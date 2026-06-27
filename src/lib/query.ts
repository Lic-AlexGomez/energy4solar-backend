/**
 * TanStack Query helpers — all API routes return `{ data, meta? }`.
 */
export type ApiResponse<T> = {
  data: T
  meta?: Record<string, unknown>
}

export type ApiError = {
  error: { message: string; code: string }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? ""
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  })
  const json = (await res.json()) as ApiResponse<T> | ApiError
  if (!res.ok || "error" in json) {
    const message = "error" in json ? json.error.message : res.statusText
    throw new Error(message)
  }
  return json.data
}

export const queryKeys = {
  products: (params?: Record<string, string | number | boolean | undefined>) =>
    ["products", params] as const,
  product: (slug: string) => ["product", slug] as const,
  categories: ["categories"] as const,
  brands: ["brands"] as const,
  search: (q: string) => ["search", q] as const,
  guides: ["guides"] as const,
  guide: (slug: string) => ["guide", slug] as const,
}
