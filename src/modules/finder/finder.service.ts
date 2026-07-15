import { prisma } from "@/lib/prisma"
import { serializeProduct } from "@/modules/products/product.service"
import { parseCapacityKwh, parseVolts, voltageClass } from "@/lib/capacity"
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

export const finderService = {
  async recommend(input: {
    application: string
    budget?: number
    capacityKwh?: number
    backupDays?: number
    voltage?: string
  }) {
    const targetCapacity = input.capacityKwh ?? (input.backupDays ?? 1) * 24
    const voltagePref = input.voltage && input.voltage !== "any" ? input.voltage : undefined
    const targetVoltClass = voltagePref ? voltageClass(parseVolts(voltagePref)) : null

    const products = await prisma.product.findMany({
      where: {
        inStock: true,
        isVisible: true,
        ...(input.application ? { compatibility: { has: input.application } } : {}),
        ...(input.budget ? { price: { lte: input.budget } } : {}),
      },
      orderBy: { energyScore: "desc" },
      take: 80,
      include: finderInclude,
    })

    const appLabel = APPLICATION_LABELS[input.application] ?? input.application

    return products
      // Exact voltage-class match (51.2V counts as 48V). Required when the user
      // states a system voltage — critical for golf carts (36V vs 48V).
      .filter((p) => !targetVoltClass || voltageClass(parseVolts(p.voltage)) === targetVoltClass)
      .map((p) => {
        const cap = parseCapacityKwh(p.capacity, p.voltage) ?? 0
        const diff = Math.abs(cap - targetCapacity)
        // Weighted fit: closeness to target capacity, budget headroom, quality.
        const capacityFit = 1 - Math.min(1, diff / Math.max(targetCapacity, 1))
        const budgetFit = input.budget ? Math.min(1, input.budget / Math.max(Number(p.price), 1)) : 1
        const score = capacityFit * 40 + Math.min(budgetFit, 1) * 25 + (p.energyScore / 100) * 35

        const reasons: string[] = []
        if (cap > 0) {
          reasons.push(`Delivers ~${cap} kWh, a close match for your ~${round1(targetCapacity)} kWh ${appLabel} target.`)
        } else {
          reasons.push(`Recommended for ${appLabel}.`)
        }
        if (input.budget && Number(p.price) <= input.budget) {
          reasons.push(`Within your $${input.budget.toLocaleString()} budget.`)
        }
        if (voltagePref) reasons.push(`Matches your ${voltagePref} system.`)
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
