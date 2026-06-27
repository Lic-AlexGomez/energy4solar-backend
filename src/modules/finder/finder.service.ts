import { prisma } from "@/lib/prisma"
import { serializeProduct } from "@/modules/products/product.service"
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

export const finderService = {
  async recommend(input: {
    application: string
    budget?: number
    capacityKwh?: number
    backupDays?: number
  }) {
    const targetCapacity = input.capacityKwh ?? (input.backupDays ?? 1) * 24

    const products = await prisma.product.findMany({
      where: {
        inStock: true,
        isVisible: true,
        ...(input.application ? { compatibility: { has: input.application } } : {}),
        ...(input.budget ? { price: { lte: input.budget } } : {}),
      },
      orderBy: { energyScore: "desc" },
      take: 50,
      include: finderInclude,
    })

    return products
      .map((p) => {
        const cap = parseFloat(p.capacity ?? "0") || 0
        const diff = Math.abs(cap - targetCapacity)
        return {
          product: serializeProduct(p),
          diff,
          reasoning: `Sized for ~${targetCapacity} kWh target (${input.application} use). Capacity delta ${diff.toFixed(1)} kWh.`,
        }
      })
      .sort((a, b) => a.diff - b.diff)
      .slice(0, 3)
      .map(({ product, reasoning }) => ({ product, reasoning }))
  },
}
