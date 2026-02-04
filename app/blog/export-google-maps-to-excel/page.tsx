"use client"

import Link from "next/link"

export default function ExportGoogleMapsToExcelPage() {
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
              <li className="text-foreground">Export Google Maps to Excel</li>
            </ol>
          </nav>

          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">Tutorial</span>
              <span className="text-muted-foreground text-sm">January 12, 2026</span>
              <span className="text-muted-foreground text-sm">• 7 min read</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              How to Export Google Maps List to Excel: Complete Guide [2026]
            </h1>
            <p className="text-xl text-muted-foreground">
              Learn how to export Google Maps business listings to Excel or CSV. Step-by-step guide with manual and automated methods for lead generation.
            </p>
          </header>

          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground mb-6">
              Need to export Google Maps data to Excel? Whether you're building a lead list, doing market research, or organizing business contacts, this guide shows you exactly how to get Google Maps data into a spreadsheet.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Why Export Google Maps to Excel?</h2>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
              <li>Build B2B lead lists with verified business data</li>
              <li>Organize local business information for outreach</li>
              <li>Create databases of potential clients or partners</li>
              <li>Conduct market research and competitor analysis</li>
              <li>Import into CRM systems for sales campaigns</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Method 1: Export Saved Google Maps Lists (Manual)</h2>
            <p className="text-muted-foreground mb-4">
              Google allows you to export your saved places, but with significant limitations:
            </p>
            
            <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Steps:</h3>
            <ol className="list-decimal list-inside text-muted-foreground mb-4 space-y-2">
              <li>Go to Google Takeout (takeout.google.com)</li>
              <li>Deselect all products, then select "Saved"</li>
              <li>Click "Next step" and create export</li>
              <li>Download the export (JSON or GeoJSON format)</li>
              <li>Convert JSON to CSV/Excel using online tools</li>
            </ol>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
              <p className="text-sm text-amber-200">
                <strong>⚠️ Limitations:</strong> This only exports places YOU saved, not general business listings. It doesn't include phone numbers or emails for most places.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Method 2: Export Any Google Maps Listings to Excel (Automated)</h2>
            <p className="text-muted-foreground mb-4">
              To export any Google Maps search results to Excel, you need a Google Maps scraper tool. Here's how to do it with MapsReach:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Step 1: Install MapsReach Chrome Extension</h3>
            <p className="text-muted-foreground mb-4">
              Download and install the MapsReach extension from the Chrome Web Store. The extension adds an overlay panel to Google Maps.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Step 2: Search for Businesses on Google Maps</h3>
            <p className="text-muted-foreground mb-4">
              Open Google Maps and search for your target businesses. For example: "restaurants in Los Angeles" or "plumbers near Dallas Texas".
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Step 3: Extract the Data</h3>
            <p className="text-muted-foreground mb-4">
              Click the MapsReach panel and hit "Extract". The extension will scroll through results and collect business data automatically.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Step 4: Export to Excel/CSV</h3>
            <p className="text-muted-foreground mb-4">
              Once extraction is complete, click "Export CSV" or "Export to Google Sheets". Your data is now ready to use!
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">What Data Can You Export to Excel?</h2>
            <p className="text-muted-foreground mb-4">
              When you export Google Maps listings to Excel, you can get:
            </p>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-2">📋 Basic Info</h4>
                <ul className="text-muted-foreground text-sm space-y-1">
                  <li>• Business name</li>
                  <li>• Full address</li>
                  <li>• Phone number</li>
                  <li>• Website URL</li>
                  <li>• Business category</li>
                </ul>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-2">⭐ Review Data</h4>
                <ul className="text-muted-foreground text-sm space-y-1">
                  <li>• Star rating</li>
                  <li>• Total review count</li>
                  <li>• Google Maps link</li>
                  <li>• Plus Code</li>
                  <li>• Opening hours</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Excel Format Example</h2>
            <p className="text-muted-foreground mb-4">
              Your exported Excel file will look something like this:
            </p>
            
            <div className="overflow-x-auto mb-6">
              <table className="w-full border border-border rounded-lg overflow-hidden text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-3 py-2 text-left text-foreground">Name</th>
                    <th className="px-3 py-2 text-left text-foreground">Phone</th>
                    <th className="px-3 py-2 text-left text-foreground">Address</th>
                    <th className="px-3 py-2 text-left text-foreground">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-muted-foreground">
                  <tr>
                    <td className="px-3 py-2">Joe's Pizza</td>
                    <td className="px-3 py-2">(555) 123-4567</td>
                    <td className="px-3 py-2">123 Main St, LA</td>
                    <td className="px-3 py-2">4.5</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">Pizza Palace</td>
                    <td className="px-3 py-2">(555) 234-5678</td>
                    <td className="px-3 py-2">456 Oak Ave, LA</td>
                    <td className="px-3 py-2">4.2</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Tips for Better Excel Exports</h2>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
              <li><strong className="text-foreground">Use specific searches:</strong> "dentists in Chicago downtown" gives better results than just "dentists"</li>
              <li><strong className="text-foreground">Zoom into the area:</strong> Google Maps shows different results based on your zoom level</li>
              <li><strong className="text-foreground">Export in batches:</strong> For large lists, export 100-200 leads at a time</li>
              <li><strong className="text-foreground">Clean your data:</strong> Remove duplicates and verify important contacts</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">FAQ</h2>
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-2">Can I export Google Maps to Excel for free?</h4>
                <p className="text-muted-foreground text-sm">
                  You can export your own saved places via Google Takeout for free. For bulk business data extraction, tools like MapsReach offer trial periods.
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-2">How many leads can I export?</h4>
                <p className="text-muted-foreground text-sm">
                  With MapsReach's one-time license, you can export unlimited leads. Google Maps typically shows up to ~120 results per search.
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-2">Does the export include email addresses?</h4>
                <p className="text-muted-foreground text-sm">
                  Email addresses are extracted when businesses list them on their Google Maps profile. Not all businesses provide emails.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 p-6 bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 rounded-xl text-center">
            <h3 className="text-xl font-semibold mb-2">Export Google Maps to Excel in Minutes</h3>
            <p className="text-muted-foreground mb-4">
              Stop copying business data manually. Get MapsReach and export any Google Maps search to Excel.
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
