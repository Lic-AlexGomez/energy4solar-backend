import Link from "next/link"
import { prisma } from "@/lib/prisma"

export default async function AdminOverviewPage() {
  const [productCount, withImages, clickCount, categoryCount, lastSync] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { images: { some: {} } } }),
    prisma.affiliateClick.count(),
    prisma.category.count(),
    prisma.syncLog.findFirst({ orderBy: { startedAt: "desc" } }),
  ])

  const withoutImages = productCount - withImages
  const imagePct = productCount ? Math.round((withImages / productCount) * 100) : 0

  return (
    <div>
      <h1 className="admin-page-title">Dashboard</h1>
      <p className="admin-subtitle">Energy4Solar affiliate platform — catalog, sync, and analytics.</p>

      <div className="admin-stats">
        <StatCard label="Products" value={productCount} sub={`${categoryCount} categories`} />
        <StatCard label="With images" value={withImages} sub={`${imagePct}% coverage`} />
        <StatCard label="Missing images" value={withoutImages} sub="Woo / OG enrichment" />
        <StatCard label="Affiliate clicks" value={clickCount} sub="All time" />
        <StatCard
          label="Last sync"
          value={lastSync?.status ?? "—"}
          sub={lastSync?.finishedAt?.toLocaleString() ?? "Never"}
        />
      </div>

      <section className="admin-section">
        <h2>Quick actions</h2>
        <div className="admin-actions">
          <Link href="/admin/sync" className="admin-btn">
            Zoho sync
          </Link>
          <Link href="/admin/analytics" className="admin-btn admin-btn-secondary">
            Analytics
          </Link>
          <a href="/api/health" className="admin-btn admin-btn-secondary" target="_blank" rel="noreferrer">
            API health
          </a>
        </div>
      </section>

      {lastSync?.errorMessage ? (
        <section className="admin-section">
          <h2>Last sync error</h2>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.8rem", color: "#fca5a5" }}>
            {lastSync.errorMessage}
          </pre>
        </section>
      ) : null}
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-label">{label}</div>
      <div className="admin-stat-value">{value}</div>
      {sub ? <div className="admin-stat-sub">{sub}</div> : null}
    </div>
  )
}
