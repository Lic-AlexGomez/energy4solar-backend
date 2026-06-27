import Link from "next/link"
import { StatCard } from "../../components/stat-card"
import { getAdminProducts } from "./actions"
import { ProductsTable } from "./products-table"

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q = "", page: pageStr = "1" } = await searchParams
  const page = Math.max(1, Number(pageStr) || 1)
  const siteUrl = process.env.SITE_URL ?? "https://www.energy4solar.com"
  const data = await getAdminProducts(q, page)

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Products</h1>
          <p className="admin-subtitle">
            Manage affiliate referrer links and visibility. Hidden products are removed from the public shop.
          </p>
        </div>
        <div className="admin-header-stat">
          <span className="admin-badge admin-badge-muted">{data.hidden} hidden</span>
        </div>
      </div>

      <form className="admin-search-bar" method="get">
        <input type="search" name="q" defaultValue={q} placeholder="Search by name, SKU or slug…" />
        <button type="submit" className="admin-btn">
          Search
        </button>
        {q ? (
          <Link href="/admin/products" className="admin-btn admin-btn-secondary">
            Clear
          </Link>
        ) : null}
      </form>

      <div className="admin-stats admin-stats-compact">
        <StatCard label="Total products" value={data.total} />
        <StatCard label="This page" value={data.rows.length} sub={`Page ${data.page} of ${data.pages}`} />
        <StatCard label="Hidden" value={data.hidden} accent={data.hidden > 0} />
      </div>

      <ProductsTable rows={data.rows} siteUrl={siteUrl} />

      {data.pages > 1 ? (
        <div className="admin-pagination">
          {page > 1 ? (
            <Link
              href={`/admin/products?q=${encodeURIComponent(q)}&page=${page - 1}`}
              className="admin-btn admin-btn-secondary"
            >
              ← Previous
            </Link>
          ) : null}
          <span className="admin-pagination-info">
            Page {data.page} / {data.pages}
          </span>
          {page < data.pages ? (
            <Link
              href={`/admin/products?q=${encodeURIComponent(q)}&page=${page + 1}`}
              className="admin-btn admin-btn-secondary"
            >
              Next →
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
