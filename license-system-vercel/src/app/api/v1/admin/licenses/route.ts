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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const plan = searchParams.get('plan');
    const search = searchParams.get('search');

    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = '';
    const whereArgs: any[] = [];
    
    if (status) {
      whereClause += ' AND l.status = ?';
      whereArgs.push(status);
    }
    
    if (plan) {
      whereClause += ' AND l.plan = ?';
      whereArgs.push(plan);
    }
    
    if (search) {
      whereClause += ' AND (l.customer_email LIKE ? OR l.customer_name LIKE ?)';
      whereArgs.push(`%${search}%`, `%${search}%`);
    }

    // Get total count
    const countResult = await db.execute(
      `SELECT COUNT(*) as total FROM licenses l WHERE 1=1 ${whereClause}`,
      whereArgs
    );
    const total = countResult.rows[0].total;

    // Get licenses with pagination
    const licensesResult = await db.execute(
      `
      SELECT 
        l.*,
        (SELECT COUNT(*) FROM activations WHERE license_id = l.id AND is_active = 1) as active_activations,
        (SELECT MAX(last_validated_at) FROM activations WHERE license_id = l.id) as last_used
      FROM licenses l
      WHERE 1=1 ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [...whereArgs, limit, offset]
    );

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      licenses: licensesResult.rows,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages
      }
    });

  } catch (error) {
    console.error('List licenses error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
