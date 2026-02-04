"use client"

import Link from "next/link"

export default function ComingSoonPage() {
  return (
    <main className="bg-background text-foreground min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="py-0 px-8">
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
            <Link href="/#how-it-works" className="text-muted-foreground hover:text-foreground transition-all duration-300 text-base font-medium px-4 py-2 rounded-lg hover:bg-white/10">How it Works</Link>
            <Link href="/#features" className="text-muted-foreground hover:text-foreground transition-all duration-300 text-base font-medium px-4 py-2 rounded-lg hover:bg-white/10">Features</Link>
            <Link href="/#faq" className="text-muted-foreground hover:text-foreground transition-all duration-300 text-base font-medium px-4 py-2 rounded-lg hover:bg-white/10">FAQ</Link>
          </div>
          
          <Link
            href="/coming-soon"
            className="px-6 py-3 bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] text-white font-semibold rounded-full text-base hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200"
          >
            Try for Free
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <section className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Icon */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-primary/10 rounded-full mb-6">
              <span className="text-5xl">🚀</span>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
            Almost There!
          </h1>

          {/* Message */}
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Our extension is currently being reviewed by the Chrome Web Store team. 
            We're working hard to bring MapsReach to you as soon as possible!
          </p>

          {/* Status Card */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
              <span className="text-foreground font-semibold">Under Review</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Chrome Web Store reviews typically take 1-3 business days. 
              We'll notify you as soon as it's live!
            </p>
          </div>

          {/* Get Notified */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-3">
              🔔 Want to be the first to know?
            </h3>
            <p className="text-muted-foreground mb-4">
              Get notified the moment MapsReach is available on the Chrome Web Store.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-1 px-4 py-3 bg-background border border-border rounded-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-full hover:shadow-lg hover:shadow-primary/30 transition-all">
                Notify Me
              </button>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to Home
            </Link>
            <span className="hidden sm:block text-border">|</span>
            <Link 
              href="/pricing" 
              className="text-primary hover:text-primary/80 transition-colors font-medium"
            >
              View Pricing Plans →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-8 border-t border-border/50 text-center">
        <p className="text-muted-foreground text-sm">
          © 2026 MapsReach. All rights reserved.
        </p>
      </footer>
    </main>
  )
}
