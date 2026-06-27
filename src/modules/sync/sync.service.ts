import { prisma } from "@/lib/prisma"
import { uniqueProductSlug } from "@/lib/slug"
import { getZohoClient } from "@/modules/zoho/client"
import type { ZohoItem } from "@/modules/zoho/types"
import { SyncStatus } from "@prisma/client"
import {
  buildSearchDocument,
  inferBrandName,
  inferCategorySlug,
  mapZohoItemToProductData,
  tokenizeSearch,
} from "./product.mapper"

export type SyncResult = {
  logId: string
  itemsFetched: number
  itemsUpserted: number
  itemsFailed: number
  priceChanges: number
  status: SyncStatus
}

export const zohoSyncService = {
  async runFullSync(): Promise<SyncResult> {
    const log = await prisma.syncLog.create({ data: { status: SyncStatus.RUNNING } })
    let itemsFetched = 0
    let itemsUpserted = 0
    let itemsFailed = 0
    let priceChanges = 0
    const errors: string[] = []

    try {
      const zoho = getZohoClient()
      for await (const batch of zoho.listItems()) {
        for (const item of batch) {
          itemsFetched += 1
          try {
            const changed = await upsertZohoItem(item)
            itemsUpserted += 1
            if (changed) priceChanges += 1
          } catch (err) {
            itemsFailed += 1
            errors.push(`${item.item_id}: ${err instanceof Error ? err.message : String(err)}`)
          }
        }
      }

      const status =
        itemsFailed === 0 ? SyncStatus.SUCCESS : itemsUpserted > 0 ? SyncStatus.PARTIAL : SyncStatus.FAILED

      await prisma.syncLog.update({
        where: { id: log.id },
        data: {
          status,
          finishedAt: new Date(),
          itemsFetched,
          itemsUpserted,
          itemsFailed,
          priceChanges,
          errorMessage: errors.length ? errors.slice(0, 20).join("\n") : null,
        },
      })

      return { logId: log.id, itemsFetched, itemsUpserted, itemsFailed, priceChanges, status }
    } catch (err) {
      await prisma.syncLog.update({
        where: { id: log.id },
        data: {
          status: SyncStatus.FAILED,
          finishedAt: new Date(),
          errorMessage: err instanceof Error ? err.message : String(err),
        },
      })
      throw err
    }
  },
}

async function upsertZohoItem(item: ZohoItem): Promise<boolean> {
  const categorySlug = inferCategorySlug(item)
  const brandName = inferBrandName(item)

  const category = await prisma.category.upsert({
    where: { slug: categorySlug },
    create: { slug: categorySlug, name: titleCase(categorySlug.replace(/-/g, " ")) },
    update: {},
  })

  const brandSlug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "bigbattery"
  const brand = await prisma.brand.upsert({
    where: { slug: brandSlug },
    create: { slug: brandSlug, name: brandName },
    update: { name: brandName },
  })

  const mapped = mapZohoItemToProductData(item, category.id, brand.id)

  const existing = await prisma.product.findUnique({
    where: { zohoItemId: mapped.zohoItemId },
    select: { id: true, price: true, slug: true },
  })

  const slug =
    existing?.slug ??
    (await uniqueProductSlug(mapped.name, async (s) => Boolean(await prisma.product.findUnique({ where: { slug: s } }))))

  let priceChanged = false
  if (existing && Number(existing.price) !== mapped.price) {
    priceChanged = true
    await prisma.priceHistory.create({
      data: { productId: existing.id, price: mapped.price, source: "zoho_sync" },
    })
  }

  const product = existing
    ? await prisma.product.update({
        where: { id: existing.id },
        data: {
          name: mapped.name,
          sku: mapped.sku,
          shortDescription: mapped.shortDescription,
          description: mapped.description,
          price: mapped.price,
          inStock: mapped.inStock,
          stockOnHand: mapped.stockOnHand,
          affiliateUrl: mapped.affiliateUrl,
          manufacturerUrl: mapped.manufacturerUrl,
          categoryId: mapped.categoryId,
          brandId: mapped.brandId,
          capacity: mapped.capacity,
          voltage: mapped.voltage,
          chemistry: mapped.chemistry,
          warranty: mapped.warranty,
          cycleLife: mapped.cycleLife,
          weightLbs: mapped.weightLbs,
          energyScore: mapped.energyScore,
          zohoRaw: mapped.zohoRaw,
          lastSyncedAt: new Date(),
        },
      })
    : await prisma.product.create({
        data: {
          zohoItemId: mapped.zohoItemId,
          slug,
          sku: mapped.sku,
          name: mapped.name,
          shortDescription: mapped.shortDescription,
          description: mapped.description,
          price: mapped.price,
          inStock: mapped.inStock,
          stockOnHand: mapped.stockOnHand,
          affiliateUrl: mapped.affiliateUrl,
          manufacturerUrl: mapped.manufacturerUrl,
          categoryId: mapped.categoryId,
          brandId: mapped.brandId,
          capacity: mapped.capacity,
          voltage: mapped.voltage,
          chemistry: mapped.chemistry,
          warranty: mapped.warranty,
          cycleLife: mapped.cycleLife,
          weightLbs: mapped.weightLbs,
          energyScore: mapped.energyScore,
          zohoRaw: mapped.zohoRaw,
        },
      })

  await prisma.productImage.deleteMany({ where: { productId: product.id } })
  if (mapped.images.length) {
    await prisma.productImage.createMany({
      data: mapped.images.map((url, i) => ({
        productId: product.id,
        url,
        sortOrder: i,
        isPrimary: i === 0,
      })),
    })
  }

  await prisma.productSpecification.deleteMany({ where: { productId: product.id } })
  await prisma.productSpecification.createMany({
    data: mapped.specifications.map((s, i) => ({
      productId: product.id,
      label: s.label,
      value: s.value,
      sortOrder: i,
    })),
  })

  await prisma.productFeature.deleteMany({ where: { productId: product.id } })
  await prisma.productFeature.createMany({
    data: mapped.features.map((text, i) => ({ productId: product.id, text, sortOrder: i })),
  })

  const existingLink = await prisma.affiliateLink.findFirst({
    where: { productId: product.id, isPrimary: true },
  })
  if (existingLink) {
    await prisma.affiliateLink.update({
      where: { id: existingLink.id },
      data: { url: mapped.affiliateUrl },
    })
  } else {
    await prisma.affiliateLink.create({
      data: { productId: product.id, url: mapped.affiliateUrl, isPrimary: true },
    })
  }

  const doc = buildSearchDocument(mapped.name, mapped.description, mapped.sku, brandName)
  await prisma.searchIndex.upsert({
    where: { productId: product.id },
    create: { productId: product.id, document: doc, tokens: tokenizeSearch(doc) },
    update: { document: doc, tokens: tokenizeSearch(doc) },
  })

  await prisma.brand.update({
    where: { id: brand.id },
    data: { productCount: await prisma.product.count({ where: { brandId: brand.id } }) },
  })

  return priceChanged
}

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}
