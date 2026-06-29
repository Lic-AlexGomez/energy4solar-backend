import { readFileSync } from "node:fs"
import { resolve } from "node:path"

for (const line of readFileSync(resolve(__dirname, "../.env"), "utf8").split(/\r?\n/)) {
  const t = line.trim()
  if (!t || t.startsWith("#")) continue
  const i = t.indexOf("=")
  if (i < 0) continue
  process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
}

const limitArg = process.argv.find((a) => a.startsWith("--limit="))
const limit = limitArg ? Math.max(1, Number(limitArg.split("=")[1]) || 10) : 10
const ogFallback = process.argv.includes("--og-fallback")
if (ogFallback) process.env.WOO_IMAGE_OG_FALLBACK = "true"

async function main() {
  const { prisma } = await import("../src/lib/prisma")
  const { loadWooCommerceImageCatalog, resolveWooProductMedia } = await import(
    "../src/modules/woocommerce/images"
  )

  console.log(`[test-images] limit=${limit}, og-fallback=${ogFallback ? "ON" : "OFF"}`)
  console.log("[test-images] Loading WooCommerce catalog…")

  const catalog = await loadWooCommerceImageCatalog()
  console.log("[test-images] Catalog SKUs:", catalog.size)

  const products = await prisma.product.findMany({
    where: { images: { none: {} } },
    select: { sku: true, name: true },
    orderBy: { sku: "asc" },
    take: limit,
  })

  console.log(`[test-images] Testing ${products.length} product(s) without images:\n`)

  let matched = 0
  for (const p of products) {
    const media = await resolveWooProductMedia(p.sku ?? undefined, catalog)
    const hit = media.images.length > 0
    if (hit) matched++
    const sku = (p.sku ?? "no-sku").padEnd(22)
    const status = hit ? "OK  " : "MISS"
    const detail = hit ? media.images[0]!.slice(0, 72) : p.name.slice(0, 50)
    console.log(`${sku} ${status}  ${detail}`)
  }

  console.log(`\n[test-images] Matched ${matched}/${products.length}`)
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error("[test-images] Failed:", err)
  process.exit(1)
})
