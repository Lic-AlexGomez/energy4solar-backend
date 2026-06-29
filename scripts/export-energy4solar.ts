import { mkdirSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { loadEnvFile } from "./load-env"

loadEnvFile(".env", true)

const OUT_DIR = resolve(
  __dirname,
  "..",
  "backups",
  `energy4solar-${new Date().toISOString().slice(0, 10)}`,
)

async function dump(name: string, rows: unknown[]) {
  const path = resolve(OUT_DIR, `${name}.json`)
  writeFileSync(path, JSON.stringify(rows, null, 2), "utf8")
  console.log(`${name}: ${rows.length} rows`)
  return rows.length
}

async function main() {
  const { prisma } = await import("../src/lib/prisma")
  mkdirSync(OUT_DIR, { recursive: true })

  console.log(`Exporting to ${OUT_DIR}`)

  const counts: Record<string, number> = {}

  counts.Brand = await dump("Brand", await prisma.brand.findMany())
  counts.Category = await dump("Category", await prisma.category.findMany())
  counts.Product = await dump("Product", await prisma.product.findMany())
  counts.ProductImage = await dump("ProductImage", await prisma.productImage.findMany())
  counts.ProductSpecification = await dump(
    "ProductSpecification",
    await prisma.productSpecification.findMany(),
  )
  counts.ProductFeature = await dump("ProductFeature", await prisma.productFeature.findMany())
  counts.ProductFAQ = await dump("ProductFAQ", await prisma.productFAQ.findMany())
  counts.ProductReview = await dump("ProductReview", await prisma.productReview.findMany())
  counts.ProductSEO = await dump("ProductSEO", await prisma.productSEO.findMany())
  counts.GuideCategory = await dump("GuideCategory", await prisma.guideCategory.findMany())
  counts.Guide = await dump("Guide", await prisma.guide.findMany())
  counts.GuideSEO = await dump("GuideSEO", await prisma.guideSEO.findMany())
  counts.AffiliateLink = await dump("AffiliateLink", await prisma.affiliateLink.findMany())
  counts.AffiliateClick = await dump("AffiliateClick", await prisma.affiliateClick.findMany())
  counts.SitePageview = await dump("SitePageview", await prisma.sitePageview.findMany())
  counts.PriceHistory = await dump("PriceHistory", await prisma.priceHistory.findMany())
  counts.SearchIndex = await dump("SearchIndex", await prisma.searchIndex.findMany())
  counts.BlogPost = await dump("BlogPost", await prisma.blogPost.findMany())
  counts.CommissionRecord = await dump("CommissionRecord", await prisma.commissionRecord.findMany())
  counts.AdminUser = await dump("AdminUser", await prisma.adminUser.findMany())
  counts.SyncLog = await dump("SyncLog", await prisma.syncLog.findMany())

  const manifest = {
    exportedAt: new Date().toISOString(),
    schema: "energy4solar",
    counts,
    restore: "npm run import-energy4solar -- backups/energy4solar-YYYY-MM-DD",
  }
  writeFileSync(resolve(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8")

  console.log("\nDone.", manifest)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
