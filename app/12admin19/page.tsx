"use client"

import { useState, useEffect } from "react"
import { safeLocalStorageGet, safeLocalStorageRemove, safeLocalStorageSet } from "@/lib/safe-storage"

interface Purchase {
  id: string
  token: string
  name: string
  email: string
  affiliateCode: string | null
  affiliateName: string | null
  paymentMethod: string | null
  status: 'pending_payment' | 'awaiting_verification' | 'verified' | 'completed'
  amount: number
  commission: number
  createdAt: string
  paidAt: string | null
  verifiedAt: string | null
  completedAt: string | null
  auditLog: Array<{ timestamp: string; action: string; details: string; actor: string }>
  paymentProof?: {
    type: 'transaction_hash' | 'screenshot'
    value: string
    submittedAt: string
  }
}

interface Affiliate {
  code: string
  name: string
  email: string
  password: string
  commission: number
  referralLink: string
  stats: {
    clicks: number
    totalPurchases: number
    completed: number
    totalEarnings: number
  }
}

interface Stats {
  total: number
  pending: number
  awaiting: number
  verified: number
  totalRevenue: number
  totalCommissions: number
}

interface Visitor {
  ip: string
  country: string
  city: string
  region: string
  browser: string
  os: string
  device: string
  page: string
  referrer: string
  screenWidth: number
  screenHeight: number
  language: string
  timestamp: string
  sessionId: string
  count?: number
  isAggregate?: boolean
}

interface VisitorStats {
  date: string
  unique: number
  pageviews: number
}

interface DownloadStat {
  type: string
  count: number
  last_download_at: string | null
}

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [adminKey, setAdminKey] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [activeTab, setActiveTab] = useState<'purchases' | 'affiliates' | 'overview' | 'visitors' | 'downloads'>('overview')
  
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [visitorStats, setVisitorStats] = useState<VisitorStats[]>([])
  const [todayVisitors, setTodayVisitors] = useState({ unique: 0, pageviews: 0 })
  const [selectedDayStats, setSelectedDayStats] = useState({ unique: 0, pageviews: 0 })
  const [monthStats, setMonthStats] = useState<VisitorStats[]>([])
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("")
  const [totalTracked, setTotalTracked] = useState(0)
  const [downloads, setDownloads] = useState<DownloadStat[]>([])
  const [proofImageUrl, setProofImageUrl] = useState<string | null>(null)

  // New affiliate form
  const [newAffiliate, setNewAffiliate] = useState({ name: '', code: '', email: '', password: '', commission: 20 })

  const login = async () => {
    setLoginError("")
    try {
      const res = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      
      if (data.success) {
        setAdminKey(data.adminKey)
        setIsLoggedIn(true)
        safeLocalStorageSet('adminKey', data.adminKey)
      } else {
        setLoginError('Invalid credentials')
      }
    } catch {
      setLoginError('Login failed')
    }
  }

  const logout = () => {
    setIsLoggedIn(false)
    setAdminKey("")
    safeLocalStorageRemove('adminKey')
  }

  const fetchData = async () => {
    if (!adminKey) return
    setLoading(true)
    try {
      // Fetch purchases
      const purchasesRes = await fetch(`/api/purchase?adminKey=${adminKey}`)
      const purchasesData = await purchasesRes.json()
      if (!purchasesData.error) {
        setPurchases(purchasesData.purchases || [])
        setStats(purchasesData.stats)
      }

      // Fetch affiliates
      const affiliatesRes = await fetch(`/api/affiliate?adminKey=${adminKey}`)
      const affiliatesData = await affiliatesRes.json()
      if (!affiliatesData.error) {
        setAffiliates(affiliatesData.affiliates || [])
      }
      
      // Fetch downloads
      const downloadsRes = await fetch('/api/track/download', {
        headers: { 'x-admin-key': adminKey }
      })
      const downloadsData = await downloadsRes.json()
      if (!downloadsData.error) {
        setDownloads(downloadsData.downloads || [])
      }

      await fetchVisitors()
    } catch (err) {
      console.error('Failed to fetch data:', err)
    }
    setLoading(false)
  }

  const fetchVisitors = async (dateOverride?: string, monthOverride?: string) => {
    if (!adminKey) return
    const today = new Date().toISOString().split('T')[0]
    const date = dateOverride || selectedDate || today
    const month = monthOverride || selectedMonth || date.slice(0, 7)
    const params = new URLSearchParams()
    if (date) params.set('date', date)
    if (month) params.set('month', month)
    
    const visitorsRes = await fetch(`/api/track?${params.toString()}`, {
      headers: { 'x-admin-key': adminKey }
    })
    const visitorsData = await visitorsRes.json()
    if (!visitorsData.error) {
      setVisitors(visitorsData.visitors || [])
      setVisitorStats(visitorsData.stats || [])
      setTodayVisitors(visitorsData.today || { unique: 0, pageviews: 0 })
      setSelectedDayStats(visitorsData.selectedDay || { unique: 0, pageviews: 0 })
      setMonthStats(visitorsData.monthStats || [])
      setTotalTracked(visitorsData.totalTracked || 0)
    }
  }

  const selectDay = (dateStr: string) => {
    if (!dateStr) return
    const monthStr = dateStr.slice(0, 7)
    setSelectedDate(dateStr)
    setSelectedMonth(monthStr)
    fetchVisitors(dateStr, monthStr)
  }

  const verifyPayment = async (purchaseId: string, action: 'verify' | 'complete' | 'reject') => {
    try {
      const res = await fetch('/api/purchase/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseId, action, adminKey })
      })
      const data = await res.json()
      
      if (data.success) {
        fetchData()
        setSelectedPurchase(null)
        alert(`Action completed: ${action}`)
      } else {
        alert(data.error || 'Failed')
      }
    } catch {
      alert('Failed to process')
    }
  }

  const addAffiliate = async () => {
    if (!newAffiliate.name || !newAffiliate.code || !newAffiliate.email || !newAffiliate.password) {
      alert('Please fill all fields')
      return
    }
    
    try {
      const res = await fetch('/api/affiliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newAffiliate, adminKey })
      })
      const data = await res.json()
      
      if (data.success) {
        setNewAffiliate({ name: '', code: '', email: '', password: '', commission: 20 })
        fetchData()
        alert('Affiliate added!')
      } else {
        alert(data.error || 'Failed to add affiliate')
      }
    } catch {
      alert('Failed to add affiliate')
    }
  }

  const deleteAffiliate = async (code: string) => {
    if (!confirm(`Delete affiliate ${code}?`)) return
    
    try {
      await fetch('/api/affiliate', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, adminKey })
      })
      fetchData()
    } catch {
      alert('Failed to delete')
    }
  }

  const resetPassword = async (code: string, name: string) => {
    if (!confirm(`Reset password for ${name}?`)) return
    
    try {
      const res = await fetch('/api/affiliate', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, adminKey })
      })
      const data = await res.json()
      
      if (data.success) {
        alert(`New password for ${name}: ${data.newPassword}`)
        fetchData()
      } else {
        alert(data.error || 'Failed to reset password')
      }
    } catch {
      alert('Failed to reset password')
    }
  }

  useEffect(() => {
    const savedKey = safeLocalStorageGet('adminKey')
    if (savedKey) {
      setAdminKey(savedKey)
      setIsLoggedIn(true)
    }
  }, [])

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    setSelectedDate(today)
    setSelectedMonth(today.slice(0, 7))
  }, [])

  useEffect(() => {
    if (isLoggedIn && adminKey) {
      fetchData()
    }
  }, [isLoggedIn, adminKey])

  useEffect(() => {
    if (isLoggedIn && adminKey && selectedDate) {
      fetchVisitors()
    }
  }, [selectedDate, selectedMonth, isLoggedIn, adminKey])

  useEffect(() => {
    if (selectedMonth && selectedDate && !selectedDate.startsWith(selectedMonth)) {
      setSelectedDate(`${selectedMonth}-01`)
    }
  }, [selectedMonth])

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
      case 'pending_payment': return 'Payment Requested'
      case 'awaiting_verification': return 'Payment Sent'
      case 'verified': return 'Payment Verified'
      case 'completed': return 'Sale Completed'
      default: return status
    }
  }

  const getCountryFlag = (countryCode: string) => {
    if (!countryCode || countryCode === 'Unknown') return '🌍'
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0))
    return String.fromCodePoint(...codePoints)
  }

  // Login Screen
  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400 mt-2">MapsReach Sales & Affiliates</p>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white"
              placeholder="Username"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && login()}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white"
              placeholder="Password"
            />
            {loginError && <p className="text-red-400 text-sm text-center">{loginError}</p>}
            <button onClick={login} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 rounded-xl">
              Sign In
            </button>
          </div>
        </div>
      </main>
    )
  }

  // Dashboard
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-lg">MapsReach Admin</h1>
              <p className="text-xs text-gray-400">Sales & Affiliate Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={fetchData} disabled={loading} className="text-gray-400 hover:text-white text-sm">
              {loading ? '⏳' : '🔄'} Refresh
            </button>
            <button onClick={logout} className="text-gray-400 hover:text-white text-sm">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-gray-800/30 p-1 rounded-xl w-fit">
          {(['overview', 'purchases', 'affiliates', 'visitors', 'downloads'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${
                activeTab === tab ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'downloads' ? '📥 Downloads' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-5 gap-4">
              <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
                <div className="text-3xl font-bold text-white">{stats.total}</div>
                <div className="text-gray-400 text-sm mt-1">Total Purchases</div>
              </div>
              <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-2xl p-6">
                <div className="text-3xl font-bold text-yellow-400">{stats.awaiting}</div>
                <div className="text-gray-400 text-sm mt-1">Awaiting Verification</div>
              </div>
              <div className="bg-green-600/20 border border-green-500/30 rounded-2xl p-6">
                <div className="text-3xl font-bold text-green-400">{stats.verified}</div>
                <div className="text-gray-400 text-sm mt-1">Completed Sales</div>
              </div>
              <div className="bg-blue-600/20 border border-blue-500/30 rounded-2xl p-6">
                <div className="text-3xl font-bold text-blue-400">${stats.totalRevenue}</div>
                <div className="text-gray-400 text-sm mt-1">Total Revenue</div>
              </div>
              <div className="bg-purple-600/20 border border-purple-500/30 rounded-2xl p-6">
                <div className="text-3xl font-bold text-purple-400">${stats.totalCommissions}</div>
                <div className="text-gray-400 text-sm mt-1">Affiliate Payouts</div>
              </div>
            </div>

            {/* Awaiting Verification */}
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></span>
                Awaiting Verification ({purchases.filter(p => p.status === 'awaiting_verification').length})
              </h2>
              <div className="space-y-2">
                {purchases.filter(p => p.status === 'awaiting_verification').map(purchase => (
                  <div key={purchase.id} className="bg-gray-700/30 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{purchase.name} ({purchase.email})</div>
                      <div className="text-sm text-gray-400">
                        {purchase.paymentMethod?.toUpperCase()} • ${purchase.amount}
                        {purchase.affiliateCode && <span className="text-purple-400"> • via {purchase.affiliateCode}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => verifyPayment(purchase.id, 'complete')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                      >
                        ✓ Verify & Complete
                      </button>
                      <button
                        onClick={() => setSelectedPurchase(purchase)}
                        className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg text-sm"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
                {purchases.filter(p => p.status === 'awaiting_verification').length === 0 && (
                  <p className="text-gray-500 text-center py-4">No payments awaiting verification</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Purchases Tab */}
        {activeTab === 'purchases' && (
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-sm border-b border-gray-700/50">
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Payment</th>
                    <th className="px-6 py-4">Affiliate</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase) => (
                    <tr key={purchase.id} className="border-b border-gray-700/30 hover:bg-gray-700/20">
                      <td className="px-6 py-4">
                        <div className="font-medium">{purchase.name}</div>
                        <div className="text-sm text-gray-400">{purchase.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-green-400 font-semibold">${purchase.amount}</div>
                        <div className="text-sm text-gray-400">{purchase.paymentMethod?.toUpperCase() || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        {purchase.affiliateCode ? (
                          <span className="bg-purple-600/30 text-purple-300 px-2 py-1 rounded text-sm">{purchase.affiliateCode}</span>
                        ) : (
                          <span className="text-gray-500">Direct</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(purchase.status)}`}>
                          {getStatusLabel(purchase.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(purchase.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => setSelectedPurchase(purchase)} className="text-blue-400 hover:text-blue-300 text-sm">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {purchases.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No purchases yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Affiliates Tab */}
        {activeTab === 'affiliates' && (
          <div className="space-y-6">
            {/* Add Affiliate Form */}
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">Add New Affiliate</h2>
              <div className="grid md:grid-cols-6 gap-4">
                <input
                  type="text"
                  value={newAffiliate.name}
                  onChange={(e) => setNewAffiliate({...newAffiliate, name: e.target.value})}
                  className="bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-2 text-white"
                  placeholder="Name"
                />
                <input
                  type="text"
                  value={newAffiliate.code}
                  onChange={(e) => setNewAffiliate({...newAffiliate, code: e.target.value.toUpperCase()})}
                  className="bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-2 text-white uppercase"
                  placeholder="Code"
                />
                <input
                  type="email"
                  value={newAffiliate.email}
                  onChange={(e) => setNewAffiliate({...newAffiliate, email: e.target.value})}
                  className="bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-2 text-white"
                  placeholder="Email"
                />
                <input
                  type="text"
                  value={newAffiliate.password}
                  onChange={(e) => setNewAffiliate({...newAffiliate, password: e.target.value})}
                  className="bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-2 text-white"
                  placeholder="Password"
                />
                <input
                  type="number"
                  value={newAffiliate.commission}
                  onChange={(e) => setNewAffiliate({...newAffiliate, commission: Number(e.target.value)})}
                  className="bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-2 text-white"
                  placeholder="%"
                />
                <button onClick={addAffiliate} className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-2">
                  + Add
                </button>
              </div>
            </div>

            {/* Affiliates List */}
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">Affiliates ({affiliates.length})</h2>
              <div className="space-y-3">
                {affiliates.map((affiliate) => (
                  <div key={affiliate.code} className="bg-gray-700/30 rounded-xl p-4 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center font-bold text-lg">
                        {affiliate.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{affiliate.name}</div>
                        <div className="text-sm text-gray-400">
                          {affiliate.email} • <span className="text-purple-400">{affiliate.code}</span> • {affiliate.commission}%
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Password: <span className="text-yellow-400 font-mono">{affiliate.password}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="font-bold text-blue-400">{affiliate.stats.clicks}</div>
                        <div className="text-xs text-gray-400">Clicks</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-yellow-400">{affiliate.stats.totalPurchases}</div>
                        <div className="text-xs text-gray-400">Leads</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-green-400">{affiliate.stats.completed}</div>
                        <div className="text-xs text-gray-400">Sales</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-green-400">${affiliate.stats.totalEarnings}</div>
                        <div className="text-xs text-gray-400">Earned</div>
                      </div>
                      <button
                        onClick={() => {navigator.clipboard.writeText(affiliate.referralLink); alert('Copied!')}}
                        className="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-sm"
                      >
                        Copy Link
                      </button>
                      <button 
                        onClick={() => resetPassword(affiliate.code, affiliate.name)} 
                        className="text-yellow-400 hover:text-yellow-300 text-sm"
                      >
                        Reset PW
                      </button>
                      <button onClick={() => deleteAffiliate(affiliate.code)} className="text-red-400 hover:text-red-300 text-sm">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {affiliates.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No affiliates yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Visitors Tab */}
        {activeTab === 'visitors' && (
          <div className="space-y-6">
            {/* Today's Stats */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                <div className="text-gray-400 text-sm mb-2">Today&apos;s Unique Visitors</div>
                <div className="text-4xl font-bold text-purple-400">{todayVisitors.unique}</div>
              </div>
              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                <div className="text-gray-400 text-sm mb-2">Today&apos;s Page Views</div>
                <div className="text-4xl font-bold text-blue-400">{todayVisitors.pageviews}</div>
              </div>
              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                <div className="text-gray-400 text-sm mb-2">Total Tracked</div>
                <div className="text-4xl font-bold text-green-400">{totalTracked}</div>
              </div>
            </div>

            {/* 7 Day Chart */}
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Last 7 Days</h3>
                {selectedDate && (
                  <div className="text-xs text-gray-400">
                    Selected: <span className="text-white">{selectedDate}</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {visitorStats.map((day, i) => (
                  <button
                    key={i}
                    onClick={() => selectDay(day.date)}
                    className={`text-center rounded-lg transition-all ${
                      selectedDate === day.date
                        ? 'ring-2 ring-purple-500/60 bg-purple-500/10'
                        : 'hover:bg-gray-700/40'
                    }`}
                  >
                    <div className="text-xs text-gray-500 mb-2">{new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}</div>
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <div className="text-lg font-bold text-purple-400">{day.unique}</div>
                      <div className="text-xs text-gray-400">unique</div>
                      <div className="text-sm text-blue-400 mt-1">{day.pageviews}</div>
                      <div className="text-xs text-gray-400">views</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Month Selector */}
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Browse History</div>
                  <div className="text-white font-semibold">Select a month</div>
                </div>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
                />
                <button
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0]
                    setSelectedDate(today)
                    setSelectedMonth(today.slice(0, 7))
                  }}
                  className="text-xs text-gray-300 hover:text-white border border-gray-600/60 px-3 py-2 rounded-lg"
                >
                  Jump to Today
                </button>
              </div>
              {monthStats.length > 0 && (
                <div className="grid grid-cols-7 gap-2">
                  {monthStats.map((day) => (
                    <button
                      key={day.date}
                      onClick={() => selectDay(day.date)}
                      className={`rounded-lg border border-transparent p-2 text-xs ${
                        selectedDate === day.date
                          ? 'border-cyan-400/60 bg-cyan-500/10'
                          : 'bg-gray-700/40 hover:bg-gray-700/60'
                      }`}
                    >
                      <div className="text-gray-400">{day.date.split('-')[2]}</div>
                      <div className="text-purple-300 font-semibold">{day.unique}</div>
                      <div className="text-[10px] text-blue-300">{day.pageviews} views</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Visitors Table */}
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-semibold">Visitors on {selectedDate || 'Today'}</h3>
                  <p className="text-xs text-gray-400">
                    {selectedDayStats.unique} unique â€¢ {selectedDayStats.pageviews} views
                  </p>
                </div>
                <button
                  onClick={() => fetchVisitors(selectedDate, selectedMonth)}
                  className="text-xs text-gray-300 hover:text-white border border-gray-600/60 px-3 py-2 rounded-lg"
                >
                  Refresh Day
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 text-left border-b border-gray-700">
                      <th className="pb-3 pr-4">Time</th>
                      <th className="pb-3 pr-4">Location</th>
                      <th className="pb-3 pr-4">Device</th>
                      <th className="pb-3 pr-4">Browser</th>
                      <th className="pb-3 pr-4">Page</th>
                      <th className="pb-3">Referrer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitors.slice(0, 100).map((visitor, i) => (
                      <tr key={i} className="border-b border-gray-700/30 hover:bg-gray-700/20">
                        <td className="py-3 pr-4 text-gray-400">
                          {new Date(visitor.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-lg mr-1">{getCountryFlag(visitor.country)}</span>
                          {visitor.isAggregate ? (
                            <span className="text-orange-300 font-semibold">
                              Tunisia (x{visitor.count || 0})
                            </span>
                          ) : (
                            <span>{visitor.city}, {visitor.country}</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            visitor.device === 'Mobile' ? 'bg-green-500/20 text-green-400' :
                            visitor.device === 'Tablet' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {visitor.isAggregate ? 'Owner' : visitor.device}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-gray-300">
                          {visitor.isAggregate ? 'Tunisia (ignored)' : `${visitor.browser} / ${visitor.os}`}
                        </td>
                        <td className="py-3 pr-4 text-purple-400">{visitor.page}</td>
                        <td className="py-3 text-gray-400 truncate max-w-[200px]" title={visitor.referrer}>
                          {visitor.isAggregate ? (
                            'Filtered'
                          ) : visitor.referrer === 'Direct' ? (
                            '🔗 Direct'
                          ) : visitor.referrer.startsWith('http') ? (
                            <a 
                              href={visitor.referrer} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 hover:underline"
                            >
                              {visitor.referrer}
                            </a>
                          ) : (
                            visitor.referrer
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {visitors.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No visitors tracked yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Downloads Tab */}
        {activeTab === 'downloads' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">📥 Download Counters</h2>
            
            {/* Download Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              {downloads.map((d) => {
                const labels: Record<string, { icon: string; name: string; color: string }> = {
                  'chrome_extension': { icon: '🌐', name: 'Chrome Extension', color: 'from-blue-500 to-blue-600' },
                  'edge_extension': { icon: '🔷', name: 'Edge Extension', color: 'from-cyan-500 to-cyan-600' },
                  'whatsapp_tool': { icon: '📱', name: 'WhatsApp Outreach', color: 'from-green-500 to-green-600' },
                }
                const info = labels[d.type] || { icon: '📦', name: d.type, color: 'from-gray-500 to-gray-600' }
                
                return (
                  <div key={d.type} className={`bg-gradient-to-br ${info.color} rounded-2xl p-6 shadow-lg`}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{info.icon}</span>
                      <div className="text-white/80 font-medium">{info.name}</div>
                    </div>
                    <div className="text-5xl font-bold text-white mb-2">{d.count.toLocaleString()}</div>
                    <div className="text-white/60 text-sm">
                      {d.last_download_at 
                        ? `Last: ${new Date(d.last_download_at).toLocaleString()}`
                        : 'No downloads yet'
                      }
                    </div>
                  </div>
                )
              })}
              {downloads.length === 0 && (
                <div className="col-span-3 bg-gray-800/50 rounded-2xl p-8 text-center border border-gray-700/50">
                  <div className="text-4xl mb-4">📥</div>
                  <p className="text-gray-400">No download data yet. Downloads will be tracked automatically.</p>
                </div>
              )}
            </div>

            {/* Total Downloads */}
            {downloads.length > 0 && (
              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Total Downloads</div>
                    <div className="text-4xl font-bold text-purple-400">
                      {downloads.reduce((sum, d) => sum + d.count, 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-6xl">🎉</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Purchase Detail Modal */}
        {selectedPurchase && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold">Purchase Details</h2>
                <button onClick={() => setSelectedPurchase(null)} className="text-gray-400 hover:text-white text-2xl">×</button>
              </div>

              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-700/50 rounded-xl p-4">
                    <div className="text-xs text-gray-400 uppercase">Customer</div>
                    <div className="font-medium">{selectedPurchase.name}</div>
                    <div className="text-gray-400">{selectedPurchase.email}</div>
                  </div>
                  <div className="bg-gray-700/50 rounded-xl p-4">
                    <div className="text-xs text-gray-400 uppercase">Payment</div>
                    <div className="font-medium text-green-400">${selectedPurchase.amount}</div>
                    <div className="text-gray-400">{selectedPurchase.paymentMethod?.toUpperCase() || '-'}</div>
                  </div>
                  <div className="bg-gray-700/50 rounded-xl p-4">
                    <div className="text-xs text-gray-400 uppercase">Status</div>
                    <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(selectedPurchase.status)}`}>
                      {getStatusLabel(selectedPurchase.status)}
                    </span>
                  </div>
                  <div className="bg-gray-700/50 rounded-xl p-4">
                    <div className="text-xs text-gray-400 uppercase">Affiliate</div>
                    {selectedPurchase.affiliateCode ? (
                      <div>
                        <span className="text-purple-400">{selectedPurchase.affiliateCode}</span>
                        <div className="text-sm text-gray-400">${selectedPurchase.commission} commission</div>
                      </div>
                    ) : (
                      <div className="text-gray-500">Direct sale</div>
                    )}
                  </div>
                </div>

                {/* Payment Proof */}
                {selectedPurchase.paymentProof && (
                  <div className="bg-gray-700/50 rounded-xl p-4">
                    <div className="text-xs text-gray-400 uppercase mb-3">Payment Proof</div>
                    {selectedPurchase.paymentProof.type === 'screenshot' ? (
                      <div>
                        <button
                          onClick={() => setProofImageUrl(selectedPurchase.paymentProof?.value || null)}
                          className="text-blue-400 hover:text-blue-300 underline"
                        >
                          📷 View Screenshot
                        </button>
                        <div className="text-xs text-gray-500 mt-1">
                          Submitted: {new Date(selectedPurchase.paymentProof.submittedAt).toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-mono text-sm text-green-400 break-all bg-gray-800 p-2 rounded">
                          {selectedPurchase.paymentProof.value}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Submitted: {new Date(selectedPurchase.paymentProof.submittedAt).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Audit Log */}
                <div className="bg-gray-700/50 rounded-xl p-4">
                  <div className="text-xs text-gray-400 uppercase mb-3">Audit Log</div>
                  <div className="space-y-2 max-h-48 overflow-y-auto text-sm">
                    {selectedPurchase.auditLog.map((entry, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="text-gray-500 shrink-0 w-36">
                          {new Date(entry.timestamp).toLocaleString()}
                        </div>
                        <div>
                          <span className="text-blue-400">[{entry.action}]</span>{' '}
                          {entry.action === 'PROOF_SUBMITTED' && selectedPurchase.paymentProof ? (
                            selectedPurchase.paymentProof.type === 'screenshot' ? (
                              <>
                                Payment proof submitted:{' '}
                                <button
                                  onClick={() => setProofImageUrl(selectedPurchase.paymentProof?.value || null)}
                                  className="text-blue-400 hover:text-blue-300 underline"
                                >
                                  View Screenshot
                                </button>
                              </>
                            ) : (
                              <>
                                Transaction hash:{' '}
                                <span className="font-mono text-green-400">
                                  {selectedPurchase.paymentProof.value.slice(0, 20)}...
                                </span>
                              </>
                            )
                          ) : (
                            entry.details
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                {selectedPurchase.status === 'awaiting_verification' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => verifyPayment(selectedPurchase.id, 'complete')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl"
                    >
                      ✓ Verify & Complete Sale
                    </button>
                    <button
                      onClick={() => verifyPayment(selectedPurchase.id, 'reject')}
                      className="bg-red-600/30 hover:bg-red-600 text-red-400 hover:text-white px-6 py-3 rounded-xl"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Proof Image Modal */}
        {proofImageUrl && (
          <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setProofImageUrl(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] w-full">
              <button
                onClick={() => setProofImageUrl(null)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300 text-xl"
              >
                ✕ Close
              </button>
              <img
                src={proofImageUrl}
                alt="Payment Proof"
                className="max-w-full max-h-[85vh] object-contain mx-auto rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              <a
                href={proofImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-blue-400 hover:text-blue-300 mt-3"
                onClick={(e) => e.stopPropagation()}
              >
                Open in new tab
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}





