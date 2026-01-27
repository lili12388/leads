import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

// Keep admin auth consistent with the rest of the admin APIs.
const ADMIN_KEY = process.env.ADMIN_SECRET || process.env.ADMIN_KEY || 'M@psR3ach_S3cr3t_K3y_2024!'

// GET - Fetch download stats (admin only)
export async function GET(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key')
  
  if (adminKey !== ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get download counts
    const chromeCount = await redis.get('downloads:chrome_extension') || 0
    const edgeCount = await redis.get('downloads:edge_extension') || 0
    const whatsappCount = await redis.get('downloads:whatsapp_tool') || 0

    // Get last download timestamps
    const chromeLastDownload = await redis.get('downloads:chrome_extension:last')
    const edgeLastDownload = await redis.get('downloads:edge_extension:last')
    const whatsappLastDownload = await redis.get('downloads:whatsapp_tool:last')

    return NextResponse.json({
      success: true,
      downloads: [
        { type: 'chrome_extension', count: Number(chromeCount), last_download_at: chromeLastDownload },
        { type: 'edge_extension', count: Number(edgeCount), last_download_at: edgeLastDownload },
        { type: 'whatsapp_tool', count: Number(whatsappCount), last_download_at: whatsappLastDownload },
      ]
    })
  } catch (error: any) {
    console.error('Download stats fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Track a download (public, called when user clicks download)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type } = body

    if (!type || !['chrome_extension', 'edge_extension', 'whatsapp_tool'].includes(type)) {
      return NextResponse.json({ error: 'Invalid download type' }, { status: 400 })
    }

    // Increment the download count
    await redis.incr(`downloads:${type}`)
    
    // Update last download timestamp
    await redis.set(`downloads:${type}:last`, new Date().toISOString())

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Download tracking error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
