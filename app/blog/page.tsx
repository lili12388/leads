"use client"

import Link from "next/link"

// Blog posts data - easy to add new posts
const blogPosts = [
  {
    slug: "google-maps-data-scraping-guide",
    title: "Google Maps Data Scraping: The Ultimate Guide for B2B Lead Generation [2026]",
    description: "Master Google Maps data extraction with this comprehensive guide. Learn web scraping techniques, data enrichment strategies, and build high-converting lead lists.",
    date: "January 15, 2026",
    category: "Ultimate Guide",
    readTime: "15 min read"
  },
  {
    slug: "best-google-maps-scraper-tools",
    title: "5 Best Google Maps Scraper Chrome Extensions [2026 Updated]",
    description: "Compare the best Google Maps scraper tools for lead generation in 2026. We review MapsReach, Outscraper, Phantombuster, Apify & more.",
    date: "January 15, 2026",
    category: "Comparison",
    readTime: "8 min read"
  },
  {
    slug: "mapsreach-vs-apify",
    title: "MapsReach vs Apify Google Maps Scraper: Which Is Better? [2026]",
    description: "Comparing MapsReach Chrome extension with Apify's Google Maps Scraper. In-depth analysis of features, pricing, and ease of use.",
    date: "January 15, 2026",
    category: "Comparison",
    readTime: "10 min read"
  },
  {
    slug: "mapsreach-vs-bright-data",
    title: "MapsReach vs Bright Data (Luminati): Google Maps Scraping Comparison [2026]",
    description: "Comparing MapsReach with Bright Data's enterprise web scraping platform. Which solution fits your Google Maps lead extraction needs?",
    date: "January 14, 2026",
    category: "Comparison",
    readTime: "9 min read"
  },
  {
    slug: "how-to-extract-emails-from-google-maps",
    title: "How to Extract Emails from Google Maps (Step-by-Step Guide 2026)",
    description: "Learn how to extract business emails from Google Maps for B2B lead generation. Complete guide with manual and automated methods.",
    date: "January 14, 2026",
    category: "Tutorial",
    readTime: "7 min read"
  },
  {
    slug: "local-business-lead-generation",
    title: "Local Business Lead Generation: How to Find SMB Leads Using Google Maps [2026]",
    description: "Comprehensive guide to generating local business leads from Google Maps. Strategies used by top B2B sales teams.",
    date: "January 13, 2026",
    category: "Strategy Guide",
    readTime: "12 min read"
  },
  {
    slug: "mapsreach-vs-instant-data-scraper",
    title: "MapsReach vs Instant Data Scraper: Best Google Maps Chrome Extension [2026]",
    description: "Comparing two popular Chrome extensions for Google Maps data extraction. Which tool is better for scraping business leads?",
    date: "January 12, 2026",
    category: "Comparison",
    readTime: "8 min read"
  },
  {
    slug: "export-google-maps-to-excel",
    title: "How to Export Google Maps List to Excel: Complete Guide [2026]",
    description: "Learn how to export Google Maps business listings to Excel or CSV. Step-by-step guide with manual and automated methods.",
    date: "January 12, 2026",
    category: "Tutorial",
    readTime: "7 min read"
  },
  {
    slug: "scrape-phone-numbers-google-maps",
    title: "How to Scrape Phone Numbers from Google Maps [2026 Guide]",
    description: "Extract business phone numbers from Google Maps for cold calling and SMS outreach. Complete guide with best practices.",
    date: "January 10, 2026",
    category: "Guide",
    readTime: "6 min read"
  },
  {
    slug: "google-maps-lead-generator",
    title: "Google Maps Lead Generator: What It Is & How to Use It [2026]",
    description: "Learn what a Google Maps lead generator is, how it works, and how to use one to find qualified B2B leads for your business.",
    date: "January 8, 2026",
    category: "Beginner Guide",
    readTime: "8 min read"
  },
  {
    slug: "mapsreach-vs-outscraper",
    title: "MapsReach vs Outscraper: Best Google Maps Scraper Chrome Extension 2026",
    description: "Looking for the best extension to scrape leads from Google Maps? A transparent comparison of the top Google Maps business data extractor extensions.",
    date: "January 6, 2026",
    category: "Comparison",
    readTime: "5 min read"
  },
  {
    slug: "mapsreach-vs-phantombuster",
    title: "MapsReach vs Phantombuster: Best Google Maps Lead Scraper 2026-2027",
    description: "Searching for the best Google Maps business email extractor chrome extension? An honest breakdown comparing the top tools to scrape Google Maps leads.",
    date: "January 4, 2026",
    category: "Comparison",
    readTime: "6 min read"
  },
  {
    slug: "mapsreach-vs-texau",
    title: "MapsReach vs TexAu: Best Chrome Extension to Scrape Google Maps Leads 2026",
    description: "TexAu is a powerful automation platform. Looking for the best Google Maps scraper chrome extension? Here's how MapsReach compares.",
    date: "January 2, 2026",
    category: "Comparison",
    readTime: "5 min read"
  },
  {
    slug: "google-maps-lead-generation-guide",
    title: "Complete Guide: How to Extract Leads from Google Maps in 2026-2027",
    description: "Learn how to use the best Google Maps scraper chrome extension for B2B lead generation. Step-by-step guide to scrape Google Maps leads.",
    date: "January 1, 2026",
    category: "Guide",
    readTime: "8 min read"
  }
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="py-0 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="MapsReach" className="h-28 w-auto" />
            {/* Slogan right next to logo */}
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
          <Link
            href="/coming-soon"
            className="px-6 py-3 bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] text-white font-semibold rounded-full text-base hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200"
          >
            Try for Free
          </Link>
        </div>
      </header>

      {/* Blog Hero */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Best Google Maps Scraper Chrome Extension Guide 2026</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Looking for the best extension to scrape leads from Google Maps? Honest comparisons of Google Maps business data extractor extensions and guides to help you choose the right tool.
          </p>
        </div>
      </section>

      {/* Transparency Notice */}
      <section className="px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-primary mb-2">📝 Our Comparison Philosophy</h2>
            <p className="text-muted-foreground">
              We believe in honest comparisons. In our articles, we acknowledge the strengths of other tools 
              when they excel, and we're transparent about where MapsReach may not be the best fit. 
              Our goal is to help you make an informed decision, not to manipulate you into buying.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid gap-6">
            {blogPosts.map((post) => (
              <Link 
                key={post.slug} 
                href={`/blog/${post.slug}`}
                className="group block bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        post.category === 'Comparison' 
                          ? 'bg-secondary/20 text-secondary' 
                          : 'bg-primary/20 text-primary'
                      }`}>
                        {post.category}
                      </span>
                      <span className="text-sm text-muted-foreground">{post.date}</span>
                      <span className="text-sm text-muted-foreground">• {post.readTime}</span>
                    </div>
                    <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-muted-foreground">
                      {post.description}
                    </p>
                  </div>
                  <div className="text-muted-foreground group-hover:text-primary transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to try MapsReach?</h2>
          <p className="text-muted-foreground mb-6">
            If after reading our comparisons you think MapsReach is right for you, give it a try.
          </p>
          <Link 
            href="/purchase" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            Get Started
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground text-sm">
          <p>© 2026 MapsReach. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
