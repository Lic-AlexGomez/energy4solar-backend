import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { StatCard } from "../components/stat-card"
import { earningsService } from "@/modules/admin/earnings.service"

function money(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
}

export default async function AdminOverviewPage() {
  const [productCount, visibleCount, withImages, clickCount, categoryCount, guideCount, blogCount, lastSync, earnings] =
    await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isVisible: true } }),
      prisma.product.count({ where: { images: { some: {} } } }),
      prisma.affiliateClick.count(),
      prisma.category.count(),
      prisma.guide.count({ where: { published: true } }),
      prisma.blogPost.count({ where: { published: true } }),
      prisma.syncLog.findFirst({ orderBy: { startedAt: "desc" } }),
      earningsService.getDashboard(),
    ])

  const hidden = productCount - visibleCount
  const imagePct = productCount ? Math.round((withImages / productCount) * 100) : 0

  const recentClicks = await prisma.affiliateClick.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { product: { select: { name: true } } },
  })

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-subtitle">Catalog health, affiliate performance, and quick actions.</p>
        </div>
        <Link href="/admin/sync" className="admin-btn">
          Force sync
        </Link>
      </div>

      <div className="admin-stats">
        <StatCard label="Visible products" value={visibleCount} sub={`${hidden} hidden`} />
        <StatCard label="Image coverage" value={`${imagePct}%`} sub={`${withImages} / ${productCount}`} />
        <StatCard label="Affiliate clicks" value={clickCount} sub={`${earnings.clicks7d} last 7 days`} />
        <StatCard label="Est. commission (30d)" value={money(earnings.estCommission30d)} accent />
        <StatCard label="Actual commissions" value={money(earnings.actual.total)} sub={`${earnings.actual.records} CSV rows`} />
        <StatCard label="Published guides" value={guideCount} />
        <StatCard label="Blog articles" value={blogCount} />
        <StatCard
          label="Last Zoho sync"
          value={lastSync?.status ?? "—"}
          sub={lastSync?.finishedAt?.toLocaleString() ?? "Never"}
        />
      </div>

      <div className="admin-grid-2">
        <section className="admin-panel">
          <div className="admin-panel-header">
            <h2>Quick actions</h2>
          </div>
          <div className="admin-actions">
            <Link href="/admin/products" className="admin-btn">
              Manage products
            </Link>
            <Link href="/admin/earnings" className="admin-btn admin-btn-secondary">
              View earnings
            </Link>
            <Link href="/admin/blog" className="admin-btn admin-btn-secondary">
              Blog
            </Link>
            <Link href="/admin/commissions" className="admin-btn admin-btn-secondary">
              Commissions
            </Link>
            <Link href="/admin/analytics" className="admin-btn admin-btn-secondary">
              Analytics
            </Link>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-header">
            <h2>Recent affiliate clicks</h2>
            <Link href="/admin/analytics" className="admin-link-sm">
              View all
            </Link>
          </div>
          <ul className="admin-activity-list">
            {recentClicks.length ? (
              recentClicks.map((c) => (
                <li key={c.id}>
                  <span className="admin-activity-title">{c.product.name}</span>
                  <span className="admin-activity-meta">{c.createdAt.toLocaleString()}</span>
                </li>
              ))
            ) : (
              <li className="admin-empty">No clicks recorded yet.</li>
            )}
          </ul>
        </section>
      </div>

      {lastSync?.errorMessage ? (
        <section className="admin-panel admin-section admin-panel-error">
          <h2>Last sync error</h2>
          <pre className="admin-pre">{lastSync.errorMessage}</pre>
        </section>
      ) : null}
    </div>
  )
}
