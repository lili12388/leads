import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const FREE_LEAD_LIMIT = 100
const FINGERPRINT_PREFIX = 'fp:'
const LICENSE_PREFIX = 'license:'

// POST /api/license/activate - Activate a purchased license
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fingerprint, licenseKey } = body

    // Validate inputs
    if (!fingerprint || typeof fingerprint !== 'string' || fingerprint.length < 10) {
      return NextResponse.json(
        { error: 'Invalid fingerprint' },
        { status: 400 }
      )
    }

    if (!licenseKey || typeof licenseKey !== 'string' || licenseKey.length < 10) {
      return NextResponse.json(
        { error: 'Invalid license key' },
        { status: 400 }
      )
    }

    // Check if license key exists and is valid
    const licenseData = await redis.get(`${LICENSE_PREFIX}${licenseKey}`) as {
      email: string
      plan: string
      leadsLimit: number
      createdAt: string
      activatedAt?: string
      activatedFingerprint?: string
      status: 'active' | 'used' | 'expired' | 'revoked'
    } | null

    if (!licenseData) {
      return NextResponse.json({
        success: false,
        error: 'Invalid license key. Please check and try again.',
      }, { status: 404 })
    }

    // Check license status
    if (licenseData.status === 'used') {
      return NextResponse.json({
        success: false,
        error: 'This license key has already been activated on another device.',
        activatedAt: licenseData.activatedAt,
      }, { status: 400 })
    }

    if (licenseData.status === 'expired') {
      return NextResponse.json({
        success: false,
        error: 'This license key has expired.',
      }, { status: 400 })
    }

    if (licenseData.status === 'revoked') {
      return NextResponse.json({
        success: false,
        error: 'This license key has been revoked.',
      }, { status: 400 })
    }

    // Activate the license
    const activatedLicense = {
      ...licenseData,
      status: 'used' as const,
      activatedAt: new Date().toISOString(),
      activatedFingerprint: fingerprint,
    }

    await redis.set(`${LICENSE_PREFIX}${licenseKey}`, activatedLicense)

    // Update the fingerprint record to mark as licensed
    const fpKey = `${FINGERPRINT_PREFIX}${fingerprint}`
    const fpData = await redis.get(fpKey) as { leadsUsed: number; createdAt: string } | null

    const updatedFpData = {
      ...(fpData || { leadsUsed: 0, createdAt: new Date().toISOString() }),
      licenseKey,
      licensePlan: licenseData.plan,
      licenseLeadsLimit: licenseData.leadsLimit,
      licenseActivatedAt: new Date().toISOString(),
    }

    await redis.set(fpKey, updatedFpData)

    // Track activation
    const today = new Date().toISOString().split('T')[0]
    await redis.hincrby(`stats:daily:${today}`, 'licenses_activated', 1)

    return NextResponse.json({
      success: true,
      message: 'License activated successfully!',
      plan: licenseData.plan,
      leadsLimit: licenseData.leadsLimit,
      email: licenseData.email,
    })

  } catch (error) {
    console.error('License activation error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

// GET /api/license/activate?licenseKey=xxx - Check license status
export async function GET(request: NextRequest) {
  try {
    const licenseKey = request.nextUrl.searchParams.get('licenseKey')

    if (!licenseKey || licenseKey.length < 10) {
      return NextResponse.json(
        { error: 'Invalid license key' },
        { status: 400 }
      )
    }

    const licenseData = await redis.get(`${LICENSE_PREFIX}${licenseKey}`) as {
      email: string
      plan: string
      leadsLimit: number
      createdAt: string
      activatedAt?: string
      status: string
    } | null

    if (!licenseData) {
      return NextResponse.json({
        success: false,
        exists: false,
        error: 'License key not found',
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      exists: true,
      plan: licenseData.plan,
      leadsLimit: licenseData.leadsLimit,
      status: licenseData.status,
      createdAt: licenseData.createdAt,
      activatedAt: licenseData.activatedAt,
    })

  } catch (error) {
    console.error('License check error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
