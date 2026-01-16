"use client"

import Link from "next/link"

export default function EdgeDownloadPage() {
  const steps = [
    {
      number: 1,
      title: "Download the Extension",
      description: "Click the download button above to get the MapsReach extension ZIP file.",
    },
    {
      number: 2,
      title: "Unzip the Folder",
      description: "Extract the downloaded ZIP file to a folder on your computer. Remember where you save it!",
    },
    {
      number: 3,
      title: "Open Edge Extensions",
      description: "Open Edge and type edge://extensions in the address bar, then press Enter.",
    },
    {
      number: 4,
      title: "Enable Developer Mode",
      description: "Toggle ON the 'Developer mode' switch in the bottom-left corner of the page.",
    },
    {
      number: 5,
      title: "Load the Extension",
      description: "Click 'Load unpacked' and select the folder you extracted in step 2. Done!",
    }
  ]

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
            <Link href="/download/chrome" className="text-muted-foreground hover:text-foreground transition-all duration-300 text-base font-medium px-4 py-2 rounded-lg hover:bg-white/10">Chrome Version</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Edge Badge */}
          <div className="inline-flex items-center gap-3 px-5 py-3 bg-[#0078D4]/10 border border-[#0078D4]/30 rounded-full mb-8">
            <svg className="w-8 h-8" viewBox="0 0 48 48">
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
            <span className="text-[#0078D4] font-semibold text-lg">Microsoft Edge</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Download <span className="text-[#0078D4]">MapsReach</span> for Edge
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Installation takes less than 2 minutes!
          </p>

          {/* Download Button */}
          <a
            href="/MapsReach-Extension.zip"
            download="MapsReach-Extension.zip"
            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-[#0078D4] to-[#1CA3EC] text-white font-bold rounded-2xl text-xl hover:shadow-xl hover:shadow-cyan-500/40 transition-all duration-200 hover:scale-105"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download for Edge
          </a>
        </div>
      </section>

      {/* Installation Steps */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8 text-foreground">Installation Steps</h2>
          
          {/* Video Placeholder */}
          <div className="aspect-video bg-black/30 rounded-2xl mb-10 flex items-center justify-center border border-[#0078D4]/30 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-6xl mb-3">🎬</div>
              <p className="text-xl text-muted-foreground">Video tutorial coming soon</p>
            </div>
          </div>

          {/* Steps Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {steps.map((step) => (
              <div key={step.number} className="p-5 rounded-xl bg-card/50 border border-border/50 hover:border-[#0078D4]/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#0078D4] flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">{step.number}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Features */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card/30 border border-border/50">
              <svg className="w-6 h-6 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-muted-foreground">100% Safe & Secure</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card/30 border border-border/50">
              <svg className="w-6 h-6 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-muted-foreground">2-Minute Setup</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card/30 border border-border/50">
              <svg className="w-6 h-6 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-muted-foreground">No Credit Card Required</span>
            </div>
          </div>
        </div>
      </section>

      {/* Need Help */}
      <section className="py-12 px-4 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-muted-foreground mb-4">
            Need help with installation? We&apos;re here for you!
          </p>
          <a
            href="mailto:support@mapsreach.com"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-border rounded-xl transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="font-medium">Contact Support</span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/30">
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
