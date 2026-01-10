"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

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

  useEffect(() => {
    const token = localStorage.getItem('purchaseToken')
    if (!token) {
      router.push('/purchase')
      return
    }
    setPurchaseToken(token)
  }, [router])

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
        localStorage.setItem('paymentMethod', methodId)
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
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full"></div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Step 2 of 3
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Choose Payment Method</h1>
          <p className="text-gray-400">Select how you&apos;d like to pay for your lifetime license</p>
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
          <p className="text-4xl font-bold text-white">$59 <span className="text-lg text-gray-500 font-normal">USD</span></p>
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
