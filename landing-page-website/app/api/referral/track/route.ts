import { NextRequest, NextResponse } from 'next/server'

// Shared global data store (consistent across all API routes)
// For production, use Vercel KV, Supabase, or MongoDB

interface Creator {
  code: string
  name: string
  password: string
  commission: number
  referralLink: string
  createdAt: string
}

interface Visit {
  id: string
  code: string
  timestamp: string
  userAgent: string
  ip: string
}

interface Conversion {
  id: string
  code: string
  status: 'pending' | 'closed' | 'lost'
  notes: string
  timestamp: string
  closedAt?: string
}

declare global {
  // eslint-disable-next-line no-var
  var referralCreators: Creator[]
  // eslint-disable-next-line no-var
  var referralVisits: Visit[]
  // eslint-disable-next-line no-var
  var referralConversions: Conversion[]
}

if (!global.referralCreators) global.referralCreators = []
if (!global.referralVisits) global.referralVisits = []
if (!global.referralConversions) global.referralConversions = []

// Track a new referral visit
export async function POST(request: NextRequest) {
  try {
    const { code, userAgent } = await request.json()
    
    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 })
    }

    const visit: Visit = {
      id: `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      code: code.toUpperCase(),
      timestamp: new Date().toISOString(),
      userAgent: userAgent || 'Unknown',
      ip: request.headers.get('x-forwarded-for') || 'Unknown'
    }

    global.referralVisits.push(visit)

    return NextResponse.json({ success: true, visitId: visit.id })
  } catch {
    return NextResponse.json({ error: 'Failed to track' }, { status: 500 })
  }
}

// Get referral stats
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const adminKey = searchParams.get('adminKey')

  // Check admin access
  const isAdmin = adminKey === process.env.ADMIN_SECRET

  if (code) {
    // Get stats for specific creator
    const visits = global.referralVisits.filter(v => v.code === code.toUpperCase())
    const conversions = global.referralConversions.filter(c => c.code === code.toUpperCase())
    
    return NextResponse.json({
      code,
      totalVisits: visits.length,
      totalConversions: conversions.length,
      closedDeals: conversions.filter(c => c.status === 'closed').length,
      pendingDeals: conversions.filter(c => c.status === 'pending').length,
      lostDeals: conversions.filter(c => c.status === 'lost').length,
      visits: isAdmin ? visits : visits.slice(-10),
      conversions: isAdmin ? conversions : conversions.map(c => ({
        ...c,
        notes: undefined
      }))
    })
  }

  // Admin: get all stats
  if (isAdmin) {
    const allCodes = [...new Set(global.referralVisits.map(v => v.code))]
    const stats = allCodes.map(code => ({
      code,
      visits: global.referralVisits.filter(v => v.code === code).length,
      conversions: global.referralConversions.filter(c => c.code === code).length,
      closed: global.referralConversions.filter(c => c.code === code && c.status === 'closed').length
    }))

    return NextResponse.json({
      totalVisits: global.referralVisits.length,
      totalConversions: global.referralConversions.length,
      totalClosed: global.referralConversions.filter(c => c.status === 'closed').length,
      creators: stats,
      recentVisits: global.referralVisits.slice(-20).reverse(),
      allConversions: global.referralConversions
    })
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
