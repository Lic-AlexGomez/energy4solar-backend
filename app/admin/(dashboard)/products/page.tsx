import Link from "next/link"
import { getAdminProducts } from "./actions"
import { ProductSortSelect } from "./product-sort-select"
import { productsAdminHref } from "./products-query"
import { ProductsTable } from "./products-table"

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; sort?: string }>
}) {
  const { q = "", page: pageStr = "1", sort } = await searchParams
  const page = Math.max(1, Number(pageStr) || 1)
  const siteUrl = process.env.SITE_URL ?? "https://www.energy4solar.com"
  const data = await getAdminProducts(q, page, sort)

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Products</h1>
          <p className="admin-subtitle">Affiliate links and shop visibility</p>
        </div>
        <div className="admin-toolbar-metrics">
          <span>
            <strong>{data.total}</strong> total
          </span>
          <span className="admin-metric-dot">·</span>
          <span>
            Page <strong>{data.page}</strong>/{data.pages}
          </span>
          {data.hidden > 0 ? (
            <>
              <span className="admin-metric-dot">·</span>
              <span className="admin-metric-warn">
                <strong>{data.hidden}</strong> hidden
              </span>
            </>
          ) : null}
        </div>
      </header>

      <div className="admin-toolbar">
        <form className="admin-search-inline" method="get">
          <span className="admin-search-icon" aria-hidden>
            ⌕
          </span>
          <input type="search" name="q" defaultValue={q} placeholder="Search name, SKU or slug…" />
          <input type="hidden" name="sort" value={data.sort} />
          <button type="submit" className="admin-btn admin-btn-sm">
            Search
          </button>
          {q ? (
            <Link
              href={productsAdminHref({ sort: data.sort })}
              className="admin-btn admin-btn-sm admin-btn-ghost"
            >
              Clear
            </Link>
          ) : null}
        </form>
        <ProductSortSelect sort={data.sort} q={q} />
      </div>

      <ProductsTable rows={data.rows} siteUrl={siteUrl} />

      {data.pages > 1 ? (
        <nav className="admin-pagination" aria-label="Product pages">
          {page > 1 ? (
            <Link
              href={productsAdminHref({ q, sort: data.sort, page: page - 1 })}
              className="admin-btn admin-btn-sm admin-btn-ghost"
            >
              ← Prev
            </Link>
          ) : (
            <span />
          )}
          <span className="admin-pagination-info">
            {data.page} / {data.pages}
          </span>
          {page < data.pages ? (
            <Link
              href={productsAdminHref({ q, sort: data.sort, page: page + 1 })}
              className="admin-btn admin-btn-sm admin-btn-ghost"
            >
              Next →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  )
}
