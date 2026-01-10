"use client"

import { useState, useEffect } from "react"

interface CreatorStats {
  code: string
  name: string
  commission: number
  referralLink: string
  visits: number
  conversions: number
  closed: number
  earnings: number
  recentVisits: Array<{
    id: string
    timestamp: string
    userAgent: string
  }>
  allConversions: Array<{
    id: string
    status: 'pending' | 'closed' | 'lost'
    timestamp: string
  }>
}

export default function CreatorPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [creatorCode, setCreatorCode] = useState("")
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [stats, setStats] = useState<CreatorStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const login = async () => {
    setLoginError("")
    setLoading(true)
    
    try {
      const res = await fetch('/api/auth/creator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: creatorCode.toUpperCase(), password })
      })
      const data = await res.json()
      
      if (data.success) {
        setIsLoggedIn(true)
        setStats(data.stats)
        localStorage.setItem('creatorCode', creatorCode.toUpperCase())
        localStorage.setItem('creatorPassword', password)
      } else {
        setLoginError(data.error || 'Invalid credentials')
      }
    } catch {
      setLoginError('Login failed. Please try again.')
    }
    setLoading(false)
  }

  const logout = () => {
    setIsLoggedIn(false)
    setStats(null)
    localStorage.removeItem('creatorCode')
    localStorage.removeItem('creatorPassword')
  }

  const refreshStats = async () => {
    setLoading(true)
    try {
      const savedCode = localStorage.getItem('creatorCode')
      const savedPass = localStorage.getItem('creatorPassword')
      
      const res = await fetch('/api/auth/creator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: savedCode, password: savedPass })
      })
      const data = await res.json()
      
      if (data.success) {
        setStats(data.stats)
      }
    } catch (err) {
      console.error('Failed to refresh:', err)
    }
    setLoading(false)
  }

  const copyLink = () => {
    if (stats?.referralLink) {
      navigator.clipboard.writeText(stats.referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Auto-login from localStorage
  useEffect(() => {
    const savedCode = localStorage.getItem('creatorCode')
    const savedPass = localStorage.getItem('creatorPassword')
    
    if (savedCode && savedPass) {
      setCreatorCode(savedCode)
      setPassword(savedPass)
      
      fetch('/api/auth/creator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: savedCode, password: savedPass })
      }).then(res => res.json()).then(data => {
        if (data.success) {
          setIsLoggedIn(true)
          setStats(data.stats)
        }
      }).catch(() => {})
    }
  }, [])

  // Login Screen
  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Creator Portal</h1>
            <p className="text-gray-400 mt-2">Track your referrals & earnings</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Your Creator Code</label>
              <input
                type="text"
                value={creatorCode}
                onChange={(e) => setCreatorCode(e.target.value.toUpperCase())}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white uppercase focus:outline-none focus:border-purple-500 transition-colors tracking-widest text-center font-mono"
                placeholder="YOURCODE"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && login()}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {loginError && (
              <p className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg">{loginError}</p>
            )}

            <button
              onClick={login}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>

          <p className="text-center text-gray-500 text-xs mt-6">
            Don&apos;t have an account? Contact admin for access.
          </p>
        </div>
      </main>
    )
  }

  // Dashboard
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center font-bold">
              {stats?.name?.charAt(0) || 'C'}
            </div>
            <div>
              <h1 className="font-bold text-lg">{stats?.name || 'Creator'}</h1>
              <p className="text-xs text-gray-400">Code: <span className="text-purple-400 font-mono">{stats?.code}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refreshStats}
              disabled={loading}
              className="text-gray-400 hover:text-white text-sm flex items-center gap-2 transition-colors"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={logout}
              className="text-gray-400 hover:text-white text-sm flex items-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Referral Link Card */}
        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-2xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">Your Referral Link</h2>
              <p className="text-gray-400 text-sm">Share this link to earn {stats?.commission || 20}% commission on each sale</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={stats?.referralLink || ''}
                readOnly
                className="bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-gray-300 text-sm w-80 truncate"
              />
              <button
                onClick={copyLink}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  copied 
                    ? 'bg-green-600 text-white' 
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold text-blue-400">{stats?.visits || 0}</div>
            <div className="text-gray-400 text-sm mt-2">Total Clicks</div>
          </div>
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold text-yellow-400">{stats?.conversions || 0}</div>
            <div className="text-gray-400 text-sm mt-2">Leads Generated</div>
          </div>
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold text-green-400">{stats?.closed || 0}</div>
            <div className="text-gray-400 text-sm mt-2">Sales Made</div>
          </div>
          <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold text-green-400">${stats?.earnings?.toFixed(0) || 0}</div>
            <div className="text-gray-400 text-sm mt-2">Total Earnings</div>
          </div>
        </div>

        {/* Commission Info */}
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-lg font-semibold">Your Commission Rate</div>
                <div className="text-gray-400 text-sm">Earn ${(59 * (stats?.commission || 20) / 100).toFixed(2)} per sale ($59 × {stats?.commission || 20}%)</div>
              </div>
            </div>
            <div className="text-3xl font-bold text-green-400">{stats?.commission || 20}%</div>
          </div>
        </div>

        {/* Conversion Status */}
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Your Referral Status</h2>
          
          {stats?.allConversions && stats.allConversions.length > 0 ? (
            <div className="space-y-3">
              {stats.allConversions.map((conv) => (
                <div key={conv.id} className="bg-gray-700/30 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      conv.status === 'closed' ? 'bg-green-400' :
                      conv.status === 'pending' ? 'bg-yellow-400 animate-pulse' :
                      'bg-red-400'
                    }`}></div>
                    <div>
                      <div className="font-medium">
                        {conv.status === 'closed' ? '🎉 Sale Completed!' :
                         conv.status === 'pending' ? '⏳ In Progress' :
                         '❌ Did not convert'}
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(conv.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                    conv.status === 'closed' ? 'bg-green-600/20 text-green-400' :
                    conv.status === 'pending' ? 'bg-yellow-600/20 text-yellow-400' :
                    'bg-red-600/20 text-red-400'
                  }`}>
                    {conv.status === 'closed' && `+$${(59 * (stats?.commission || 20) / 100).toFixed(2)}`}
                    {conv.status === 'pending' && 'Pending'}
                    {conv.status === 'lost' && 'Lost'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-400">No conversions yet</h3>
              <p className="text-gray-500 text-sm mt-2">Share your referral link to start earning!</p>
            </div>
          )}
        </div>

        {/* Recent Visits */}
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Clicks</h2>
          
          {stats?.recentVisits && stats.recentVisits.length > 0 ? (
            <div className="space-y-2">
              {stats.recentVisits.slice(0, 10).map((visit) => (
                <div key={visit.id} className="bg-gray-700/30 rounded-lg p-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-gray-300">
                      {new Date(visit.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <span className="text-gray-500 truncate max-w-xs">
                    {visit.userAgent.includes('Mobile') ? '📱 Mobile' : '💻 Desktop'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No clicks recorded yet</p>
          )}
        </div>

        {/* Help */}
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6 text-center">
          <p className="text-gray-400">
            Need help? Contact us at <a href="mailto:support@leadsnap.pro" className="text-purple-400 hover:underline">support@leadsnap.pro</a>
          </p>
        </div>
      </div>
    </main>
  )
}
