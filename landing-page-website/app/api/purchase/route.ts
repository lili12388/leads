import { NextRequest, NextResponse } from 'next/server'

// Types
export interface Purchase {
  id: string
  token: string
  name: string
  email: string
  affiliateCode: string | null
  affiliateCodeLocked: boolean // Cannot be changed after creation
  paymentMethod: string | null
  status: 'pending_payment' | 'awaiting_verification' | 'verified' | 'completed'
  amount: number
  commission: number
  createdAt: string
  paidAt: string | null
  verifiedAt: string | null
  completedAt: string | null
  paymentProof: PaymentProof | null // NEW: proof of payment
  auditLog: AuditEntry[]
}

export interface PaymentProof {
  type: 'transaction_hash' | 'screenshot'
  value: string // hash or base64 image data
  submittedAt: string
}

export interface AuditEntry {
  timestamp: string
  action: string
  details: string
  actor: 'system' | 'user' | 'admin'
}

export interface Affiliate {
  code: string
  name: string
  email: string
  passwordHash: string  // bcrypt hashed password
  commission: number
  createdAt: string
}

// Global data store (use database in production)
declare global {
  var purchases: Purchase[]
  var affiliates: Affiliate[]
  var referralClicks: Array<{
    id: string
    code: string
    timestamp: string
    userAgent: string
    ip: string
  }>
}

if (!global.purchases) global.purchases = []
if (!global.affiliates) global.affiliates = []
if (!global.referralClicks) global.referralClicks = []

// Helper to generate unique tokens
function generateToken(): string {
  return `PUR_${Date.now()}_${Math.random().toString(36).substr(2, 12).toUpperCase()}`
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Helper to add audit log entry
function addAuditLog(purchase: Purchase, action: string, details: string, actor: 'system' | 'user' | 'admin') {
  purchase.auditLog.push({
    timestamp: new Date().toISOString(),
    action,
    details,
    actor
  })
}

// POST - Create new purchase request
export async function POST(request: NextRequest) {
  try {
    const { name, email, affiliateCode } = await request.json()

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Get affiliate info if code provided
    let affiliate: Affiliate | undefined
    let commissionRate = 0
    if (affiliateCode) {
      affiliate = global.affiliates.find(a => a.code === affiliateCode.toUpperCase())
      if (affiliate) {
        commissionRate = affiliate.commission
      }
    }

    const productPrice = 59 // $59 USD
    const commission = affiliate ? (productPrice * commissionRate / 100) : 0

    const purchase: Purchase = {
      id: generateId(),
      token: generateToken(),
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

    addAuditLog(purchase, 'CREATED', `Purchase request created by ${email}`, 'user')
    
    if (affiliate) {
      addAuditLog(purchase, 'AFFILIATE_LOCKED', `Affiliate ${affiliate.code} (${affiliate.name}) permanently linked - cannot be changed`, 'system')
    }

    global.purchases.push(purchase)

    // TODO: Send email notification to admin
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
    const purchase = global.purchases.find(p => p.token === token)
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
        createdAt: purchase.createdAt
      }
    })
  }

  // Admin: get all purchases
  if (adminKey === process.env.ADMIN_SECRET) {
    const purchases = global.purchases.map(p => ({
      ...p,
      affiliateName: global.affiliates.find(a => a.code === p.affiliateCode)?.name || null
    }))
    
    return NextResponse.json({
      purchases: purchases.sort((a, b) => 
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
    const affiliate = global.affiliates.find(a => a.code === affiliateCode.toUpperCase())
    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
    }

    const affiliatePurchases = global.purchases
      .filter(p => p.affiliateCode === affiliateCode.toUpperCase())
      .map(p => ({
        id: p.id,
        token: p.token,
        email: p.email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Partially mask email
        status: p.status,
        paymentMethod: p.paymentMethod,
        amount: p.amount,
        commission: p.commission,
        createdAt: p.createdAt,
        paidAt: p.paidAt,
        verifiedAt: p.verifiedAt
      }))

    const clicks = global.referralClicks.filter(c => c.code === affiliateCode.toUpperCase())

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
