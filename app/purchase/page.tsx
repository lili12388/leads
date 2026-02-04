"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { safeLocalStorageGet, safeLocalStorageSet } from "@/lib/safe-storage"

// Cookie helper function
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

function PurchaseContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null)
  const [planKey, setPlanKey] = useState<'single' | 'extended' | 'outreach' | 'bundle'>('single')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const planConfig = {
    single: {
      price: 59,
      title: 'Single License',
      label: 'MapsReach Extension',
      tag: 'Most Popular',
      highlights: [
        '1 browser license',
        'Unlimited lead extractions',
        'Export to Sheets and CSV',
        'Lifetime updates'
      ]
    },
    extended: {
      price: 69,
      title: 'Extended License',
      label: 'MapsReach Extension',
      tag: 'Professional',
      highlights: [
        'Up to 3 browsers',
        'Unlimited lead extractions',
        'Priority email support',
        'Lifetime updates'
      ]
    },
    outreach: {
      price: 49,
      title: 'Outreach Tool',
      label: 'WhatsApp and Email Outreach',
      tag: 'Outreach',
      highlights: [
        'WhatsApp and email outreach',
        'CSV lead import',
        'Campaign templates',
        'Windows desktop app'
      ]
    },
    bundle: {
      price: 89,
      title: 'Bundle Deal',
      label: 'Extension + Outreach Bundle',
      tag: 'Best Deal',
      highlights: [
        'Extension + outreach tool',
        'Save vs buying separately',
        'Unlimited lead extractions',
        'Lifetime updates'
      ]
    }
  }

  const plan = planConfig[planKey]

  useEffect(() => {
    // Get affiliate code from localStorage first, then cookie as fallback
    const storedCode = safeLocalStorageGet('referralCode') 
      || safeLocalStorageGet('affiliateCode')
      || getCookie('affiliateCode')
    if (storedCode) {
      setAffiliateCode(storedCode)
      // Sync back to localStorage if it came from cookie
      if (!safeLocalStorageGet('affiliateCode')) {
        safeLocalStorageSet('affiliateCode', storedCode)
        safeLocalStorageSet('referralCode', storedCode)
      }
    }
  }, [])

  useEffect(() => {
    const planParam = searchParams.get('plan')
    if (planParam === 'single' || planParam === 'extended' || planParam === 'outreach' || planParam === 'bundle') {
      setPlanKey(planParam)
      safeLocalStorageSet('purchasePlan', planParam)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          affiliateCode,
          plan: planKey
        })
      })

      const data = await res.json()

      if (data.success) {
        // Store purchase token for the payment flow
        safeLocalStorageSet('purchaseToken', data.token)
        safeLocalStorageSet('purchaseId', data.purchaseId)
        
        // Redirect to payment method selection
        router.push('/purchase/payment-method')
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch {
      setError('Failed to submit. Please try again.')
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-10">
      {/* Premium Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628] via-[#0d1f38] to-[#0a1220]">
        {/* Central radial spotlight */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[800px] bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.25)_0%,rgba(8,145,178,0.12)_30%,transparent_70%)]"></div>
        
        {/* Top glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.3)_0%,transparent_70%)]"></div>
        
        {/* Corner accents */}
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.2)_0%,transparent_60%)]"></div>
        <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.15)_0%,transparent_60%)]"></div>
        
        {/* Topographic contours */}
        <div className="absolute inset-0 opacity-[0.15]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="contour" x="0" y="0" width="250" height="250" patternUnits="userSpaceOnUse">
                <circle cx="125" cy="125" r="100" fill="none" stroke="rgba(34,197,94,0.5)" strokeWidth="0.5"/>
                <circle cx="125" cy="125" r="75" fill="none" stroke="rgba(6,182,212,0.4)" strokeWidth="0.5"/>
                <circle cx="125" cy="125" r="50" fill="none" stroke="rgba(34,197,94,0.3)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#contour)"/>
          </svg>
        </div>
        
        {/* Location pins */}
        <div className="absolute top-[15%] left-[10%] w-6 h-6 opacity-30 text-green-400">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        </div>
        <div className="absolute top-[25%] right-[12%] w-7 h-7 opacity-25 text-cyan-400">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        </div>
        <div className="absolute bottom-[30%] left-[8%] w-5 h-5 opacity-20 text-emerald-400">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        </div>
        <div className="absolute top-[60%] right-[10%] w-6 h-6 opacity-30 text-teal-400">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        </div>
        
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.08] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC40Ii8+PC9zdmc+')]"></div>
        
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_40%,rgba(2,5,16,0.4)_100%)]"></div>
      </div>
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.05)_1px,transparent_1px)] bg-[size:60px_60px]"></div>

      <div className="relative z-10 w-full max-w-6xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs uppercase tracking-[0.25em] text-cyan-200/80">
            Secure Checkout
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mt-5">Complete your purchase</h1>
          <p className="text-gray-400 text-base md:text-lg mt-3">
            Lifetime access, no subscriptions. Start extracting in minutes.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative overflow-hidden rounded-3xl border border-emerald-400/20 bg-gray-900/40 p-8 backdrop-blur-xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500"></div>
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">Selected plan</p>
                <h2 className="text-3xl font-bold text-white mt-2">{plan.title}</h2>
                <p className="text-gray-400">{plan.label}</p>
              </div>
              {plan.tag && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-200 text-xs font-semibold uppercase">
                  {plan.tag}
                </span>
              )}
            </div>

            <div className="flex items-end gap-3 mb-6">
              <div className="text-5xl font-bold text-white">${plan.price}</div>
              <div className="text-sm text-gray-400 pb-2">one-time payment</div>
            </div>

            <p className="text-gray-300 mb-6">
              Unlock unlimited leads and keep every update forever. One payment and you are set.
            </p>

            <div className="space-y-3">
              {plan.highlights.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-gray-200 text-sm">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 text-sm text-gray-300">
              {[
                'Instant license delivery',
                'Lifetime updates',
                'Secure checkout',
                'Email support'
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-gray-700/60 bg-gray-800/40 p-8 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/80">Step 1 of 2</p>
                <h3 className="text-xl font-bold text-white mt-2">Your details</h3>
                <p className="text-gray-400 text-sm mt-1">We email your license and updates here.</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c.552 0 1-.448 1-1V7a1 1 0 10-2 0v3c0 .552.448 1 1 1zm0 2a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7a8 8 0 1116 0v6a4 4 0 01-4 4H8a4 4 0 01-4-4V7z" />
                </svg>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-gray-900/40 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-gray-900/40 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
                  placeholder="john@example.com"
                />
                <p className="text-xs text-gray-500 mt-1">We never share your email.</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/30 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Continue to Payment
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-700/50">
              <div className="flex flex-wrap items-center justify-center gap-4 text-gray-400 text-xs">
                {['Secure', 'Lifetime license', 'Instant delivery', 'Email support'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <a href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            Back to homepage
          </a>
        </div>
      </div>
    </main>
  )
}

export default function PurchasePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-[#020a18] via-[#041225] to-[#020510]" />}> 
      <PurchaseContent />
    </Suspense>
  )
}
