export const ADMIN_PRODUCT_SORTS = [
  { value: "name-asc", label: "Name A → Z" },
  { value: "name-desc", label: "Name Z → A" },
  { value: "price-desc", label: "Price: high → low" },
  { value: "price-asc", label: "Price: low → high" },
  { value: "clicks-desc", label: "Clicks: most → least" },
  { value: "clicks-asc", label: "Clicks: least → most" },
  { value: "visible-first", label: "Visible first" },
  { value: "hidden-first", label: "Hidden first" },
] as const

export type AdminProductSort = (typeof ADMIN_PRODUCT_SORTS)[number]["value"]

export function parseAdminProductSort(raw?: string): AdminProductSort {
  const hit = ADMIN_PRODUCT_SORTS.find((s) => s.value === raw)
  return hit?.value ?? "name-asc"
}

export function productsAdminHref(params: { q?: string; page?: number; sort?: AdminProductSort }) {
  const sp = new URLSearchParams()
  if (params.q?.trim()) sp.set("q", params.q.trim())
  if (params.page && params.page > 1) sp.set("page", String(params.page))
  if (params.sort && params.sort !== "name-asc") sp.set("sort", params.sort)
  const qs = sp.toString()
  return `/admin/products${qs ? `?${qs}` : ""}`
}
