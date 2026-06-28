const ZOHO_DOCUMENT_PATTERN = /zohoapis\.com\/books\/v3\/documents\//i

/** URLs that work in the browser without Zoho auth. */
export function isPublicProductImageUrl(url: string | null | undefined): url is string {
  if (!url?.trim()) return false
  if (ZOHO_DOCUMENT_PATTERN.test(url)) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === "https:" || parsed.protocol === "http:"
  } catch {
    return false
  }
}

export function filterPublicProductImageUrls(urls: string[]): string[] {
  return urls.filter(isPublicProductImageUrl)
}

export const DEFAULT_PRODUCT_IMAGE =
  "https://bigbattery.com/wp-content/uploads/2026/04/BigBattery-ALL-PRODUCT-IMAGES-1-1.webp"

export function resolveProductImageUrl(urls: string[]): string {
  const valid = filterPublicProductImageUrls(urls)
  return valid[0] ?? DEFAULT_PRODUCT_IMAGE
}
