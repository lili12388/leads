"use client"

import Link from "next/link"

export default function MapsReachVsTexAuPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="MapsReach" className="h-28 w-auto" />
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/blog" className="text-primary font-medium">Blog</Link>
          </nav>
        </div>
      </header>

      {/* Article */}
      <article className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
              <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
              <li>/</li>
              <li className="text-foreground">MapsReach vs TexAu</li>
            </ol>
          </nav>

          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-secondary/20 text-secondary rounded-full text-sm font-medium">Comparison</span>
              <span className="text-muted-foreground text-sm">January 13, 2026</span>
              <span className="text-muted-foreground text-sm">• 5 min read</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              MapsReach vs TexAu: A Fair Comparison
            </h1>
            <p className="text-xl text-muted-foreground">
              TexAu is a powerful automation platform. Here's how MapsReach compares for Google Maps lead extraction.
            </p>
          </header>

          {/* Disclosure Box */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-8">
            <p className="text-sm text-amber-200">
              <strong>⚠️ Disclosure:</strong> This comparison is written by MapsReach. We aim to be fair and accurate, 
              but encourage you to verify information yourself. Pricing and features may change.
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">What is TexAu?</h2>
            <p className="text-muted-foreground mb-4">
              TexAu is a growth automation platform that provides "recipes" (automated workflows) for various platforms 
              including LinkedIn, Twitter, Facebook, Instagram, and Google Maps. It's designed for marketers and agencies 
              who need scalable automation solutions.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Where TexAu Excels</h2>
            <p className="text-muted-foreground mb-2">
              Being honest about TexAu's strengths:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
              <li><strong className="text-foreground">Multi-platform support:</strong> Automate across LinkedIn, Twitter, Facebook, and more</li>
              <li><strong className="text-foreground">Visual workflow builder:</strong> Create complex automation sequences</li>
              <li><strong className="text-foreground">Team collaboration:</strong> Built for agencies and teams</li>
              <li><strong className="text-foreground">Data enrichment:</strong> Combine and enrich data from multiple sources</li>
              <li><strong className="text-foreground">Scheduled automations:</strong> Run extractions on autopilot</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Where MapsReach Offers Advantages</h2>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
              <li><strong className="text-foreground">Pricing:</strong> One-time $59 vs TexAu's $29-199/month subscription</li>
              <li><strong className="text-foreground">Simplicity:</strong> No dashboard needed - works in your browser</li>
              <li><strong className="text-foreground">Specialized:</strong> Purpose-built for Google Maps extraction</li>
              <li><strong className="text-foreground">No credits/limits:</strong> Extract unlimited leads with one purchase</li>
              <li><strong className="text-foreground">Instant results:</strong> Real-time extraction as you browse</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Pricing Comparison</h2>
            
            {/* Pricing Table */}
            <div className="overflow-x-auto mb-8">
              <table className="w-full border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-4 py-3 text-left text-foreground font-semibold">Aspect</th>
                    <th className="px-4 py-3 text-left text-foreground font-semibold">MapsReach</th>
                    <th className="px-4 py-3 text-left text-foreground font-semibold">TexAu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-4 py-3 text-muted-foreground">Pricing Model</td>
                    <td className="px-4 py-3 text-foreground">One-time $59</td>
                    <td className="px-4 py-3 text-foreground">$29-199/month</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-muted-foreground">Annual cost</td>
                    <td className="px-4 py-3 text-foreground">$59 total</td>
                    <td className="px-4 py-3 text-foreground">$348-2,388/year</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-muted-foreground">Google Maps extraction</td>
                    <td className="px-4 py-3 text-foreground">Unlimited</td>
                    <td className="px-4 py-3 text-foreground">Credit-based</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-muted-foreground">Learning curve</td>
                    <td className="px-4 py-3 text-foreground">Minimal</td>
                    <td className="px-4 py-3 text-foreground">Moderate</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Who Should Use TexAu?</h2>
            <p className="text-muted-foreground mb-4">
              TexAu is probably better if you:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
              <li>Need multi-platform automation (LinkedIn, Twitter, etc.)</li>
              <li>Are an agency managing multiple clients</li>
              <li>Want to build complex automated workflows</li>
              <li>Need team collaboration features</li>
              <li>Have ongoing subscription budget</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Who Should Use MapsReach?</h2>
            <p className="text-muted-foreground mb-4">
              MapsReach is probably better if you:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
              <li>Focus specifically on Google Maps lead generation</li>
              <li>Prefer one-time payment over monthly fees</li>
              <li>Want something simple and immediate</li>
              <li>Are a freelancer or small business</li>
              <li>Don't need complex workflow automation</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Bottom Line</h2>
            <p className="text-muted-foreground mb-4">
              TexAu is a comprehensive automation platform suited for teams and agencies with diverse needs across multiple platforms. 
              MapsReach is a focused, cost-effective solution for those who primarily need Google Maps lead extraction.
            </p>
            <p className="text-muted-foreground mb-4">
              If you're spending more on TexAu's subscription than you're getting value from Google Maps specifically, 
              MapsReach could save you money while doing that one job well.
            </p>
          </div>

          {/* CTA */}
          <div className="mt-12 p-6 bg-card border border-border rounded-xl text-center">
            <h3 className="text-xl font-semibold mb-2">Interested in MapsReach?</h3>
            <p className="text-muted-foreground mb-4">
              If Google Maps extraction is your main use case:
            </p>
            <Link 
              href="/purchase" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Get MapsReach - $59 One-Time
            </Link>
          </div>

          {/* Back to Blog */}
          <div className="mt-8">
            <Link href="/blog" className="text-primary hover:underline flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to all articles
            </Link>
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground text-sm">
          <p>© 2026 MapsReach. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
