import { NextRequest, NextResponse } from 'next/server';
import { db, generateId, initDatabase } from '@/lib/db';
import { generateLicenseKey, hashLicenseKey } from '@/lib/crypto';
import { checkRateLimit } from '@/lib/rate-limit';
import { createLicenseSchema } from '@/lib/schemas';
import { logAudit, getClientIp, getUserAgent } from '@/lib/audit';

const ADMIN_SECRET = process.env.ADMIN_SECRET;

function verifyAdminAuth(request: NextRequest): boolean {
  if (!ADMIN_SECRET) return false;
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;
  const [type, token] = authHeader.split(' ');
  return type === 'Bearer' && token === ADMIN_SECRET;
}

// Initialize DB on first request
let dbInitialized = false;

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
    // Init DB if needed
    if (!dbInitialized) {
      await initDatabase();
      dbInitialized = true;
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(`admin:${ip}`, 'admin');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'RATE_LIMITED', message: 'Too many requests', retry_after: rateLimitResult.retryAfter },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validation = createLicenseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Invalid request body', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { plan, max_activations, expires_days, customer_email, customer_name, notes } = validation.data;

    // Generate license key
    const licenseKey = generateLicenseKey();
    const licenseKeyHash = hashLicenseKey(licenseKey);
    const id = generateId();

    // Calculate expiry
    let expiresAt: string | null = null;
    if (expires_days) {
      expiresAt = new Date(Date.now() + expires_days * 24 * 60 * 60 * 1000).toISOString();
    } else if (plan !== 'lifetime') {
      const now = new Date();
      if (plan === 'monthly') {
        expiresAt = new Date(now.setMonth(now.getMonth() + 1)).toISOString();
      } else if (plan === 'yearly') {
        expiresAt = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();
      }
    }

    // Insert license
    await db.execute({
      sql: `INSERT INTO licenses (id, license_key_hash, license_key_plaintext, plan, max_activations, expires_at, customer_email, customer_name, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, licenseKeyHash, licenseKey, plan || 'lifetime', max_activations ?? 2, expiresAt, customer_email || null, customer_name || null, notes || null],
    });

    // Log audit
    await logAudit({
      event: 'LICENSE_CREATED',
      licenseId: id,
      ip,
      userAgent,
      details: { plan, maxActivations: max_activations, customerEmail: customer_email },
    });

    return NextResponse.json({
      success: true,
      license_key: licenseKey,
      license_id: id,
      plan: plan || 'lifetime',
      max_activations: max_activations ?? 2,
      expires_at: expiresAt,
      status: 'active',
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Create license error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

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

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await db.execute({
      sql: `SELECT id, plan, status, max_activations, expires_at, customer_email, customer_name, notes, created_at 
            FROM licenses ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      args: [limit, offset],
    });

    const countResult = await db.execute(`SELECT COUNT(*) as total FROM licenses`);
    const total = countResult.rows[0]?.total as number || 0;

    return NextResponse.json({
      licenses: result.rows,
      pagination: { total, limit, offset, has_more: offset + limit < total },
    });
  } catch (error) {
    console.error('List licenses error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
