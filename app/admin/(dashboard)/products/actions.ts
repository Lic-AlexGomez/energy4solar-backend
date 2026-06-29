"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getEffectiveAffiliateUrl } from "@/lib/affiliate-url"
import { isPublicProductImageUrl, normalizeProductImageUrl } from "@/lib/product-image-url"
import { buildSearchDocument, tokenizeSearch } from "@/modules/sync/product.mapper"
import type { AdminProductSort } from "./products-query"
import { parseAdminProductSort } from "./products-query"

export type PriceVisibilityFilters = {
  hideZero: boolean
  hideBelow: number | null
  hideAbove: number | null
}

function parsePriceVisibilityFilters(formData: FormData): PriceVisibilityFilters {
  const hideBelowRaw = String(formData.get("hideBelow") ?? "").trim()
  const hideAboveRaw = String(formData.get("hideAbove") ?? "").trim()

  return {
    hideZero: formData.get("hideZero") === "true",
    hideBelow: hideBelowRaw === "" ? null : Number(hideBelowRaw),
    hideAbove: hideAboveRaw === "" ? null : Number(hideAboveRaw),
  }
}

function buildPriceVisibilityWhere(filters: PriceVisibilityFilters): Prisma.ProductWhereInput | null {
  const rules: Prisma.ProductWhereInput[] = []

  if (filters.hideZero) {
    rules.push({ price: { equals: 0 } })
  }
  if (filters.hideBelow != null && !Number.isNaN(filters.hideBelow)) {
    rules.push({ price: { lt: filters.hideBelow } })
  }
  if (filters.hideAbove != null && !Number.isNaN(filters.hideAbove)) {
    rules.push({ price: { gt: filters.hideAbove } })
  }

  if (!rules.length) return null
  return rules.length === 1 ? rules[0]! : { OR: rules }
}

export async function previewPriceVisibilityAction(formData: FormData) {
  const filters = parsePriceVisibilityFilters(formData)
  const where = buildPriceVisibilityWhere(filters)
  if (!where) return { total: 0, visible: 0, hidden: 0 }

  const [total, visible, hidden] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.count({ where: { ...where, isVisible: true } }),
    prisma.product.count({ where: { ...where, isVisible: false } }),
  ])

  return { total, visible, hidden }
}

export async function bulkHideByPriceAction(formData: FormData) {
  const filters = parsePriceVisibilityFilters(formData)
  const where = buildPriceVisibilityWhere(filters)
  if (!where) return { updated: 0 }

  const result = await prisma.product.updateMany({
    where: { ...where, isVisible: true },
    data: { isVisible: false },
  })

  revalidatePath("/admin/products")
  revalidatePath("/admin")
  return { updated: result.count }
}

export async function bulkShowByPriceAction(formData: FormData) {
  const filters = parsePriceVisibilityFilters(formData)
  const where = buildPriceVisibilityWhere(filters)
  if (!where) return { updated: 0 }

  const result = await prisma.product.updateMany({
    where: { ...where, isVisible: false },
    data: { isVisible: true },
  })

  revalidatePath("/admin/products")
  revalidatePath("/admin")
  return { updated: result.count }
}

export async function updateAffiliateUrlAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "")
  const url = String(formData.get("affiliateUrl") ?? "").trim()

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { affiliateUrl: true },
  })
  if (!product) return

  const override = url && url !== product.affiliateUrl ? url : null

  await prisma.product.update({
    where: { id: productId },
    data: { affiliateUrlOverride: override },
  })

  const effective = override ?? product.affiliateUrl
  await prisma.affiliateLink.updateMany({
    where: { productId, isPrimary: true },
    data: { url: effective },
  })

  revalidatePath("/admin/products")
}

export async function toggleProductVisibilityAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "")
  const isVisible = formData.get("isVisible") === "true"

  await prisma.product.update({
    where: { id: productId },
    data: { isVisible },
  })

  revalidatePath("/admin/products")
  revalidatePath("/admin")
}

export async function resetAffiliateUrlAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "")

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { affiliateUrl: true },
  })
  if (!product) return

  await prisma.product.update({
    where: { id: productId },
    data: { affiliateUrlOverride: null },
  })

  await prisma.affiliateLink.updateMany({
    where: { productId, isPrimary: true },
    data: { url: product.affiliateUrl },
  })

  revalidatePath("/admin/products")
}

export type AdminProductEdit = {
  id: string
  slug: string
  sku: string | null
  name: string
  shortDescription: string
  description: string
  price: number
  capacity: string | null
  voltage: string | null
  chemistry: string | null
  warranty: string | null
  cycleLife: number | null
  weightLbs: number | null
  badge: string | null
  inStock: boolean
  isVisible: boolean
  contentLocked: boolean
  imageUrl: string
  brandName: string | null
  categoryName: string | null
}

export async function getAdminProductForEdit(id: string): Promise<AdminProductEdit | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      brand: { select: { name: true } },
      category: { select: { name: true } },
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
    },
  })
  if (!product) return null

  const primary = product.images.find((i) => i.isPrimary) ?? product.images[0]

  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    name: product.name,
    shortDescription: product.shortDescription,
    description: product.description,
    price: Number(product.price),
    capacity: product.capacity,
    voltage: product.voltage,
    chemistry: product.chemistry,
    warranty: product.warranty,
    cycleLife: product.cycleLife,
    weightLbs: product.weightLbs,
    badge: product.badge,
    inStock: product.inStock,
    isVisible: product.isVisible,
    contentLocked: product.contentLocked,
    imageUrl: primary?.url ?? "",
    brandName: product.brand?.name ?? null,
    categoryName: product.category?.name ?? null,
  }
}

function parseOptionalNumber(raw: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : null
}

export async function updateProductAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  if (!productId || !name) return

  const priceRaw = String(formData.get("price") ?? "").trim()
  const price = Number(priceRaw)
  if (!Number.isFinite(price) || price < 0) return

  const imageUrl = String(formData.get("imageUrl") ?? "").trim()
  const contentLocked = formData.get("contentLocked") === "true"
  const inStock = formData.get("inStock") === "true"
  const isVisible = formData.get("isVisible") === "true"

  const existing = await prisma.product.findUnique({
    where: { id: productId },
    include: { brand: { select: { name: true } } },
  })
  if (!existing) return

  const shortDescription = String(formData.get("shortDescription") ?? "")
  const description = String(formData.get("description") ?? "")
  const capacity = String(formData.get("capacity") ?? "").trim() || null
  const voltage = String(formData.get("voltage") ?? "").trim() || null
  const chemistry = String(formData.get("chemistry") ?? "").trim() || null
  const warranty = String(formData.get("warranty") ?? "").trim() || null
  const badge = String(formData.get("badge") ?? "").trim() || null
  const cycleLife = parseOptionalNumber(String(formData.get("cycleLife") ?? ""))
  const weightLbs = parseOptionalNumber(String(formData.get("weightLbs") ?? ""))

  await prisma.product.update({
    where: { id: productId },
    data: {
      name,
      shortDescription,
      description,
      price,
      capacity,
      voltage,
      chemistry,
      warranty,
      cycleLife,
      weightLbs,
      badge,
      inStock,
      isVisible,
      contentLocked,
    },
  })

  if (imageUrl) {
    if (!isPublicProductImageUrl(imageUrl)) {
      redirect(`/admin/products/${productId}?error=invalid-image`)
    }

    const normalizedUrl = normalizeProductImageUrl(imageUrl)

    await prisma.productImage.deleteMany({ where: { productId } })
    await prisma.productImage.create({
      data: { productId, url: normalizedUrl, sortOrder: 0, isPrimary: true },
    })
  }

  const brandName = existing.brand?.name ?? undefined
  const doc = buildSearchDocument(name, description, existing.sku ?? undefined, brandName)
  await prisma.searchIndex.upsert({
    where: { productId },
    create: { productId, document: doc, tokens: tokenizeSearch(doc) },
    update: { document: doc, tokens: tokenizeSearch(doc) },
  })

  revalidatePath("/admin/products")
  revalidatePath(`/admin/products/${productId}`)
  revalidatePath("/admin")
  redirect(`/admin/products/${productId}?saved=1`)
}

export type AdminProductRow = {
  id: string
  name: string
  slug: string
  sku: string | null
  price: number
  isVisible: boolean
  affiliateUrl: string
  effectiveUrl: string
  hasOverride: boolean
  clickCount: number
}

export async function getAdminProducts(query: string, page: number, sortRaw?: string) {
  const take = 40
  const skip = (page - 1) * take
  const q = query.trim()
  const sort = parseAdminProductSort(sortRaw)

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { sku: { contains: q, mode: "insensitive" as const } },
          { slug: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {}

  const select = {
    id: true,
    name: true,
    slug: true,
    sku: true,
    price: true,
    isVisible: true,
    affiliateUrl: true,
    affiliateUrlOverride: true,
    affiliateLinks: { where: { isPrimary: true }, select: { clickCount: true } },
  } as const

  const [total, hidden] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.count({ where: { isVisible: false } }),
  ])

  const needsMemorySort = sort.startsWith("clicks-") || sort.startsWith("visible") || sort.startsWith("hidden")

  let rows: AdminProductRow[]

  if (needsMemorySort) {
    const products = await prisma.product.findMany({ where, select })
    rows = products.map(mapAdminProductRow)
    rows = sortAdminProductRows(rows, sort)
    rows = rows.slice(skip, skip + take)
  } else {
    const products = await prisma.product.findMany({
      where,
      orderBy: prismaOrderBy(sort),
      skip,
      take,
      select,
    })
    rows = products.map(mapAdminProductRow)
  }

  return {
    rows,
    total,
    hidden,
    page,
    pages: Math.ceil(total / take),
    sort,
  }
}

function mapAdminProductRow(p: {
  id: string
  name: string
  slug: string
  sku: string | null
  price: { toNumber?: () => number } | number | bigint
  isVisible: boolean
  affiliateUrl: string
  affiliateUrlOverride: string | null
  affiliateLinks: { clickCount: number }[]
}): AdminProductRow {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    price: Number(p.price),
    isVisible: p.isVisible,
    affiliateUrl: p.affiliateUrl,
    effectiveUrl: getEffectiveAffiliateUrl(p),
    hasOverride: Boolean(p.affiliateUrlOverride),
    clickCount: p.affiliateLinks[0]?.clickCount ?? 0,
  }
}

function prismaOrderBy(sort: AdminProductSort) {
  switch (sort) {
    case "name-desc":
      return { name: "desc" as const }
    case "price-desc":
      return { price: "desc" as const }
    case "price-asc":
      return { price: "asc" as const }
    default:
      return { name: "asc" as const }
  }
}

function sortAdminProductRows(rows: AdminProductRow[], sort: AdminProductSort) {
  const sorted = [...rows]
  switch (sort) {
    case "clicks-desc":
      sorted.sort((a, b) => b.clickCount - a.clickCount || a.name.localeCompare(b.name))
      break
    case "clicks-asc":
      sorted.sort((a, b) => a.clickCount - b.clickCount || a.name.localeCompare(b.name))
      break
    case "visible-first":
      sorted.sort((a, b) => Number(b.isVisible) - Number(a.isVisible) || a.name.localeCompare(b.name))
      break
    case "hidden-first":
      sorted.sort((a, b) => Number(a.isVisible) - Number(b.isVisible) || a.name.localeCompare(b.name))
      break
  }
  return sorted
}
