import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import TawkTo from "@/components/TawkTo"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MapsReach - Extract Unlimited Leads from Google Maps in Seconds",
  description:
    "Stop hunting leads, start extracting them. Get business names, emails, phones, reviews from Google Maps with one click. Used by 2,000+ freelancers.",
  keywords: ["lead generation", "Google Maps scraper", "business leads", "email extractor", "chrome extension", "freelancer tools"],
  openGraph: {
    title: "MapsReach - Extract Unlimited Leads from Google Maps",
    description: "Get business names, emails, phones from Google Maps in seconds. The fastest way to build your lead list.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MapsReach - Google Maps Lead Extractor",
    description: "Extract unlimited business leads from Google Maps. Names, emails, phones, reviews – everything you need.",
  },
  icons: {
    icon: [
      {
        url: "/favicon.png",
        type: "image/png",
      },
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
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
    "description": "Extract unlimited business leads from Google Maps in seconds. Names, emails, phones, reviews – everything you need.",
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
    "name": "MapsReach - Google Maps Lead Extractor",
    "operatingSystem": "Chrome, Edge",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "59",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "2847"
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
      </head>
      <body className={`font-sans antialiased bg-background text-foreground`}>
        {children}
        <Analytics />
        {/* Tawk.to Live Chat Widget */}
        <TawkTo 
          propertyId="6962631edcdfaf197f8056f9" 
          widgetId="1jek56c98" 
        />
      </body>
    </html>
  )
}
