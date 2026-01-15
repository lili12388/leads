"use client"

import Link from "next/link"

export default function MapsReachVsOutscraperPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="MapsReach" className="h-28 w-auto" />
            {/* Slogan right next to logo */}
            <div className="hidden sm:flex items-center gap-2 -ml-1">
              <span className="text-[#3b82f6] font-semibold text-base tracking-wide">Extract</span>
              <span className="text-[#60a5fa] text-sm">•</span>
              <span className="text-[#2563eb] font-semibold text-base tracking-wide">Export</span>
              <span className="text-[#60a5fa] text-sm">•</span>
              <span className="text-[#1d4ed8] font-semibold text-base tracking-wide">Excel</span>
            </div>
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
              <li className="text-foreground">MapsReach vs Outscraper</li>
            </ol>
          </nav>

          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-secondary/20 text-secondary rounded-full text-sm font-medium">Comparison</span>
              <span className="text-muted-foreground text-sm">January 15, 2026</span>
              <span className="text-muted-foreground text-sm">• 5 min read</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              MapsReach vs Outscraper: Honest Comparison for 2026
            </h1>
            <p className="text-xl text-muted-foreground">
              A transparent comparison of features, pricing, and use cases. We acknowledge where each tool excels.
            </p>
          </header>

          {/* Disclosure Box */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-8">
            <p className="text-sm text-amber-200">
              <strong>⚠️ Disclosure:</strong> This comparison is written by MapsReach. We've done our best to be fair and accurate, 
              but we encourage you to try both tools and verify the information yourself. Pricing and features may change.
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">What is Outscraper?</h2>
            <p className="text-muted-foreground mb-4">
              Outscraper is a well-established cloud-based data extraction platform that offers Google Maps scraping among many other services. 
              They've been in the market longer than us and have built a comprehensive suite of tools.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Where Outscraper Excels</h2>
            <p className="text-muted-foreground mb-2">
              To be fair, here are areas where Outscraper has advantages:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
              <li><strong className="text-foreground">More data sources:</strong> Outscraper offers scraping for many platforms beyond Google Maps (Yelp, TripAdvisor, etc.)</li>
              <li><strong className="text-foreground">API access:</strong> They provide a robust API for developers who need programmatic access</li>
              <li><strong className="text-foreground">Larger scale operations:</strong> Better suited for enterprise-level data extraction needs</li>
              <li><strong className="text-foreground">Established reputation:</strong> They've been around longer with more reviews and case studies</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Where MapsReach Offers Advantages</h2>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
              <li><strong className="text-foreground">Pricing model:</strong> One-time $59 payment vs Outscraper's credit-based system that charges per result</li>
              <li><strong className="text-foreground">Simplicity:</strong> Browser extension that works directly in Google Maps - no dashboard needed</li>
              <li><strong className="text-foreground">No limits:</strong> Extract unlimited leads with your one-time purchase</li>
              <li><strong className="text-foreground">Instant results:</strong> See leads as you browse, no waiting for batch processing</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Pricing Comparison</h2>
            
            {/* Pricing Table */}
            <div className="overflow-x-auto mb-8">
              <table className="w-full border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-4 py-3 text-left text-foreground font-semibold">Feature</th>
                    <th className="px-4 py-3 text-left text-foreground font-semibold">MapsReach</th>
                    <th className="px-4 py-3 text-left text-foreground font-semibold">Outscraper</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-4 py-3 text-muted-foreground">Pricing Model</td>
                    <td className="px-4 py-3 text-foreground">One-time $59</td>
                    <td className="px-4 py-3 text-foreground">Pay per result (credits)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-muted-foreground">1,000 leads cost</td>
                    <td className="px-4 py-3 text-foreground">$59 (same price)</td>
                    <td className="px-4 py-3 text-foreground">~$20-40 (varies)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-muted-foreground">10,000 leads cost</td>
                    <td className="px-4 py-3 text-foreground">$59 (same price)</td>
                    <td className="px-4 py-3 text-foreground">~$200-400 (varies)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-muted-foreground">Unlimited leads</td>
                    <td className="px-4 py-3 text-foreground">$59 total</td>
                    <td className="px-4 py-3 text-foreground">Scales with usage</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Who Should Use Outscraper?</h2>
            <p className="text-muted-foreground mb-4">
              Outscraper may be a better choice if you:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
              <li>Need data from multiple platforms (not just Google Maps)</li>
              <li>Require API access for automation workflows</li>
              <li>Only need occasional, small batches of data (their free tier might suffice)</li>
              <li>Are an enterprise with complex integration needs</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Who Should Use MapsReach?</h2>
            <p className="text-muted-foreground mb-4">
              MapsReach may be a better choice if you:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
              <li>Focus primarily on Google Maps lead generation</li>
              <li>Want predictable pricing without per-lead costs</li>
              <li>Prefer a simple browser extension over cloud dashboards</li>
              <li>Plan to extract leads regularly over time</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Our Honest Recommendation</h2>
            <p className="text-muted-foreground mb-4">
              Both tools have their place. If you need a comprehensive data platform with multiple sources and API access, 
              Outscraper is worth considering. If you want a simple, cost-effective solution specifically for Google Maps 
              lead extraction, MapsReach offers better value for that specific use case.
            </p>
            <p className="text-muted-foreground mb-4">
              We recommend trying both if you're unsure. Outscraper has a free tier, and we offer a money-back guarantee 
              if MapsReach doesn't meet your needs.
            </p>
          </div>

          {/* CTA */}
          <div className="mt-12 p-6 bg-card border border-border rounded-xl text-center">
            <h3 className="text-xl font-semibold mb-2">Want to try MapsReach?</h3>
            <p className="text-muted-foreground mb-4">
              If this comparison helped and you think MapsReach is right for you:
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
