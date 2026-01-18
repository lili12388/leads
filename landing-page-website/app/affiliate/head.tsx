import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "MapsReach Affiliate Program - Earn 30% Commission",
  description: "Join the MapsReach affiliate program and earn 30% commission on every sale. Promote the best Google Maps scraper chrome extension.",
}

export default function Head() {
  return (
    <>
      <link rel="canonical" href="https://www.mapsreach.com/affiliate" />
      <meta property="og:url" content="https://www.mapsreach.com/affiliate" />
    </>
  )
}
