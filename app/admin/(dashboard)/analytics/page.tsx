import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { SiteTrafficPanel } from "../../components/site-traffic-panel"
import { getSiteTrafficStats } from "@/modules/admin/site-analytics.service"

export default async function AdminAnalyticsPage() {
  const [topProducts, recentClicks, daily, traffic] = await Promise.all([
    prisma.affiliateLink.findMany({
      orderBy: { clickCount: "desc" },
      take: 15,
      include: { product: { select: { name: true, slug: true } } },
    }),
    prisma.affiliateClick.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { product: { select: { name: true, slug: true } } },
    }),
    prisma.$queryRaw<{ day: Date; clicks: bigint }[]>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS clicks
      FROM energy4solar."AffiliateClick"
      WHERE "createdAt" > NOW() - INTERVAL '30 days'
      GROUP BY 1
      ORDER BY 1 DESC
    `,
    getSiteTrafficStats(),
  ])

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Analytics</h1>
          <p className="admin-subtitle">Site visits and affiliate click tracking.</p>
        </div>
        <Link href="/admin/commissions" className="admin-btn admin-btn-secondary">
          My commissions →
        </Link>
      </div>

      <SiteTrafficPanel stats={traffic} />

      <section className="admin-panel admin-section">
        <h2>Top products by affiliate clicks</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Clicks</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link href={`/admin/products?q=${encodeURIComponent(row.product.name)}`}>
                    {row.product.name}
                  </Link>
                </td>
                <td>{row.clickCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="admin-grid-2">
        <section className="admin-panel">
          <h2>Daily affiliate clicks (30 days)</h2>
          <ul className="admin-activity-list">
            {daily.map((d) => (
              <li key={String(d.day)}>
                <span>{new Date(d.day).toISOString().slice(0, 10)}</span>
                <span className="admin-activity-meta">{String(d.clicks)} clicks</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="admin-panel">
          <h2>Recent affiliate clicks</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Product</th>
                <th>UTM</th>
                <th>Referrer</th>
              </tr>
            </thead>
            <tbody>
              {recentClicks.map((c) => (
                <tr key={c.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{c.createdAt.toLocaleString()}</td>
                  <td>{c.product.name}</td>
                  <td>{c.utmSource ?? "—"}</td>
                  <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.referrer ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}
