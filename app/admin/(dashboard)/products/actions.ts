"use server"

import { revalidatePath } from "next/cache"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getEffectiveAffiliateUrl } from "@/lib/affiliate-url"
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
