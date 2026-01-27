import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const FREE_LEAD_LIMIT = 100
const FINGERPRINT_PREFIX = 'fp:'

// POST /api/trial/consume - Consume leads from the free quota
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fingerprint, leadsCount } = body

    // Validate inputs
    if (!fingerprint || typeof fingerprint !== 'string' || fingerprint.length < 10) {
      return NextResponse.json(
        { error: 'Invalid fingerprint' },
        { status: 400 }
      )
    }

    if (!leadsCount || typeof leadsCount !== 'number' || leadsCount < 1 || leadsCount > 100) {
      return NextResponse.json(
        { error: 'Invalid leads count (must be 1-100)' },
        { status: 400 }
      )
    }

    const key = `${FINGERPRINT_PREFIX}${fingerprint}`
    const existingData = await redis.get(key) as { leadsUsed: number; createdAt: string; lastUsed: string; ip?: string } | null

    // If fingerprint doesn't exist, create it first
    if (!existingData) {
      const newTrial = {
        leadsUsed: leadsCount,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      }

      await redis.set(key, newTrial)

      return NextResponse.json({
        success: true,
        leadsConsumed: leadsCount,
        leadsUsed: leadsCount,
        leadsRemaining: FREE_LEAD_LIMIT - leadsCount,
        leadsTotal: FREE_LEAD_LIMIT,
        isLocked: FREE_LEAD_LIMIT - leadsCount === 0,
      })
    }

    // Check if already at limit
    if (existingData.leadsUsed >= FREE_LEAD_LIMIT) {
      return NextResponse.json({
        success: false,
        error: 'Free trial limit reached',
        leadsUsed: existingData.leadsUsed,
        leadsRemaining: 0,
        leadsTotal: FREE_LEAD_LIMIT,
        isLocked: true,
        upgradeUrl: 'https://mapsreach.com/pricing',
      })
    }

    // Calculate how many leads can actually be consumed
    const availableLeads = FREE_LEAD_LIMIT - existingData.leadsUsed
    const actualConsumed = Math.min(leadsCount, availableLeads)
    const newLeadsUsed = existingData.leadsUsed + actualConsumed
    const leadsRemaining = FREE_LEAD_LIMIT - newLeadsUsed

    // Update the record
    const updatedData = {
      ...existingData,
      leadsUsed: newLeadsUsed,
      lastUsed: new Date().toISOString(),
    }

    await redis.set(key, updatedData)

    // Track daily usage statistics
    const today = new Date().toISOString().split('T')[0]
    await redis.hincrby(`stats:daily:${today}`, 'leads_consumed', actualConsumed)
    await redis.hincrby(`stats:daily:${today}`, 'api_calls', 1)

    return NextResponse.json({
      success: true,
      leadsConsumed: actualConsumed,
      leadsRequested: leadsCount,
      leadsUsed: newLeadsUsed,
      leadsRemaining,
      leadsTotal: FREE_LEAD_LIMIT,
      isLocked: leadsRemaining === 0,
      ...(leadsRemaining === 0 && { upgradeUrl: 'https://mapsreach.com/pricing' }),
      ...(leadsRemaining <= 20 && leadsRemaining > 0 && { 
        warning: `Only ${leadsRemaining} free leads remaining!` 
      }),
    })

  } catch (error) {
    console.error('Consume leads error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
