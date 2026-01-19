import { NextRequest, NextResponse } from 'next/server';
import { db, initDatabase } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/audit';

const ADMIN_SECRET = process.env.ADMIN_SECRET;

function verifyAdminAuth(request: NextRequest): boolean {
  if (!ADMIN_SECRET) return false;
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;
  const [type, token] = authHeader.split(' ');
  return type === 'Bearer' && token === ADMIN_SECRET;
}

let dbInitialized = false;

// GET: List all WhatsApp trial users
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

    // Get all trials
    const result = await db.execute(
      `SELECT t.*, l.customer_email as license_email, l.customer_name as license_customer
       FROM whatsapp_trials t
       LEFT JOIN whatsapp_licenses l ON t.license_id = l.id
       ORDER BY t.last_seen_at DESC`
    );

    // Get stats
    const statsResult = await db.execute(
      `SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN license_id IS NOT NULL THEN 1 ELSE 0 END) as licensed_users,
        SUM(CASE WHEN is_locked = 1 AND license_id IS NULL THEN 1 ELSE 0 END) as locked_users,
        SUM(messages_sent) as total_messages_sent
       FROM whatsapp_trials`
    );

    const stats = statsResult.rows[0] || {
      total_users: 0,
      licensed_users: 0,
      locked_users: 0,
      total_messages_sent: 0,
    };

    return NextResponse.json({
      success: true,
      trials: result.rows || [],
      stats,
    });
  } catch (error) {
    console.error('List WhatsApp trials error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
