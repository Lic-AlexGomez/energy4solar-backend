import { readFileSync } from "node:fs"
import { resolve } from "node:path"

for (const line of readFileSync(resolve(__dirname, "../.env"), "utf8").split(/\r?\n/)) {
  const t = line.trim()
  if (!t || t.startsWith("#")) continue
  const i = t.indexOf("=")
  if (i < 0) continue
  process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
}

if (process.argv.includes("--og-fallback")) {
  process.env.WOO_IMAGE_OG_FALLBACK = "true"
}

const fixBroken = process.argv.includes("--fix-broken")
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function main() {
  const { prisma } = await import("../src/lib/prisma")
  const { filterPublicProductImageUrls } = await import("../src/lib/product-image-url")
  const { loadWooCommerceImageCatalog, resolveWooProductMedia } = await import(
    "../src/modules/woocommerce/images"
  )

  const ogFallback = process.env.WOO_IMAGE_OG_FALLBACK === "true"
  console.log("[images] OG fallback:", ogFallback ? "ON" : "OFF")
  console.log("[images] Fix broken Zoho URLs:", fixBroken ? "ON" : "OFF")
  console.log("[images] Loading WooCommerce catalog…")
  const catalog = await loadWooCommerceImageCatalog()
  console.log("[images] SKUs in catalog:", catalog.size)

  const products = await prisma.product.findMany({
    where: fixBroken
      ? {
          OR: [
            { images: { none: {} } },
            { images: { some: { url: { contains: "zohoapis.com/books/v3/documents" } } } },
          ],
        }
      : { images: { none: {} } },
    select: { id: true, sku: true, name: true },
    orderBy: { sku: "asc" },
  })

  console.log(`[images] Products to process: ${products.length}`)

  let updated = 0
  let failed = 0
  for (let i = 0; i < products.length; i++) {
    const product = products[i]!
    await prisma.productImage.deleteMany({ where: { productId: product.id } })

    const media = await resolveWooProductMedia(product.sku ?? undefined, catalog)
    const urls = filterPublicProductImageUrls(media.images)

    if (!urls.length) {
      failed += 1
      if ((i + 1) % 25 === 0) {
        console.log(`[images] Progress ${i + 1}/${products.length} — updated: ${updated}, missed: ${failed}`)
      }
      if (ogFallback) await sleep(80)
      continue
    }

    await prisma.productImage.createMany({
      data: urls.map((url, idx) => ({
        productId: product.id,
        url,
        sortOrder: idx,
        isPrimary: idx === 0,
      })),
    })
    updated += 1

    if ((i + 1) % 25 === 0 || i === products.length - 1) {
      console.log(`[images] Progress ${i + 1}/${products.length} — updated: ${updated}, missed: ${failed}`)
    }
    if (ogFallback) await sleep(50)
  }

  const withImages = await prisma.product.count({
    where: { images: { some: {} } },
  })
  const total = await prisma.product.count()

  console.log(`[images] Done. Newly updated: ${updated}. With images: ${withImages}/${total}`)
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
