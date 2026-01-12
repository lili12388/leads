import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

interface VisitorData {
  ip: string
  country: string
  city: string
  region: string
  userAgent: string
  browser: string
  os: string
  device: string
  page: string
  referrer: string
  screenWidth: number
  screenHeight: number
  language: string
  timestamp: string
  sessionId: string
}

// Parse user agent to get browser, OS, device
function parseUserAgent(ua: string): { browser: string; os: string; device: string } {
  let browser = 'Unknown'
  let os = 'Unknown'
  let device = 'Desktop'

  // Browser detection
  if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Edg')) browser = 'Edge'
  else if (ua.includes('Chrome')) browser = 'Chrome'
  else if (ua.includes('Safari')) browser = 'Safari'
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera'

  // OS detection
  if (ua.includes('Windows NT 10')) os = 'Windows 10/11'
  else if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac OS X')) os = 'macOS'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'

  // Device detection
  if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) device = 'Mobile'
  else if (ua.includes('Tablet') || ua.includes('iPad')) device = 'Tablet'

  return { browser, os, device }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get IP from various headers
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || request.headers.get('x-real-ip') 
      || 'Unknown'
    
    const userAgent = request.headers.get('user-agent') || ''
    const { browser, os, device } = parseUserAgent(userAgent)
    
    // Get geo data from Vercel's headers (free on Vercel)
    const country = request.headers.get('x-vercel-ip-country') || 'Unknown'
    const city = request.headers.get('x-vercel-ip-city') || 'Unknown'
    const region = request.headers.get('x-vercel-ip-country-region') || ''
    
    const visitorData: VisitorData = {
      ip,
      country,
      city: decodeURIComponent(city),
      region,
      userAgent,
      browser,
      os,
      device,
      page: body.page || '/',
      referrer: body.referrer || 'Direct',
      screenWidth: body.screenWidth || 0,
      screenHeight: body.screenHeight || 0,
      language: body.language || 'Unknown',
      timestamp: new Date().toISOString(),
      sessionId: body.sessionId || 'unknown'
    }
    
    // Store in Redis - keep last 1000 visitors
    await redis.lpush('visitors', JSON.stringify(visitorData))
    await redis.ltrim('visitors', 0, 999) // Keep only last 1000
    
    // Also track unique visitors today
    const today = new Date().toISOString().split('T')[0]
    await redis.sadd(`visitors:unique:${today}`, ip)
    
    // Track page views today
    await redis.incr(`visitors:pageviews:${today}`)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Tracking error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

// GET endpoint for admin to fetch visitor data
export async function GET(request: NextRequest) {
  try {
    // Check admin key
    const adminKey = request.headers.get('x-admin-key')
    if (adminKey !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get visitors
    const visitors = await redis.lrange('visitors', 0, 99) // Last 100
    
    // Get today's stats
    const today = new Date().toISOString().split('T')[0]
    const uniqueToday = await redis.scard(`visitors:unique:${today}`)
    const pageviewsToday = await redis.get(`visitors:pageviews:${today}`) || 0
    
    // Get last 7 days stats
    const stats: { date: string; unique: number; pageviews: number }[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const unique = await redis.scard(`visitors:unique:${dateStr}`)
      const pageviews = await redis.get(`visitors:pageviews:${dateStr}`) || 0
      stats.push({ date: dateStr, unique: unique || 0, pageviews: Number(pageviews) })
    }
    
    return NextResponse.json({
      visitors: visitors.map(v => typeof v === 'string' ? JSON.parse(v) : v),
      today: {
        unique: uniqueToday,
        pageviews: Number(pageviewsToday)
      },
      stats
    })
  } catch (error) {
    console.error('Get visitors error:', error)
    return NextResponse.json({ error: 'Failed to fetch visitors' }, { status: 500 })
  }
}
