import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import TawkTo from "@/components/TawkTo"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "LeadSnap - Extract Unlimited Leads from Google Maps in Seconds",
  description:
    "Stop hunting leads, start extracting them. Get business names, emails, phones, reviews from Google Maps with one click. $59 lifetime license. Used by 2,000+ freelancers.",
  keywords: ["lead generation", "Google Maps scraper", "business leads", "email extractor", "chrome extension", "freelancer tools"],
  generator: "v0.app",
  openGraph: {
    title: "LeadSnap - Extract Unlimited Leads from Google Maps",
    description: "Get business names, emails, phones from Google Maps in seconds. $59 lifetime license.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LeadSnap - Google Maps Lead Extractor",
    description: "Extract unlimited business leads from Google Maps. One-time $59 payment.",
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
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
  return (
    <html lang="en" className="dark">
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
