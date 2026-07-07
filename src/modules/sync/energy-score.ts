import { parseCapacityKwh } from "@/lib/capacity"

/**
 * Value-based Energy4Solar Score (0-100).
 *
 * Replaces the old base-70 heuristic (stock/description/sku bonuses), which
 * measured data completeness rather than product quality. This mirrors the
 * frontend reference formula in lib/ecommerce/score.ts but uses the robust
 * kWh parser so value-per-dollar is correct for Wh/Ah specs too.
 */
export function computeEnergyScore(input: {
  price: number
  capacity?: string | null
  voltage?: string | null
  rating?: number | null
  reviewCount?: number | null
  cycleLife?: number | null
  warranty?: string | null
  inStock?: boolean | null
  badge?: string | null
}): number {
  const kwh = parseCapacityKwh(input.capacity, input.voltage) ?? 0
  const price = input.price > 0 ? input.price : 1
  const valuePerDollar = kwh > 0 ? kwh / price : 0.001

  const valueScore = Math.min(28, valuePerDollar * 12000)
  const ratingScore = ((input.rating ?? 0) / 5) * 22
  const cycleScore = Math.min(22, ((input.cycleLife ?? 0) / 8000) * 22)
  const reviewScore = Math.min(8, Math.log10((input.reviewCount ?? 0) + 1) * 2.5)
  const stockBonus = input.inStock ? 5 : 0
  const badgeBonus = input.badge ? 5 : 0
  const warranty = input.warranty ?? ""
  const warrantyBonus = warranty.includes("25") ? 5 : warranty.includes("10") ? 3 : 0

  return Math.round(
    Math.min(100, valueScore + ratingScore + cycleScore + reviewScore + stockBonus + badgeBonus + warrantyBonus),
  )
}
