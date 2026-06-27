"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getEffectiveAffiliateUrl } from "@/lib/affiliate-url"

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

export async function getAdminProducts(query: string, page: number) {
  const take = 40
  const skip = (page - 1) * take
  const q = query.trim()

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { sku: { contains: q, mode: "insensitive" as const } },
          { slug: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {}

  const [products, total, hidden] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take,
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        price: true,
        isVisible: true,
        affiliateUrl: true,
        affiliateUrlOverride: true,
        affiliateLinks: { where: { isPrimary: true }, select: { clickCount: true } },
      },
    }),
    prisma.product.count({ where }),
    prisma.product.count({ where: { isVisible: false } }),
  ])

  const rows: AdminProductRow[] = products.map((p) => ({
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
  }))

  return {
    rows,
    total,
    hidden,
    page,
    pages: Math.ceil(total / take),
  }
}
