import { loadEnvFile } from "./load-env"

loadEnvFile(".env", true)

async function main() {
  const { prisma } = await import("../src/lib/prisma")

  const tables = await prisma.$queryRaw<
    { table_name: string; bytes: bigint }[]
  >`
    SELECT c.relname AS table_name, pg_total_relation_size(c.oid) AS bytes
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'energy4solar' AND c.relkind = 'r'
    ORDER BY bytes DESC
  `

  const schemas = await prisma.$queryRaw<
    { nspname: string; bytes: bigint }[]
  >`
    SELECT n.nspname, sum(pg_total_relation_size(c.oid))::bigint AS bytes
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname IN ('public', 'energy4solar') AND c.relkind = 'r'
    GROUP BY n.nspname
    ORDER BY bytes DESC
  `

  const totalE4s = tables.reduce((s, r) => s + Number(r.bytes), 0)

  console.log(
    JSON.stringify(
      {
        energy4solar_mb: Math.round((totalE4s / 1024 / 1024) * 10) / 10,
        tables: tables.map((r) => ({
          table: r.table_name,
          mb: Math.round((Number(r.bytes) / 1024 / 1024) * 100) / 100,
        })),
        schemas: schemas.map((r) => ({
          schema: r.nspname,
          mb: Math.round((Number(r.bytes) / 1024 / 1024) * 10) / 10,
        })),
      },
      null,
      2,
    ),
  )

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
