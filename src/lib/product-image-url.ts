const ZOHO_DOCUMENT_PATTERN = /zohoapis\.com\/books\/v3\/documents\//i

/** URLs that work in the browser without Zoho auth. */
export function normalizeProductImageUrl(url: string): string {
  if (!url?.trim()) return url
  return url.replace(/(\/wp-content\/uploads)+/gi, "/wp-content/uploads")
}

/** URLs that work in the browser without Zoho auth. */
export function isPublicProductImageUrl(url: string | null | undefined): url is string {
  if (!url?.trim()) return false
  const normalized = normalizeProductImageUrl(url)
  if (ZOHO_DOCUMENT_PATTERN.test(normalized)) return false
  try {
    const parsed = new URL(normalized)
    return parsed.protocol === "https:" || parsed.protocol === "http:"
  } catch {
    return false
  }
}

export function filterPublicProductImageUrls(urls: string[]): string[] {
  return urls.map(normalizeProductImageUrl).filter(isPublicProductImageUrl)
}

export const DEFAULT_PRODUCT_IMAGE =
  "https://bigbattery.com/wp-content/uploads/2026/04/BigBattery-ALL-PRODUCT-IMAGES-1-1.webp"

/** Generic BigBattery banner/catalog images that aren't a specific product shot. */
const GENERIC_IMAGE_PATTERN = /ALL-PRODUCT-IMAGES|placeholder|banner|logo/i

export function resolveProductImageUrl(urls: string[]): string {
  const valid = filterPublicProductImageUrls(urls)
  // Prefer a real product photo over a generic banner when both exist.
  const specific = valid.find((u) => !GENERIC_IMAGE_PATTERN.test(u))
  return specific ?? valid[0] ?? DEFAULT_PRODUCT_IMAGE
}
