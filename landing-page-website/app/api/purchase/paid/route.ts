import { NextRequest, NextResponse } from 'next/server'

// Mark purchase as "I've Paid"
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const purchase = global.purchases?.find(p => p.token === token)
    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
    }

    if (purchase.status !== 'pending_payment') {
      return NextResponse.json({ error: 'Purchase already marked as paid' }, { status: 400 })
    }

    if (!purchase.paymentMethod) {
      return NextResponse.json({ error: 'Payment method not selected' }, { status: 400 })
    }

    // Update status
    purchase.status = 'awaiting_verification'
    purchase.paidAt = new Date().toISOString()

    // Add audit log
    purchase.auditLog.push({
      timestamp: new Date().toISOString(),
      action: 'MARKED_AS_PAID',
      details: `User clicked "I\'ve Paid" - awaiting admin verification`,
      actor: 'user'
    })

    // Get affiliate info for notification
    const affiliate = purchase.affiliateCode 
      ? global.affiliates?.find(a => a.code === purchase.affiliateCode) 
      : null

    // TODO: Send email notifications
    console.log(`[EMAIL TO ADMIN] Payment submitted for verification:
      - Purchase ID: ${purchase.id}
      - Customer: ${purchase.name} (${purchase.email})
      - Amount: $${purchase.amount}
      - Payment Method: ${purchase.paymentMethod?.toUpperCase()}
      - Affiliate: ${affiliate ? `${affiliate.name} (${affiliate.code})` : 'Direct sale'}
    `)

    if (affiliate) {
      console.log(`[EMAIL TO AFFILIATE ${affiliate.email}] A referral has submitted payment:
        - Customer Email: ${purchase.email.replace(/(.{2}).*(@.*)/, '$1***$2')}
        - Amount: $${purchase.amount}
        - Your Commission: $${purchase.commission}
        - Status: Awaiting Verification
      `)
    }

    return NextResponse.json({
      success: true,
      message: 'Payment marked as submitted. We will verify and process your order.'
    })
  } catch (error) {
    console.error('Error marking as paid:', error)
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 })
  }
}
