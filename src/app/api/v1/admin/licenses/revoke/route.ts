import { NextRequest, NextResponse } from 'next/server';
import { db, initDatabase } from '@/lib/db';
import { hashLicenseKey } from '@/lib/crypto';

let dbInitialized = false;

export async function POST(request: NextRequest) {
  try {
    if (!dbInitialized) {
      await initDatabase();
      dbInitialized = true;
    }

    // Verify admin auth
    const authHeader = request.headers.get('authorization');
    const url = new URL(request.url);
    const tokenQuery = url.searchParams.get('token');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : tokenQuery;

    if (!token || token !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { license_key, license_id } = body;

    if (!license_key && !license_id) {
      return NextResponse.json({ ok: false, error: 'license_key or license_id required' }, { status: 400 });
    }

    // Find the license
    let license;
    if (license_id) {
      const result = await db.execute({ sql: 'SELECT * FROM licenses WHERE id = ?', args: [license_id] });
      license = result.rows[0];
    } else {
      const keyHash = hashLicenseKey(license_key);
      const result = await db.execute({ sql: 'SELECT * FROM licenses WHERE license_key_hash = ?', args: [keyHash] });
      license = result.rows[0];
    }

    if (!license) {
      return NextResponse.json({ ok: false, error: 'License not found' }, { status: 404 });
    }

    // Revoke the license
    await db.execute({ sql: 'UPDATE licenses SET status = ?, updated_at = datetime("now") WHERE id = ?', args: ['revoked', license.id] });

    // Deactivate all activations for this license
    await db.execute({ sql: 'UPDATE activations SET is_active = 0 WHERE license_id = ?', args: [license.id] });

    return NextResponse.json({ ok: true, message: 'License revoked successfully', license_id: license.id });
  } catch (error) {
    console.error('Revoke license error:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
