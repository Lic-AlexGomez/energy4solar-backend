import { NextRequest, NextResponse } from "next/server"
import { ingestVercelAnalyticsDrain } from "@/modules/admin/site-analytics.service"

export async function POST(request: NextRequest) {
  const secret = process.env.VERCEL_ANALYTICS_DRAIN_SECRET
  if (!secret) {
    return NextResponse.json({ error: "Drain not configured" }, { status: 503 })
  }

  const auth = request.headers.get("authorization")
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const events = Array.isArray(body) ? body : [body]
  try {
    const ingested = await ingestVercelAnalyticsDrain(events)
    return NextResponse.json({ ingested })
  } catch {
    return NextResponse.json({ error: "Ingest failed" }, { status: 500 })
  }
}
