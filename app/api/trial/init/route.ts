import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

// Initialize Redis (you'll need to add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to environment)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const FREE_LEAD_LIMIT = 100
const FINGERPRINT_PREFIX = 'fp:'

// POST /api/trial/init - Initialize or get trial status for a fingerprint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fingerprint } = body

    if (!fingerprint || typeof fingerprint !== 'string' || fingerprint.length < 10) {
      return NextResponse.json(
        { error: 'Invalid fingerprint' },
        { status: 400 }
      )
    }

    const key = `${FINGERPRINT_PREFIX}${fingerprint}`
    
    // Check if this fingerprint already exists
    const existingData = await redis.get(key) as { leadsUsed: number; createdAt: string; lastUsed: string } | null

    if (existingData) {
      // Return existing trial status
      const leadsRemaining = Math.max(0, FREE_LEAD_LIMIT - existingData.leadsUsed)
      const isLocked = leadsRemaining === 0

      return NextResponse.json({
        success: true,
        isNew: false,
        leadsUsed: existingData.leadsUsed,
        leadsRemaining,
        leadsTotal: FREE_LEAD_LIMIT,
        isLocked,
        createdAt: existingData.createdAt,
      })
    }

    // Create new trial for this fingerprint
    const newTrial = {
      leadsUsed: 0,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    }

    await redis.set(key, newTrial)

    // Also track IP to prevent mass abuse (max 5 new fingerprints per IP per day)
    const ip = newTrial.ip
    const ipKey = `ip:${ip}:${new Date().toISOString().split('T')[0]}`
    const ipCount = await redis.incr(ipKey)
    
    if (ipCount === 1) {
      // Set expiry for IP counter (24 hours)
      await redis.expire(ipKey, 86400)
    }

    if (ipCount > 5) {
      // Too many new fingerprints from this IP today
      // Still allow but flag for review
      await redis.set(`flagged:${fingerprint}`, { ip, count: ipCount, date: new Date().toISOString() })
    }

    return NextResponse.json({
      success: true,
      isNew: true,
      leadsUsed: 0,
      leadsRemaining: FREE_LEAD_LIMIT,
      leadsTotal: FREE_LEAD_LIMIT,
      isLocked: false,
      createdAt: newTrial.createdAt,
    })

  } catch (error) {
    console.error('Trial init error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

// GET /api/trial/init?fingerprint=xxx - Get trial status (for checking without creating)
export async function GET(request: NextRequest) {
  try {
    const fingerprint = request.nextUrl.searchParams.get('fingerprint')

    if (!fingerprint || fingerprint.length < 10) {
      return NextResponse.json(
        { error: 'Invalid fingerprint' },
        { status: 400 }
      )
    }

    const key = `${FINGERPRINT_PREFIX}${fingerprint}`
    const existingData = await redis.get(key) as { leadsUsed: number; createdAt: string } | null

    if (!existingData) {
      return NextResponse.json({
        success: true,
        exists: false,
        leadsRemaining: FREE_LEAD_LIMIT,
        leadsTotal: FREE_LEAD_LIMIT,
        isLocked: false,
      })
    }

    const leadsRemaining = Math.max(0, FREE_LEAD_LIMIT - existingData.leadsUsed)

    return NextResponse.json({
      success: true,
      exists: true,
      leadsUsed: existingData.leadsUsed,
      leadsRemaining,
      leadsTotal: FREE_LEAD_LIMIT,
      isLocked: leadsRemaining === 0,
      createdAt: existingData.createdAt,
    })

  } catch (error) {
    console.error('Trial status error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
