import { NextRequest, NextResponse } from 'next/server'
import { 
  getPurchases, 
  savePurchases,
  getPurchaseByToken,
  getAffiliateByCode 
} from '@/lib/redis'

// Telegram notification function
async function sendTelegramNotification(message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  
  if (!botToken || !chatId) {
    console.log('[TELEGRAM] Bot token or chat ID not configured')
    return
  }
  
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    })
  } catch (error) {
    console.error('[TELEGRAM] Failed to send notification:', error)
  }
}

// Rate limiting store (simple in-memory)
const rateLimitStore: Map<string, { count: number; resetAt: number }> = new Map()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute window
  const maxRequests = 5 // 5 requests per minute
  
  const record = rateLimitStore.get(ip)
  if (!record || now > record.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  
  if (record.count >= maxRequests) {
    return false
  }
  
  record.count++
  return true
}

// Mark purchase as "I've Paid" with optional payment proof
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 })
    }

    const { token, paymentProof } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const purchases = await getPurchases()
    const purchaseIndex = purchases.findIndex(p => p.token === token)
    
    if (purchaseIndex === -1) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
    }

    const purchase = purchases[purchaseIndex]

    if (purchase.status !== 'pending_payment') {
      return NextResponse.json({ error: 'Purchase already marked as paid' }, { status: 400 })
    }

    if (!purchase.paymentMethod) {
      return NextResponse.json({ error: 'Payment method not selected' }, { status: 400 })
    }

    // Update status
    purchase.status = 'awaiting_verification'
    purchase.paidAt = new Date().toISOString()

    // Store payment proof if provided
    if (paymentProof && paymentProof.type && paymentProof.value) {
      purchase.paymentProof = {
        type: paymentProof.type,
        value: paymentProof.value,
        submittedAt: new Date().toISOString()
      }
      
      // Add audit log for proof submission
      purchase.auditLog.push({
        timestamp: new Date().toISOString(),
        action: 'PROOF_SUBMITTED',
        details: `Payment proof submitted: ${paymentProof.type === 'transaction_hash' ? 'Transaction hash' : 'Screenshot'}`,
        actor: 'user'
      })
    }

    // Add audit log
    purchase.auditLog.push({
      timestamp: new Date().toISOString(),
      action: 'MARKED_AS_PAID',
      details: `User clicked "I've Paid" - awaiting admin verification${paymentProof ? ' (proof attached)' : ''}`,
      actor: 'user'
    })

    // Save to Redis
    purchases[purchaseIndex] = purchase
    await savePurchases(purchases)

    // Get affiliate info for notification
    const affiliate = purchase.affiliateCode 
      ? await getAffiliateByCode(purchase.affiliateCode)
      : null

    // TODO: Send email notifications
    console.log(`[EMAIL TO ADMIN] Payment submitted for verification:
      - Purchase ID: ${purchase.id}
      - Customer: ${purchase.name} (${purchase.email})
      - Amount: $${purchase.amount}
      - Payment Method: ${purchase.paymentMethod?.toUpperCase()}
      - Affiliate: ${affiliate ? `${affiliate.name} (${affiliate.code})` : 'Direct sale'}
    `)

    // Send Telegram notification
    const telegramMessage = `🔔 <b>NEW PAYMENT SUBMITTED!</b>

💰 <b>Amount:</b> $${purchase.amount}
👤 <b>Customer:</b> ${purchase.name}
📧 <b>Email:</b> ${purchase.email}
💳 <b>Method:</b> ${purchase.paymentMethod?.toUpperCase()}
${paymentProof ? `📎 <b>Proof:</b> ${paymentProof.type === 'transaction_hash' ? 'TX Hash attached' : 'Screenshot attached'}` : '⚠️ No proof attached'}
${affiliate ? `🤝 <b>Affiliate:</b> ${affiliate.name} (${affiliate.code})` : '🎯 Direct sale'}

🔗 <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mapsreach.com'}/admin">Open Admin Panel</a>`
    
    await sendTelegramNotification(telegramMessage)

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
