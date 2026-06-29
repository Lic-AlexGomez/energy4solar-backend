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
  const [total, withImages, hidden] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { images: { some: {} } } }),
    prisma.product.count({ where: { isVisible: false } }),
  ])
  console.log(
    JSON.stringify({
      total,
      withImages,
      withoutImages: total - withImages,
      pctWithImages: total ? Math.round((withImages / total) * 100) : 0,
      hidden,
      visible: total - hidden,
    }),
  )
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
