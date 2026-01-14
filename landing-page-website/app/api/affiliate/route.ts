import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { 
  getAffiliates, 
  addAffiliate, 
  getAffiliateByCode, 
  getAffiliateByEmail,
  deleteAffiliate as deleteAffiliateFromDb,
  updateAffiliate,
  getPurchases,
  getReferralClicks,
  Affiliate 
} from '@/lib/redis'

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
    const existingCode = await getAffiliateByCode(code)
    if (existingCode) {
      return NextResponse.json({ error: 'Affiliate code already exists' }, { status: 400 })
    }

    // Check if email already exists
    const existingEmail = await getAffiliateByEmail(email)
    if (existingEmail) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mapsreach.com'

    // Hash the password with bcrypt
    const passwordHash = await bcrypt.hash(password, 12)

    const affiliate: Affiliate = {
      code: code.toUpperCase(),
      name,
      email: email.toLowerCase(),
      passwordHash,
      passwordPlain: password,
      commission: commission || 20,
      createdAt: new Date().toISOString()
    }

    await addAffiliate(affiliate)

    console.log(`[EMAIL TO AFFILIATE ${email}] Welcome to MapsReach Affiliate Program! 🎉
      
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mapsreach.com'

  const [affiliates, purchases, clicks] = await Promise.all([
    getAffiliates(),
    getPurchases(),
    getReferralClicks()
  ])

  // Get affiliate stats
  const affiliatesWithStats = affiliates.map(affiliate => {
    const affiliatePurchases = purchases.filter(p => p.affiliateCode === affiliate.code)
    const affiliateClicks = clicks.filter(c => c.code === affiliate.code)
    
    return {
      code: affiliate.code,
      name: affiliate.name,
      email: affiliate.email,
      password: affiliate.passwordPlain,
      commission: affiliate.commission,
      referralLink: `${siteUrl}?ref=${affiliate.code}`,
      createdAt: affiliate.createdAt,
      stats: {
        clicks: affiliateClicks.length,
        totalPurchases: affiliatePurchases.length,
        pendingPayment: affiliatePurchases.filter(p => p.status === 'pending_payment').length,
        awaitingVerification: affiliatePurchases.filter(p => p.status === 'awaiting_verification').length,
        completed: affiliatePurchases.filter(p => p.status === 'completed').length,
        totalEarnings: affiliatePurchases
          .filter(p => p.status === 'completed')
          .reduce((sum, p) => sum + p.commission, 0),
        pendingEarnings: affiliatePurchases
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

    const deleted = await deleteAffiliateFromDb(code)
    if (!deleted) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting affiliate:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}

// Admin: Reset affiliate password
export async function PATCH(request: NextRequest) {
  try {
    const { code, adminKey } = await request.json()
    
    if (adminKey !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const affiliate = await getAffiliateByCode(code)
    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
    }

    // Generate new random password
    const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase()
    
    // Hash and store new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12)
    
    await updateAffiliate(code, {
      passwordHash: newPasswordHash,
      passwordPlain: newPassword
    })

    return NextResponse.json({ 
      success: true, 
      newPassword,
      message: `Password reset for ${affiliate.name}` 
    })
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}
