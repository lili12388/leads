import { NextRequest, NextResponse } from 'next/server';
import { db, initDatabase } from '@/lib/db';

let dbInitialized = false;

// GET all licenses
export async function GET(request: NextRequest) {
  try {
    // Verify admin auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.slice(7);
    if (token !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Invalid admin token' }, { status: 401 });
    }

    if (!dbInitialized) {
      await initDatabase();
      dbInitialized = true;
    }

    // Get all licenses with activation counts and last used time
    const licensesResult = await db.execute(`
      SELECT 
        l.*,
        (SELECT COUNT(*) FROM activations WHERE license_id = l.id AND is_active = 1) as active_activations,
        (SELECT MAX(last_validated_at) FROM activations WHERE license_id = l.id) as last_used
      FROM licenses l
      ORDER BY l.created_at DESC
    `);

    return NextResponse.json({
      success: true,
      licenses: licensesResult.rows
    });

  } catch (error) {
    console.error('List licenses error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
