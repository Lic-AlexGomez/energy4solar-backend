import { execSync } from "node:child_process"
import { existsSync } from "node:fs"
import { resolve } from "node:path"
import { loadEnvFile } from "./load-env"

loadEnvFile(".env", true)

async function main() {
  const backupDir = process.argv[2] ?? "backups/energy4solar-2026-06-29"
  const abs = resolve(process.cwd(), backupDir)

  if (!existsSync(resolve(abs, "manifest.json"))) {
    console.error(`Backup not found: ${abs}`)
    console.error("Run: npm run export-energy4solar")
    process.exit(1)
  }

  const dbUrl = process.env.DATABASE_URL ?? ""
  if (dbUrl.includes("evgmeszyxjzrrbrzznhv")) {
    console.error(
      "DATABASE_URL still points to the OLD Supabase project (evgmeszyxjzrrbrzznhv).\n" +
        "Update .env with the NEW project connection strings first, then run this again.",
    )
    process.exit(1)
  }

  console.log("1/4 Creating energy4solar schema...")
  const { prisma } = await import("../src/lib/prisma")
  await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "energy4solar"`)
  await prisma.$disconnect()

  console.log("2/4 Pushing Prisma schema...")
  execSync("npx prisma db push", { stdio: "inherit", cwd: resolve(__dirname, "..") })

  console.log("3/4 Importing backup...")
  execSync(`npx tsx scripts/import-energy4solar.ts "${backupDir}"`, {
    stdio: "inherit",
    cwd: resolve(__dirname, ".."),
  })

  console.log("4/4 Verifying counts...")
  const { prisma: p2 } = await import("../src/lib/prisma")
  const [products, blog, brands] = await Promise.all([
    p2.product.count(),
    p2.blogPost.count(),
    p2.brand.count(),
  ])
  console.log({ products, blog, brands })
  await p2.$disconnect()

  console.log("\nDone. Update Vercel DATABASE_URL + DIRECT_URL + SUPABASE_URL, then redeploy backend.")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
