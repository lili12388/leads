"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { safeLocalStorageGet, safeLocalStorageSet } from "@/lib/safe-storage"

const paymentMethods = [
  {
    id: 'usdt',
    name: 'USDT (Tether)',
    icon: '💵',
    description: 'TRC20 or ERC20 network',
    color: 'from-green-500 to-emerald-600'
  },
  {
    id: 'skrill',
    name: 'Skrill',
    icon: '💳',
    description: 'Fast & secure transfer',
    color: 'from-purple-500 to-violet-600'
  },
  {
    id: 'neteller',
    name: 'Neteller',
    icon: '💰',
    description: 'Instant transfer',
    color: 'from-green-600 to-teal-600'
  },
  {
    id: 'redotpay',
    name: 'RedotPay',
    icon: '🔴',
    description: 'Crypto-friendly payments',
    color: 'from-red-500 to-rose-600'
  }
]

export default function PaymentMethodPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [purchaseToken, setPurchaseToken] = useState<string | null>(null)
  const [amount, setAmount] = useState<number>(59)
  const [productName, setProductName] = useState<string>('MapsReach License')

  useEffect(() => {
    const token = safeLocalStorageGet('purchaseToken')
    if (!token) {
      router.push('/purchase')
      return
    }
    setPurchaseToken(token)
  }, [router])

  useEffect(() => {
    if (!purchaseToken) return
    const load = async () => {
      try {
        const res = await fetch(`/api/purchase?token=${purchaseToken}`)
        const data = await res.json()
        if (data?.purchase?.amount) setAmount(Number(data.purchase.amount))
        if (data?.purchase?.productName) setProductName(data.purchase.productName)
      } catch {
        // ignore
      }
    }
    load()
  }, [purchaseToken])

  const selectMethod = async (methodId: string) => {
    if (!purchaseToken) return
    
    setLoading(methodId)
    setError("")

    try {
      const res = await fetch('/api/purchase/method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: purchaseToken,
          paymentMethod: methodId
        })
      })

      const data = await res.json()

      if (data.success) {
        safeLocalStorageSet('paymentMethod', methodId)
        router.push('/purchase/pay')
      } else {
        setError(data.error || 'Failed to select payment method')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }

    setLoading(null)
  }

  if (!purchaseToken) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#020a18] via-[#041225] to-[#020510] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full"></div>
      </main>
    )
  }

  return (
    <main className="min-h-screen relative overflow-hidden py-12 px-4">
      {/* Premium Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#0a1628] via-[#0d1f38] to-[#0a1220]">
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
              <pattern id="contour2" x="0" y="0" width="250" height="250" patternUnits="userSpaceOnUse">
                <circle cx="125" cy="125" r="100" fill="none" stroke="rgba(34,197,94,0.5)" strokeWidth="0.5"/>
                <circle cx="125" cy="125" r="75" fill="none" stroke="rgba(6,182,212,0.4)" strokeWidth="0.5"/>
                <circle cx="125" cy="125" r="50" fill="none" stroke="rgba(34,197,94,0.3)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#contour2)"/>
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
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.05)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Step 2 of 3
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Choose Payment Method</h1>
          <p className="text-gray-400">Select how you&apos;d like to pay for {productName}</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Payment Methods Grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => selectMethod(method.id)}
              disabled={loading !== null}
              className={`bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-gray-600 rounded-2xl p-6 text-left transition-all duration-300 group disabled:opacity-50 ${
                loading === method.id ? 'ring-2 ring-green-500' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${method.color} rounded-xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                  {method.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white group-hover:text-green-400 transition-colors">
                    {method.name}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">{method.description}</p>
                </div>
                {loading === method.id ? (
                  <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-6 h-6 text-gray-500 group-hover:text-green-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Amount Reminder */}
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 text-center">
          <p className="text-gray-400 mb-2">Total Amount</p>
          <p className="text-4xl font-bold text-white">${amount} <span className="text-lg text-gray-500 font-normal">USD</span></p>
          <p className="text-green-400 text-sm mt-2">✓ Lifetime access • No monthly fees</p>
        </div>

        {/* Back Link */}
        <div className="text-center mt-8">
          <a href="/purchase" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            ← Back to details
          </a>
        </div>
      </div>
    </main>
  )
}
