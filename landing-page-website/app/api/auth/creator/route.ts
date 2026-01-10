import { NextRequest, NextResponse } from 'next/server'

// Use the shared global data store (declared in referral/track/route.ts)
// For production, use Vercel KV, Supabase, or MongoDB

if (!global.referralCreators) global.referralCreators = []
if (!global.referralVisits) global.referralVisits = []
if (!global.referralConversions) global.referralConversions = []

// POST - Creator Login
export async function POST(request: NextRequest) {
  try {
    const { code, password } = await request.json()

    if (!code || !password) {
      return NextResponse.json({ error: 'Code and password required' }, { status: 400 })
    }

    const creator = global.referralCreators.find(
      c => c.code.toUpperCase() === code.toUpperCase() && c.password === password
    )

    if (!creator) {
      return NextResponse.json({ error: 'Invalid code or password' }, { status: 401 })
    }

    // Calculate stats for this creator
    const creatorVisits = global.referralVisits.filter(v => v.code === creator.code)
    const creatorConversions = global.referralConversions.filter(c => c.code === creator.code)
    const closedCount = creatorConversions.filter(c => c.status === 'closed').length
    
    // $59 per sale
    const earnings = closedCount * 59 * (creator.commission / 100)

    const stats = {
      code: creator.code,
      name: creator.name,
      commission: creator.commission,
      referralLink: creator.referralLink,
      visits: creatorVisits.length,
      conversions: creatorConversions.length,
      closed: closedCount,
      earnings: earnings,
      recentVisits: creatorVisits
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 20)
        .map(v => ({
          id: v.id,
          timestamp: v.timestamp,
          userAgent: v.userAgent
        })),
      allConversions: creatorConversions
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .map(c => ({
          id: c.id,
          status: c.status,
          timestamp: c.timestamp
        }))
    }

    return NextResponse.json({ 
      success: true, 
      stats 
    })

  } catch (error) {
    console.error('Creator auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
