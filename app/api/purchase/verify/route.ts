import { NextRequest, NextResponse } from 'next/server'
import { getPurchases, savePurchases, getAffiliateByCode } from '@/lib/redis'

// Admin: Verify payment and complete sale
export async function POST(request: NextRequest) {
  try {
    const { purchaseId, action, adminKey, notes, licenseKey } = await request.json()

    // Verify admin
    if (adminKey !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!purchaseId || !action) {
      return NextResponse.json({ error: 'Purchase ID and action are required' }, { status: 400 })
    }

    const purchases = await getPurchases()
    const purchaseIndex = purchases.findIndex(p => p.id === purchaseId)
    
    if (purchaseIndex === -1) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
    }

    const purchase = purchases[purchaseIndex]

    const affiliate = purchase.affiliateCode 
      ? await getAffiliateByCode(purchase.affiliateCode)
      : null

    if (action === 'verify') {
      // Verify the payment
      if (purchase.status !== 'awaiting_verification') {
        return NextResponse.json({ error: 'Purchase is not awaiting verification' }, { status: 400 })
      }

      purchase.status = 'verified'
      purchase.verifiedAt = new Date().toISOString()

      purchase.auditLog.push({
        timestamp: new Date().toISOString(),
        action: 'PAYMENT_VERIFIED',
        details: notes ? `Payment verified by admin. Notes: ${notes}` : 'Payment verified by admin',
        actor: 'admin'
      })

      // Save to Redis
      purchases[purchaseIndex] = purchase
      await savePurchases(purchases)

      console.log(`[EMAIL TO CUSTOMER ${purchase.email}] Payment Verified!
        Your payment has been verified. Your license is being prepared.
      `)

      if (affiliate) {
        console.log(`[EMAIL TO AFFILIATE ${affiliate.email}] Sale Verified! 🎉
          - Customer: ${purchase.email.replace(/(.{2}).*(@.*)/, '$1***$2')}
          - Your Commission: $${purchase.commission}
          - Status: Verified - Pending License Delivery
        `)
      }

      return NextResponse.json({ success: true, message: 'Payment verified' })
    }

    if (action === 'complete') {
      // Complete the sale and deliver license
      if (purchase.status !== 'verified' && purchase.status !== 'awaiting_verification') {
        return NextResponse.json({ error: 'Purchase cannot be completed in current status' }, { status: 400 })
      }

      purchase.status = 'completed'
      purchase.completedAt = new Date().toISOString()
      if (!purchase.verifiedAt) {
        purchase.verifiedAt = new Date().toISOString()
      }

      purchase.auditLog.push({
        timestamp: new Date().toISOString(),
        action: 'SALE_COMPLETED',
        details: licenseKey 
          ? `Sale completed. License key delivered: ${licenseKey.substring(0, 8)}...` 
          : 'Sale completed. License delivered.',
        actor: 'admin'
      })

      // Credit affiliate commission
      if (affiliate) {
        purchase.auditLog.push({
          timestamp: new Date().toISOString(),
          action: 'COMMISSION_CREDITED',
          details: `Commission of $${purchase.commission} credited to affiliate ${affiliate.code}`,
          actor: 'system'
        })
      }

      // Save to Redis
      purchases[purchaseIndex] = purchase
      await savePurchases(purchases)

      console.log(`[EMAIL TO CUSTOMER ${purchase.email}] 🎉 Your License is Ready!
        Thank you for your purchase!
        
        Your License Key: ${licenseKey || '[GENERATED_KEY]'}
        
        Installation Instructions:
        1. Download the extension from the link provided
        2. Open Chrome Extensions (chrome://extensions)
        3. Enable Developer Mode
        4. Load the extension
        5. Enter your license key when prompted
        
        Need help? Reply to this email or contact support.
      `)

      if (affiliate) {
        console.log(`[EMAIL TO AFFILIATE ${affiliate.email}] 💰 Commission Confirmed!
          Great news! Your referral has completed their purchase.
          
          - Commission Earned: $${purchase.commission}
          - Sale Amount: $${purchase.amount}
          - Customer: ${purchase.email.replace(/(.{2}).*(@.*)/, '$1***$2')}
          
          This commission will be included in your next payout.
        `)
      }

      return NextResponse.json({ success: true, message: 'Sale completed and license delivered' })
    }

    if (action === 'reject') {
      // Reject/cancel the purchase
      purchase.auditLog.push({
        timestamp: new Date().toISOString(),
        action: 'PAYMENT_REJECTED',
        details: notes ? `Payment rejected by admin. Reason: ${notes}` : 'Payment rejected by admin',
        actor: 'admin'
      })

      // Remove from active purchases or mark as rejected
      purchase.status = 'pending_payment' // Reset to allow retry

      // Save to Redis
      purchases[purchaseIndex] = purchase
      await savePurchases(purchases)

      console.log(`[EMAIL TO CUSTOMER ${purchase.email}] Payment Issue
        We couldn't verify your payment. Please check the payment details and try again,
        or contact support if you believe this is an error.
        
        ${notes ? `Note: ${notes}` : ''}
      `)

      return NextResponse.json({ success: true, message: 'Payment rejected' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 })
  }
}
