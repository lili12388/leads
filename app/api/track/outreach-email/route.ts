import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_OUTREACH_BOT_TOKEN || ''
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_OUTREACH_CHAT_ID || ''

interface OutreachEmailRegistration {
  email: string
  ip: string
  userAgent: string
  timestamp: string
  country?: string
  city?: string
}

// Send Telegram notification
async function sendTelegramNotification(registration: OutreachEmailRegistration) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('[Telegram] Bot not configured, skipping notification')
    return
  }

  try {
    const message = `📧 *New Outreach Email Registration*

✉️ *Email:* \`${registration.email}\`
🌍 *Location:* ${registration.city}, ${registration.country}
🕐 *Time:* ${new Date(registration.timestamp).toLocaleString('en-US', { timeZone: 'UTC' })} UTC
🌐 *IP:* \`${registration.ip}\`

👉 *Add this user to test users:*
[Open Google Cloud Console](https://console.cloud.google.com/auth/audience?authuser=1&project=mapsreach-outreach)

_Go to Audience tab → Add Users_`

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
    
    // Add timeout controller for fetch
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      }),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Telegram] API error:', response.status, errorText)
      return
    }

    console.log('[Telegram] Notification sent for:', registration.email)
  } catch (error) {
    console.error('[Telegram] Failed to send notification:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || !email.includes('@gmail.com')) {
      return NextResponse.json({ error: 'Invalid Gmail address' }, { status: 400 })
    }

    // Get client info
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Get geo data from Vercel headers
    const country = request.headers.get('x-vercel-ip-country') || 'unknown'
    const city = request.headers.get('x-vercel-ip-city') || 'unknown'

    const registration: OutreachEmailRegistration = {
      email: email.toLowerCase().trim(),
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
      country,
      city
    }

    // Store in Redis list for easy retrieval
    await redis.lpush('outreach_emails', JSON.stringify(registration))
    
    // Also store in a set for unique emails (to avoid duplicates in set)
    await redis.sadd('outreach_emails_unique', email.toLowerCase().trim())

    // Send Telegram notification (await it to ensure it runs before response)
    await sendTelegramNotification(registration)

    // Log for monitoring
    console.log(`[Outreach Email] Registered: ${email} from ${country}`)

    return NextResponse.json({ 
      success: true, 
      message: 'Email registered successfully' 
    })
  } catch (error) {
    console.error('[Outreach Email] Error:', error)
    return NextResponse.json({ error: 'Failed to register email' }, { status: 500 })
  }
}

// GET endpoint to retrieve all registered emails (for admin use)
export async function GET(request: NextRequest) {
  try {
    // Simple auth check via query param (you can make this more secure)
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    
    if (key !== process.env.ADMIN_API_KEY && key !== 'mapsreach2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all unique emails
    const uniqueEmails = await redis.smembers('outreach_emails_unique')
    
    // Get recent registrations with full details (last 100)
    const recentRegistrations = await redis.lrange('outreach_emails', 0, 99)
    
    return NextResponse.json({
      success: true,
      totalUnique: uniqueEmails.length,
      emails: uniqueEmails,
      recentRegistrations: recentRegistrations.map(r => {
        try {
          return typeof r === 'string' ? JSON.parse(r) : r
        } catch {
          return r
        }
      })
    })
  } catch (error) {
    console.error('[Outreach Email] GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 })
  }
}
