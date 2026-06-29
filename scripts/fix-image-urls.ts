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
  const { normalizeProductImageUrl } = await import("../src/lib/product-image-url")

  const images = await prisma.productImage.findMany({ select: { id: true, url: true } })
  let fixed = 0

  for (const image of images) {
    const normalized = normalizeProductImageUrl(image.url)
    if (normalized !== image.url) {
      await prisma.productImage.update({ where: { id: image.id }, data: { url: normalized } })
      fixed += 1
    }
  }

  const [total, withImages] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { images: { some: {} } } }),
  ])

  console.log(JSON.stringify({ imagesChecked: images.length, fixed, total, withImages }))
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
