import { NextRequest, NextResponse } from "next/server"

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS ?? "https://www.energy4solar.com,http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean)

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  const origin = request.headers.get("origin")
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(allowed),
    })
  }

  const response = NextResponse.next()
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    for (const [key, value] of Object.entries(corsHeaders(origin))) {
      response.headers.set(key, value)
    }
  }
  return response
}

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  }
}

export const config = {
  matcher: "/api/:path*",
}
