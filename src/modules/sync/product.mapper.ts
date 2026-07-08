import { getEnv } from "@/config/env"
import type { ZohoItem } from "@/modules/zoho/types"
import { slugify } from "@/lib/slug"
import { deriveProductTaxonomy } from "./product-taxonomy"
import { computeEnergyScore } from "./energy-score"

// Ordered most-specific-first: the first matching rule wins. "battery" is
// checked LAST so a "portable power station" or "hybrid inverter" isn't
// swallowed by the generic battery match.
const CATEGORY_RULES: Array<{ slug: string; pattern: RegExp }> = [
  { slug: "ev-chargers", pattern: /\bev\b|ev charger|ev-charger|evse|j1772|nacs|charging station|level 2/i },
  { slug: "portable-power", pattern: /portable|power station|solar generator|\bgenerator\b|power pack|off[-\s]?grid kit/i },
  { slug: "inverters", pattern: /inverter|charge controller|\bmppt\b|hybrid inverter|power center/i },
  { slug: "solar-panels", pattern: /solar panel|\bpanel\b|photovoltaic|\bpv\b|solar module|monocrystalline/i },
  { slug: "home-batteries", pattern: /batter|lifepo4|\blfp\b|\bkwh\b|server rack|\brack\b|powerwall|wall[-\s]?mount|\bess\b/i },
]

export function inferCategorySlug(item: ZohoItem): string {
  const hay = `${item.name} ${item.sku ?? ""} ${item.product_type ?? ""} ${(item.tags ?? []).join(" ")}`
  for (const { slug, pattern } of CATEGORY_RULES) {
    if (pattern.test(hay)) return slug
  }
  return "home-batteries"
}

export function inferBrandName(item: ZohoItem): string {
  const cf = item.custom_fields?.find((f) => /brand|manufacturer/i.test(f.label ?? f.api_name ?? ""))
  if (cf?.value) return String(cf.value)
  if (item.brand) return String(item.brand)
  if (item.manufacturer) return String(item.manufacturer)
  const first = item.name.split(/[\s-]/)[0]
  return first || "BigBattery"
}

export function buildAffiliateUrl(sku: string | undefined, itemId: string): string {
  const env = getEnv()
  const base = env.AFFILIATE_BASE_URL.replace(/\/$/, "")
  const path = sku ? `/products/${encodeURIComponent(sku.toLowerCase())}` : `/shop`
  const url = new URL(path, base)
  url.searchParams.set("utm_source", env.AFFILIATE_UTM_SOURCE)
  url.searchParams.set("utm_medium", env.AFFILIATE_UTM_MEDIUM)
  url.searchParams.set("utm_campaign", "product")
  url.searchParams.set("ref", "energy4solar")
  url.searchParams.set("zoho_item", itemId)
  return url.toString()
}

export function mapZohoItemToProductData(item: ZohoItem, categoryId: string, brandId: string) {
  const price = Number(item.rate ?? 0)
  const stock = item.stock_on_hand ?? 0
  const sku = item.sku?.trim() || undefined

  const categorySlug = inferCategorySlug(item)
  const chemistry = extractCustomField(item, /chem|lifepo|nmc/i) ?? "LiFePO4"
  const warranty = extractCustomField(item, /warranty/i) ?? "10 years"
  const cycleLife = parseInt(extractCustomField(item, /cycle/i) ?? "6000", 10) || 6000
  const capacity = extractCustomField(item, /capacity|kwh/i)
  const voltage = extractCustomField(item, /voltage|volt/i)
  const inStock = stock > 0 || item.status !== "inactive"
  const taxonomy = deriveProductTaxonomy({ categorySlug, name: item.name, chemistry, cycleLife, warranty })
  // Rating/reviews are unknown at sync time (editorial), so the score reflects
  // value-per-dollar, cycles, warranty and availability; it lifts as reviews land.
  const energyScore = computeEnergyScore({ price, capacity, voltage, cycleLife, warranty, inStock })

  return {
    zohoItemId: String(item.item_id),
    sku,
    name: item.name,
    slug: slugify(`${item.name}-${item.item_id}`),
    shortDescription: (item.description ?? "").slice(0, 280) || item.name,
    description: item.description ?? item.name,
    price,
    inStock,
    stockOnHand: stock,
    affiliateUrl: buildAffiliateUrl(sku, String(item.item_id)),
    manufacturerUrl: sku ? `https://bigbattery.com/products/${sku.toLowerCase()}` : "https://bigbattery.com/shop",
    categoryId,
    brandId,
    zohoRaw: item as object,
    capacity,
    voltage,
    chemistry,
    warranty,
    cycleLife,
    weightLbs: parseFloat(extractCustomField(item, /weight|lbs/i) ?? "0") || undefined,
    energyScore,
    compatibility: taxonomy.compatibility,
    idealUseCases: taxonomy.idealUseCases,
    pros: taxonomy.pros,
    cons: taxonomy.cons,
    images: [] as string[],
    features: defaultFeatures(item),
    specifications: defaultSpecs(item),
  }
}

function extractCustomField(item: ZohoItem, pattern: RegExp): string | undefined {
  const hit = item.custom_fields?.find((f) => pattern.test(`${f.label} ${f.api_name}`))
  return hit?.value != null ? String(hit.value) : undefined
}


function defaultFeatures(item: ZohoItem): string[] {
  return [
    "Synced from Zoho Books catalog",
    item.sku ? `SKU: ${item.sku}` : "Premium energy storage",
    "Ships from BigBattery",
  ]
}

function defaultSpecs(item: ZohoItem): Array<{ label: string; value: string }> {
  const specs: Array<{ label: string; value: string }> = [
    { label: "SKU", value: item.sku ?? "N/A" },
    { label: "Unit", value: item.unit ?? "qty" },
    { label: "Status", value: item.status ?? "active" },
  ]
  const cap = extractCustomField(item, /capacity/i)
  if (cap) specs.push({ label: "Capacity", value: cap })
  return specs
}

export function buildSearchDocument(name: string, description: string, sku?: string, brand?: string) {
  return [name, description, sku, brand].filter(Boolean).join(" ").toLowerCase()
}

export function tokenizeSearch(text: string): string[] {
  return [...new Set(text.split(/[^a-z0-9]+/i).filter((t) => t.length > 2))]
}
