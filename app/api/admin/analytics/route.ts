import { jsonError, jsonOk, requireAdminKey } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    requireAdminKey(request)
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const [totalClicks, topProducts, byDay] = await Promise.all([
      prisma.affiliateClick.count({ where: { createdAt: { gte: since } } }),
      prisma.affiliateLink.findMany({
        orderBy: { clickCount: "desc" },
        take: 20,
        include: { product: { select: { slug: true, name: true } } },
      }),
      prisma.$queryRaw<{ day: Date; clicks: bigint }[]>`
        SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS clicks
        FROM "AffiliateClick"
        WHERE "createdAt" > NOW() - INTERVAL '30 days'
        GROUP BY 1 ORDER BY 1 DESC
      `,
    ])
    return jsonOk({ totalClicks, topProducts, byDay })
  } catch (error) {
    return jsonError(error)
  }
}
