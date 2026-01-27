import { NextRequest, NextResponse } from 'next/server';
import { db, initDatabase, generateId } from '@/lib/db';

export const runtime = 'edge';

// POST - Track a page view
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path } = body;

    if (!path || typeof path !== 'string') {
      return NextResponse.json({ error: 'Invalid page path' }, { status: 400 });
    }

    // Sanitize the path
    const cleanPath = path.startsWith('/') ? path : '/' + path;

    await initDatabase();

    // Upsert - insert or update the page view count
    await db.execute(
      `INSERT INTO page_views (id, page_path, view_count, last_viewed_at) 
       VALUES (?, ?, 1, datetime('now'))
       ON CONFLICT(page_path) DO UPDATE SET 
       view_count = view_count + 1, 
       last_viewed_at = datetime('now')`,
      [generateId(), cleanPath]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Page view tracking error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
