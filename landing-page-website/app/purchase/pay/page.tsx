"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

const paymentDetails: Record<string, {
  title: string
  icon: string
  instructions: string[]
  details: { label: string; value: string; copyable?: boolean }[]
}> = {
  usdt: {
    title: 'USDT (Tether) Payment',
    icon: '💵',
    instructions: [
      'Send exactly $59 USDT to the wallet address below',
      'You can use TRC20 (recommended - lower fees) or ERC20 network',
      'Double-check the address before sending',
      'After sending, click "I\'ve Paid!" below'
    ],
    details: [
      { label: 'USDT Address (TRC20)', value: 'TYourUSDTWalletAddressHere', copyable: true },
      { label: 'Network', value: 'TRC20 (Tron) - Recommended' },
      { label: 'Amount', value: '$59 USDT' }
    ]
  },
  skrill: {
    title: 'Skrill Payment',
    icon: '💳',
    instructions: [
      'Send $59 USD to the Skrill email below',
      'Use "Send Money" → "Send to Skrill account"',
      'Add your email in the message for reference',
      'After sending, click "I\'ve Paid!" below'
    ],
    details: [
      { label: 'Skrill Email', value: 'your-skrill@email.com', copyable: true },
      { label: 'Amount', value: '$59 USD' },
      { label: 'Reference', value: 'MapsReach License' }
    ]
  },
  neteller: {
    title: 'Neteller Payment',
    icon: '💰',
    instructions: [
      'Send $59 USD to the Neteller account below',
      'Use "Money Transfer" in your Neteller app',
      'Add your email in the message for reference',
      'After sending, click "I\'ve Paid!" below'
    ],
    details: [
      { label: 'Neteller Email', value: 'your-neteller@email.com', copyable: true },
      { label: 'Amount', value: '$59 USD' },
      { label: 'Reference', value: 'MapsReach License' }
    ]
  },
  redotpay: {
    title: 'RedotPay Payment',
    icon: '🔴',
    instructions: [
      'Send $59 USD via RedotPay',
      'Use the payment ID below',
      'Add your email in the message',
      'After sending, click "I\'ve Paid!" below'
    ],
    details: [
      { label: 'RedotPay ID', value: 'your-redotpay-id', copyable: true },
      { label: 'Amount', value: '$59 USD' }
    ]
  },
  bank: {
    title: 'Bank Transfer',
    icon: '🏧',
    instructions: [
      'Send $59 USD to the bank account below',
      'International transfers may take 1-3 business days',
      'Include your email as reference',
      'After sending, click "I\'ve Paid!" below'
    ],
    details: [
      { label: 'Bank Name', value: 'Your Bank Name' },
      { label: 'Account Name', value: 'Your Account Name' },
      { label: 'IBAN', value: 'XX00 0000 0000 0000 0000 00', copyable: true },
      { label: 'SWIFT/BIC', value: 'BANKCODE', copyable: true },
      { label: 'Amount', value: '$59 USD' }
    ]
  }
}

export default function PayPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null)
  const [purchaseToken, setPurchaseToken] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [error, setError] = useState("")
  
  // Payment proof fields
  const [transactionHash, setTransactionHash] = useState("")
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('purchaseToken')
    const method = localStorage.getItem('paymentMethod')
    
    if (!token || !method) {
      router.push('/purchase')
      return
    }
    
    setPurchaseToken(token)
    setPaymentMethod(method)
  }, [router])

  const copyToClipboard = (value: string, label: string) => {
    navigator.clipboard.writeText(value)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Limit file size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError('Screenshot must be less than 5MB')
      return
    }
    
    const reader = new FileReader()
    reader.onload = () => {
      setScreenshotPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handlePaid = async () => {
    if (!purchaseToken) return
    
    setLoading(true)
    setError("")

    // Build payment proof object
    let paymentProof = null
    if (paymentMethod === 'usdt' && transactionHash.trim()) {
      paymentProof = { type: 'transaction_hash', value: transactionHash.trim() }
    } else if (screenshotPreview) {
      paymentProof = { type: 'screenshot', value: screenshotPreview }
    }

    try {
      const res = await fetch('/api/purchase/paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: purchaseToken, paymentProof })
      })

      const data = await res.json()

      if (data.success) {
        router.push('/purchase/confirmation')
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch {
      setError('Failed to submit. Please try again.')
    }

    setLoading(false)
  }

  if (!paymentMethod || !purchaseToken) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full"></div>
      </main>
    )
  }

  const method = paymentDetails[paymentMethod]

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Step 3 of 3
          </div>
          <div className="text-5xl mb-4">{method.icon}</div>
          <h1 className="text-3xl font-bold text-white mb-2">{method.title}</h1>
          <p className="text-gray-400">Complete your payment using the details below</p>
        </div>

        {/* Payment Details Card */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Payment Details
          </h2>
          
          <div className="space-y-4">
            {method.details.map((detail, index) => (
              <div key={index} className="bg-gray-700/50 rounded-xl p-4">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">{detail.label}</div>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-white font-mono text-sm break-all">{detail.value}</div>
                  {detail.copyable && (
                    <button
                      onClick={() => copyToClipboard(detail.value, detail.label)}
                      className={`shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        copied === detail.label
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                      }`}
                    >
                      {copied === detail.label ? '✓ Copied!' : 'Copy'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Instructions
          </h2>
          <ol className="space-y-3">
            {method.instructions.map((instruction, index) => (
              <li key={index} className="flex gap-3 text-gray-300">
                <span className="shrink-0 w-6 h-6 bg-blue-600/30 text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                {instruction}
              </li>
            ))}
          </ol>
        </div>

        {/* Payment Proof Section */}
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-purple-400 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Proof of Payment <span className="text-gray-400 font-normal text-sm">(optional but speeds up verification)</span>
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            Attach proof to get verified faster and avoid back-and-forth.
          </p>
          
          {paymentMethod === 'usdt' ? (
            <div>
              <label className="block text-sm text-gray-300 mb-2">Transaction Hash (TxID)</label>
              <input
                type="text"
                value={transactionHash}
                onChange={(e) => setTransactionHash(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white font-mono text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="e.g., 0x1234abcd..."
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm text-gray-300 mb-2">Screenshot of Payment</label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  className="hidden"
                  id="screenshot-upload"
                />
                <label
                  htmlFor="screenshot-upload"
                  className="flex items-center justify-center gap-3 w-full bg-gray-700/50 border border-dashed border-gray-500 rounded-xl px-4 py-6 text-gray-400 cursor-pointer hover:border-purple-500 hover:text-purple-400 transition-colors"
                >
                  {screenshotPreview ? (
                    <div className="text-center">
                      <img src={screenshotPreview} alt="Payment proof" className="max-h-32 mx-auto rounded-lg mb-2" />
                      <span className="text-green-400 text-sm">✓ Screenshot attached</span>
                    </div>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Click to upload screenshot</span>
                    </>
                  )}
                </label>
              </div>
              <p className="text-gray-500 text-xs mt-2">Max 5MB • PNG, JPG, or GIF</p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* I've Paid Button */}
        <button
          onClick={handlePaid}
          disabled={loading}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-5 rounded-2xl text-lg transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Processing...
            </>
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              I&apos;ve Paid!
            </>
          )}
        </button>

        <p className="text-center text-gray-500 text-sm mt-4">
          Click above after you&apos;ve completed your payment
        </p>

        {/* Help */}
        <div className="text-center mt-8 pt-6 border-t border-gray-700/50">
          <p className="text-gray-400 text-sm">
            Need help? Contact us at{' '}
            <a href="mailto:support@mapsreach.com" className="text-green-400 hover:underline">
              support@mapsreach.com
            </a>
          </p>
        </div>

        {/* Back Link */}
        <div className="text-center mt-4">
          <a href="/purchase/payment-method" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            ← Choose different payment method
          </a>
        </div>
      </div>
    </main>
  )
}
