import { Redis } from '@upstash/redis'

// Initialize Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Types
export interface Purchase {
  id: string
  token: string
  plan?: string
  productName?: string
  name: string
  email: string
  affiliateCode: string | null
  affiliateCodeLocked: boolean
  paymentMethod: string | null
  status: 'pending_payment' | 'awaiting_verification' | 'verified' | 'completed'
  amount: number
  commission: number
  createdAt: string
  paidAt: string | null
  verifiedAt: string | null
  completedAt: string | null
  paymentProof: PaymentProof | null
  auditLog: AuditEntry[]
}

export interface PaymentProof {
  type: 'transaction_hash' | 'screenshot'
  value: string
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
  passwordHash: string
  passwordPlain: string
  commission: number
  createdAt: string
}

export interface ReferralClick {
  id: string
  code: string
  timestamp: string
  userAgent: string
  ip: string
}

// Helper functions for Redis operations

// Purchases
export async function getPurchases(): Promise<Purchase[]> {
  const purchases = await redis.get<Purchase[]>('purchases')
  return purchases || []
}

export async function savePurchases(purchases: Purchase[]): Promise<void> {
  await redis.set('purchases', purchases)
}

export async function getPurchaseById(id: string): Promise<Purchase | null> {
  const purchases = await getPurchases()
  return purchases.find(p => p.id === id) || null
}

export async function getPurchaseByToken(token: string): Promise<Purchase | null> {
  const purchases = await getPurchases()
  return purchases.find(p => p.token === token) || null
}

export async function addPurchase(purchase: Purchase): Promise<void> {
  const purchases = await getPurchases()
  purchases.push(purchase)
  await savePurchases(purchases)
}

export async function updatePurchase(id: string, updates: Partial<Purchase>): Promise<Purchase | null> {
  const purchases = await getPurchases()
  const index = purchases.findIndex(p => p.id === id)
  if (index === -1) return null
  
  purchases[index] = { ...purchases[index], ...updates }
  await savePurchases(purchases)
  return purchases[index]
}

// Affiliates
export async function getAffiliates(): Promise<Affiliate[]> {
  const affiliates = await redis.get<Affiliate[]>('affiliates')
  return affiliates || []
}

export async function saveAffiliates(affiliates: Affiliate[]): Promise<void> {
  await redis.set('affiliates', affiliates)
}

export async function getAffiliateByCode(code: string): Promise<Affiliate | null> {
  const affiliates = await getAffiliates()
  return affiliates.find(a => a.code === code.toUpperCase()) || null
}

export async function getAffiliateByEmail(email: string): Promise<Affiliate | null> {
  const affiliates = await getAffiliates()
  return affiliates.find(a => a.email.toLowerCase() === email.toLowerCase()) || null
}

export async function addAffiliate(affiliate: Affiliate): Promise<void> {
  const affiliates = await getAffiliates()
  affiliates.push(affiliate)
  await saveAffiliates(affiliates)
}

export async function updateAffiliate(code: string, updates: Partial<Affiliate>): Promise<Affiliate | null> {
  const affiliates = await getAffiliates()
  const index = affiliates.findIndex(a => a.code === code.toUpperCase())
  if (index === -1) return null
  
  affiliates[index] = { ...affiliates[index], ...updates }
  await saveAffiliates(affiliates)
  return affiliates[index]
}

export async function deleteAffiliate(code: string): Promise<boolean> {
  const affiliates = await getAffiliates()
  const index = affiliates.findIndex(a => a.code === code.toUpperCase())
  if (index === -1) return false
  
  affiliates.splice(index, 1)
  await saveAffiliates(affiliates)
  return true
}

// Referral Clicks
export async function getReferralClicks(): Promise<ReferralClick[]> {
  const clicks = await redis.get<ReferralClick[]>('referralClicks')
  return clicks || []
}

export async function saveReferralClicks(clicks: ReferralClick[]): Promise<void> {
  await redis.set('referralClicks', clicks)
}

export async function addReferralClick(click: ReferralClick): Promise<void> {
  const clicks = await getReferralClicks()
  clicks.push(click)
  await saveReferralClicks(clicks)
}

export async function getReferralClicksByCode(code: string): Promise<ReferralClick[]> {
  const clicks = await getReferralClicks()
  return clicks.filter(c => c.code === code.toUpperCase())
}
