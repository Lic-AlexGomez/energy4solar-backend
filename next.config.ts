import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.zoho.com" },
      { protocol: "https", hostname: "**.zohoapis.com" },
      { protocol: "https", hostname: "bigbattery.com" },
      { protocol: "https", hostname: "**.bigbattery.com" },
    ],
  },
}

export default nextConfig
