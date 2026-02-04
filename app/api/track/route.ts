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
function parseUserAgent(ua: string): { browser: string; os: string; device: string; isBot: boolean } {
  let browser = 'Unknown'
  let os = 'Unknown'
  let device = 'Desktop'
  let isBot = false

  // Bot detection - check first
  const botPatterns = [
    'bot', 'crawler', 'spider', 'scraper', 'headless',
    'vercel', 'pingdom', 'uptimerobot', 'monitoring',
    'googlebot', 'bingbot', 'slurp', 'duckduckbot',
    'baiduspider', 'yandex', 'facebookexternalhit',
    'twitterbot', 'linkedinbot', 'whatsapp', 'telegram',
    'curl', 'wget', 'python', 'java/', 'go-http',
    'apache-httpclient', 'okhttp', 'node-fetch'
  ]
  
  const uaLower = ua.toLowerCase()
  if (botPatterns.some(pattern => uaLower.includes(pattern)) || ua.length < 20) {
    isBot = true
    browser = 'Bot'
    os = 'Bot'
    device = 'Bot'
    return { browser, os, device, isBot }
  }

  // Browser detection (order matters - check specific before generic)
  if (ua.includes('Edg/') || ua.includes('Edge/')) browser = 'Edge'
  else if (ua.includes('OPR/') || ua.includes('Opera/')) browser = 'Opera'
  else if (ua.includes('Brave')) browser = 'Brave'
  else if (ua.includes('Vivaldi')) browser = 'Vivaldi'
  else if (ua.includes('Firefox/')) browser = 'Firefox'
  else if (ua.includes('Chrome/') && !ua.includes('Chromium')) browser = 'Chrome'
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari'
  else if (ua.includes('MSIE') || ua.includes('Trident/')) browser = 'IE'

  // OS detection
  if (ua.includes('Windows NT 10') || ua.includes('Windows NT 11')) os = 'Windows 10/11'
  else if (ua.includes('Windows NT 6.3')) os = 'Windows 8.1'
  else if (ua.includes('Windows NT 6.2')) os = 'Windows 8'
  else if (ua.includes('Windows NT 6.1')) os = 'Windows 7'
  else if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac OS X')) os = 'macOS'
  else if (ua.includes('CrOS')) os = 'Chrome OS'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) os = 'iOS'

  // Device detection
  if (ua.includes('Mobile') || ua.includes('Android') && !ua.includes('Tablet')) {
    if (ua.includes('iPhone')) device = 'iPhone'
    else device = 'Mobile'
  } else if (ua.includes('Tablet') || ua.includes('iPad')) {
    device = 'Tablet'
  }

  return { browser, os, device, isBot }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get IP from various headers
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || request.headers.get('x-real-ip') 
      || 'Unknown'
    
    const userAgent = request.headers.get('user-agent') || ''
    const { browser, os, device, isBot } = parseUserAgent(userAgent)
    
    // Skip bot tracking entirely
    if (isBot) {
      return NextResponse.json({ success: true, skipped: 'bot' })
    }
    
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

    const today = new Date().toISOString().split('T')[0]
    const isTunisia = country.toUpperCase() === 'TN' || country.toLowerCase() === 'tunisia'

    // ALWAYS track unique visitors and pageviews - even for Tunisia
    // This ensures the admin dashboard shows accurate visitor counts
    await redis.sadd(`visitors:unique:${today}`, ip)
    await redis.incr(`visitors:pageviews:${today}`)

    if (isTunisia) {
      // Track Tunisia-specific stats separately
      await redis.incr(`visitors:tn:count:${today}`)
      await redis.incr('visitors:tn:count:total')
      await redis.set(`visitors:tn:last:${today}`, JSON.stringify(visitorData))
      await redis.set('visitors:tn:last:total', JSON.stringify(visitorData))
      return NextResponse.json({ success: true, skipped: 'tunisia' })
    }
    
    // Store in Redis - keep last 1000 recent visitors
    await redis.lpush('visitors', JSON.stringify(visitorData))
    await redis.ltrim('visitors', 0, 999) // Keep only last 1000

    // Store per-day visitors for long-term history
    await redis.lpush(`visitors:day:${today}`, JSON.stringify(visitorData))
    
    // Increment total tracked (non-Tunisia only)
    await redis.incr('visitors:count:total')
    
    // Also track unique visitors today
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
    
    const url = new URL(request.url)
    const dateParam = url.searchParams.get('date')
    const monthParam = url.searchParams.get('month')
    const limitParam = url.searchParams.get('limit')
    const limit = Math.max(1, Math.min(Number(limitParam) || 200, 1000))
    
    // Get today's stats
    const today = new Date().toISOString().split('T')[0]
    const uniqueToday = await redis.scard(`visitors:unique:${today}`)
    const pageviewsToday = await redis.get(`visitors:pageviews:${today}`) || 0

    const selectedDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : today
    let visitors = await redis.lrange(`visitors:day:${selectedDate}`, 0, limit - 1)
    const selectedUnique = await redis.scard(`visitors:unique:${selectedDate}`)
    const selectedPageviews = await redis.get(`visitors:pageviews:${selectedDate}`) || 0
    const totalTrackedRaw = await redis.get('visitors:count:total')
    let totalTracked = Number(totalTrackedRaw || 0)
    if (!totalTracked) {
      const recentCount = await redis.llen('visitors')
      totalTracked = Number(recentCount || 0)
    }
    
    const tunisiaCount = await redis.get(`visitors:tn:count:${selectedDate}`) || 0
    const tunisiaLastRaw = await redis.get(`visitors:tn:last:${selectedDate}`)
    // Upstash auto-parses JSON, so check if it's already an object
    const tunisiaLast = tunisiaLastRaw 
      ? (typeof tunisiaLastRaw === 'string' ? JSON.parse(tunisiaLastRaw) : tunisiaLastRaw)
      : null
    
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

    // Optional month stats for deeper history
    let monthStats: { date: string; unique: number; pageviews: number }[] = []
    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      const [yearStr, monthStr] = monthParam.split('-')
      const year = Number(yearStr)
      const monthIndex = Number(monthStr) - 1
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${yearStr}-${monthStr}-${String(day).padStart(2, '0')}`
        const unique = await redis.scard(`visitors:unique:${dateStr}`)
        const pageviews = await redis.get(`visitors:pageviews:${dateStr}`) || 0
        monthStats.push({ date: dateStr, unique: unique || 0, pageviews: Number(pageviews) })
      }
    }

    let parsedVisitors = visitors.map(v => typeof v === 'string' ? JSON.parse(v) : v)
    if (parsedVisitors.length === 0) {
      const recent = await redis.lrange('visitors', 0, 999)
      const recentParsed = recent.map(v => typeof v === 'string' ? JSON.parse(v) : v)
      parsedVisitors = recentParsed.filter((v: VisitorData) => v.timestamp?.startsWith(selectedDate)).slice(0, limit)
    }
    if (Number(tunisiaCount) > 0) {
      parsedVisitors.unshift({
        ip: 'TN',
        country: 'TN',
        city: tunisiaLast?.city || 'Tunisia',
        region: tunisiaLast?.region || '',
        browser: 'Self',
        os: '',
        device: 'Self',
        page: tunisiaLast?.page || '/',
        referrer: 'Direct',
        screenWidth: 0,
        screenHeight: 0,
        language: 'N/A',
        timestamp: tunisiaLast?.timestamp || new Date().toISOString(),
        sessionId: 'tunisia',
        count: Number(tunisiaCount),
        isAggregate: true
      })
    }
    
    return NextResponse.json({
      visitors: parsedVisitors,
      today: {
        unique: uniqueToday,
        pageviews: Number(pageviewsToday)
      },
      stats,
      selectedDate,
      selectedDay: {
        unique: selectedUnique || 0,
        pageviews: Number(selectedPageviews)
      },
      totalTracked: Number(totalTracked),
      tunisia: {
        count: Number(tunisiaCount),
        lastSeen: tunisiaLast?.timestamp || null
      },
      monthStats,
      debug: {
        redisUrl: process.env.KV_REST_API_URL ? 'KV_REST_API_URL set' : (process.env.UPSTASH_REDIS_REST_URL ? 'UPSTASH_REDIS_REST_URL set' : 'NO REDIS URL'),
        hasToken: !!(process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN),
        allKeysCheck: await redis.keys('visitors:*').then(k => k.slice(0, 20)).catch(() => [])
      }
    })
  } catch (error) {
    console.error('Get visitors error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch visitors', 
      details: error instanceof Error ? error.message : String(error),
      redisUrl: process.env.KV_REST_API_URL ? 'KV set' : (process.env.UPSTASH_REDIS_REST_URL ? 'UPSTASH set' : 'NONE')
    }, { status: 500 })
  }
}
