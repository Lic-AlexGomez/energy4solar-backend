export function getEffectiveAffiliateUrl(product: {
  affiliateUrl: string
  affiliateUrlOverride?: string | null
}): string {
  const override = product.affiliateUrlOverride?.trim()
  return override || product.affiliateUrl
}
