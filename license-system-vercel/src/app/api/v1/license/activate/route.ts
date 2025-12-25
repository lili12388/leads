import { NextRequest, NextResponse } from 'next/server';
import { db, generateId, initDatabase } from '@/lib/db';
import { hashLicenseKey, signToken } from '@/lib/crypto';
import { checkRateLimit } from '@/lib/rate-limit';
import { ActivateRequestSchema } from '@/lib/schemas';
import { logAudit, getClientIp, getUserAgent } from '@/lib/audit';

let dbInitialized = false;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const userAgent = getUserAgent(request);

  try {
    if (!dbInitialized) {
      await initDatabase();
      dbInitialized = true;
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(`activate:${ip}`, 'activate');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { ok: false, code: 'RATE_LIMITED', message: 'Too many requests', retry_after: rateLimitResult.retryAfter },
        { status: 429, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const validation = ActivateRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, code: 'BAD_REQUEST', message: 'Invalid request', details: validation.error.flatten() },
        { status: 400, headers: corsHeaders }
      );
    }

    const { license_key, extension_id, fingerprint_hash, client } = validation.data;
    const licenseKeyHash = hashLicenseKey(license_key);

    // Find license
    const licenseResult = await db.execute({
      sql: `SELECT * FROM licenses WHERE license_key_hash = ?`,
      args: [licenseKeyHash],
    });

    if (licenseResult.rows.length === 0) {
      await logAudit({ event: 'ACTIVATE_FAIL', ip, userAgent, details: { reason: 'License not found' } });
      return NextResponse.json(
        { ok: false, code: 'LICENSE_NOT_FOUND', message: 'Invalid license key' },
        { status: 404, headers: corsHeaders }
      );
    }

    const license = licenseResult.rows[0];

    // Check license status
    if (license.status === 'revoked') {
      await logAudit({ event: 'ACTIVATE_FAIL', licenseId: license.id as string, ip, userAgent, details: { reason: 'License revoked' } });
      return NextResponse.json(
        { ok: false, code: 'LICENSE_REVOKED', message: 'License has been revoked' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Check expiry
    if (license.expires_at && new Date(license.expires_at as string) < new Date()) {
      await logAudit({ event: 'ACTIVATE_FAIL', licenseId: license.id as string, ip, userAgent, details: { reason: 'License expired' } });
      return NextResponse.json(
        { ok: false, code: 'LICENSE_EXPIRED', message: 'License has expired' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Check existing activations
    const activationsResult = await db.execute({
      sql: `SELECT * FROM activations WHERE license_id = ? AND is_active = 1`,
      args: [license.id],
    });

    const existingActivation = activationsResult.rows.find(
      (a) => a.extension_id === extension_id || a.fingerprint_hash === fingerprint_hash
    );

    let activationId: string;
    let slotIndex: number;

    if (existingActivation) {
      // Reactivate existing
      activationId = existingActivation.id as string;
      slotIndex = existingActivation.slot_index as number;
      
      await db.execute({
        sql: `UPDATE activations SET last_validated_at = datetime('now'), last_ip = ?, client_browser = ?, client_os = ?, client_timezone = ? WHERE id = ?`,
        args: [ip, client.browser, client.os, client.timezone, activationId],
      });
    } else {
      // Check max activations
      if (activationsResult.rows.length >= (license.max_activations as number)) {
        await logAudit({ event: 'ACTIVATE_FAIL', licenseId: license.id as string, ip, userAgent, details: { reason: 'Max activations reached' } });
        return NextResponse.json(
          { ok: false, code: 'MAX_ACTIVATIONS', message: 'Maximum activations reached', max: license.max_activations },
          { status: 403, headers: corsHeaders }
        );
      }

      // Create new activation
      activationId = generateId();
      const usedSlots = new Set(activationsResult.rows.map((a) => a.slot_index as number));
      slotIndex = 0;
      while (usedSlots.has(slotIndex)) slotIndex++;

      await db.execute({
        sql: `INSERT INTO activations (id, license_id, extension_id, fingerprint_hash, slot_index, last_validated_at, last_ip, client_browser, client_os, client_timezone)
              VALUES (?, ?, ?, ?, ?, datetime('now'), ?, ?, ?, ?)`,
        args: [activationId, license.id, extension_id, fingerprint_hash, slotIndex, ip, client.browser, client.os, client.timezone],
      });
    }

    // Generate token
    const tokenResult = signToken({
      licenseId: license.id as string,
      activationId,
      plan: license.plan as string,
      extensionId: extension_id,
      fingerprintHash: fingerprint_hash,
      expiresAt: license.expires_at ? new Date(license.expires_at as string) : undefined,
    });

    await logAudit({
      event: existingActivation ? 'REACTIVATE' : 'ACTIVATE',
      licenseId: license.id as string,
      activationId,
      ip,
      userAgent,
      details: { plan: license.plan, slotIndex },
    });

    return NextResponse.json({
      ok: true,
      token: tokenResult.token,
      expires_at: tokenResult.expiresAt.toISOString(),
      grace_seconds: 86400, // 24 hours offline grace
      plan: license.plan,
      max_activations: license.max_activations,
      current_activations: activationsResult.rows.length + (existingActivation ? 0 : 1),
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Activate error:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500, headers: corsHeaders }
    );
  }
}
