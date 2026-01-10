import { NextRequest, NextResponse } from 'next/server'

// Set payment method for a purchase
export async function POST(request: NextRequest) {
  try {
    const { token, paymentMethod } = await request.json()

    if (!token || !paymentMethod) {
      return NextResponse.json({ error: 'Token and payment method are required' }, { status: 400 })
    }

    const validMethods = ['usdt', 'skrill', 'neteller', 'bank', 'redotpay', 'payeer']
    if (!validMethods.includes(paymentMethod.toLowerCase())) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }

    const purchase = global.purchases?.find(p => p.token === token)
    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
    }

    if (purchase.status !== 'pending_payment') {
      return NextResponse.json({ error: 'Payment method already set' }, { status: 400 })
    }

    purchase.paymentMethod = paymentMethod.toLowerCase()
    
    // Add audit log
    purchase.auditLog.push({
      timestamp: new Date().toISOString(),
      action: 'PAYMENT_METHOD_SELECTED',
      details: `Payment method set to ${paymentMethod.toUpperCase()}`,
      actor: 'user'
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error setting payment method:', error)
    return NextResponse.json({ error: 'Failed to set payment method' }, { status: 500 })
  }
}
