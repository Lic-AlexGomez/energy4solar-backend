import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { StatCard } from "../components/stat-card"
import { commissionService } from "@/modules/admin/commission.service"

function money(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
}

export default async function AdminOverviewPage() {
  const [productCount, visibleCount, withImages, categoryCount, guideCount, blogCount, lastSync, commissions] =
    await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isVisible: true } }),
      prisma.product.count({ where: { images: { some: {} } } }),
      prisma.category.count(),
      prisma.guide.count({ where: { published: true } }),
      prisma.blogPost.count({ where: { published: true } }),
      prisma.syncLog.findFirst({ orderBy: { startedAt: "desc" } }),
      commissionService.getDashboard(),
    ])

  const hidden = productCount - visibleCount
  const imagePct = productCount ? Math.round((withImages / productCount) * 100) : 0

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-subtitle">Catalog, content, and your affiliate commissions.</p>
        </div>
        <Link href="/admin/sync" className="admin-btn">
          Force sync
        </Link>
      </div>

      <div className="admin-stats">
        <StatCard
          label="My commissions"
          value={money(commissions.totalAmount)}
          sub={`${commissions.totalRecords} orders · ${money(commissions.last30Amount)} last 30d`}
          accent
        />
        <StatCard label="Paid" value={money(commissions.paidAmount)} />
        <StatCard label="Pending" value={money(commissions.pendingAmount)} />
        <StatCard label="Visible products" value={visibleCount} sub={`${hidden} hidden`} />
        <StatCard label="Image coverage" value={`${imagePct}%`} sub={`${withImages} / ${productCount}`} />
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
            <Link href="/admin/commissions" className="admin-btn">
              Import commissions
            </Link>
            <Link href="/admin/products" className="admin-btn admin-btn-secondary">
              Products
            </Link>
            <Link href="/admin/blog" className="admin-btn admin-btn-secondary">
              Blog
            </Link>
            <Link href="/admin/analytics" className="admin-btn admin-btn-secondary">
              Analytics
            </Link>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-header">
            <h2>Recent commissions</h2>
            <Link href="/admin/commissions" className="admin-link-sm">
              View all
            </Link>
          </div>
          <ul className="admin-activity-list">
            {commissions.recent.length ? (
              commissions.recent.slice(0, 8).map((c) => (
                <li key={c.id}>
                  <span className="admin-activity-title">{c.productName}</span>
                  <span className="admin-activity-meta admin-money">{money(c.amount)}</span>
                </li>
              ))
            ) : (
              <li className="admin-empty">
                Upload a CSV from BigBattery to see your commissions here.
              </li>
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
