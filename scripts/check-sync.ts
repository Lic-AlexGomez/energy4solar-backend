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
  const [products, log] = await Promise.all([
    prisma.product.count(),
    prisma.syncLog.findFirst({ orderBy: { startedAt: "desc" } }),
  ])
  console.log("products:", products)
  console.log("sync:", log?.status, "fetched:", log?.itemsFetched, "upserted:", log?.itemsUpserted)
  await prisma.$disconnect()
}

main()
