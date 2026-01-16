"use client"

import Link from "next/link"

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020a18] via-[#041225] to-[#020510]">
      {/* Header */}
      <header className="py-0 px-8 border-b border-border/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="MapsReach" className="h-28 w-auto" />
            <div className="hidden sm:flex items-center gap-2 -ml-1">
              <span className="text-[#3b82f6] font-semibold text-base tracking-wide">Extract</span>
              <span className="text-[#60a5fa] text-sm">•</span>
              <span className="text-[#2563eb] font-semibold text-base tracking-wide">Export</span>
              <span className="text-[#60a5fa] text-sm">•</span>
              <span className="text-[#1d4ed8] font-semibold text-base tracking-wide">Excel</span>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-4">
            <Link href="/pricing" className="text-accent hover:text-foreground transition-all duration-300 text-base font-semibold px-4 py-2 rounded-lg border border-accent/30 hover:border-accent/60 hover:bg-accent/10">💰 Pricing</Link>
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-all duration-300 text-base font-medium px-4 py-2 rounded-lg hover:bg-white/10">Home</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full mb-6">
            <span className="text-2xl">🎁</span>
            <span className="text-green-400 font-medium">100 Free Leads Included — No Credit Card Required!</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Choose Your <span className="text-primary">Browser</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Select your browser below to get started with MapsReach. Installation takes less than 2 minutes!
          </p>

          {/* Browser Selection Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Chrome Card */}
            <Link
              href="/download/chrome"
              className="group p-8 rounded-2xl border-2 border-border/50 bg-card/30 hover:border-[#4285F4] hover:bg-[#4285F4]/5 transition-all duration-300"
            >
              <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-12 h-12" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="20" fill="#4285F4"/>
                  <circle cx="24" cy="24" r="8" fill="white"/>
                  <path d="M24 4a20 20 0 0116.97 9.39l-9.49 5.48a8 8 0 00-7.48-5.14V4z" fill="#EA4335"/>
                  <path d="M40.97 13.39A20 20 0 0144 24a20 20 0 01-7.03 15.18l-9.49-16.44a8 8 0 00.52-6.87l12.97-2.48z" fill="#FBBC05"/>
                  <path d="M36.97 39.18A20 20 0 014 24a20 20 0 013.03-10.61l9.49 16.44a8 8 0 007.48 2.74l12.97 6.61z" fill="#34A853"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Google Chrome</h2>
              <p className="text-muted-foreground mb-6">Most popular browser worldwide</p>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#4285F4] to-[#1a73e8] text-white font-semibold rounded-xl group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all">
                <span>Get for Chrome</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </Link>

            {/* Edge Card */}
            <Link
              href="/download/edge"
              className="group p-8 rounded-2xl border-2 border-border/50 bg-card/30 hover:border-[#0078D4] hover:bg-[#0078D4]/5 transition-all duration-300"
            >
              <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-12 h-12" viewBox="0 0 48 48">
                  <defs>
                    <linearGradient id="edge1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0078D4"/>
                      <stop offset="100%" stopColor="#1CA3EC"/>
                    </linearGradient>
                    <linearGradient id="edge2" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#50E6FF"/>
                      <stop offset="100%" stopColor="#32BEDD"/>
                    </linearGradient>
                  </defs>
                  <circle cx="24" cy="24" r="20" fill="url(#edge1)"/>
                  <path d="M24 8c-8.837 0-16 7.163-16 16 0 4.418 1.791 8.418 4.686 11.314C15.58 32.418 19.58 30 24 30c8.837 0 16-7.163 16-16 0-3.313-1.005-6.392-2.729-8.951C34.392 9.005 29.313 8 24 8z" fill="url(#edge2)" opacity="0.8"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Microsoft Edge</h2>
              <p className="text-muted-foreground mb-6">Windows default browser</p>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0078D4] to-[#1CA3EC] text-white font-semibold rounded-xl group-hover:shadow-lg group-hover:shadow-cyan-500/30 transition-all">
                <span>Get for Edge</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </Link>
          </div>

          {/* Also Works With */}
          <div className="mt-12 p-6 bg-card/30 rounded-xl border border-border/50 max-w-2xl mx-auto">
            <p className="text-muted-foreground">
              <span className="text-foreground font-semibold">Also works with:</span> Brave, Opera, Vivaldi, and any Chromium-based browser
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Use the Chrome instructions for other Chromium browsers
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/30 mt-auto">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground text-sm">
          <p>© 2026 MapsReach. All rights reserved.</p>
          <div className="mt-2 flex items-center justify-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <span>•</span>
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
