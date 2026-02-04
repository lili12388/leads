import { NextRequest, NextResponse } from 'next/server'
import { 
  getPurchases, 
  addPurchase, 
  getPurchaseByToken,
  getAffiliates,
  getAffiliateByCode,
  getReferralClicks,
  Purchase,
  Affiliate,
  AuditEntry
} from '@/lib/redis'

// Re-export types for other files
export type { Purchase, Affiliate, AuditEntry }

// Helper to generate unique tokens
function generateToken(): string {
  return `PUR_${Date.now()}_${Math.random().toString(36).substr(2, 12).toUpperCase()}`
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// POST - Create new purchase request
const PLAN_CONFIG: Record<string, { price: number; name: string }> = {
  single: { price: 59, name: 'MapsReach Extension – Single License' },
  extended: { price: 69, name: 'MapsReach Extension – Extended License' },
  outreach: { price: 49, name: 'MapsReach Outreach Tool' },
  bundle: { price: 89, name: 'Extension + Outreach Bundle' },
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, affiliateCode, plan } = await request.json()

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Get affiliate info if code provided
    let affiliate: Affiliate | null = null
    let commissionRate = 0
    if (affiliateCode) {
      affiliate = await getAffiliateByCode(affiliateCode)
      if (affiliate) {
        commissionRate = affiliate.commission
      }
    }

    const planKey = typeof plan === 'string' && PLAN_CONFIG[plan] ? plan : 'single'
    const productPrice = PLAN_CONFIG[planKey].price
    const productName = PLAN_CONFIG[planKey].name
    const commission = affiliate ? (productPrice * commissionRate / 100) : 0

    const purchase: Purchase = {
      id: generateId(),
      token: generateToken(),
      plan: planKey,
      productName,
      name,
      email,
      affiliateCode: affiliateCode?.toUpperCase() || null,
      affiliateCodeLocked: true, // LOCKED: Cannot be changed after creation
      paymentMethod: null,
      status: 'pending_payment',
      amount: productPrice,
      commission,
      createdAt: new Date().toISOString(),
      paidAt: null,
      verifiedAt: null,
      completedAt: null,
      paymentProof: null,
      auditLog: []
    }

    // Add audit logs
    purchase.auditLog.push({
      timestamp: new Date().toISOString(),
      action: 'CREATED',
      details: `Purchase request created by ${email} for ${productName} ($${productPrice})`,
      actor: 'user'
    })
    
    if (affiliate) {
      purchase.auditLog.push({
        timestamp: new Date().toISOString(),
        action: 'AFFILIATE_LOCKED',
        details: `Affiliate ${affiliate.code} (${affiliate.name}) permanently linked - cannot be changed`,
        actor: 'system'
      })
    }

    await addPurchase(purchase)

    console.log(`[EMAIL] New purchase request from ${email}${affiliate ? ` via affiliate ${affiliate.code}` : ''}`)

    return NextResponse.json({
      success: true,
      purchaseId: purchase.id,
      token: purchase.token
    })
  } catch (error) {
    console.error('Error creating purchase:', error)
    return NextResponse.json({ error: 'Failed to create purchase request' }, { status: 500 })
  }
}

// GET - Get purchases (admin or affiliate)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const adminKey = searchParams.get('adminKey')
  const affiliateCode = searchParams.get('affiliateCode')
  const token = searchParams.get('token')

  // Get single purchase by token
  if (token) {
    const purchase = await getPurchaseByToken(token)
    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
    }
    return NextResponse.json({
      purchase: {
        id: purchase.id,
        token: purchase.token,
        status: purchase.status,
        paymentMethod: purchase.paymentMethod,
        amount: purchase.amount,
        createdAt: purchase.createdAt,
        plan: purchase.plan,
        productName: purchase.productName
      }
    })
  }

  // Admin: get all purchases
  if (adminKey === process.env.ADMIN_SECRET) {
    const [purchases, affiliates] = await Promise.all([
      getPurchases(),
      getAffiliates()
    ])
    
    const purchasesWithAffiliate = purchases.map(p => ({
      ...p,
      affiliateName: affiliates.find(a => a.code === p.affiliateCode)?.name || null
    }))
    
    return NextResponse.json({
      purchases: purchasesWithAffiliate.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
      stats: {
        total: purchases.length,
        pending: purchases.filter(p => p.status === 'pending_payment').length,
        awaiting: purchases.filter(p => p.status === 'awaiting_verification').length,
        verified: purchases.filter(p => p.status === 'verified' || p.status === 'completed').length,
        totalRevenue: purchases.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
        totalCommissions: purchases.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.commission, 0)
      }
    })
  }

  // Affiliate: get their referred purchases
  if (affiliateCode) {
    const affiliate = await getAffiliateByCode(affiliateCode)
    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
    }

    const [allPurchases, allClicks] = await Promise.all([
      getPurchases(),
      getReferralClicks()
    ])

    const affiliatePurchases = allPurchases
      .filter(p => p.affiliateCode === affiliateCode.toUpperCase())
      .map(p => ({
        id: p.id,
        token: p.token,
        email: p.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        status: p.status,
        paymentMethod: p.paymentMethod,
        amount: p.amount,
        commission: p.commission,
        createdAt: p.createdAt,
        paidAt: p.paidAt,
        verifiedAt: p.verifiedAt
      }))

    const clicks = allClicks.filter(c => c.code === affiliateCode.toUpperCase())

    return NextResponse.json({
      purchases: affiliatePurchases.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
      stats: {
        totalClicks: clicks.length,
        totalPurchases: affiliatePurchases.length,
        pendingPayment: affiliatePurchases.filter(p => p.status === 'pending_payment').length,
        awaitingVerification: affiliatePurchases.filter(p => p.status === 'awaiting_verification').length,
        verified: affiliatePurchases.filter(p => p.status === 'verified' || p.status === 'completed').length,
        totalCommission: affiliatePurchases
          .filter(p => p.status === 'completed')
          .reduce((sum, p) => sum + p.commission, 0),
        pendingCommission: affiliatePurchases
          .filter(p => p.status === 'awaiting_verification' || p.status === 'verified')
          .reduce((sum, p) => sum + p.commission, 0)
      }
    })
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
