"use client"

import { useState, useTransition } from "react"
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
  if (!rows.length) {
    return (
      <div className="admin-panel admin-empty-state">
        <p>No products match your search.</p>
      </div>
    )
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table admin-table-products">
        <thead>
          <tr>
            <th className="col-product">Product</th>
            <th className="col-price">Price</th>
            <th className="col-clicks">Clicks</th>
            <th className="col-link">Referrer link</th>
            <th className="col-visible">Visible</th>
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
    <tr className={`${pending ? "admin-row-pending" : ""}${!row.isVisible ? " admin-row-hidden" : ""}`}>
      <td className="col-product">
        <div className="admin-product-cell">
          <span className="admin-product-name" title={row.name}>
            {row.name}
          </span>
          <span className="admin-product-meta">
            {row.sku ? <code>{row.sku}</code> : null}
            <a href={`${siteUrl}/product/${row.slug}`} target="_blank" rel="noreferrer" className="admin-link-sm">
              View
            </a>
          </span>
        </div>
      </td>
      <td className="col-price admin-num">${row.price.toLocaleString()}</td>
      <td className="col-clicks">
        <span className="admin-pill">{row.clickCount}</span>
      </td>
      <td className="col-link">
        <AffiliateUrlCell row={row} pending={pending} onSave={(fd) => startTransition(() => updateAffiliateUrlAction(fd))} onReset={() =>
            startTransition(() => {
              const fd = new FormData()
              fd.set("productId", row.id)
              resetAffiliateUrlAction(fd)
            })
          } />
      </td>
      <td className="col-visible">
        <form action={(fd) => startTransition(() => toggleProductVisibilityAction(fd))}>
          <input type="hidden" name="productId" value={row.id} />
          <input type="hidden" name="isVisible" value={String(!row.isVisible)} />
          <button
            type="submit"
            className={`admin-toggle${row.isVisible ? " admin-toggle-on" : ""}`}
            title={row.isVisible ? "Visible on site — click to hide" : "Hidden — click to show"}
            aria-label={row.isVisible ? "Hide product" : "Show product"}
          >
            <span className="admin-toggle-knob" />
          </button>
        </form>
      </td>
    </tr>
  )
}

function AffiliateUrlCell({
  row,
  pending,
  onSave,
  onReset,
}: {
  row: AdminProductRow
  pending: boolean
  onSave: (fd: FormData) => void
  onReset: () => void
}) {
  const [editing, setEditing] = useState(false)

  if (!editing) {
    return (
      <div className="admin-url-preview">
        <span className={`admin-url-text${row.hasOverride ? " admin-url-custom" : ""}`} title={row.effectiveUrl}>
          {truncateUrl(row.effectiveUrl)}
        </span>
        <button type="button" className="admin-icon-btn" onClick={() => setEditing(true)} disabled={pending}>
          Edit
        </button>
      </div>
    )
  }

  return (
    <form
      className="admin-url-edit"
      action={(fd) => {
        onSave(fd)
        setEditing(false)
      }}
    >
      <input type="hidden" name="productId" value={row.id} />
      <input
        type="url"
        name="affiliateUrl"
        defaultValue={row.effectiveUrl}
        className="admin-input-url"
        placeholder="https://..."
        autoFocus
      />
      <div className="admin-url-edit-actions">
        <button type="submit" className="admin-btn-sm" disabled={pending}>
          Save
        </button>
        <button type="button" className="admin-btn-sm admin-btn-ghost" onClick={() => setEditing(false)}>
          Cancel
        </button>
        {row.hasOverride ? (
          <button type="button" className="admin-btn-sm admin-btn-ghost" onClick={onReset}>
            Reset
          </button>
        ) : null}
      </div>
    </form>
  )
}

function truncateUrl(url: string, max = 42) {
  if (url.length <= max) return url
  return `${url.slice(0, max)}…`
}
