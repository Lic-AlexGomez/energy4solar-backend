"use client"

import { useRouter } from "next/navigation"
import { ADMIN_PRODUCT_SORTS, productsAdminHref, type AdminProductSort } from "./products-query"

export function ProductSortSelect({ sort, q }: { sort: AdminProductSort; q: string }) {
  const router = useRouter()

  return (
    <label className="admin-sort-select">
      <span className="admin-sort-label">Sort</span>
      <select
        value={sort}
        onChange={(e) => {
          router.push(
            productsAdminHref({
              q,
              sort: e.target.value as AdminProductSort,
              page: 1,
            }),
          )
        }}
      >
        {ADMIN_PRODUCT_SORTS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}
