import { loadEnvFile } from "./load-env"

loadEnvFile(".env", true)

async function main() {
  const confirm = process.argv.includes("--confirm")
  if (!confirm) {
    console.error(
      "This DELETES all data in schema energy4solar (products, blog, clicks, etc.).\n" +
        "public schema (commissions app) is NOT touched.\n\n" +
        "Run export first: npm run export-energy4solar\n" +
        "Then purge: npm run purge-energy4solar -- --confirm",
    )
    process.exit(1)
  }

  const { prisma } = await import("../src/lib/prisma")

  console.log("Dropping schema energy4solar...")
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "energy4solar" CASCADE`)
  await prisma.$executeRawUnsafe(`CREATE SCHEMA "energy4solar"`)

  console.log("Schema dropped and recreated (empty).")
  console.log("Run: npx prisma db push")
  console.log("Then restore: npm run import-energy4solar -- backups/energy4solar-YYYY-MM-DD")

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
