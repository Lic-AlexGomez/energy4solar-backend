import { prisma } from "@/lib/prisma"
import { getEnv } from "@/config/env"
import { commissionService } from "./commission.service"

function commissionRate(): number {
  const pct = Number(process.env.AFFILIATE_COMMISSION_PCT ?? "5")
  return Number.isFinite(pct) && pct > 0 ? pct / 100 : 0.05
}

export const earningsService = {
  async getDashboard() {
    const rate = commissionRate()
    const now = new Date()
    const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [clicks7d, clicks30d, clicksAll, recentClicks, topByClicks] = await Promise.all([
      prisma.affiliateClick.count({ where: { createdAt: { gte: d7 } } }),
      prisma.affiliateClick.count({ where: { createdAt: { gte: d30 } } }),
      prisma.affiliateClick.count(),
      prisma.affiliateClick.findMany({
        where: { createdAt: { gte: d30 } },
        select: {
          productId: true,
          product: { select: { name: true, slug: true, price: true } },
        },
      }),
      prisma.affiliateLink.findMany({
        orderBy: { clickCount: "desc" },
        take: 15,
        include: { product: { select: { name: true, slug: true, price: true } } },
      }),
    ])

    const productStats = new Map<
      string,
      { name: string; slug: string; price: number; clicks: number }
    >()

    for (const click of recentClicks) {
      const existing = productStats.get(click.productId)
      const price = Number(click.product.price)
      if (existing) {
        existing.clicks += 1
      } else {
        productStats.set(click.productId, {
          name: click.product.name,
          slug: click.product.slug,
          price,
          clicks: 1,
        })
      }
    }

    const topEarners30d = [...productStats.values()]
      .map((p) => ({
        ...p,
        estCommission: p.clicks * p.price * rate,
      }))
      .sort((a, b) => b.estCommission - a.estCommission)
      .slice(0, 12)

    const estCommission30d = topEarners30d.reduce((sum, p) => sum + p.estCommission, 0)
    const estCommission7d = estCommission30d * (clicks7d / Math.max(clicks30d, 1))

    const daily = await prisma.$queryRaw<{ day: Date; clicks: bigint }[]>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS clicks
      FROM energy4solar."AffiliateClick"
      WHERE "createdAt" > NOW() - INTERVAL '14 days'
      GROUP BY 1
      ORDER BY 1 ASC
    `

    const topAllTime = topByClicks.map((row) => ({
      name: row.product.name,
      slug: row.product.slug,
      clicks: row.clickCount,
      price: Number(row.product.price),
      estCommission: row.clickCount * Number(row.product.price) * rate,
    }))

    const commissions = await commissionService.getDashboard()

    return {
      commissionPct: rate * 100,
      siteUrl: getEnv().SITE_URL,
      clicks7d,
      clicks30d,
      clicksAll,
      estCommission7d,
      estCommission30d,
      topEarners30d,
      topAllTime,
      daily: daily.map((d) => ({
        day: new Date(d.day).toISOString().slice(0, 10),
        clicks: Number(d.clicks),
      })),
      actual: {
        total: commissions.totalAmount,
        paid: commissions.paidAmount,
        pending: commissions.pendingAmount,
        last30: commissions.last30Amount,
        records: commissions.totalRecords,
      },
    }
  },
}
