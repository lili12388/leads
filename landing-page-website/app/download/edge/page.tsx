"use client"

import Link from "next/link"

export default function EdgeDownloadPage() {
  const steps = [
    {
      number: 1,
      title: "Click 'Get' Button",
      description: "Click the button above to open the Edge Add-ons store page for MapsReach.",
    },
    {
      number: 2,
      title: "Add to Edge",
      description: "Click 'Get' on the Edge Add-ons page to install MapsReach instantly.",
    },
    {
      number: 3,
      title: "Start Extracting",
      description: "Go to Google Maps, search for businesses, and click the MapsReach icon. That's it!",
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
          {/* Official Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0078D4]/20 border border-[#0078D4]/40 mb-6">
            <svg className="w-5 h-5 text-[#0078D4]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-[#0078D4] font-medium text-sm">Official Edge Add-on</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Get <span className="text-[#0078D4]">MapsReach</span> for Edge
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Now available on the official Microsoft Edge Add-ons store!
          </p>

          {/* Install Button */}
          <a
            href="https://microsoftedge.microsoft.com/addons/detail/mapsreach-extract-%E2%80%A2-exp/emifecdjjaekekfjpcbocgihccnafefp"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-[#0078D4] to-[#1CA3EC] text-white font-bold rounded-2xl text-xl hover:shadow-xl hover:shadow-cyan-500/40 transition-all duration-200 hover:scale-105"
          >
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.86 17.86q.14 0 .25.12.1.13.1.25t-.11.33l-.32.46-.43.53-.44.5q-.21.25-.38.42l-.22.23q-.58.53-1.34 1.04-.76.51-1.6.91-.86.4-1.74.64t-1.67.24q-.9 0-1.69-.28-.79-.28-1.48-.78-.68-.5-1.22-1.17-.53-.66-.89-1.42-.52-1.1-.7-2.03-.18-.92-.18-1.78 0-.85.23-1.74.24-.9.69-1.76.45-.87 1.1-1.68.66-.8 1.51-1.46.85-.67 1.88-1.13 1.04-.45 2.18-.65v2.05q-.96.21-1.83.6-.88.4-1.62.94-.74.55-1.32 1.23-.57.68-.96 1.44-.4.76-.6 1.56-.21.81-.21 1.65 0 .94.13 1.63.13.7.37 1.28.24.57.57 1.06.34.48.75.93.42.44.9.84.49.4 1.02.75.54.34 1.1.62.56.27 1.14.48.58.2 1.16.34.58.13 1.15.19v-4.39H12v-2.05h9.86z"/>
            </svg>
            Get from Edge Add-ons
          </a>

          <p className="text-sm text-muted-foreground mt-4">
            One-click install • No manual setup required
          </p>
        </div>
      </section>

      {/* Installation Steps */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8 text-foreground">Simple 3-Step Installation</h2>
          
          {/* Video Placeholder */}
          <div className="aspect-video bg-black/30 rounded-2xl mb-10 flex items-center justify-center border border-[#0078D4]/30 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-6xl mb-3">🎬</div>
              <p className="text-xl text-muted-foreground">Video tutorial coming soon</p>
            </div>
          </div>

          {/* Steps Grid */}
          <div className="grid md:grid-cols-3 gap-4">
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
