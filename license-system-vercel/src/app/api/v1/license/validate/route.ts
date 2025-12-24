import { NextRequest, NextResponse } from 'next/server';
import { db, initDatabase } from '@/lib/db';
import { verifyToken } from '@/lib/crypto';
import { checkRateLimit } from '@/lib/rate-limit';
import { ValidateRequestSchema } from '@/lib/schemas';
import { logAudit, getClientIp, getUserAgent } from '@/lib/audit';

let dbInitialized = false;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const userAgent = getUserAgent(request);

  try {
    if (!dbInitialized) {
      await initDatabase();
      dbInitialized = true;
    }

    // Rate limiting (more lenient for validation)
    const rateLimitResult = await checkRateLimit(`validate:${ip}`, 'validate');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { ok: false, valid: false, code: 'RATE_LIMITED', retry_after: rateLimitResult.retryAfter },
        { status: 429, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const validation = ValidateRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, valid: false, code: 'BAD_REQUEST', message: 'Invalid request' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { token, extension_id, fingerprint_hash } = validation.data;

    // Verify token
    const tokenResult = verifyToken(token);

    if (!tokenResult.valid || !tokenResult.payload) {
      await logAudit({ event: 'VALIDATE_FAIL', ip, userAgent, details: { reason: tokenResult.error || 'Invalid token' } });
      return NextResponse.json(
        { ok: false, valid: false, code: 'TOKEN_INVALID', message: tokenResult.error || 'Invalid token' },
        { status: 401, headers: corsHeaders }
      );
    }

    const payload = tokenResult.payload;

    // Verify extension_id and fingerprint match (using short field names from TokenPayload)
    if (payload.eid !== extension_id || !fingerprint_hash.startsWith(payload.fph.substring(0, 16))) {
      await logAudit({ 
        event: 'VALIDATE_FAIL', 
        licenseId: payload.lid, 
        activationId: payload.aid,
        ip, 
        userAgent, 
        details: { reason: 'Device mismatch' } 
      });
      return NextResponse.json(
        { ok: false, valid: false, code: 'DEVICE_MISMATCH', message: 'Token does not match this device' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Check if license still valid in database
    const licenseResult = await db.execute({
      sql: `SELECT * FROM licenses WHERE id = ?`,
      args: [payload.lid],
    });

    if (licenseResult.rows.length === 0) {
      return NextResponse.json(
        { ok: false, valid: false, code: 'LICENSE_NOT_FOUND', message: 'License not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    const license = licenseResult.rows[0];

    // Check license status
    if (license.status === 'revoked') {
      await logAudit({ event: 'VALIDATE_FAIL', licenseId: license.id as string, ip, userAgent, details: { reason: 'License revoked' } });
      return NextResponse.json(
        { ok: false, valid: false, code: 'LICENSE_REVOKED', message: 'License has been revoked' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Check expiry
    if (license.expires_at && new Date(license.expires_at as string) < new Date()) {
      await logAudit({ event: 'VALIDATE_FAIL', licenseId: license.id as string, ip, userAgent, details: { reason: 'License expired' } });
      return NextResponse.json(
        { ok: false, valid: false, code: 'LICENSE_EXPIRED', message: 'License has expired' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Check activation still exists
    const activationResult = await db.execute({
      sql: `SELECT * FROM activations WHERE id = ? AND is_active = 1`,
      args: [payload.aid],
    });

    if (activationResult.rows.length === 0) {
      await logAudit({ event: 'VALIDATE_FAIL', licenseId: license.id as string, ip, userAgent, details: { reason: 'Activation deactivated' } });
      return NextResponse.json(
        { ok: false, valid: false, code: 'ACTIVATION_INVALID', message: 'Activation has been revoked' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Update last validated
    await db.execute({
      sql: `UPDATE activations SET last_validated_at = datetime('now'), last_ip = ? WHERE id = ?`,
      args: [ip, payload.aid],
    });

    await logAudit({
      event: 'VALIDATE',
      licenseId: license.id as string,
      activationId: payload.aid,
      ip,
      userAgent,
    });

    return NextResponse.json({
      ok: true,
      valid: true,
      plan: license.plan,
      expires_at: license.expires_at || null,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Validate error:', error);
    return NextResponse.json(
      { ok: false, valid: false, code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500, headers: corsHeaders }
    );
  }
}
