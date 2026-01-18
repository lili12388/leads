"use client"

import Link from "next/link"

export default function ScrapePhoneNumbersPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="py-0 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="MapsReach" className="h-28 w-auto" />
            <div className="hidden sm:flex items-center gap-1.5 -ml-1">
              <span className="text-muted-foreground font-medium text-base">Extract</span>
              <span className="text-primary font-bold text-base border-b-2 border-primary">Emails</span>
              <span className="text-muted-foreground">,</span>
              <span className="text-secondary font-bold text-base border-b-2 border-secondary">Phones</span>
              <span className="text-muted-foreground font-medium text-base">& More</span>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-4">
            <Link href="/pricing" className="text-accent hover:text-foreground transition-all duration-300 text-base font-semibold px-4 py-2 rounded-lg border border-accent/30 hover:border-accent/60 hover:bg-accent/10">💰 Pricing</Link>
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-all duration-300 text-base font-medium px-4 py-2 rounded-lg hover:bg-white/10">Home</Link>
            <Link href="/blog" className="text-primary font-semibold transition-all duration-300 text-base px-4 py-2 rounded-lg">Blog</Link>
          </div>
          <Link href="/coming-soon" className="px-6 py-3 bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] text-white font-semibold rounded-full text-base hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200">
            Try for Free
          </Link>
        </div>
      </header>

      {/* Article */}
      <article className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <nav className="mb-8">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
              <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
              <li>/</li>
              <li className="text-foreground">Scrape Phone Numbers</li>
            </ol>
          </nav>

          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-accent/20 text-accent rounded-full text-sm font-medium">Guide</span>
              <span className="text-muted-foreground text-sm">January 10, 2026</span>
              <span className="text-muted-foreground text-sm">• 6 min read</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              How to Scrape Phone Numbers from Google Maps [2026 Guide]
            </h1>
            <p className="text-xl text-muted-foreground">
              Extract business phone numbers from Google Maps for cold calling and SMS outreach. Complete guide with ethical best practices.
            </p>
          </header>

          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground mb-6">
              Phone numbers are one of the most valuable pieces of business data you can extract from Google Maps. Whether you're doing cold outreach, SMS marketing, or building a contact database, here's how to get phone numbers at scale.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Why Extract Phone Numbers from Google Maps?</h2>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
              <li><strong className="text-foreground">Direct outreach:</strong> Call or text business owners directly</li>
              <li><strong className="text-foreground">Higher response rates:</strong> Phone calls often convert better than emails</li>
              <li><strong className="text-foreground">Verified numbers:</strong> Google-listed numbers are typically accurate</li>
              <li><strong className="text-foreground">Local lead gen:</strong> Build lists of local service businesses</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Method 1: Manual Phone Number Collection</h2>
            <p className="text-muted-foreground mb-4">
              You can manually click on each Google Maps listing and copy phone numbers:
            </p>
            <ol className="list-decimal list-inside text-muted-foreground mb-4 space-y-2">
              <li>Search for businesses on Google Maps</li>
              <li>Click on a business listing</li>
              <li>Find the phone number in the business details panel</li>
              <li>Copy it to your spreadsheet</li>
              <li>Repeat for each business...</li>
            </ol>
            
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
              <p className="text-sm text-amber-200">
                <strong>⚠️ Time Warning:</strong> Manual extraction takes 30-60 seconds per business. For 100 leads, that's 50-100 minutes of tedious clicking.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Method 2: Automated Phone Number Extraction</h2>
            <p className="text-muted-foreground mb-4">
              A Google Maps scraper can extract phone numbers from hundreds of businesses in minutes. Here's how to do it with MapsReach:
            </p>

            <div className="bg-card border border-border rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Step-by-Step Process</h3>
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">1</span>
                  <div>
                    <p className="font-medium text-foreground">Install MapsReach extension</p>
                    <p className="text-muted-foreground text-sm">Add the extension to Chrome from the Web Store</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">2</span>
                  <div>
                    <p className="font-medium text-foreground">Search Google Maps</p>
                    <p className="text-muted-foreground text-sm">Search for "plumbers in Phoenix" or any business type</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">3</span>
                  <div>
                    <p className="font-medium text-foreground">Click Extract</p>
                    <p className="text-muted-foreground text-sm">MapsReach will auto-scroll and collect all business data including phone numbers</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">4</span>
                  <div>
                    <p className="font-medium text-foreground">Export to CSV</p>
                    <p className="text-muted-foreground text-sm">Download your list with phone numbers ready for outreach</p>
                  </div>
                </li>
              </ol>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Phone Number Data Format</h2>
            <p className="text-muted-foreground mb-4">
              When you extract phone numbers, you'll get them in a clean format:
            </p>
            
            <div className="overflow-x-auto mb-6">
              <table className="w-full border border-border rounded-lg overflow-hidden text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-3 py-2 text-left text-foreground">Business</th>
                    <th className="px-3 py-2 text-left text-foreground">Phone</th>
                    <th className="px-3 py-2 text-left text-foreground">Address</th>
                    <th className="px-3 py-2 text-left text-foreground">Website</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-muted-foreground">
                  <tr>
                    <td className="px-3 py-2">Phoenix Plumbing Co</td>
                    <td className="px-3 py-2">(602) 555-1234</td>
                    <td className="px-3 py-2">123 Main St, Phoenix AZ</td>
                    <td className="px-3 py-2">phoenixplumbing.com</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">Desert Pipes LLC</td>
                    <td className="px-3 py-2">(480) 555-5678</td>
                    <td className="px-3 py-2">456 Oak Rd, Tempe AZ</td>
                    <td className="px-3 py-2">desertpipes.com</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Do All Businesses Have Phone Numbers?</h2>
            <p className="text-muted-foreground mb-4">
              Not all Google Maps listings include phone numbers. Availability varies by:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
              <li><strong className="text-foreground">Business type:</strong> Service businesses (plumbers, lawyers, restaurants) almost always have phone numbers</li>
              <li><strong className="text-foreground">Claim status:</strong> Claimed and verified business profiles are more complete</li>
              <li><strong className="text-foreground">Location:</strong> US businesses typically have high phone number availability (80-95%)</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Best Practices for Phone Outreach</h2>
            <div className="bg-card border border-primary/30 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold mb-3 text-foreground">✅ Do's</h3>
              <ul className="text-muted-foreground space-y-2 mb-4">
                <li>• Call during business hours</li>
                <li>• Respect DNC (Do Not Call) lists</li>
                <li>• Have a clear value proposition</li>
                <li>• Keep records of who you've contacted</li>
                <li>• Follow TCPA regulations for SMS</li>
              </ul>
              
              <h3 className="text-lg font-semibold mb-3 text-foreground">❌ Don'ts</h3>
              <ul className="text-muted-foreground space-y-2">
                <li>• Don't spam call the same number</li>
                <li>• Don't call at inappropriate hours</li>
                <li>• Don't misrepresent your business</li>
                <li>• Don't send SMS without consent where required</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">FAQ</h2>
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-2">Is it legal to scrape phone numbers from Google Maps?</h4>
                <p className="text-muted-foreground text-sm">
                  Phone numbers on Google Maps are publicly available business information. Using them for legitimate B2B outreach is generally acceptable, but always comply with local telemarketing regulations.
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-2">How many phone numbers can I extract?</h4>
                <p className="text-muted-foreground text-sm">
                  Google Maps shows up to ~120 results per search. You can run multiple searches for different locations or business types to build larger lists.
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-2">Are the phone numbers verified?</h4>
                <p className="text-muted-foreground text-sm">
                  Phone numbers on Google Maps are provided by business owners. They're generally accurate, especially for claimed/verified business profiles.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 p-6 bg-card border border-border rounded-xl text-center">
            <h3 className="text-xl font-semibold mb-2">Start Extracting Phone Numbers Today</h3>
            <p className="text-muted-foreground mb-4">
              Get MapsReach and build phone lists from Google Maps in minutes, not hours.
            </p>
            <Link href="/purchase" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors">
              Get MapsReach - $59 One-Time
            </Link>
          </div>

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

      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground text-sm">
          <p>© 2026 MapsReach. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
