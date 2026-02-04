import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const FREE_LEAD_LIMIT = 100
const FINGERPRINT_PREFIX = 'fp:'

interface TrialData {
  fingerprint: string
  leadsUsed: number
  leadsRemaining: number
  isLocked: boolean
  createdAt: string
  lastUsed?: string
  ip?: string
}

// GET /api/admin/trials - List all trials
export async function GET(request: NextRequest) {
  try {
    const adminKey = request.headers.get('x-admin-key')
    if (adminKey !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all fingerprint keys
    const keys = await redis.keys(`${FINGERPRINT_PREFIX}*`)
    
    const trials: TrialData[] = []
    let totalLeadsUsed = 0
    let expiredCount = 0
    let activeCount = 0

    // Fetch data for each fingerprint
    for (const key of keys) {
      const data = await redis.get(key) as { leadsUsed: number; createdAt: string; lastUsed?: string; ip?: string } | null
      if (data) {
        const fingerprint = key.replace(FINGERPRINT_PREFIX, '')
        const leadsUsed = data.leadsUsed || 0
        const leadsRemaining = Math.max(0, FREE_LEAD_LIMIT - leadsUsed)
        const isLocked = leadsRemaining === 0

        trials.push({
          fingerprint,
          leadsUsed,
          leadsRemaining,
          isLocked,
          createdAt: data.createdAt || 'Unknown',
          lastUsed: data.lastUsed,
          ip: data.ip,
        })

        totalLeadsUsed += leadsUsed
        if (isLocked) {
          expiredCount++
        } else {
          activeCount++
        }
      }
    }

    // Sort by lastUsed or createdAt (most recent first)
    trials.sort((a, b) => {
      const dateA = new Date(a.lastUsed || a.createdAt).getTime()
      const dateB = new Date(b.lastUsed || b.createdAt).getTime()
      return dateB - dateA
    })

    return NextResponse.json({
      success: true,
      trials,
      stats: {
        total: trials.length,
        active: activeCount,
        expired: expiredCount,
        totalLeadsUsed,
      },
      leadsLimit: FREE_LEAD_LIMIT,
    })
  } catch (error) {
    console.error('Admin trials list error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST /api/admin/trials - Manage trials (reset, delete, etc.)
export async function POST(request: NextRequest) {
  try {
    const adminKey = request.headers.get('x-admin-key')
    if (adminKey !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, fingerprint } = body

    if (!fingerprint || typeof fingerprint !== 'string') {
      return NextResponse.json({ error: 'Invalid fingerprint' }, { status: 400 })
    }

    const key = `${FINGERPRINT_PREFIX}${fingerprint}`
    const existing = await redis.get(key) as { leadsUsed: number; createdAt: string; lastUsed?: string; ip?: string } | null

    if (!existing) {
      return NextResponse.json({ error: 'Trial not found' }, { status: 404 })
    }

    switch (action) {
      case 'reset': {
        // Reset leads used to 0
        await redis.set(key, {
          ...existing,
          leadsUsed: 0,
          lastUsed: new Date().toISOString(),
        })
        return NextResponse.json({ success: true, message: 'Trial reset successfully' })
      }

      case 'add_leads': {
        const amount = Number(body.amount) || 50
        await redis.set(key, {
          ...existing,
          leadsUsed: Math.max(0, existing.leadsUsed - amount),
          lastUsed: new Date().toISOString(),
        })
        return NextResponse.json({ success: true, message: `Added ${amount} leads` })
      }

      case 'lock': {
        // Set leads used to max to lock
        await redis.set(key, {
          ...existing,
          leadsUsed: FREE_LEAD_LIMIT,
          lastUsed: new Date().toISOString(),
        })
        return NextResponse.json({ success: true, message: 'Trial locked' })
      }

      case 'delete': {
        await redis.del(key)
        return NextResponse.json({ success: true, message: 'Trial deleted' })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin trials action error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
