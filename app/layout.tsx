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
  title: "MapsReach - Best Google Maps Scraper Chrome Extension 2026 | Lead Generation Tool",
  description:
    "Best Google Maps scraper chrome extension for 2026. Extract B2B leads, business emails, phone numbers from Google Maps. Export to CSV or Sheets. One-time payment, unlimited extractions.",
  keywords: [
    "Google Maps scraper",
    "Google Maps scraper chrome extension",
    "Google Maps lead extractor",
    "lead generation tool 2026",
    "B2B lead generation",
    "extract leads from Google Maps",
    "business leads extractor",
    "Google Maps business data extractor extension",
    "Google Maps business email extractor chrome extension",
    "scrape Google Maps leads chrome extension",
    "Google Maps data extraction",
    "local business leads",
    "Google Maps email scraper 2026",
    "best Google Maps scraper 2027"
  ],
  openGraph: {
    title: "MapsReach - Best Google Maps Scraper Chrome Extension 2026",
    description: "Best Google Maps scraper chrome extension for lead generation. Extract B2B leads, business emails, phone numbers. Export to CSV or Sheets. One-time payment.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MapsReach - Best Google Maps Scraper Chrome Extension 2026",
    description: "Best Google Maps scraper chrome extension for lead generation. Extract B2B leads, business emails, phone numbers. Export to CSV or Sheets.",
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
    "alternateName": ["MapsReach Lead Extractor", "MapsReach Chrome Extension", "MapsReach Google Maps Scraper"],
    "url": "https://www.mapsreach.com",
    "logo": "https://www.mapsreach.com/logo.png",
    "image": "https://www.mapsreach.com/logo.png",
    "description": "MapsReach is a Google Maps scraper chrome extension for lead generation. Extract B2B leads from Google Maps in one click. One-time payment, unlimited extractions.",
    "foundingDate": "2024",
    "sameAs": [],
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "laithou123@gmail.com",
      "contactType": "customer support",
      "availableLanguage": "English"
    },
    "brand": {
      "@type": "Brand",
      "name": "MapsReach"
    }
  };

  // WebSite schema for sitelinks search box
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "MapsReach",
    "alternateName": "MapsReach Google Maps Scraper",
    "url": "https://www.mapsreach.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.mapsreach.com/blog?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "MapsReach - Best Google Maps Scraper Chrome Extension 2026",
    "operatingSystem": "Chrome, Edge, Brave",
    "applicationCategory": "BusinessApplication",
    "applicationSubCategory": "Lead Generation Tool",
    "description": "Best Google Maps scraper chrome extension for lead generation 2026. Extract B2B leads from Google Maps - business emails, phone numbers, addresses, reviews. Export to CSV or Google Sheets. One-time payment, unlimited extractions.",
    "offers": {
      "@type": "Offer",
      "price": "59",
      "priceCurrency": "USD",
      "description": "One-time payment for lifetime access. No monthly subscriptions.",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "2847",
      "bestRating": "5",
      "worstRating": "1"
    },
    "featureList": "Google Maps business data extractor, Email extraction, Phone number extraction, CSV export, Google Sheets export, Unlimited leads extraction",
    "screenshot": "https://www.mapsreach.com/screenshot.png",
    "softwareVersion": "2.0",
    "datePublished": "2024-01-01",
    "keywords": "Google Maps scraper chrome extension, Google Maps lead extractor, Google Maps business data extractor extension, Google Maps business email extractor chrome extension, scrape Google Maps leads chrome extension, best Google Maps scraper 2026 2027"
  };

  // FAQ Schema for rich snippets - targeting search queries
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is the best extension to scrape leads from Google Maps in 2026?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "MapsReach is the best Google Maps scraper chrome extension for 2026. It extracts B2B leads including business emails, phone numbers, addresses, reviews, and social media links. One-click extraction with export to CSV or Google Sheets."
        }
      },
      {
        "@type": "Question",
        "name": "What is the best Google Maps lead scraper chrome extension?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "MapsReach is the best Google Maps lead scraper chrome extension. It offers unlimited lead extraction, business email extraction, phone number scraping, and exports to CSV or Google Sheets. One-time $59 payment with lifetime access."
        }
      },
      {
        "@type": "Question",
        "name": "How do I extract leads from Google Maps?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "To extract leads from Google Maps: 1) Install MapsReach chrome extension, 2) Go to Google Maps and search your target niche like 'restaurants in NYC', 3) Click the MapsReach extension icon, 4) Hit Extract to scrape all business data, 5) Export to CSV or Google Sheets."
        }
      },
      {
        "@type": "Question",
        "name": "What is the best Google Maps business data extractor extension?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "MapsReach is the best Google Maps business data extractor extension for 2026-2027. It extracts business names, phone numbers, emails, websites, addresses, reviews, ratings, opening hours, and social media links from any Google Maps search."
        }
      },
      {
        "@type": "Question",
        "name": "How much does MapsReach cost?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "MapsReach offers a one-time payment of $59 for lifetime access with unlimited extractions. No monthly subscriptions or hidden fees. This makes it more affordable than competitors like Outscraper, Phantombuster, or TexAu which charge monthly."
        }
      },
      {
        "@type": "Question",
        "name": "What data can I extract with MapsReach Google Maps scraper?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "MapsReach Google Maps scraper extracts: business names, phone numbers, email addresses, websites, physical addresses, Google reviews count, average ratings, opening hours, and social media links (Facebook, Instagram, LinkedIn, Twitter) from Google Maps listings."
        }
      },
      {
        "@type": "Question",
        "name": "Is there a Google Maps business email extractor chrome extension?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, MapsReach is a Google Maps business email extractor chrome extension. It automatically extracts email addresses from Google Maps business listings along with phone numbers, websites, and other contact information."
        }
      },
      {
        "@type": "Question",
        "name": "Can I scrape Google Maps leads with a chrome extension?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, you can scrape Google Maps leads with MapsReach chrome extension. It works directly in your browser - just search on Google Maps, click Extract, and export all business leads to CSV or Google Sheets instantly."
        }
      }
    ]
  };

  // WebPage schema
  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "MapsReach - Best Google Maps Scraper Chrome Extension 2026",
    "description": "Best extension to scrape leads from Google Maps. Google Maps business data extractor extension for lead generation 2026-2027.",
    "about": {
      "@type": "Thing",
      "name": "Google Maps Lead Generation",
      "description": "Chrome extension tool for extracting business leads from Google Maps including phones, emails, and addresses."
    },
    "keywords": "best extension to scrape leads from Google Maps, Google Maps lead scraper, Google Maps business data extractor extension, Google Maps business email extractor chrome extension, scrape Google Maps leads chrome extension 2026 2027"
  };

  // HowTo schema for rich snippets
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Extract Leads from Google Maps with MapsReach Chrome Extension",
    "description": "Step-by-step guide to scrape Google Maps leads using MapsReach - the best Google Maps business data extractor extension for 2026.",
    "totalTime": "PT2M",
    "estimatedCost": {
      "@type": "MonetaryAmount",
      "currency": "USD",
      "value": "59"
    },
    "tool": {
      "@type": "HowToTool",
      "name": "MapsReach Chrome Extension"
    },
    "step": [
      {
        "@type": "HowToStep",
        "name": "Install MapsReach Extension",
        "text": "Install MapsReach Google Maps scraper chrome extension from the Chrome Web Store.",
        "position": 1
      },
      {
        "@type": "HowToStep",
        "name": "Open Google Maps",
        "text": "Go to maps.google.com in your Chrome browser.",
        "position": 2
      },
      {
        "@type": "HowToStep",
        "name": "Search Your Target Niche",
        "text": "Search for businesses like 'restaurants in NYC' or 'plumbers in Los Angeles' on Google Maps.",
        "position": 3
      },
      {
        "@type": "HowToStep",
        "name": "Click MapsReach Extension",
        "text": "Click the MapsReach icon in your browser toolbar to open the Google Maps lead extractor.",
        "position": 4
      },
      {
        "@type": "HowToStep",
        "name": "Extract Business Data",
        "text": "Click Extract to scrape Google Maps leads - business names, emails, phone numbers, addresses, reviews.",
        "position": 5
      },
      {
        "@type": "HowToStep",
        "name": "Export to CSV or Sheets",
        "text": "Export your extracted Google Maps business data to CSV file or directly to Google Sheets.",
        "position": 6
      }
    ]
  };

  return (
    <html lang="en" className="dark">
      <head>
        {/* Meta Pixel Code */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1217242767164309');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=1217242767164309&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {/* End Meta Pixel Code */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
        />
      </head>
      <body className={`font-sans antialiased bg-background text-foreground`}>
        {children}
        
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
