import { randomUUID } from "node:crypto"
import { prisma } from "@/lib/prisma"

export type SiteTrafficStats = {
  configured: boolean
  pageviews7d: number
  pageviews30d: number
  visitors7d: number
  visitors30d: number
  daily: { day: string; pageviews: number; visitors: number }[]
  topPages: { path: string; views: number }[]
}

const emptyStats: SiteTrafficStats = {
  configured: true,
  pageviews7d: 0,
  pageviews30d: 0,
  visitors7d: 0,
  visitors30d: 0,
  daily: [],
  topPages: [],
}

export async function getSiteTrafficStats(): Promise<SiteTrafficStats> {
  try {
    const [counts, daily, topPages] = await Promise.all([
      prisma.$queryRaw<
        { pageviews_7d: bigint; pageviews_30d: bigint; visitors_7d: bigint; visitors_30d: bigint }[]
      >`
        SELECT
          COUNT(*) FILTER (WHERE "createdAt" > NOW() - INTERVAL '7 days')::bigint AS pageviews_7d,
          COUNT(*) FILTER (WHERE "createdAt" > NOW() - INTERVAL '30 days')::bigint AS pageviews_30d,
          COUNT(DISTINCT "sessionId") FILTER (WHERE "createdAt" > NOW() - INTERVAL '7 days')::bigint AS visitors_7d,
          COUNT(DISTINCT "sessionId") FILTER (WHERE "createdAt" > NOW() - INTERVAL '30 days')::bigint AS visitors_30d
        FROM energy4solar."SitePageview"
      `,
      prisma.$queryRaw<{ day: Date; pageviews: bigint; visitors: bigint }[]>`
        SELECT
          date_trunc('day', "createdAt") AS day,
          COUNT(*)::bigint AS pageviews,
          COUNT(DISTINCT "sessionId")::bigint AS visitors
        FROM energy4solar."SitePageview"
        WHERE "createdAt" > NOW() - INTERVAL '30 days'
        GROUP BY 1
        ORDER BY 1 DESC
      `,
      prisma.$queryRaw<{ path: string; views: bigint }[]>`
        SELECT path, COUNT(*)::bigint AS views
        FROM energy4solar."SitePageview"
        WHERE "createdAt" > NOW() - INTERVAL '30 days'
        GROUP BY path
        ORDER BY views DESC
        LIMIT 15
      `,
    ])

    const row = counts[0]
    return {
      configured: true,
      pageviews7d: Number(row?.pageviews_7d ?? 0),
      pageviews30d: Number(row?.pageviews_30d ?? 0),
      visitors7d: Number(row?.visitors_7d ?? 0),
      visitors30d: Number(row?.visitors_30d ?? 0),
      daily: daily.map((d) => ({
        day: new Date(d.day).toISOString().slice(0, 10),
        pageviews: Number(d.pageviews),
        visitors: Number(d.visitors),
      })),
      topPages: topPages.map((p) => ({ path: p.path, views: Number(p.views) })),
    }
  } catch {
    return { ...emptyStats, configured: false }
  }
}

function deviceFromUserAgent(ua: string | null): string | null {
  if (!ua) return null
  const lower = ua.toLowerCase()
  if (/bot|crawl|spider|slurp|preview|headless/i.test(lower)) return null
  if (/ipad|tablet/i.test(lower)) return "tablet"
  if (/mobile|iphone|android/i.test(lower)) return "mobile"
  return "desktop"
}

function isBotUserAgent(ua: string | null): boolean {
  if (!ua) return false
  return /bot|crawl|spider|slurp|preview|headless|uptime/i.test(ua)
}

export async function recordSitePageview(input: {
  path: string
  referrer?: string | null
  sessionId: string
  userAgent?: string | null
  country?: string | null
  utmSource?: string | null
  source?: string
}) {
  const path = input.path.trim()
  if (!path.startsWith("/") || path.startsWith("/admin")) return false
  if (!input.sessionId.trim()) return false
  if (isBotUserAgent(input.userAgent ?? null)) return false

  await prisma.sitePageview.create({
    data: {
      path: path.slice(0, 500),
      referrer: input.referrer?.slice(0, 500) ?? null,
      sessionId: input.sessionId.slice(0, 64),
      utmSource: input.utmSource?.slice(0, 120) ?? null,
      deviceType: deviceFromUserAgent(input.userAgent ?? null),
      country: input.country?.slice(0, 2).toUpperCase() ?? null,
      source: input.source ?? "site",
    },
  })
  return true
}

type VercelDrainEvent = {
  eventType?: string
  path?: string
  referrer?: string
  sessionId?: number
  timestamp?: number
}

export async function ingestVercelAnalyticsDrain(events: VercelDrainEvent[]) {
  let ingested = 0
  for (const event of events) {
    if (event.eventType !== "pageview" || !event.path) continue
    const sessionId = event.sessionId != null ? `vercel:${event.sessionId}` : `vercel:${randomUUID()}`
    const createdAt = event.timestamp ? new Date(event.timestamp) : new Date()
    await prisma.sitePageview.create({
      data: {
        path: event.path.slice(0, 500),
        referrer: event.referrer?.slice(0, 500) ?? null,
        sessionId: sessionId.slice(0, 64),
        source: "vercel_drain",
        createdAt,
      },
    })
    ingested += 1
  }
  return ingested
}
