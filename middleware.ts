import { NextRequest, NextResponse } from "next/server"



const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS ?? "https://www.energy4solar.com,http://localhost:3000")

  .split(",")

  .map((o) => o.trim())

  .filter(Boolean)



const ADMIN_ALLOWED_HOSTS = (

  process.env.ADMIN_ALLOWED_HOSTS ??

  "www.energy4solar.com,energy4solar.com,localhost:3000,localhost:3001,127.0.0.1:3000,127.0.0.1:3001"

)

  .split(",")

  .map((h) => h.trim().toLowerCase())

  .filter(Boolean)



function requestHost(request: NextRequest): string {

  const forwarded = request.headers.get("x-forwarded-host")

  if (forwarded) return forwarded.split(",")[0]!.trim().toLowerCase()

  return (request.headers.get("host") ?? "").toLowerCase()

}



function isAdminPath(pathname: string) {

  return pathname === "/admin" || pathname.startsWith("/admin/")

}



function isAdminHostAllowed(host: string) {

  if (!host) return false

  return ADMIN_ALLOWED_HOSTS.some((allowed) => host === allowed || host.startsWith(`${allowed}:`))

}



export function middleware(request: NextRequest) {

  const { pathname } = request.nextUrl



  if (isAdminPath(pathname)) {

    const host = requestHost(request)

    if (process.env.NODE_ENV === "production" && !isAdminHostAllowed(host)) {

      return new NextResponse("Not Found", { status: 404 })

    }



    const response = NextResponse.next()

    response.headers.set("X-Robots-Tag", "noindex, nofollow")

    return response

  }



  if (!pathname.startsWith("/api/")) {

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

  matcher: ["/api/:path*", "/admin", "/admin/:path*"],

}


