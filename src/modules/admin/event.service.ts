import { prisma } from "@/lib/prisma"

export type EventInput = {
  type: string
  sessionId?: string | null
  path?: string | null
  productId?: string | null
  query?: string | null
  resultCount?: number | null
  metadata?: Record<string, unknown> | null
}

const ALLOWED_TYPES = new Set([
  "finder_complete",
  "compare_view",
  "search",
  "guide_product_click",
])

export async function recordEvent(input: EventInput): Promise<boolean> {
  const type = input.type?.trim()
  if (!type || !ALLOWED_TYPES.has(type)) return false
  await prisma.event.create({
    data: {
      type,
      sessionId: input.sessionId?.slice(0, 64) ?? null,
      path: input.path?.slice(0, 500) ?? null,
      productId: input.productId?.slice(0, 64) ?? null,
      query: input.query?.slice(0, 200) ?? null,
      resultCount: input.resultCount ?? null,
      metadata: (input.metadata as object) ?? undefined,
    },
  })
  return true
}

export type EventStats = {
  configured: boolean
  countsByType: { type: string; count: number }[]
  zeroResultSearches: { query: string; count: number }[]
  topSearches: { query: string; count: number }[]
}

const emptyEventStats: EventStats = {
  configured: true,
  countsByType: [],
  zeroResultSearches: [],
  topSearches: [],
}

export async function getEventStats(): Promise<EventStats> {
  try {
    const [countsByType, zeroResult, topSearches] = await Promise.all([
      prisma.$queryRaw<{ type: string; count: bigint }[]>`
        SELECT type, COUNT(*)::bigint AS count
        FROM energy4solar."Event"
        WHERE "createdAt" > NOW() - INTERVAL '30 days'
        GROUP BY type
        ORDER BY count DESC
      `,
      prisma.$queryRaw<{ query: string; count: bigint }[]>`
        SELECT query, COUNT(*)::bigint AS count
        FROM energy4solar."Event"
        WHERE type = 'search' AND "resultCount" = 0 AND query IS NOT NULL
          AND "createdAt" > NOW() - INTERVAL '30 days'
        GROUP BY query
        ORDER BY count DESC
        LIMIT 20
      `,
      prisma.$queryRaw<{ query: string; count: bigint }[]>`
        SELECT query, COUNT(*)::bigint AS count
        FROM energy4solar."Event"
        WHERE type = 'search' AND query IS NOT NULL
          AND "createdAt" > NOW() - INTERVAL '30 days'
        GROUP BY query
        ORDER BY count DESC
        LIMIT 20
      `,
    ])

    return {
      configured: true,
      countsByType: countsByType.map((r) => ({ type: r.type, count: Number(r.count) })),
      zeroResultSearches: zeroResult.map((r) => ({ query: r.query, count: Number(r.count) })),
      topSearches: topSearches.map((r) => ({ query: r.query, count: Number(r.count) })),
    }
  } catch {
    return { ...emptyEventStats, configured: false }
  }
}
