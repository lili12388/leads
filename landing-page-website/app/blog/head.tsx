import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Blog & Comparisons - MapsReach",
  description: "Honest, transparent comparisons of Google Maps scraper tools. Read our fair reviews of MapsReach vs Outscraper, Phantombuster, and TexAu.",
}

export default function Head() {
  return (
    <>
      <link rel="canonical" href="https://www.mapsreach.com/blog" />
    </>
  )
}
