import { NextRequest, NextResponse } from 'next/server'

// Affiliate login - supports both email and code login
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Support login by email
    const affiliate = global.affiliates?.find(
      a => a.email.toLowerCase() === email.toLowerCase() && a.password === password
    )

    if (!affiliate) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://getleadsnap.com'

    // Get affiliate's purchases
    const purchases = global.purchases?.filter(p => p.affiliateCode === affiliate.code) || []
    const clicks = global.referralClicks?.filter(c => c.code === affiliate.code) || []

    return NextResponse.json({
      success: true,
      affiliate: {
        code: affiliate.code,
        name: affiliate.name,
        email: affiliate.email,
        commission: affiliate.commission,
        referralLink: `${siteUrl}?ref=${affiliate.code}`
      },
      stats: {
        totalClicks: clicks.length,
        totalPurchases: purchases.length,
        pendingPayment: purchases.filter(p => p.status === 'pending_payment').length,
        awaitingVerification: purchases.filter(p => p.status === 'awaiting_verification').length,
        verified: purchases.filter(p => p.status === 'verified').length,
        completed: purchases.filter(p => p.status === 'completed').length,
        totalEarnings: purchases
          .filter(p => p.status === 'completed')
          .reduce((sum, p) => sum + p.commission, 0),
        pendingEarnings: purchases
          .filter(p => p.status === 'awaiting_verification' || p.status === 'verified')
          .reduce((sum, p) => sum + p.commission, 0)
      },
      purchases: purchases
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map(p => ({
          id: p.id,
          email: p.email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email for privacy
          status: p.status,
          paymentMethod: p.paymentMethod,
          amount: p.amount,
          commission: p.commission,
          createdAt: p.createdAt,
          paidAt: p.paidAt,
          verifiedAt: p.verifiedAt,
          completedAt: p.completedAt
        })),
      recentClicks: clicks
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 20)
        .map(c => ({
          timestamp: c.timestamp,
          device: c.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'
        }))
    })
  } catch (error) {
    console.error('Affiliate login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
