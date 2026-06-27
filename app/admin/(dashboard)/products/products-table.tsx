"use client"

import { useTransition } from "react"
import {
  resetAffiliateUrlAction,
  toggleProductVisibilityAction,
  updateAffiliateUrlAction,
  type AdminProductRow,
} from "./actions"

export function ProductsTable({
  rows,
  siteUrl,
}: {
  rows: AdminProductRow[]
  siteUrl: string
}) {
  return (
    <div className="admin-panel">
      <table className="admin-table admin-table-products">
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Clicks</th>
            <th>Affiliate / referrer link</th>
            <th>Visible</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <ProductRow key={row.id} row={row} siteUrl={siteUrl} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ProductRow({ row, siteUrl }: { row: AdminProductRow; siteUrl: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <tr className={pending ? "admin-row-pending" : undefined}>
      <td>
        <div className="admin-product-name">{row.name}</div>
        <div className="admin-product-meta">
          {row.sku ? `${row.sku} · ` : ""}
          <a href={`${siteUrl}/product/${row.slug}`} target="_blank" rel="noreferrer">
            View ↗
          </a>
        </div>
      </td>
      <td>${row.price.toLocaleString()}</td>
      <td>{row.clickCount}</td>
      <td>
        <form
          action={(fd) => startTransition(() => updateAffiliateUrlAction(fd))}
          className="admin-inline-form"
        >
          <input type="hidden" name="productId" value={row.id} />
          <input
            type="url"
            name="affiliateUrl"
            defaultValue={row.effectiveUrl}
            className="admin-input-url"
            placeholder="https://bigbattery.com/..."
          />
          <div className="admin-inline-actions">
            <button type="submit" className="admin-btn-sm">
              Save
            </button>
            {row.hasOverride ? (
              <button
                type="button"
                className="admin-btn-sm admin-btn-ghost"
                onClick={() =>
                  startTransition(() => {
                    const fd = new FormData()
                    fd.set("productId", row.id)
                    resetAffiliateUrlAction(fd)
                  })
                }
              >
                Reset
              </button>
            ) : null}
          </div>
          {row.hasOverride ? <span className="admin-badge admin-badge-warn">Custom link</span> : null}
        </form>
      </td>
      <td>
        <form
          action={(fd) => startTransition(() => toggleProductVisibilityAction(fd))}
          className="admin-toggle-form"
        >
          <input type="hidden" name="productId" value={row.id} />
          <input type="hidden" name="isVisible" value={String(!row.isVisible)} />
          <button
            type="submit"
            className={`admin-toggle${row.isVisible ? " admin-toggle-on" : ""}`}
            title={row.isVisible ? "Visible on site" : "Hidden from site"}
          >
            <span className="admin-toggle-knob" />
          </button>
          <span className="admin-toggle-label">{row.isVisible ? "Shown" : "Hidden"}</span>
        </form>
      </td>
    </tr>
  )
}
