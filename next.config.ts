import type { NextConfig } from "next"

/** When admin is proxied via www.energy4solar.com/admin, assets must load from this origin. */
const backendPublicUrl = (
  process.env.BACKEND_PUBLIC_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")
).replace(/\/$/, "")

const nextConfig: NextConfig = {
  assetPrefix:
    process.env.NODE_ENV === "production" && backendPublicUrl ? backendPublicUrl : undefined,
  serverExternalPackages: ["ssh2", "ssh2-sftp-client"],
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
