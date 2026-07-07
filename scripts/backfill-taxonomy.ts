import { readFileSync } from "node:fs"
import { resolve } from "node:path"

/** Load .env and override shell defaults (e.g. local DATABASE_URL=localhost). */
function loadEnvFile() {
  const envPath = resolve(__dirname, "../.env")
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
}

loadEnvFile()

/**
 * Backfill derived taxonomy (compatibility / idealUseCases / pros / cons) for
 * products already in the DB, without waiting for a full Zoho sync. Only fills
 * fields that are currently empty, so manual admin overrides are preserved.
 */
async function main() {
  const { prisma } = await import("@/lib/prisma")
  const { deriveProductTaxonomy } = await import("@/modules/sync/product-taxonomy")
  const { computeEnergyScore } = await import("@/modules/sync/energy-score")

  const products = await prisma.product.findMany({
    include: { category: true },
  })

  let updated = 0
  for (const p of products) {
    const categorySlug = p.category?.slug ?? "home-batteries"
    const taxonomy = deriveProductTaxonomy({
      categorySlug,
      name: p.name,
      chemistry: p.chemistry,
      cycleLife: p.cycleLife,
      warranty: p.warranty,
    })

    // Recompute the value-based score using full DB data (rating/reviews/badge).
    const energyScore = computeEnergyScore({
      price: Number(p.price),
      capacity: p.capacity,
      voltage: p.voltage,
      rating: p.rating,
      reviewCount: p.reviewCount,
      cycleLife: p.cycleLife,
      warranty: p.warranty,
      inStock: p.inStock,
      badge: p.badge,
    })

    const data = {
      ...(p.compatibility.length ? {} : { compatibility: taxonomy.compatibility }),
      ...(p.idealUseCases.length ? {} : { idealUseCases: taxonomy.idealUseCases }),
      ...(p.pros.length ? {} : { pros: taxonomy.pros }),
      ...(p.cons.length ? {} : { cons: taxonomy.cons }),
      ...(energyScore !== p.energyScore ? { energyScore } : {}),
    }

    if (Object.keys(data).length === 0) continue
    await prisma.product.update({ where: { id: p.id }, data })
    updated += 1
  }

  console.log(`[backfill-taxonomy] Updated ${updated}/${products.length} products.`)
  process.exit(0)
}

main().catch((err) => {
  console.error("[backfill-taxonomy] Fatal error:", err)
  process.exit(1)
})
