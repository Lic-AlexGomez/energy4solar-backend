import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { ingestVercelAnalyticsDrain, recordSitePageview } from "@/modules/admin/site-analytics.service"

const collectSchema = z.object({
  path: z.string().min(1).max(500),
  referrer: z.string().max(500).nullable().optional(),
  sessionId: z.string().min(8).max(64),
  utmSource: z.string().max(120).nullable().optional(),
})

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = collectSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const country = request.headers.get("x-vercel-ip-country")
  const userAgent = request.headers.get("user-agent")

  try {
    const ok = await recordSitePageview({
      ...parsed.data,
      userAgent,
      country,
    })
    return NextResponse.json({ ok })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}
