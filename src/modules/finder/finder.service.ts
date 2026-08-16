import { prisma } from "@/lib/prisma"
import { serializeProduct } from "@/modules/products/product.service"
import { parseCapacityKwh } from "@/lib/capacity"
import type { Prisma } from "@prisma/client"

const finderInclude = {
  brand: true,
  category: true,
  images: { orderBy: { sortOrder: "asc" as const } },
  specifications: { orderBy: { sortOrder: "asc" as const } },
  features: { orderBy: { sortOrder: "asc" as const } },
  faqs: { orderBy: { sortOrder: "asc" as const } },
  reviews: { orderBy: { reviewDate: "desc" as const }, take: 10 },
  seo: true,
} satisfies Prisma.ProductInclude

const APPLICATION_LABELS: Record<string, string> = {
  home: "whole-home backup",
  rv: "RV & van life",
  cabin: "off-grid cabin",
  marine: "marine",
  commercial: "commercial",
  "golf-cart": "golf cart",
}

const ACCESSORY_RE =
  /\b(cbl\d|cable|comm\b|breaker|busbar|bracket|mount|conduit|wire|connector|fuse|lug|bus bar|parallel kit|communication)\b/i

function isAccessory(name: string, sku: string | null | undefined, capacity: string): boolean {
  const hay = `${sku ?? ""} ${name}`
  if (ACCESSORY_RE.test(hay)) return true
  const kwh = parseCapacityKwh(capacity) ?? 0
  return kwh < 0.5
}

export const finderService = {
  async recommend(input: {
    application: string
    budget?: number
    capacityKwh?: number
    backupDays?: number
    voltage?: string
  }) {
    // Prefer usable storage target (frontend may already send DoD-adjusted kWh).
    const targetCapacity =
      input.capacityKwh ?? Math.max(5, ((input.backupDays ?? 1) * 24) / 0.9)
    const voltagePref = input.voltage && input.voltage !== "any" ? input.voltage : undefined
    const budgetCeiling = input.budget ? input.budget * 1.2 : undefined

    const products = await prisma.product.findMany({
      where: {
        inStock: true,
        isVisible: true,
        // Soft application match: tagged use-case OR home battery / portable category.
        OR: [
          ...(input.application ? [{ compatibility: { has: input.application } }] : []),
          { category: { slug: { in: ["home-batteries", "portable-power"] } } },
        ],
        ...(budgetCeiling ? { price: { lte: budgetCeiling } } : {}),
        ...(voltagePref
          ? { voltage: { contains: voltagePref.replace(/V/i, ""), mode: "insensitive" } }
          : {}),
      },
      orderBy: { energyScore: "desc" },
      take: 120,
      include: finderInclude,
    })

    const appLabel = APPLICATION_LABELS[input.application] ?? input.application

    return products
      .filter((p) => !isAccessory(p.name, p.sku, p.capacity))
      .map((p) => {
        const cap = parseCapacityKwh(p.capacity, p.voltage) ?? 0
        const diff = Math.abs(cap - targetCapacity)
        const capacityFit = 1 - Math.min(1, diff / Math.max(targetCapacity, 1))
        const budgetFit = input.budget
          ? Math.min(1, input.budget / Math.max(Number(p.price), 1))
          : 1
        const score = capacityFit * 50 + Math.min(budgetFit, 1) * 20 + (p.energyScore / 100) * 30

        const reasons: string[] = []
        if (cap > 0) {
          reasons.push(
            `Delivers ~${cap} kWh, a close match for your ~${round1(targetCapacity)} kWh ${appLabel} target.`,
          )
        } else {
          reasons.push(`Recommended for ${appLabel}.`)
        }
        if (input.budget && Number(p.price) <= input.budget) {
          reasons.push(`Within your $${input.budget.toLocaleString()} budget.`)
        }
        if (voltagePref && p.voltage) reasons.push(`Matches your ${voltagePref} system.`)
        if (p.energyScore >= 85) reasons.push("Top-rated Energy4Solar Score.")

        return { product: serializeProduct(p), score, reasoning: reasons.join(" ") }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ product, reasoning }) => ({ product, reasoning }))
  },
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}
