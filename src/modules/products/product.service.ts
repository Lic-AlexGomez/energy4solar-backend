import { prisma } from "@/lib/prisma"
import { NotFoundError } from "@/lib/errors"
import type { Prisma } from "@prisma/client"
import { getEffectiveAffiliateUrl } from "@/lib/affiliate-url"

const productInclude = {
  brand: true,
  category: true,
  images: { orderBy: { sortOrder: "asc" as const } },
  specifications: { orderBy: { sortOrder: "asc" as const } },
  features: { orderBy: { sortOrder: "asc" as const } },
  faqs: { orderBy: { sortOrder: "asc" as const } },
  reviews: { orderBy: { reviewDate: "desc" as const }, take: 10 },
  seo: true,
} satisfies Prisma.ProductInclude

export type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof productInclude }>

export function serializeProduct(p: ProductWithRelations) {
  const primaryImage = p.images.find((i) => i.isPrimary) ?? p.images[0]
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand?.name ?? "Unknown",
    brandId: p.brand?.slug ?? "",
    categoryId: p.category?.slug ?? "",
    category: p.category?.name ?? "Uncategorized",
    image: primaryImage?.url ?? null,
    images: p.images.map((i) => i.url),
    capacity: p.capacity ?? "",
    voltage: p.voltage ?? "",
    price: Number(p.price),
    oldPrice: p.oldPrice ? Number(p.oldPrice) : undefined,
    rating: p.rating,
    reviews: p.reviewCount,
    description: p.description,
    shortDescription: p.shortDescription,
    badge: p.badge ?? undefined,
    affiliateUrl: getEffectiveAffiliateUrl(p),
    manufacturerUrl: p.manufacturerUrl ?? undefined,
    specs: p.specifications.map((s) => ({ label: s.label, value: s.value })),
    features: p.features.map((f) => f.text),
    faqs: p.faqs.map((f) => ({ question: f.question, answer: f.answer })),
    productReviews: p.reviews.map((r) => ({
      id: r.id,
      author: r.author,
      rating: r.rating,
      date: r.reviewDate.toISOString().slice(0, 10),
      title: r.title ?? "",
      body: r.body,
      verified: r.verified,
    })),
    inStock: p.inStock,
    warranty: p.warranty ?? "",
    chemistry: p.chemistry ?? "",
    cycleLife: p.cycleLife ?? 0,
    weightLbs: p.weightLbs ?? 0,
    energyScore: p.energyScore,
    pros: p.pros,
    cons: p.cons,
    compatibility: p.compatibility,
    idealUseCases: p.idealUseCases,
    seo: p.seo
      ? {
          metaTitle: p.seo.metaTitle,
          metaDescription: p.seo.metaDescription,
          keywords: p.seo.keywords,
        }
      : undefined,
    lastSyncedAt: p.lastSyncedAt.toISOString(),
  }
}

export const productService = {
  async list(params: {
    cursor?: string
    limit?: number
    category?: string
    brand?: string
    inStock?: boolean
    sort?: "featured" | "price-asc" | "price-desc" | "rating" | "newest"
    minPrice?: number
    maxPrice?: number
  }) {
    const limit = Math.min(params.limit ?? 24, 100)
    const where: Prisma.ProductWhereInput = { isVisible: true }
    if (params.category) where.category = { slug: params.category }
    if (params.brand) where.brand = { slug: params.brand }
    if (params.inStock != null) where.inStock = params.inStock
    if (params.minPrice != null || params.maxPrice != null) {
      where.price = {}
      if (params.minPrice != null) where.price.gte = params.minPrice
      if (params.maxPrice != null) where.price.lte = params.maxPrice
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      params.sort === "price-asc"
        ? { price: "asc" }
        : params.sort === "price-desc"
          ? { price: "desc" }
          : params.sort === "rating"
            ? { rating: "desc" }
            : params.sort === "newest"
              ? { createdAt: "desc" }
              : { energyScore: "desc" }

    const items = await prisma.product.findMany({
      where,
      take: limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      orderBy,
      include: productInclude,
    })

    const hasMore = items.length > limit
    const page = hasMore ? items.slice(0, limit) : items
    const nextCursor = hasMore ? page[page.length - 1]?.id : undefined

    return {
      items: page.map(serializeProduct),
      meta: { hasMore, nextCursor, limit },
    }
  },

  async getBySlug(slug: string) {
    const product = await prisma.product.findFirst({
      where: { slug, isVisible: true },
      include: productInclude,
    })
    if (!product) throw new NotFoundError("Product not found")
    return serializeProduct(product)
  },

  async compare(ids: string[]) {
    const products = await prisma.product.findMany({
      where: { id: { in: ids }, isVisible: true },
      include: productInclude,
    })
    return products.map(serializeProduct)
  },

  async search(q: string, limit = 20) {
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean)
    const items = await prisma.searchIndex.findMany({
      where: tokens.length
        ? { OR: tokens.map((t) => ({ document: { contains: t, mode: "insensitive" as const } })) }
        : undefined,
      take: limit,
      include: { product: { include: productInclude } },
    })
    return items
      .map((i) => i.product)
      .filter((p) => p.isVisible)
      .map((p) => serializeProduct(p))
  },
}
