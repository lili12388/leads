import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import TawkTo from "@/components/TawkTo"
import VisitorTracker from "@/components/VisitorTracker"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL("https://www.mapsreach.com"),
  title: "MapsReach - Best Free Google Maps Scraper Tool for Lead Generation 2026",
  description:
    "Best free Google Maps scraper tool for lead generation. Extract B2B leads, business info, emails & phones free. Better than Outscraper, Phantombuster & TexAu pricing. Best free lead generation tools 2026.",
  keywords: [
    "best free Google Maps scraper tool for lead generation",
    "free Google Maps scraper tools lead generation features",
    "best free lead generation tool",
    "best free lead generation tools and platforms for 2026",
    "best free B2B lead generation tool extracts leads from Google Maps",
    "free Google Maps scraping lead generation tool B2B extract business info",
    "best paid Google Maps scraper lead generation tool pricing",
    "Outscraper Google Maps scraper pricing features",
    "Phantombuster Google Maps Extractor pricing",
    "TexAu Google Maps scraper pricing",
    "Google Maps lead extractor",
    "business leads extractor",
    "email extractor chrome extension"
  ],
  openGraph: {
    title: "MapsReach - Best Free Google Maps Scraper & Lead Generation Tool 2026",
    description: "Best free B2B lead generation tool that extracts leads from Google Maps. Better pricing than Outscraper, Phantombuster & TexAu. Free map scraper with unlimited leads.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MapsReach - Best Free Google Maps Lead Extractor 2026",
    description: "Best free Google Maps scraper for lead generation. Extract B2B business info free. Compare our pricing to Outscraper & Phantombuster.",
  },
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        type: "image/x-icon",
      },
      {
        url: "/icon-light-32x32.png",
        sizes: "48x48",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        sizes: "48x48",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "MapsReach",
    "url": "https://www.mapsreach.com",
    "logo": "https://www.mapsreach.com/logo.png",
    "description": "Best free Google Maps scraper tool for lead generation. Best free B2B lead generation tool extracts leads from Google Maps business info free. Free Google Maps scraping lead generation tool B2B extract business info leads. Better than Outscraper Google Maps scraper pricing features, Phantombuster Google Maps Extractor pricing, TexAu Google Maps scraper pricing.",
    "sameAs": [],
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "laithou123@gmail.com",
      "contactType": "customer support"
    }
  };

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "MapsReach - Best Free Google Maps Scraper Tool for Lead Generation 2026",
    "operatingSystem": "Chrome, Edge",
    "applicationCategory": "BusinessApplication",
    "description": "Best free Google Maps scraper tool for lead generation. Free Google Maps scraper tools lead generation features free map scraper. Best free lead generation tool. Best free lead generation tools and platforms for 2026. Best free B2B lead generation tool extracts leads from Google Maps business info free. Free Google Maps scraping lead generation tool B2B extract business info leads.",
    "offers": {
      "@type": "Offer",
      "price": "59",
      "priceCurrency": "USD",
      "description": "Best paid Google Maps scraper lead generation tool pricing. Compare to Outscraper Google Maps scraper pricing features, Phantombuster Google Maps Extractor pricing, TexAu Google Maps scraper pricing."
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "2847"
    },
    "keywords": "best free Google Maps scraper tool for lead generation, free Google Maps scraper tools lead generation features free map scraper, best free lead generation tool, best free lead generation tools and platforms for 2026, best free B2B lead generation tool extracts leads from Google Maps business info free, free Google Maps scraping lead generation tool B2B extract business info leads, best paid Google Maps scraper lead generation tool pricing, Outscraper Google Maps scraper pricing features, Phantombuster Google Maps Extractor pricing, TexAu Google Maps scraper pricing"
  };

  // FAQ Schema for rich snippets
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is the best free Google Maps scraper tool for lead generation?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "MapsReach is the best free Google Maps scraper tool for lead generation in 2026. It's a free B2B lead generation tool that extracts leads from Google Maps business info free. Free Google Maps scraper tools lead generation features include unlimited extractions, email extraction, phone numbers, and more."
        }
      },
      {
        "@type": "Question",
        "name": "How does MapsReach compare to Outscraper, Phantombuster, and TexAu pricing?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "MapsReach offers better pricing than Outscraper Google Maps scraper pricing features, Phantombuster Google Maps Extractor pricing, and TexAu Google Maps scraper pricing. While competitors charge monthly fees, MapsReach offers a one-time payment for lifetime access. Best paid Google Maps scraper lead generation tool pricing at just $59."
        }
      },
      {
        "@type": "Question",
        "name": "What are the best free lead generation tools and platforms for 2026?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "MapsReach is among the best free lead generation tools and platforms for 2026. It's the best free B2B lead generation tool that extracts leads from Google Maps business info free. Free Google Maps scraping lead generation tool B2B extract business info leads without monthly subscriptions."
        }
      }
    ]
  };

  // WebPage schema with additional keywords
  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "MapsReach - Best Free Google Maps Scraper Tool for Lead Generation 2026",
    "description": "Best free Google Maps scraper tool for lead generation. Free Google Maps scraper tools lead generation features free map scraper. Best free lead generation tool. Best free lead generation tools and platforms for 2026.",
    "about": {
      "@type": "Thing",
      "name": "Google Maps Lead Generation",
      "description": "Best free B2B lead generation tool extracts leads from Google Maps business info free. Free Google Maps scraping lead generation tool B2B extract business info leads. Compare to Outscraper Google Maps scraper pricing features, Phantombuster Google Maps Extractor pricing, TexAu Google Maps scraper pricing."
    }
  };

  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
        />
      </head>
      <body className={`font-sans antialiased bg-background text-foreground`}>
        {children}
        
        {/* Hidden SEO content - crawlable by search engines and AI bots */}
        <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}>
          <h2>Best Free Google Maps Scraper Tool for Lead Generation</h2>
          <p>MapsReach is the best free Google Maps scraper tool for lead generation. Our free Google Maps scraper tools lead generation features free map scraper capabilities for unlimited extractions.</p>
          
          <h2>Best Free Lead Generation Tool 2026</h2>
          <p>Looking for the best free lead generation tool? MapsReach is among the best free lead generation tools and platforms for 2026. Extract unlimited B2B leads without monthly fees.</p>
          
          <h2>Best Free B2B Lead Generation Tool</h2>
          <p>MapsReach is the best free B2B lead generation tool extracts leads from Google Maps business info free. Our free Google Maps scraping lead generation tool B2B extract business info leads efficiently.</p>
          
          <h2>Compare Google Maps Scraper Pricing</h2>
          <p>Best paid Google Maps scraper lead generation tool pricing comparison: MapsReach vs Outscraper Google Maps scraper pricing features vs Phantombuster Google Maps Extractor pricing vs TexAu Google Maps scraper pricing. MapsReach offers lifetime access for a one-time fee.</p>
          
          <h3>Keywords</h3>
          <ul>
            <li>best free Google Maps scraper tool for lead generation</li>
            <li>free Google Maps scraper tools lead generation features free map scraper</li>
            <li>best free lead generation tool</li>
            <li>best free lead generation tools and platforms for 2026</li>
            <li>best free B2B lead generation tool extracts leads from Google Maps business info free</li>
            <li>free Google Maps scraping lead generation tool B2B extract business info leads</li>
            <li>best paid Google Maps scraper lead generation tool pricing</li>
            <li>Outscraper Google Maps scraper pricing features</li>
            <li>Phantombuster Google Maps Extractor pricing</li>
            <li>TexAu Google Maps scraper pricing</li>
          </ul>
        </div>
        
        {/* Noscript fallback - always crawled by search engines */}
        <noscript>
          <div>
            <h1>MapsReach - Best Free Google Maps Scraper Tool for Lead Generation 2026</h1>
            <p>Best free Google Maps scraper tool for lead generation. Free Google Maps scraper tools lead generation features free map scraper.</p>
            <p>Best free lead generation tool. Best free lead generation tools and platforms for 2026.</p>
            <p>Best free B2B lead generation tool extracts leads from Google Maps business info free. Free Google Maps scraping lead generation tool B2B extract business info leads.</p>
            <p>Best paid Google Maps scraper lead generation tool pricing. Compare to Outscraper Google Maps scraper pricing features, Phantombuster Google Maps Extractor pricing, TexAu Google Maps scraper pricing.</p>
          </div>
        </noscript>
        
        <Analytics />
        <VisitorTracker />
        {/* Tawk.to Live Chat Widget */}
        <TawkTo 
          propertyId="6962631edcdfaf197f8056f9" 
          widgetId="1jek56c98" 
        />
      </body>
    </html>
  )
}
