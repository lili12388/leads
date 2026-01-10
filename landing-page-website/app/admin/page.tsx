"use client"

import { useState, useEffect } from "react"

interface Creator {
  code: string
  name: string
  commission: number
  referralLink: string
  createdAt: string
}

interface Visit {
  id: string
  code: string
  timestamp: string
  userAgent: string
  ip: string
}

interface Conversion {
  id: string
  code: string
  status: 'pending' | 'closed' | 'lost'
  notes: string
  timestamp: string
  closedAt?: string
}

interface Stats {
  totalVisits: number
  totalConversions: number
  totalClosed: number
  creators: Array<{ code: string; visits: number; conversions: number; closed: number }>
  recentVisits: Visit[]
  allConversions: Conversion[]
}

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [adminKey, setAdminKey] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [activeTab, setActiveTab] = useState<'overview' | 'creators' | 'visits' | 'conversions'>('overview')
  
  const [stats, setStats] = useState<Stats | null>(null)
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(false)

  // New creator form
  const [newCreator, setNewCreator] = useState({ name: '', code: '', password: '', commission: 20 })

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
        localStorage.setItem('adminKey', data.adminKey)
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
    localStorage.removeItem('adminKey')
  }

  const fetchData = async () => {
    if (!adminKey) return
    setLoading(true)
    try {
      // Fetch stats
      const statsRes = await fetch(`/api/referral/track?adminKey=${adminKey}`)
      const statsData = await statsRes.json()
      if (!statsData.error) setStats(statsData)

      // Fetch creators
      const creatorsRes = await fetch(`/api/referral/creators?adminKey=${adminKey}`)
      const creatorsData = await creatorsRes.json()
      if (!creatorsData.error) setCreators(creatorsData.creators || [])
    } catch (err) {
      console.error('Failed to fetch data:', err)
    }
    setLoading(false)
  }

  const addCreator = async () => {
    if (!newCreator.name || !newCreator.code || !newCreator.password) {
      alert('Please fill all fields')
      return
    }
    
    try {
      const res = await fetch('/api/referral/creators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newCreator, adminKey })
      })
      const data = await res.json()
      
      if (data.success) {
        setNewCreator({ name: '', code: '', password: '', commission: 20 })
        fetchData()
        alert('Creator added successfully!')
      } else {
        alert(data.error || 'Failed to add creator')
      }
    } catch {
      alert('Failed to add creator')
    }
  }

  const deleteCreator = async (code: string) => {
    if (!confirm(`Delete creator ${code}?`)) return
    
    try {
      await fetch('/api/referral/creators', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, adminKey })
      })
      fetchData()
    } catch {
      alert('Failed to delete')
    }
  }

  const updateConversion = async (conversionId: string, status: string) => {
    try {
      await fetch('/api/referral/conversion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversionId, status, adminKey })
      })
      fetchData()
    } catch {
      alert('Failed to update')
    }
  }

  const markAsConversion = async (visit: Visit) => {
    try {
      await fetch('/api/referral/conversion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: visit.code, visitId: visit.id, adminKey })
      })
      fetchData()
      alert('Marked as potential conversion!')
    } catch {
      alert('Failed to mark')
    }
  }

  useEffect(() => {
    const savedKey = localStorage.getItem('adminKey')
    if (savedKey) {
      setAdminKey(savedKey)
      setIsLoggedIn(true)
    }
  }, [])

  useEffect(() => {
    if (isLoggedIn && adminKey) {
      fetchData()
    }
  }, [isLoggedIn, adminKey])

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
            <p className="text-gray-400 mt-2">LeadSnap Referral System</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Enter username"
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
                placeholder="Enter password"
              />
            </div>

            {loginError && (
              <p className="text-red-400 text-sm text-center">{loginError}</p>
            )}

            <button
              onClick={login}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25"
            >
              Sign In
            </button>
          </div>

          <p className="text-center text-gray-500 text-xs mt-6">
            Secure admin access only
          </p>
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
              <h1 className="font-bold text-lg">LeadSnap Admin</h1>
              <p className="text-xs text-gray-400">Referral Management</p>
            </div>
          </div>
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
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-gray-800/30 p-1 rounded-xl w-fit">
          {(['overview', 'creators', 'visits', 'conversions'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${
                activeTab === tab
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading...</p>
          </div>
        )}

        {!loading && activeTab === 'overview' && stats && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-2xl p-6">
                <div className="text-3xl font-bold text-blue-400">{stats.totalVisits}</div>
                <div className="text-gray-400 text-sm mt-1">Total Referral Visits</div>
              </div>
              <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-2xl p-6">
                <div className="text-3xl font-bold text-purple-400">{creators.length}</div>
                <div className="text-gray-400 text-sm mt-1">Active Creators</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border border-yellow-500/30 rounded-2xl p-6">
                <div className="text-3xl font-bold text-yellow-400">{stats.totalConversions}</div>
                <div className="text-gray-400 text-sm mt-1">Total Leads</div>
              </div>
              <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-2xl p-6">
                <div className="text-3xl font-bold text-green-400">{stats.totalClosed}</div>
                <div className="text-gray-400 text-sm mt-1">Closed Deals</div>
              </div>
            </div>

            {/* Creator Performance */}
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">Creator Performance</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 text-sm border-b border-gray-700/50">
                      <th className="pb-3">Creator</th>
                      <th className="pb-3">Visits</th>
                      <th className="pb-3">Leads</th>
                      <th className="pb-3">Closed</th>
                      <th className="pb-3">Conversion Rate</th>
                      <th className="pb-3">Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.creators.map((c) => {
                      const creator = creators.find(cr => cr.code === c.code)
                      const rate = c.visits > 0 ? ((c.closed / c.visits) * 100).toFixed(1) : '0'
                      const earnings = c.closed * 59 * ((creator?.commission || 20) / 100)
                      return (
                        <tr key={c.code} className="border-b border-gray-700/30">
                          <td className="py-3">
                            <span className="bg-purple-600/30 text-purple-300 px-3 py-1 rounded-full text-sm font-mono">
                              {c.code}
                            </span>
                          </td>
                          <td className="py-3 text-blue-400">{c.visits}</td>
                          <td className="py-3 text-yellow-400">{c.conversions}</td>
                          <td className="py-3 text-green-400">{c.closed}</td>
                          <td className="py-3">{rate}%</td>
                          <td className="py-3 text-green-400 font-semibold">${earnings.toFixed(0)}</td>
                        </tr>
                      )
                    })}
                    {stats.creators.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500">
                          No referral data yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!loading && activeTab === 'creators' && (
          <div className="space-y-8">
            {/* Add Creator Form */}
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">Add New Creator</h2>
              <div className="grid md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Name</label>
                  <input
                    type="text"
                    value={newCreator.name}
                    onChange={(e) => setNewCreator({...newCreator, name: e.target.value})}
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-2 text-white"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Code</label>
                  <input
                    type="text"
                    value={newCreator.code}
                    onChange={(e) => setNewCreator({...newCreator, code: e.target.value.toUpperCase()})}
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-2 text-white uppercase"
                    placeholder="JOHN"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Password</label>
                  <input
                    type="text"
                    value={newCreator.password}
                    onChange={(e) => setNewCreator({...newCreator, password: e.target.value})}
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-2 text-white"
                    placeholder="creator123"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Commission %</label>
                  <input
                    type="number"
                    value={newCreator.commission}
                    onChange={(e) => setNewCreator({...newCreator, commission: Number(e.target.value)})}
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-2 text-white"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={addCreator}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl px-4 py-2 transition-colors"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>

            {/* Creators List */}
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">Active Creators ({creators.length})</h2>
              <div className="space-y-3">
                {creators.map((creator) => (
                  <div key={creator.code} className="bg-gray-700/30 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center font-bold">
                        {creator.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{creator.name}</div>
                        <div className="text-sm text-gray-400">
                          Code: <span className="text-purple-400 font-mono">{creator.code}</span> • {creator.commission}% commission
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(creator.referralLink)
                          alert('Link copied!')
                        }}
                        className="text-sm bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg transition-colors"
                      >
                        Copy Link
                      </button>
                      <button
                        onClick={() => deleteCreator(creator.code)}
                        className="text-sm bg-red-600/30 hover:bg-red-600 text-red-400 hover:text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {creators.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No creators yet. Add one above!</p>
                )}
              </div>
            </div>
          </div>
        )}

        {!loading && activeTab === 'visits' && stats && (
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Referral Visits</h2>
            <div className="space-y-2">
              {stats.recentVisits.map((visit) => (
                <div key={visit.id} className="bg-gray-700/30 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="bg-purple-600/30 text-purple-300 px-3 py-1 rounded-full text-sm font-mono">
                        {visit.code}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {new Date(visit.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 truncate max-w-md">
                      {visit.userAgent}
                    </div>
                  </div>
                  <button
                    onClick={() => markAsConversion(visit)}
                    className="text-sm bg-yellow-600/30 hover:bg-yellow-600 text-yellow-400 hover:text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Mark as Lead
                  </button>
                </div>
              ))}
              {stats.recentVisits.length === 0 && (
                <p className="text-center text-gray-500 py-8">No visits yet</p>
              )}
            </div>
          </div>
        )}

        {!loading && activeTab === 'conversions' && stats && (
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">All Conversions</h2>
            <div className="space-y-2">
              {stats.allConversions.map((conv) => (
                <div key={conv.id} className="bg-gray-700/30 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="bg-purple-600/30 text-purple-300 px-3 py-1 rounded-full text-sm font-mono">
                        {conv.code}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        conv.status === 'closed' ? 'bg-green-600/30 text-green-400' :
                        conv.status === 'pending' ? 'bg-yellow-600/30 text-yellow-400' :
                        'bg-red-600/30 text-red-400'
                      }`}>
                        {conv.status.toUpperCase()}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {new Date(conv.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateConversion(conv.id, 'closed')}
                      className="text-sm bg-green-600/30 hover:bg-green-600 text-green-400 hover:text-white px-3 py-1 rounded-lg transition-colors"
                    >
                      ✓ Closed
                    </button>
                    <button
                      onClick={() => updateConversion(conv.id, 'lost')}
                      className="text-sm bg-red-600/30 hover:bg-red-600 text-red-400 hover:text-white px-3 py-1 rounded-lg transition-colors"
                    >
                      ✗ Lost
                    </button>
                  </div>
                </div>
              ))}
              {stats.allConversions.length === 0 && (
                <p className="text-center text-gray-500 py-8">No conversions yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
