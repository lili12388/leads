"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { safeLocalStorageGet } from "@/lib/safe-storage"
import QRCode from "qrcode"

const buildPaymentDetails = (amount: number, productName: string): Record<string, {
  title: string
  icon: string
  instructions: string[]
  details: { label: string; value: string; copyable?: boolean }[]
}> => ({
  usdt: {
    title: 'USDT (Tether) Payment',
    icon: '??',
    instructions: [
      `Send exactly $${amount} USDT to the wallet address below`,
      'Select your preferred network from the dropdown',
      'Copy the address or scan the QR code',
      'Double-check the address before sending',
      "After sending, click \"I've Paid!\" below"
    ],
    details: [
      { label: 'Asset', value: 'USDT (Tether)' },
      { label: 'Amount', value: `$${amount} USDT` }
    ]
  },
  skrill: {
    title: 'Skrill Payment',
    icon: '??',
    instructions: [
      `Send $${amount} USD to the Skrill email below`,
      'Use "Send Money" ? "Send to Skrill account"',
      'Add your email in the message for reference',
      "After sending, click \"I've Paid!\" below"
    ],
    details: [
      { label: 'Skrill Email', value: 'laithou123@gmail.com', copyable: true },
      { label: 'Amount', value: `$${amount} USD` },
      { label: 'Reference', value: productName }
    ]
  },
  neteller: {
    title: 'Neteller Payment',
    icon: '??',
    instructions: [
      `Send $${amount} USD to the Neteller account below`,
      'Use "Money Transfer" in your Neteller app',
      'Add your email in the message for reference',
      "After sending, click \"I've Paid!\" below"
    ],
    details: [
      { label: 'Neteller Email', value: 'laithou123@gmail.com', copyable: true },
      { label: 'Amount', value: `$${amount} USD` },
      { label: 'Reference', value: productName }
    ]
  },
  redotpay: {
    title: 'RedotPay Payment',
    icon: '??',
    instructions: [
      `Send $${amount} USD via RedotPay`,
      'Use the RedotPay UID below',
      'Add your email in the message',
      "After sending, click \"I've Paid!\" below"
    ],
    details: [
      { label: 'RedotPay UID', value: '1280516473', copyable: true },
      { label: 'Amount', value: `$${amount} USD` }
    ]
  },
  bank: {
    title: 'Bank Transfer',
    icon: '??',
    instructions: [
      `Send $${amount} USD to the bank account below`,
      'International transfers may take 1-3 business days',
      'Include your email as reference',
      "After sending, click \"I've Paid!\" below"
    ],
    details: [
      { label: 'Bank Name', value: 'Your Bank Name' },
      { label: 'Account Name', value: 'Your Account Name' },
      { label: 'IBAN', value: 'XX00 0000 0000 0000 0000 00', copyable: true },
      { label: 'SWIFT/BIC', value: 'BANKCODE', copyable: true },
      { label: 'Amount', value: `$${amount} USD` }
    ]
  }
})

const usdtNetworks = [
  {
    id: 'trc20',
    code: 'TRX',
    name: 'Tron (TRC20)',
    eta: '≈ 1 mins',
    confirmations: '1 Confirmation/s',
    address: 'TGDYK2qzrVgWGuELMMgvopKz7pNbHcvADL'
  },
  {
    id: 'bep20',
    code: 'BSC',
    name: 'BNB Smart Chain (BEP20)',
    eta: '≈ 1 mins',
    confirmations: '1 Confirmation/s',
    address: '0x84eb188586083df8cadb40dd6a4cc41490ab2895'
  },
  {
    id: 'erc20',
    code: 'ETH',
    name: 'Ethereum (ERC20)',
    eta: '≈ 2 mins',
    confirmations: '6 Confirmation/s',
    address: '0x84eb188586083df8cadb40dd6a4cc41490ab2895'
  },
  {
    id: 'arbitrum',
    code: 'ARBITRUM',
    name: 'Arbitrum One',
    eta: '≈ 1 mins',
    confirmations: '1 Bundle',
    address: '0x84eb188586083df8cadb40dd6a4cc41490ab2895'
  },
  {
    id: 'polygon',
    code: 'POL',
    name: 'Polygon POS',
    eta: '≈ 1 mins',
    confirmations: '1 Bundle',
    address: '0x84eb188586083df8cadb40dd6a4cc41490ab2895'
  },
  {
    id: 'optimism',
    code: 'OPTIMISM',
    name: 'Optimism',
    eta: '≈ 1 mins',
    confirmations: '1 Bundle',
    address: '0x84eb188586083df8cadb40dd6a4cc41490ab2895'
  },
  {
    id: 'sol',
    code: 'SOL',
    name: 'Solana',
    eta: '≈ 1 mins',
    confirmations: '1 Confirmation/s',
    address: 'Dj4J6F9PCrUtPynhcn44yNR25aMeYzgoeqdGKxukk6FK',
    warning: 'SOL addresses are case sensitive. Please double-check before sending.'
  },
  {
    id: 'ton',
    code: 'TON',
    name: 'The Open Network (TON)',
    eta: '≈ 1 mins',
    confirmations: '1 Confirmation/s',
    address: 'UQCAt1P0hHjtHbUzsC-XH6ZvUXqinGi6i2tMHtU9CnTZ0fAR',
    warning: 'TON deposits do not require a memo. Test with a small amount first.'
  },
  {
    id: 'aptos',
    code: 'APT',
    name: 'Aptos',
    eta: '≈ 1 mins',
    confirmations: '1 Confirmation/s',
    address: '0x160b9cc400ac84a7f06f17c00dce94082a906207ad98b9c510c106aecb4760fd',
    warning: 'Ensure the USDT coin on Aptos ends with the contract address 9dc2b.'
  },
  {
    id: 'plasma',
    code: 'PLASMA',
    name: 'Plasma',
    eta: '≈ 1 mins',
    confirmations: '1 Confirmation/s',
    address: '0x84eb188586083df8cadb40dd6a4cc41490ab2895'
  }
]

export default function PayPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null)
  const [purchaseToken, setPurchaseToken] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [amount, setAmount] = useState<number>(59)
  const [productName, setProductName] = useState<string>('MapsReach License')
  const [selectedNetworkId, setSelectedNetworkId] = useState(usdtNetworks[0].id)
  const [networkMenuOpen, setNetworkMenuOpen] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  
  // Payment proof fields
  const [transactionHash, setTransactionHash] = useState("")
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)

  useEffect(() => {
    const token = safeLocalStorageGet('purchaseToken')
    const method = safeLocalStorageGet('paymentMethod')
    
    if (!token || !method) {
      router.push('/purchase')
      return
    }
    
    setPurchaseToken(token)
    setPaymentMethod(method)
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

  const selectedNetwork = usdtNetworks.find((network) => network.id === selectedNetworkId) || usdtNetworks[0]

  useEffect(() => {
    if (paymentMethod !== 'usdt') return
    QRCode.toDataURL(selectedNetwork.address, { width: 220, margin: 1 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null))
  }, [selectedNetworkId, paymentMethod, selectedNetwork.address])

  const paymentDetails = buildPaymentDetails(amount, productName)

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
      <main className="min-h-screen bg-gradient-to-b from-[#020a18] via-[#041225] to-[#020510] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full"></div>
      </main>
    )
  }

  const method = paymentDetails[paymentMethod]

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
              <pattern id="contour3" x="0" y="0" width="250" height="250" patternUnits="userSpaceOnUse">
                <circle cx="125" cy="125" r="100" fill="none" stroke="rgba(34,197,94,0.5)" strokeWidth="0.5"/>
                <circle cx="125" cy="125" r="75" fill="none" stroke="rgba(6,182,212,0.4)" strokeWidth="0.5"/>
                <circle cx="125" cy="125" r="50" fill="none" stroke="rgba(34,197,94,0.3)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#contour3)"/>
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

      <div className="max-w-2xl mx-auto relative z-10">
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
          
          {paymentMethod === 'usdt' ? (
            <div className="space-y-4">
              <div className="bg-gray-700/50 rounded-xl p-4">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Asset</div>
                <div className="text-white font-semibold">USDT (Tether)</div>
              </div>

              <div className="bg-gray-700/50 rounded-xl p-4">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Select Network</div>
                <button
                  type="button"
                  onClick={() => setNetworkMenuOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between gap-3 bg-gray-800/60 border border-gray-600 rounded-xl px-4 py-3 text-left hover:border-green-500/60 transition-colors"
                >
                  <div>
                    <div className="text-white font-semibold">{selectedNetwork.code}</div>
                    <div className="text-xs text-gray-400">{selectedNetwork.name}</div>
                  </div>
                  <div className={`text-gray-400 transition-transform ${networkMenuOpen ? 'rotate-180' : ''}`}>
                    v
                  </div>
                </button>

                {networkMenuOpen && (
                  <div className="mt-3 grid gap-2">
                    {usdtNetworks.map((network) => (
                      <button
                        key={network.id}
                        type="button"
                        onClick={() => {
                          setSelectedNetworkId(network.id)
                          setNetworkMenuOpen(false)
                        }}
                        className={`w-full rounded-xl border px-4 py-3 text-left transition-all ${
                          selectedNetworkId === network.id
                            ? 'border-green-500/60 bg-green-500/10'
                            : 'border-gray-600/60 bg-gray-800/50 hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-white font-semibold">{network.code}</div>
                            <div className="text-xs text-gray-400">{network.name}</div>
                          </div>
                          <div className="text-xs text-gray-400 text-right">
                            <div>{network.eta}</div>
                            <div>{network.confirmations}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedNetwork.warning && (
                <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-xl p-4 text-yellow-200 text-sm">
                  ! {selectedNetwork.warning}
                </div>
              )}

              <div className="bg-gray-700/50 rounded-xl p-4">
                <div className="grid gap-4 md:grid-cols-[160px_1fr] items-center">
                  <div className="bg-gray-900/60 rounded-xl p-3 flex items-center justify-center">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="USDT QR code" className="w-36 h-36 rounded-lg bg-white p-2" />
                    ) : (
                      <div className="w-36 h-36 rounded-lg bg-gray-800 flex items-center justify-center text-xs text-gray-400">
                        Generating QR...
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="bg-gray-800/60 rounded-xl p-3">
                      <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                        USDT Address ({selectedNetwork.code})
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-white font-mono text-sm break-all">{selectedNetwork.address}</div>
                        <button
                          onClick={() => copyToClipboard(selectedNetwork.address, 'USDT Address')}
                          className={`shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                            copied === 'USDT Address'
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                          }`}
                        >
                          {copied === 'USDT Address' ? '✓ Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="bg-gray-800/60 rounded-xl p-3">
                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">ETA</div>
                        <div className="text-white text-sm">{selectedNetwork.eta}</div>
                      </div>
                      <div className="bg-gray-800/60 rounded-xl p-3">
                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Confirmations</div>
                        <div className="text-white text-sm">{selectedNetwork.confirmations}</div>
                      </div>
                    </div>

                    <div className="bg-gray-800/60 rounded-xl p-3">
                      <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Amount</div>
                      <div className="text-white text-sm font-semibold">${amount} USDT</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentMethod === 'redotpay' && (
                <div className="bg-gray-700/50 rounded-xl p-4">
                  <div className="grid gap-4 md:grid-cols-[160px_1fr] items-center">
                    <div className="bg-gray-900/60 rounded-xl p-3 flex items-center justify-center">
                      <img
                        src="/payments/redotpay-qr.jpg"
                        alt="RedotPay QR code"
                        className="w-36 h-36 rounded-lg bg-white p-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs text-gray-400 uppercase tracking-wider">Scan to Pay</div>
                      <div className="text-white text-sm">
                        Scan this QR code with the RedotPay app to send your payment quickly.
                      </div>
                      <div className="text-xs text-gray-500">
                        RedotPay UID: <span className="text-gray-200">1280516473</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
          )}
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
            <a href="mailto:laithou123@gmail.com" className="text-green-400 hover:underline">
              laithou123@gmail.com
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



