import { NextRequest, NextResponse } from 'next/server';
import { db, initDatabase } from '@/lib/db';

export const runtime = 'edge';

// GET - Fetch all analytics (downloads + page views)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token || token !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await initDatabase();

    // Get download counts
    const downloadsRes = await db.execute('SELECT download_type, count, last_download_at FROM downloads ORDER BY download_type');
    const downloads = downloadsRes.rows || [];

    // Get page views
    const pageViewsRes = await db.execute('SELECT page_path, view_count, last_viewed_at FROM page_views ORDER BY view_count DESC');
    const pageViews = pageViewsRes.rows || [];

    return NextResponse.json({
      success: true,
      downloads: downloads.map((d: any) => ({
        type: d.download_type,
        count: d.count,
        last_download_at: d.last_download_at
      })),
      pageViews: pageViews.map((p: any) => ({
        path: p.page_path,
        count: p.view_count,
        last_viewed_at: p.last_viewed_at
      }))
    });
  } catch (error: any) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
