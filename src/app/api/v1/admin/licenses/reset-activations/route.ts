import { NextRequest, NextResponse } from 'next/server';
import { db, initDatabase } from '@/lib/db';
import { logAudit, getClientIp, getUserAgent } from '@/lib/audit';

function verifyAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  return token === process.env.ADMIN_SECRET;
}

let dbInitialized = false;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const userAgent = getUserAgent(request);

  try {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!dbInitialized) {
      await initDatabase();
      dbInitialized = true;
    }

    const body = await request.json();
    const { license_id, reason } = body;

    if (!license_id) {
      return NextResponse.json({ error: 'license_id required' }, { status: 400 });
    }

    // Deactivate all activations for this license
    await db.execute({ sql: 'UPDATE activations SET is_active = 0 WHERE license_id = ?', args: [license_id] });

    // Audit
    await logAudit({ event: 'ACTIVATIONS_RESET', licenseId: license_id, ip, userAgent, details: { reason } });

    return NextResponse.json({ success: true, message: 'Activations reset' });
  } catch (error) {
    console.error('Reset activations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}