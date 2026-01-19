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

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Get license stats
    const totalLicenses = await db.execute(`SELECT COUNT(*) as count FROM licenses`);
    const activeLicenses = await db.execute(`SELECT COUNT(*) as count FROM licenses WHERE status = 'active' AND (expires_at IS NULL OR datetime(expires_at) > datetime('now'))`);
    const revokedLicenses = await db.execute(`SELECT COUNT(*) as count FROM licenses WHERE status = 'revoked'`);
    const expiredLicenses = await db.execute(`SELECT COUNT(*) as count FROM licenses WHERE status = 'expired' OR (expires_at IS NOT NULL AND datetime(expires_at) <= datetime('now'))`);
    const suspiciousLicenses = await db.execute(`SELECT COUNT(*) as count FROM licenses WHERE suspicious_score > 50`);
    const newLast30 = await db.execute({ sql: `SELECT COUNT(*) as count FROM licenses WHERE datetime(created_at) >= datetime(?)`, args: [thirtyDaysAgo] });
    const newLast7 = await db.execute({ sql: `SELECT COUNT(*) as count FROM licenses WHERE datetime(created_at) >= datetime(?)`, args: [sevenDaysAgo] });

    // Get plan breakdown
    const planBreakdown = await db.execute(`SELECT plan, COUNT(*) as count FROM licenses GROUP BY plan`);
    const byPlan: Record<string, number> = {};
    for (const row of planBreakdown.rows) {
      byPlan[row.plan as string] = row.count as number;
    }

    // Get activation stats
    const totalActivations = await db.execute(`SELECT COUNT(*) as count FROM activations`);
    const activeActivations = await db.execute(`SELECT COUNT(*) as count FROM activations WHERE is_active = 1`);
    const newActivations30 = await db.execute({ sql: `SELECT COUNT(*) as count FROM activations WHERE datetime(created_at) >= datetime(?)`, args: [thirtyDaysAgo] });

    // Get recent audit events
    const recentEvents = await db.execute(`SELECT event, COUNT(*) as count FROM audit_logs WHERE datetime(created_at) >= datetime('now', '-7 days') GROUP BY event`);
    const eventBreakdown: Record<string, number> = {};
    let totalEvents = 0;
    for (const row of recentEvents.rows) {
      eventBreakdown[row.event as string] = row.count as number;
      totalEvents += row.count as number;
    }

    return NextResponse.json({
      licenses: {
        total: totalLicenses.rows[0]?.count || 0,
        active: activeLicenses.rows[0]?.count || 0,
        revoked: revokedLicenses.rows[0]?.count || 0,
        expired: expiredLicenses.rows[0]?.count || 0,
        suspicious: suspiciousLicenses.rows[0]?.count || 0,
        new_last_30_days: newLast30.rows[0]?.count || 0,
        new_last_7_days: newLast7.rows[0]?.count || 0,
        by_plan: byPlan,
      },
      activations: {
        total: totalActivations.rows[0]?.count || 0,
        active: activeActivations.rows[0]?.count || 0,
        new_last_30_days: newActivations30.rows[0]?.count || 0,
      },
      recent_activity: {
        total_events_sampled: totalEvents,
        event_breakdown: eventBreakdown,
      },
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
