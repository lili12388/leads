"use client"

import Link from "next/link"

// Blog posts data - easy to add new posts
const blogPosts = [
  {
    slug: "mapsreach-vs-outscraper",
    title: "MapsReach vs Outscraper: Honest Comparison for 2026",
    description: "A transparent comparison of features, pricing, and use cases. We acknowledge where Outscraper excels and where MapsReach offers advantages.",
    date: "January 15, 2026",
    category: "Comparison",
    readTime: "5 min read"
  },
  {
    slug: "mapsreach-vs-phantombuster",
    title: "MapsReach vs Phantombuster: Which is Right for You?",
    description: "Honest breakdown of both tools. Phantombuster offers more automation options, while MapsReach focuses on simplicity and one-time pricing.",
    date: "January 14, 2026",
    category: "Comparison",
    readTime: "6 min read"
  },
  {
    slug: "mapsreach-vs-texau",
    title: "MapsReach vs TexAu: A Fair Comparison",
    description: "TexAu is a powerful automation platform. Here's how MapsReach compares for Google Maps lead extraction specifically.",
    date: "January 13, 2026",
    category: "Comparison",
    readTime: "5 min read"
  },
  {
    slug: "google-maps-lead-generation-guide",
    title: "Complete Guide to Google Maps Lead Generation in 2026",
    description: "Learn how to effectively use Google Maps for B2B lead generation. Tips, strategies, and best practices.",
    date: "January 10, 2026",
    category: "Guide",
    readTime: "8 min read"
  }
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="MapsReach" className="h-12 w-auto" />
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/blog" className="text-primary font-medium">Blog</Link>
          </nav>
        </div>
      </header>

      {/* Blog Hero */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Blog & Comparisons</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Honest, transparent comparisons and guides to help you choose the right tool for your needs. 
            We believe in providing real value, not marketing fluff.
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
