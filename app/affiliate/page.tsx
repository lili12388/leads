"use client"

import { useState, useEffect } from "react"
import { safeLocalStorageGet, safeLocalStorageRemove, safeLocalStorageSet } from "@/lib/safe-storage"

interface Purchase {
  token: string
  customerName: string
  status: 'pending_payment' | 'awaiting_verification' | 'verified' | 'completed'
  amount: number
  commission: number
  paymentMethod: string | null
  createdAt: string
  paidAt: string | null
  completedAt: string | null
}

interface AffiliateData {
  affiliate: {
    code: string
    name: string
    email: string
    commission: number
    referralLink: string
    createdAt: string
  }
  stats: {
    totalClicks: number
    totalPurchases: number
    completed: number
    pendingEarnings: number
    totalEarnings: number
  }
  purchases: Purchase[]
  recentClicks: Array<{ timestamp: string; userAgent: string }>
}

export default function AffiliateDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true) // Start true to prevent login flash
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [data, setData] = useState<AffiliateData | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'purchases' | 'clicks'>('overview')
  const [savedCredentials, setSavedCredentials] = useState<{email: string, password: string} | null>(null)

  const login = async () => {
    setLoginError("")
    setLoading(true)
    try {
      const res = await fetch('/api/affiliate/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const result = await res.json()
      
      if (result.error) {
        setLoginError(result.error)
      } else {
        setData(result)
        setIsLoggedIn(true)
        setSavedCredentials({ email, password })
        safeLocalStorageSet('affiliateAuth', JSON.stringify({ email, password }))
      }
    } catch {
      setLoginError('Login failed. Please try again.')
    }
    setLoading(false)
  }

  const refresh = async () => {
    if (!savedCredentials) return
    setLoading(true)
    try {
      const res = await fetch('/api/affiliate/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savedCredentials)
      })
      const result = await res.json()
      if (!result.error) {
        setData(result)
      }
    } catch {}
    setLoading(false)
  }

  const logout = () => {
    setIsLoggedIn(false)
    setData(null)
    setSavedCredentials(null)
    safeLocalStorageRemove('affiliateAuth')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  useEffect(() => {
    const saved = safeLocalStorageGet('affiliateAuth')
    if (saved) {
      let creds: { email: string; password: string } | null = null
      try {
        creds = JSON.parse(saved)
      } catch {
        safeLocalStorageRemove('affiliateAuth')
      }

      if (!creds?.email || !creds?.password) {
        setCheckingAuth(false)
        return
      }
      setEmail(creds.email)
      setPassword(creds.password)
      setSavedCredentials(creds)
      
      // Auto-login
      fetch('/api/affiliate/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: saved
      }).then(res => res.json()).then(result => {
        if (!result.error) {
          setData(result)
          setIsLoggedIn(true)
        } else {
          safeLocalStorageRemove('affiliateAuth')
        }
        setCheckingAuth(false)
      }).catch(() => {
        safeLocalStorageRemove('affiliateAuth')
        setCheckingAuth(false)
      })
    } else {
      setCheckingAuth(false)
    }
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_payment': return 'bg-gray-600/30 text-gray-400'
      case 'awaiting_verification': return 'bg-yellow-600/30 text-yellow-400'
      case 'verified': return 'bg-blue-600/30 text-blue-400'
      case 'completed': return 'bg-green-600/30 text-green-400'
      default: return 'bg-gray-600/30 text-gray-400'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_payment': return '⏳ Payment Requested'
      case 'awaiting_verification': return '🔍 Payment Sent'
      case 'verified': return '✓ Payment Verified'
      case 'completed': return '✅ Sale Completed'
      default: return status
    }
  }

  // Loading state while checking auth
  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </main>
    )
  }

  // Login Screen
  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Affiliate Dashboard</h1>
            <p className="text-gray-400 mt-2">Track your referrals & earnings</p>
          </div>

          <div className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400"
              placeholder="Email"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && login()}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400"
              placeholder="Password"
            />
            {loginError && <p className="text-red-400 text-sm text-center">{loginError}</p>}
            <button 
              onClick={login} 
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
          
          <p className="text-gray-500 text-center text-sm mt-6">
            Contact support if you forgot your password
          </p>
        </div>
      </main>
    )
  }

  if (!data) return null

  // Dashboard
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center font-bold">
              {data.affiliate.name.charAt(0)}
            </div>
            <div>
              <h1 className="font-bold text-lg">Welcome, {data.affiliate.name}!</h1>
              <p className="text-xs text-gray-400">Affiliate Partner • {data.affiliate.commission}% commission</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={refresh} disabled={loading} className="text-gray-400 hover:text-white text-sm">
              {loading ? '⏳' : '🔄'} Refresh
            </button>
            <button onClick={logout} className="text-gray-400 hover:text-white text-sm">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Referral Link Banner */}
        <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-semibold">Your Referral Link</h2>
              <p className="text-gray-400 text-sm">Share this link to earn {data.affiliate.commission}% on every sale</p>
            </div>
            <div className="flex items-center gap-2 bg-gray-900/50 rounded-xl px-4 py-2">
              <code className="text-green-400 text-sm">{data.affiliate.referralLink}</code>
              <button 
                onClick={() => copyToClipboard(data.affiliate.referralLink)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm"
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
            <div className="text-3xl font-bold text-blue-400">{data.stats.totalClicks}</div>
            <div className="text-gray-400 text-sm mt-1">Link Clicks</div>
          </div>
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
            <div className="text-3xl font-bold text-yellow-400">{data.stats.totalPurchases}</div>
            <div className="text-gray-400 text-sm mt-1">Total Leads</div>
          </div>
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
            <div className="text-3xl font-bold text-green-400">{data.stats.completed}</div>
            <div className="text-gray-400 text-sm mt-1">Completed Sales</div>
          </div>
          <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-2xl p-6">
            <div className="text-3xl font-bold text-yellow-400">${data.stats.pendingEarnings.toFixed(2)}</div>
            <div className="text-gray-400 text-sm mt-1">Pending Earnings</div>
          </div>
          <div className="bg-green-600/20 border border-green-500/30 rounded-2xl p-6">
            <div className="text-3xl font-bold text-green-400">${data.stats.totalEarnings.toFixed(2)}</div>
            <div className="text-gray-400 text-sm mt-1">Total Earned</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-800/30 p-1 rounded-xl w-fit">
          {(['overview', 'purchases', 'clicks'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${
                activeTab === tab ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* How It Works */}
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">How Your Commission Works</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-600/30 text-blue-400 rounded-full flex items-center justify-center font-bold text-sm shrink-0">1</div>
                  <div>
                    <div className="font-medium">Share Link</div>
                    <div className="text-sm text-gray-400">Someone clicks your referral link</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-yellow-600/30 text-yellow-400 rounded-full flex items-center justify-center font-bold text-sm shrink-0">2</div>
                  <div>
                    <div className="font-medium">They Purchase</div>
                    <div className="text-sm text-gray-400">They submit a purchase request</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-600/30 text-purple-400 rounded-full flex items-center justify-center font-bold text-sm shrink-0">3</div>
                  <div>
                    <div className="font-medium">Payment Verified</div>
                    <div className="text-sm text-gray-400">Admin verifies their payment</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-600/30 text-green-400 rounded-full flex items-center justify-center font-bold text-sm shrink-0">4</div>
                  <div>
                    <div className="font-medium">You Earn</div>
                    <div className="text-sm text-gray-400">${((59 * data.affiliate.commission) / 100).toFixed(2)} per sale!</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Referrals</h3>
              {data.purchases.length > 0 ? (
                <div className="space-y-3">
                  {data.purchases.slice(0, 5).map((purchase) => (
                    <div key={purchase.token} className="flex items-center justify-between bg-gray-700/30 rounded-xl p-4">
                      <div>
                        <div className="font-medium">{purchase.customerName}</div>
                        <div className="text-sm text-gray-400">
                          {new Date(purchase.createdAt).toLocaleDateString()} • {purchase.paymentMethod?.toUpperCase() || 'Method not selected'}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(purchase.status)}`}>
                          {getStatusLabel(purchase.status)}
                        </span>
                        <div className={`font-semibold ${purchase.status === 'completed' ? 'text-green-400' : 'text-gray-400'}`}>
                          ${purchase.commission.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No referrals yet. Start sharing your link!</p>
              )}
            </div>
          </div>
        )}

        {/* Purchases Tab */}
        {activeTab === 'purchases' && (
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">All Referred Purchases ({data.purchases.length})</h3>
            <p className="text-gray-400 text-sm mb-6">
              Every purchase from your referral link is tracked here. You can see the complete journey from lead to sale.
            </p>
            
            {data.purchases.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 text-sm border-b border-gray-700/50">
                      <th className="pb-4">Customer</th>
                      <th className="pb-4">Payment Method</th>
                      <th className="pb-4">Status</th>
                      <th className="pb-4">Started</th>
                      <th className="pb-4">Completed</th>
                      <th className="pb-4 text-right">Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.purchases.map((purchase) => (
                      <tr key={purchase.token} className="border-b border-gray-700/30">
                        <td className="py-4 font-medium">{purchase.customerName}</td>
                        <td className="py-4 text-gray-400">{purchase.paymentMethod?.toUpperCase() || '-'}</td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(purchase.status)}`}>
                            {getStatusLabel(purchase.status)}
                          </span>
                        </td>
                        <td className="py-4 text-gray-400 text-sm">
                          {new Date(purchase.createdAt).toLocaleString()}
                        </td>
                        <td className="py-4 text-gray-400 text-sm">
                          {purchase.completedAt ? new Date(purchase.completedAt).toLocaleString() : '-'}
                        </td>
                        <td className={`py-4 font-semibold text-right ${purchase.status === 'completed' ? 'text-green-400' : 'text-gray-500'}`}>
                          ${purchase.commission.toFixed(2)}
                          {purchase.status !== 'completed' && <span className="text-xs ml-1">(pending)</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No purchases yet. Share your referral link to start earning!</p>
            )}
          </div>
        )}

        {/* Clicks Tab */}
        {activeTab === 'clicks' && (
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Link Clicks ({data.stats.totalClicks} total)</h3>
            <p className="text-gray-400 text-sm mb-6">
              Track when people click your referral link. Not all clicks convert to purchases.
            </p>
            
            {data.recentClicks.length > 0 ? (
              <div className="space-y-2">
                {data.recentClicks.map((click, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-700/30 rounded-xl p-4">
                    <div className="text-sm">
                      <div className="text-gray-400">{(click.userAgent || 'Unknown device').substring(0, 80)}{click.userAgent && click.userAgent.length > 80 ? '...' : ''}</div>
                    </div>
                    <div className="text-gray-400 text-sm shrink-0 ml-4">
                      {new Date(click.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No clicks yet. Start sharing your referral link!</p>
            )}
          </div>
        )}

        {/* Transparency Notice */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            🔒 Full transparency - every referral click, purchase attempt, and payment is logged and visible to you.
            <br />Questions? Contact us at laithou123@gmail.com
          </p>
        </div>
      </div>
    </main>
  )
}
