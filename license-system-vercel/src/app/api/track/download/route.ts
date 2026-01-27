import { NextRequest, NextResponse } from 'next/server';
import { db, initDatabase } from '@/lib/db';

export const runtime = 'edge';

// POST - Track a download
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    if (!type || !['chrome_extension', 'edge_extension', 'whatsapp_tool'].includes(type)) {
      return NextResponse.json({ error: 'Invalid download type' }, { status: 400 });
    }

    await initDatabase();

    // Increment the download count
    const idMap: Record<string, string> = {
      chrome_extension: 'chrome',
      edge_extension: 'edge',
      whatsapp_tool: 'whatsapp'
    };

    await db.execute(
      `UPDATE downloads SET count = count + 1, last_download_at = datetime('now') WHERE id = ?`,
      [idMap[type]]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Download tracking error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
