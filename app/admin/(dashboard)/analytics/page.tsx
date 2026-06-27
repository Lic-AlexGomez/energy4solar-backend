import { prisma } from "@/lib/prisma"

export default async function AdminAnalyticsPage() {
  const [topProducts, recentClicks, daily] = await Promise.all([
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
      FROM "AffiliateClick"
      WHERE "createdAt" > NOW() - INTERVAL '30 days'
      GROUP BY 1
      ORDER BY 1 DESC
    `,
  ])

  return (
    <div>
      <h1>Affiliate analytics</h1>
      <section style={{ marginTop: "2rem" }}>
        <h2>Top products (30d clicks)</h2>
        <table style={{ width: "100%", marginTop: "1rem", fontSize: "0.875rem", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #334155", textAlign: "left" }}>
              <th style={{ padding: "0.5rem 0" }}>Product</th>
              <th>Clicks</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((row) => (
              <tr key={row.id} style={{ borderBottom: "1px solid #1e293b" }}>
                <td style={{ padding: "0.5rem 0" }}>{row.product.name}</td>
                <td>{row.clickCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section style={{ marginTop: "2.5rem" }}>
        <h2>Daily clicks (last 30 days)</h2>
        <ul style={{ marginTop: "1rem", color: "#94a3b8" }}>
          {daily.map((d) => (
            <li key={String(d.day)}>
              {new Date(d.day).toISOString().slice(0, 10)}: {String(d.clicks)} clicks
            </li>
          ))}
        </ul>
      </section>
      <section style={{ marginTop: "2.5rem" }}>
        <h2>Recent clicks</h2>
        <table style={{ width: "100%", marginTop: "1rem", fontSize: "0.8rem", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #334155", textAlign: "left" }}>
              <th>Time</th>
              <th>Product</th>
              <th>UTM source</th>
              <th>Referrer</th>
            </tr>
          </thead>
          <tbody>
            {recentClicks.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid #1e293b" }}>
                <td>{c.createdAt.toISOString()}</td>
                <td>{c.product.name}</td>
                <td>{c.utmSource ?? "—"}</td>
                <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{c.referrer ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
