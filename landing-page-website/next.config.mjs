/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "mapsreach.com" }],
        destination: "https://www.mapsreach.com/:path*",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
