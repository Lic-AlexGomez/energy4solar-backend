import { getEnv } from "@/config/env"
import { logger } from "@/lib/logger"
import type { WooCatalogEntry, WooImageCatalog, WooStoreProduct } from "./types"

const STORE_PAGE_SIZE = 100
const V3_PAGE_SIZE = 100

function normalizeSku(sku: string): string {
  return sku.trim().toUpperCase()
}

function entryFromStoreProduct(product: WooStoreProduct): WooCatalogEntry {
  return {
    images: product.images?.map((i) => i.src).filter(Boolean) ?? [],
    permalink: product.permalink,
    name: product.name,
  }
}

async function fetchStorePage(page: number): Promise<WooStoreProduct[]> {
  const base = getEnv().WOO_STORE_URL.replace(/\/$/, "")
  const url = `${base}/wp-json/wc/store/v1/products?per_page=${STORE_PAGE_SIZE}&page=${page}`
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "Energy4Solar-Sync/1.0" },
    next: { revalidate: 0 },
  })
  if (!res.ok) {
    throw new Error(`Woo store API HTTP ${res.status}`)
  }
  const data = (await res.json()) as WooStoreProduct[]
  return Array.isArray(data) ? data : []
}

async function fetchV3Page(page: number): Promise<WooStoreProduct[]> {
  const env = getEnv()
  if (!env.WOO_CONSUMER_KEY || !env.WOO_CONSUMER_SECRET) return []

  const base = env.WOO_STORE_URL.replace(/\/$/, "")
  const url = new URL(`${base}/wp-json/wc/v3/products`)
  url.searchParams.set("per_page", String(V3_PAGE_SIZE))
  url.searchParams.set("page", String(page))
  url.searchParams.set("status", "publish")

  const auth = Buffer.from(`${env.WOO_CONSUMER_KEY}:${env.WOO_CONSUMER_SECRET}`).toString("base64")
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${auth}`,
      "User-Agent": "Energy4Solar-Sync/1.0",
    },
    next: { revalidate: 0 },
  })
  if (!res.ok) {
    logger.warn("Woo v3 catalog page failed", { page, status: res.status })
    return []
  }
  const data = (await res.json()) as WooStoreProduct[]
  return Array.isArray(data) ? data : []
}

function mergeIntoCatalog(catalog: WooImageCatalog, product: WooStoreProduct) {
  const sku = product.sku?.trim()
  if (!sku) return
  const key = normalizeSku(sku)
  const entry = entryFromStoreProduct(product)
  if (!entry.images.length && !catalog.has(key)) return
  const existing = catalog.get(key)
  if (!existing || entry.images.length >= existing.images.length) {
    catalog.set(key, entry)
  }
}

/** Public Woo Store API + optional authenticated v3 — no HTML scraping. */
export async function loadWooCommerceImageCatalog(): Promise<WooImageCatalog> {
  const catalog: WooImageCatalog = new Map()

  try {
    let page = 1
    while (page <= 50) {
      const batch = await fetchStorePage(page)
      if (!batch.length) break
      for (const product of batch) mergeIntoCatalog(catalog, product)
      if (batch.length < STORE_PAGE_SIZE) break
      page += 1
    }
    logger.info("Woo store catalog loaded", { skus: catalog.size })
  } catch (err) {
    logger.warn("Woo store catalog failed", {
      message: err instanceof Error ? err.message : String(err),
    })
  }

  if (getEnv().WOO_CONSUMER_KEY && getEnv().WOO_CONSUMER_SECRET) {
    try {
      let page = 1
      while (page <= 100) {
        const batch = await fetchV3Page(page)
        if (!batch.length) break
        for (const product of batch) mergeIntoCatalog(catalog, product)
        if (batch.length < V3_PAGE_SIZE) break
        page += 1
      }
      logger.info("Woo v3 catalog merged", { skus: catalog.size })
    } catch (err) {
      logger.warn("Woo v3 catalog failed", {
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return catalog
}

export function skuLookupVariants(sku: string): string[] {
  const base = normalizeSku(sku)
  const variants = new Set<string>([base])

  // Refurb / warehouse prefixes in Zoho
  for (const prefix of ["RF-", "RHWK-", "REF-"]) {
    if (base.startsWith(prefix)) variants.add(base.slice(prefix.length))
  }

  // Refurb / grade suffixes common in Zoho SKUs
  for (const suffix of [
    "-INV-B",
    "-INV-A",
    "-PWR-B",
    "-PWR-A",
    "-G2-INV",
    "-G2-B",
    "-G2-A",
    "-G1-B",
    "-G1-A",
    "-B",
    "-A",
  ]) {
    if (base.endsWith(suffix)) {
      variants.add(base.slice(0, -suffix.length))
    }
  }

  return [...variants]
}

export async function searchStoreProducts(query: string): Promise<WooStoreProduct[]> {
  const q = query.trim()
  if (q.length < 3) return []
  const base = getEnv().WOO_STORE_URL.replace(/\/$/, "")
  const url = `${base}/wp-json/wc/store/v1/products?search=${encodeURIComponent(q)}&per_page=5`
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "Energy4Solar-Sync/1.0" },
    next: { revalidate: 0 },
  })
  if (!res.ok) return []
  const data = (await res.json()) as WooStoreProduct[]
  return Array.isArray(data) ? data : []
}

export async function lookupCatalogEntryWithSearch(
  catalog: WooImageCatalog,
  sku?: string,
): Promise<WooCatalogEntry | null> {
  const direct = lookupCatalogEntry(catalog, sku)
  if (direct?.images.length) return direct
  if (!sku?.trim()) return direct

  const variants = skuLookupVariants(sku)
  for (const variant of variants) {
    if (variant.length < 4) continue
    try {
      const results = await searchStoreProducts(variant)
      for (const product of results) {
        if (!product.images?.length) continue
        const productSku = normalizeSku(product.sku ?? "")
        const matches = variants.some(
          (v) =>
            productSku === v ||
            productSku.startsWith(v) ||
            v.startsWith(productSku) ||
            v.includes(productSku) ||
            productSku.includes(v.replace(/^(RF-|RHWK-|REF-)/, "")),
        )
        if (matches) return entryFromStoreProduct(product)
      }
      // Refurb SKUs: use best search hit for the same model family
      const best = results.find((p) => p.images?.length)
      if (best && variant.length >= 8) return entryFromStoreProduct(best)
    } catch {
      /* try next variant */
    }
  }

  return direct
}

export function lookupCatalogEntry(catalog: WooImageCatalog, sku?: string): WooCatalogEntry | null {
  if (!sku?.trim()) return null
  for (const variant of skuLookupVariants(sku)) {
    const hit = catalog.get(variant)
    if (hit?.images.length) return hit
  }
  for (const variant of skuLookupVariants(sku)) {
    const hit = catalog.get(variant)
    if (hit) return hit
  }
  return null
}
