import { getEnv } from "@/config/env"
import { logger } from "@/lib/logger"
import { loadWooCommerceImageCatalog, lookupCatalogEntry } from "./catalog"
import type { WooCatalogEntry, WooImageCatalog } from "./types"

export { loadWooCommerceImageCatalog, lookupCatalogEntry }

const OG_IMAGE_RE =
  /<meta[^>]+property=["']og:image(?::url)?["'][^>]+content=["']([^"']+)["'][^>]*>/i
const OG_IMAGE_RE_ALT =
  /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::url)?["'][^>]*>/i

async function fetchOgImage(pageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(pageUrl, {
      headers: {
        Accept: "text/html",
        "User-Agent": "Energy4Solar-Sync/1.0 (affiliate; +https://www.energy4solar.com)",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
    })
    if (!res.ok) return null
    const html = await res.text()
    const match = html.match(OG_IMAGE_RE) ?? html.match(OG_IMAGE_RE_ALT)
    return match?.[1] ?? null
  } catch {
    return null
  }
}

function candidatePageUrls(sku: string): string[] {
  const base = getEnv().WOO_STORE_URL.replace(/\/$/, "")
  const encoded = encodeURIComponent(sku)
  const slug = sku.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  return [
    `${base}/products/${slug}/`,
    `${base}/product/${encoded}/`,
    `${base}/products/${encoded}/`,
  ]
}

/** Resolve images: Woo catalog → optional og:image from product page (last resort). */
export async function resolveWooProductMedia(
  sku: string | undefined,
  catalog: WooImageCatalog,
): Promise<WooCatalogEntry> {
  const fromCatalog = lookupCatalogEntry(catalog, sku)
  if (fromCatalog?.images.length) return fromCatalog

  if (!sku?.trim()) return { images: [] }

  if (!getEnv().WOO_IMAGE_OG_FALLBACK) return fromCatalog ?? { images: [] }

  for (const url of candidatePageUrls(sku)) {
    const og = await fetchOgImage(url)
    if (og) {
      logger.info("Resolved product image via og:image", { sku, url })
      return { images: [og], permalink: url }
    }
  }

  return fromCatalog ?? { images: [] }
}
