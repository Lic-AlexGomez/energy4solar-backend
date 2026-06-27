import { readFileSync } from "node:fs"
import { resolve } from "node:path"

for (const line of readFileSync(resolve(__dirname, "../.env"), "utf8").split(/\r?\n/)) {
  const t = line.trim()
  if (!t || t.startsWith("#")) continue
  const i = t.indexOf("=")
  if (i < 0) continue
  process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
}

async function main() {
  const { prisma } = await import("../src/lib/prisma")
  const { loadWooCommerceImageCatalog, resolveWooProductMedia } = await import(
    "../src/modules/woocommerce/images"
  )

  console.log("[images] Loading WooCommerce catalog…")
  const catalog = await loadWooCommerceImageCatalog()
  console.log("[images] SKUs in catalog:", catalog.size)

  const products = await prisma.product.findMany({
    select: { id: true, sku: true, name: true },
  })

  let updated = 0
  for (const product of products) {
    const media = await resolveWooProductMedia(product.sku ?? undefined, catalog)
    if (!media.images.length) continue

    await prisma.productImage.deleteMany({ where: { productId: product.id } })
    await prisma.productImage.createMany({
      data: media.images.map((url, i) => ({
        productId: product.id,
        url,
        sortOrder: i,
        isPrimary: i === 0,
      })),
    })
    updated += 1
  }

  console.log(`[images] Updated ${updated} / ${products.length} products`)
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
