import { NextRequest, NextResponse } from 'next/server';
import { db, generateId, initDatabase } from '@/lib/db';
import { generateLicenseKey, hashLicenseKey } from '@/lib/crypto';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAudit, getClientIp, getUserAgent } from '@/lib/audit';

const ADMIN_SECRET = process.env.ADMIN_SECRET;

function verifyAdminAuth(request: NextRequest): boolean {
  if (!ADMIN_SECRET) return false;
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;
  const [type, token] = authHeader.split(' ');
  return type === 'Bearer' && token === ADMIN_SECRET;
}

let dbInitialized = false;

// GET: List all WhatsApp licenses
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);

  if (!verifyAdminAuth(request)) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Invalid or missing admin credentials' },
      { status: 401 }
    );
  }

  try {
    if (!dbInitialized) {
      await initDatabase();
      dbInitialized = true;
    }

    const rateLimitResult = await checkRateLimit(`admin:${ip}`, 'admin');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'RATE_LIMITED', message: 'Too many requests' },
        { status: 429 }
      );
    }

    // Get licenses with activation counts
    const result = await db.execute(
      `SELECT l.*, 
        (SELECT COUNT(*) FROM whatsapp_activations WHERE license_id = l.id AND is_active = 1) as active_activations,
        (SELECT MAX(last_validated_at) FROM whatsapp_activations WHERE license_id = l.id) as last_used
       FROM whatsapp_licenses l
       ORDER BY l.created_at DESC`
    );

    return NextResponse.json({
      success: true,
      licenses: result.rows || [],
    });
  } catch (error) {
    console.error('List WhatsApp licenses error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST: Create new WhatsApp license
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const userAgent = getUserAgent(request);

  if (!verifyAdminAuth(request)) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Invalid or missing admin credentials' },
      { status: 401 }
    );
  }

  try {
    if (!dbInitialized) {
      await initDatabase();
      dbInitialized = true;
    }

    const rateLimitResult = await checkRateLimit(`admin:${ip}`, 'admin');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'RATE_LIMITED', message: 'Too many requests' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { max_activations = 2, expires_days, customer_email, customer_name, notes } = body;

    // Generate license key with WA prefix to distinguish from extension licenses
    const licenseKey = 'WA-' + generateLicenseKey();
    const licenseKeyHash = hashLicenseKey(licenseKey);
    const id = generateId();

    // Calculate expiry
    let expiresAt: string | null = null;
    if (expires_days && expires_days > 0) {
      expiresAt = new Date(Date.now() + expires_days * 24 * 60 * 60 * 1000).toISOString();
    }

    // Insert license
    await db.execute({
      sql: `INSERT INTO whatsapp_licenses (id, license_key_hash, license_key_plaintext, max_activations, expires_at, customer_email, customer_name, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, licenseKeyHash, licenseKey, max_activations, expiresAt, customer_email || null, customer_name || null, notes || null],
    });

    await logAudit({
      event: 'WHATSAPP_LICENSE_CREATED',
      licenseId: id,
      ip,
      userAgent,
      details: { maxActivations: max_activations, customerEmail: customer_email },
    });

    return NextResponse.json({
      success: true,
      license_key: licenseKey,
      license_id: id,
      max_activations,
      expires_at: expiresAt,
      status: 'active',
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Create WhatsApp license error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// DELETE: Revoke a WhatsApp license
export async function DELETE(request: NextRequest) {
  const ip = getClientIp(request);
  const userAgent = getUserAgent(request);

  if (!verifyAdminAuth(request)) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Invalid or missing admin credentials' },
      { status: 401 }
    );
  }

  try {
    if (!dbInitialized) {
      await initDatabase();
      dbInitialized = true;
    }

    const body = await request.json();
    const { license_id } = body;

    if (!license_id) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'license_id required' },
        { status: 400 }
      );
    }

    // Update license status
    await db.execute({
      sql: `UPDATE whatsapp_licenses SET status = 'revoked', updated_at = datetime('now') WHERE id = ?`,
      args: [license_id],
    });

    // Deactivate all activations
    await db.execute({
      sql: `UPDATE whatsapp_activations SET is_active = 0 WHERE license_id = ?`,
      args: [license_id],
    });

    // Lock any trials using this license
    await db.execute({
      sql: `UPDATE whatsapp_trials SET license_id = NULL, is_locked = 1 WHERE license_id = ?`,
      args: [license_id],
    });

    await logAudit({
      event: 'WHATSAPP_LICENSE_REVOKED',
      licenseId: license_id,
      ip,
      userAgent,
    });

    return NextResponse.json({ success: true, message: 'License revoked' });
  } catch (error) {
    console.error('Revoke WhatsApp license error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
