import { NextRequest, NextResponse } from 'next/server'

// Affiliate management - Updated to use new system

interface Affiliate {
  code: string
  name: string
  email: string
  password: string
  commission: number
  createdAt: string
}

declare global {
  var affiliates: Affiliate[]
}

if (!global.affiliates) global.affiliates = []

// Admin: Add new affiliate
export async function POST(request: NextRequest) {
  try {
    const { name, code, email, password, commission, adminKey } = await request.json()
    
    if (adminKey !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!name || !code || !email || !password) {
      return NextResponse.json({ error: 'Name, code, email, and password are required' }, { status: 400 })
    }

    // Check if code already exists
    if (global.affiliates.find(a => a.code === code.toUpperCase())) {
      return NextResponse.json({ error: 'Affiliate code already exists' }, { status: 400 })
    }

    // Check if email already exists
    if (global.affiliates.find(a => a.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://getleadsnap.com'

    const affiliate: Affiliate = {
      code: code.toUpperCase(),
      name,
      email: email.toLowerCase(),
      password, // In production, hash this!
      commission: commission || 20,
      createdAt: new Date().toISOString()
    }

    global.affiliates.push(affiliate)

    console.log(`[EMAIL TO AFFILIATE ${email}] Welcome to LeadSnap Affiliate Program! 🎉
      
      Your affiliate account has been created:
      
      - Affiliate Code: ${affiliate.code}
      - Your Referral Link: ${siteUrl}?ref=${affiliate.code}
      - Commission Rate: ${affiliate.commission}%
      - Login URL: ${siteUrl}/affiliate
      - Password: ${password}
      
      Share your referral link and earn $${(59 * affiliate.commission / 100).toFixed(2)} for every sale!
    `)

    return NextResponse.json({ 
      success: true, 
      affiliate: {
        code: affiliate.code,
        name: affiliate.name,
        email: affiliate.email,
        commission: affiliate.commission,
        referralLink: `${siteUrl}?ref=${affiliate.code}`
      }
    })
  } catch (error) {
    console.error('Error creating affiliate:', error)
    return NextResponse.json({ error: 'Failed to create affiliate' }, { status: 500 })
  }
}

// Get affiliates (admin only)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const adminKey = searchParams.get('adminKey')

  if (adminKey !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://getleadsnap.com'

  // Get affiliate stats
  const affiliatesWithStats = global.affiliates.map(affiliate => {
    const purchases = global.purchases?.filter(p => p.affiliateCode === affiliate.code) || []
    const clicks = global.referralClicks?.filter(c => c.code === affiliate.code) || []
    
    return {
      code: affiliate.code,
      name: affiliate.name,
      email: affiliate.email,
      commission: affiliate.commission,
      referralLink: `${siteUrl}?ref=${affiliate.code}`,
      createdAt: affiliate.createdAt,
      stats: {
        clicks: clicks.length,
        totalPurchases: purchases.length,
        pendingPayment: purchases.filter(p => p.status === 'pending_payment').length,
        awaitingVerification: purchases.filter(p => p.status === 'awaiting_verification').length,
        completed: purchases.filter(p => p.status === 'completed').length,
        totalEarnings: purchases
          .filter(p => p.status === 'completed')
          .reduce((sum, p) => sum + p.commission, 0),
        pendingEarnings: purchases
          .filter(p => p.status === 'awaiting_verification' || p.status === 'verified')
          .reduce((sum, p) => sum + p.commission, 0)
      }
    }
  })

  return NextResponse.json({ affiliates: affiliatesWithStats })
}

// Admin: Delete affiliate
export async function DELETE(request: NextRequest) {
  try {
    const { code, adminKey } = await request.json()
    
    if (adminKey !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const index = global.affiliates.findIndex(a => a.code === code.toUpperCase())
    if (index === -1) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
    }

    global.affiliates.splice(index, 1)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting affiliate:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
