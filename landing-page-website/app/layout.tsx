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
  title: "MapsReach - Best Google Maps Scraper for Lead Generation",
  description:
    "Extract B2B leads from Google Maps in one click. Export to CSV or Sheets, collect phones, emails, reviews, and addresses. One-time payment, unlimited extractions.",
  keywords: [
    "Google Maps scraper",
    "Google Maps lead extractor",
    "lead generation tool",
    "B2B lead generation",
    "extract leads from Google Maps",
    "business leads extractor",
    "email extractor chrome extension",
    "Google Maps data extraction",
    "local business leads"
  ],
  openGraph: {
    title: "MapsReach - Best Google Maps Scraper for Lead Generation",
    description: "Extract B2B leads from Google Maps in one click. Export to CSV or Sheets, collect phones, emails, reviews, and addresses. One-time payment, unlimited extractions.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MapsReach - Best Google Maps Scraper for Lead Generation",
    description: "Extract B2B leads from Google Maps in one click. Export to CSV or Sheets, collect phones, emails, reviews, and addresses. One-time payment, unlimited extractions.",
  },
  icons: {
    icon: [
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
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
    "description": "Google Maps scraper tool for lead generation. Extract B2B leads from Google Maps in one click. One-time payment, unlimited extractions.",
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
    "name": "MapsReach - Google Maps Scraper for Lead Generation",
    "operatingSystem": "Chrome, Edge",
    "applicationCategory": "BusinessApplication",
    "description": "Google Maps scraper tool for lead generation. Extract B2B leads from Google Maps in one click. Export to CSV or Sheets. One-time payment, unlimited extractions.",
    "offers": {
      "@type": "Offer",
      "price": "59",
      "priceCurrency": "USD",
      "description": "One-time payment for lifetime access. No monthly subscriptions."
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "2847"
    },
    "keywords": "Google Maps scraper, lead generation tool, B2B leads, business data extraction, Google Maps extractor"
  };

  // FAQ Schema for rich snippets
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is MapsReach?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "MapsReach is a Google Maps scraper tool for lead generation. It extracts B2B leads from Google Maps with features like email extraction, phone numbers, and CSV export. One-time payment for lifetime access."
        }
      },
      {
        "@type": "Question",
        "name": "How much does MapsReach cost?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "MapsReach offers a one-time payment of $59 for lifetime access with unlimited extractions. No monthly subscriptions or hidden fees."
        }
      },
      {
        "@type": "Question",
        "name": "What data can I extract with MapsReach?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "MapsReach extracts business names, phone numbers, emails, websites, addresses, reviews, ratings, and social media links from Google Maps listings."
        }
      }
    ]
  };

  // WebPage schema
  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "MapsReach - Google Maps Scraper for Lead Generation",
    "description": "Extract B2B leads from Google Maps in one click. One-time payment, unlimited extractions.",
    "about": {
      "@type": "Thing",
      "name": "Google Maps Lead Generation",
      "description": "Tool for extracting business leads from Google Maps including phones, emails, and addresses."
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
