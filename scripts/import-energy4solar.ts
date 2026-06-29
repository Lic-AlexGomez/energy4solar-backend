import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"
import { loadEnvFile } from "./load-env"

loadEnvFile(".env", true)

function readJson<T>(dir: string, file: string): T[] {
  const path = resolve(dir, file)
  if (!existsSync(path)) return []
  return JSON.parse(readFileSync(path, "utf8")) as T[]
}

async function main() {
  const dir = process.argv[2]
  if (!dir) {
    console.error("Usage: npm run import-energy4solar -- backups/energy4solar-YYYY-MM-DD")
    process.exit(1)
  }

  const abs = resolve(process.cwd(), dir)
  const { prisma } = await import("../src/lib/prisma")

  console.log(`Importing from ${abs}`)

  // Parent tables first
  if (readJson(abs, "Brand.json").length) {
    await prisma.brand.createMany({ data: readJson(abs, "Brand.json"), skipDuplicates: true })
  }
  if (readJson(abs, "Category.json").length) {
    await prisma.category.createMany({ data: readJson(abs, "Category.json"), skipDuplicates: true })
  }
  if (readJson(abs, "GuideCategory.json").length) {
    await prisma.guideCategory.createMany({ data: readJson(abs, "GuideCategory.json"), skipDuplicates: true })
  }
  if (readJson(abs, "Product.json").length) {
    await prisma.product.createMany({ data: readJson(abs, "Product.json"), skipDuplicates: true })
  }
  if (readJson(abs, "Guide.json").length) {
    await prisma.guide.createMany({ data: readJson(abs, "Guide.json"), skipDuplicates: true })
  }
  if (readJson(abs, "BlogPost.json").length) {
    await prisma.blogPost.createMany({ data: readJson(abs, "BlogPost.json"), skipDuplicates: true })
  }

  const childTables: [string, (data: unknown[]) => Promise<unknown>][] = [
    ["ProductImage.json", (d) => prisma.productImage.createMany({ data: d as never[], skipDuplicates: true })],
    ["ProductSpecification.json", (d) => prisma.productSpecification.createMany({ data: d as never[], skipDuplicates: true })],
    ["ProductFeature.json", (d) => prisma.productFeature.createMany({ data: d as never[], skipDuplicates: true })],
    ["ProductFAQ.json", (d) => prisma.productFAQ.createMany({ data: d as never[], skipDuplicates: true })],
    ["ProductReview.json", (d) => prisma.productReview.createMany({ data: d as never[], skipDuplicates: true })],
    ["ProductSEO.json", (d) => prisma.productSEO.createMany({ data: d as never[], skipDuplicates: true })],
    ["GuideSEO.json", (d) => prisma.guideSEO.createMany({ data: d as never[], skipDuplicates: true })],
    ["AffiliateLink.json", (d) => prisma.affiliateLink.createMany({ data: d as never[], skipDuplicates: true })],
    ["AffiliateClick.json", (d) => prisma.affiliateClick.createMany({ data: d as never[], skipDuplicates: true })],
    ["SitePageview.json", (d) => prisma.sitePageview.createMany({ data: d as never[], skipDuplicates: true })],
    ["PriceHistory.json", (d) => prisma.priceHistory.createMany({ data: d as never[], skipDuplicates: true })],
    ["SearchIndex.json", (d) => prisma.searchIndex.createMany({ data: d as never[], skipDuplicates: true })],
    ["CommissionRecord.json", (d) => prisma.commissionRecord.createMany({ data: d as never[], skipDuplicates: true })],
    ["AdminUser.json", (d) => prisma.adminUser.createMany({ data: d as never[], skipDuplicates: true })],
    ["SyncLog.json", (d) => prisma.syncLog.createMany({ data: d as never[], skipDuplicates: true })],
  ]

  for (const [file, insert] of childTables) {
    const rows = readJson(abs, file)
    if (rows.length) {
      await insert(rows)
      console.log(`${file}: ${rows.length}`)
    }
  }

  console.log("Import complete.")
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
