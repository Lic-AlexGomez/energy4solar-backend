import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { recordEvent } from "@/modules/admin/event.service"

const eventSchema = z.object({
  type: z.string().min(1).max(60),
  sessionId: z.string().max(64).nullable().optional(),
  path: z.string().max(500).nullable().optional(),
  productId: z.string().max(64).nullable().optional(),
  query: z.string().max(200).nullable().optional(),
  resultCount: z.number().int().min(0).nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
})

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = eventSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  try {
    const ok = await recordEvent(parsed.data)
    return NextResponse.json({ ok })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}
