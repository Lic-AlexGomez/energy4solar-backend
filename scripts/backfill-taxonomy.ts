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

function titleCase(s: string) {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Backfill for products already in the DB, without a full Zoho sync:
 *  - re-infer the category from the stored zohoRaw (fixes everything having
 *    been lumped into "home-batteries"),
 *  - derive compatibility / idealUseCases / pros / cons,
 *  - recompute the value-based Energy4Solar Score.
 *
 * Derived taxonomy is only written when empty OR when the category changed
 * (its old values were derived from the wrong category); a real category change
 * always refreshes them. Manual overrides on an unchanged category are kept.
 */
async function main() {
  const { prisma } = await import("@/lib/prisma")
  const { deriveProductTaxonomy } = await import("@/modules/sync/product-taxonomy")
  const { computeEnergyScore } = await import("@/modules/sync/energy-score")
  const { inferCategorySlug } = await import("@/modules/sync/product.mapper")

  const categoryIdBySlug = new Map<string, string>()
  async function resolveCategoryId(slug: string) {
    const cached = categoryIdBySlug.get(slug)
    if (cached) return cached
    const category = await prisma.category.upsert({
      where: { slug },
      create: { slug, name: titleCase(slug) },
      update: {},
    })
    categoryIdBySlug.set(slug, category.id)
    return category.id
  }

  const products = await prisma.product.findMany({ include: { category: true } })

  let updated = 0
  let recategorized = 0
  for (const p of products) {
    const currentSlug = p.category?.slug ?? null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = p.zohoRaw as any
    const newSlug =
      raw && typeof raw.name === "string" ? inferCategorySlug(raw) : currentSlug ?? "home-batteries"
    const categoryChanged = newSlug !== currentSlug

    const taxonomy = deriveProductTaxonomy({
      categorySlug: newSlug,
      name: p.name,
      voltage: p.voltage,
      chemistry: p.chemistry,
      cycleLife: p.cycleLife,
      warranty: p.warranty,
    })

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

    const refreshTaxonomy = categoryChanged
    const data = {
      ...(categoryChanged ? { categoryId: await resolveCategoryId(newSlug) } : {}),
      ...(refreshTaxonomy || !p.compatibility.length ? { compatibility: taxonomy.compatibility } : {}),
      ...(refreshTaxonomy || !p.idealUseCases.length ? { idealUseCases: taxonomy.idealUseCases } : {}),
      ...(refreshTaxonomy || !p.pros.length ? { pros: taxonomy.pros } : {}),
      ...(refreshTaxonomy || !p.cons.length ? { cons: taxonomy.cons } : {}),
      ...(energyScore !== p.energyScore ? { energyScore } : {}),
    }

    if (Object.keys(data).length === 0) continue
    await prisma.product.update({ where: { id: p.id }, data })
    updated += 1
    if (categoryChanged) recategorized += 1
  }

  // Refresh cached product counts per brand (categories are counted live by API).
  const brands = await prisma.brand.findMany({ select: { id: true } })
  for (const b of brands) {
    await prisma.brand.update({
      where: { id: b.id },
      data: { productCount: await prisma.product.count({ where: { brandId: b.id } }) },
    })
  }

  console.log(
    `[backfill-taxonomy] Updated ${updated}/${products.length} products (${recategorized} recategorized).`,
  )
  process.exit(0)
}

main().catch((err) => {
  console.error("[backfill-taxonomy] Fatal error:", err)
  process.exit(1)
})
