import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "MapsReach - Admin Dashboard",
}

export default function SegmentLayout({ children }: { children: ReactNode }) {
  return children
}
