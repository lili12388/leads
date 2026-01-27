import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Choose Payment Method | MapsReach",
  description: "Select a payment method to complete your MapsReach purchase. Secure checkout with instant license delivery.",
}

export default function Head() {
  return (
    <>
      <link rel="canonical" href="https://www.mapsreach.com/purchase/payment-method" />
      <meta property="og:url" content="https://www.mapsreach.com/purchase/payment-method" />
    </>
  )
}
