"use client"

import Link from "next/link"

export default function PricingPage() {
  return (
    <main className="bg-background text-foreground min-h-screen">
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
            <Link href="/pricing" className="text-accent hover:text-foreground transition-all duration-300 text-base font-semibold px-4 py-2 rounded-lg border border-accent/30 hover:border-accent/60 hover:bg-accent/10">💰 Plans</Link>
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

      {/* Plans Section */}
      <section className="py-10 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-6">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 gradient-text">One Price. Unlimited Value.</h1>
            <p className="text-muted-foreground text-lg">No subscriptions. No hidden fees. Just results.</p>
          </div>

          {/* Plan Cards */}
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8 mb-12">
            
            {/* Single License - Most Popular */}
            <div className="bg-card border-2 border-primary/50 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-primary/10 flex flex-col">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-secondary text-white px-4 py-1 rounded-bl-2xl font-semibold text-sm">
                MOST POPULAR
              </div>
              
              <h3 className="text-xl font-bold text-foreground mt-4 mb-6">Single License</h3>
              
              <div className="mb-6">
                <div className="text-5xl font-bold text-foreground">$59</div>
                <p className="text-muted-foreground mt-2">One-time payment • Forever access</p>
              </div>
              
              <div className="space-y-3 text-left mb-8 flex-1">
                {[
                  "1 User, 1 Browser",
                  "Unlimited lead extractions",
                  "All 10+ data fields",
                  "Export to Sheets & CSV",
                  "Email support",
                  "All future updates free"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-foreground text-sm">{item}</span>
                  </div>
                ))}
              </div>
              
              <Link
                href="/purchase?plan=single"
                className="block w-full py-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-full hover:shadow-xl hover:shadow-primary/40 transition-all text-center mt-auto"
              >
                Get Single License →
              </Link>
            </div>

            {/* Extended License - Professional */}
            <div className="bg-card border border-border/50 rounded-3xl p-8 relative overflow-hidden shadow-xl flex flex-col">
              <div className="absolute top-0 right-0 bg-secondary/20 text-secondary px-4 py-1 rounded-bl-2xl font-semibold text-sm">
                PROFESSIONAL
              </div>
              
              <h3 className="text-xl font-bold text-foreground mt-4 mb-6">Extended License</h3>
              
              <div className="mb-6">
                <div className="text-5xl font-bold text-foreground">$69</div>
                <p className="text-muted-foreground mt-2">One-time payment • Forever access</p>
              </div>
              
              <div className="space-y-3 text-left mb-8 flex-1">
                {[
                  "1 User, Up to 3 Browsers",
                  "Unlimited lead extractions",
                  "All 10+ data fields",
                  "Export to Sheets & CSV",
                  "Priority email support",
                  "All future updates free",
                  "Chrome & Edge support"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-foreground text-sm">{item}</span>
                  </div>
                ))}
              </div>
              
              <Link
                href="/purchase?plan=extended"
                className="block w-full py-4 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-full transition-all text-center mt-auto"
              >
                Get Extended License →
              </Link>
            </div>

            {/* Outreach Tool */}
            <div className="bg-card border border-green-500/40 rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-green-500/10 flex flex-col">
              <div className="absolute top-0 right-0 bg-green-500 text-white px-4 py-1 rounded-bl-2xl font-semibold text-sm">
                OUTREACH
              </div>
              
              <h3 className="text-xl font-bold text-foreground mt-4 mb-6">Outreach Tool</h3>
              
              <div className="mb-6">
                <div className="text-5xl font-bold text-foreground">$49</div>
                <p className="text-muted-foreground mt-2">One-time payment • Windows app</p>
              </div>
              
              <div className="space-y-3 text-left mb-8 flex-1">
                {[
                  "WhatsApp + email outreach",
                  "Import leads from CSV",
                  "Personalized templates",
                  "Save hours every week",
                  "Simple 2‑minute setup",
                  "Begin outreach in minutes"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-foreground text-sm">{item}</span>
                  </div>
                ))}
              </div>
              
              <Link
                href="/purchase?plan=outreach"
                className="block w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-full hover:shadow-xl hover:shadow-green-500/40 transition-all text-center mt-auto"
              >
                Get Outreach Tool →
              </Link>
            </div>

            {/* Bundle - Best Deal */}
            <div className="relative rounded-3xl p-[2px] bg-gradient-to-r from-primary via-emerald-400 to-secondary shadow-[0_0_30px_rgba(59,130,246,0.30)]">
              <div className="absolute -inset-2 bg-gradient-to-r from-primary/25 via-emerald-400/25 to-secondary/25 blur-xl opacity-70"></div>
              <div className="relative bg-card rounded-3xl p-8 overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-green-500 text-white px-4 py-1 rounded-bl-2xl font-semibold text-sm">
                  BEST DEAL
                </div>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.18),transparent_60%)]"></div>
                
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-foreground mt-4 mb-6">Extension + Outreach Bundle</h3>
                  
                  <div className="mb-6">
                    <div className="flex items-end justify-center gap-3">
                      <span className="text-xl text-muted-foreground line-through">$99</span>
                      <span className="text-5xl font-bold text-foreground">$89</span>
                    </div>
                    <p className="text-muted-foreground mt-2">One-time payment • Save $19</p>
                  </div>
                  
                  <div className="space-y-3 text-left mb-8 flex-1">
                    {[
                      "MapsReach Extension (lifetime)",
                      "Outreach Tool (WhatsApp + email)",
                      "Unlimited lead extraction",
                      "CSV + Google Sheets export",
                      "Priority updates"
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-foreground text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Link
                    href="/purchase?plan=bundle"
                    className="block w-full py-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-full hover:shadow-xl hover:shadow-primary/40 transition-all text-center mt-auto"
                  >
                    Get Bundle →
                  </Link>
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    Includes MapsReach Extension ($59) + Outreach Tool ($49)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust elements */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground mb-12">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Secure Payment
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Multiple Payment Options
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Activation in Minutes
            </span>
          </div>

          {/* ROI Calculator hint */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="bg-card border border-border rounded-2xl p-6 text-center">
              <p className="text-foreground mb-2">
                <span className="font-semibold">Quick Math:</span> If your time is worth $30/hour and you save 4 hours/day...
              </p>
              <p className="text-2xl font-bold text-accent">
                MapsReach pays for itself in just 30 minutes of use.
              </p>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto text-left mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 gradient-text">Frequently Asked Questions</h2>
            
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Is this a subscription?</h3>
                <p className="text-muted-foreground">
                  No, this is a one-time payment for lifetime access. You'll never have to pay again.
                </p>
              </div>
              
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">What happens after I purchase?</h3>
                <p className="text-muted-foreground">
                  After purchase, you'll receive a license key via email. You can then activate the extension using this key to unlock all pro features.
                </p>
              </div>
              
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Can I use it on multiple devices?</h3>
                <p className="text-muted-foreground">
                  Yes! The Single License allows usage on 1 browser, Extended License on up to 3 browsers, while the Team License supports up to 15 devices across 5 users (3 devices per user).
                </p>
              </div>
            </div>
          </div>

          {/* Back to home */}
          <div>
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
