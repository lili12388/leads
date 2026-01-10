import { NextRequest, NextResponse } from 'next/server'

// Track affiliate click
export async function POST(request: NextRequest) {
  try {
    const { code, userAgent } = await request.json()
    
    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 })
    }

    // Verify affiliate exists
    const affiliate = global.affiliates?.find(a => a.code === code.toUpperCase())
    if (!affiliate) {
      // Still track but don't error - might be an old link
      console.log(`[WARN] Click for unknown affiliate code: ${code}`)
    }

    const click = {
      id: `click_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      code: code.toUpperCase(),
      timestamp: new Date().toISOString(),
      userAgent: userAgent || 'Unknown',
      ip: request.headers.get('x-forwarded-for') || 'Unknown'
    }

    if (!global.referralClicks) global.referralClicks = []
    global.referralClicks.push(click)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking click:', error)
    return NextResponse.json({ error: 'Failed to track' }, { status: 500 })
  }
}
