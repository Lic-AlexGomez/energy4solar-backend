const ref = "lpcqeljhfxzpebxusqjo"
const password = process.env.TEST_DB_PASSWORD ?? "BB400Maple."

const urls = [
  `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`,
  `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-us-west-2.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-us-west-2.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-1-us-west-2.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-1-us-east-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
]

async function tryUrl(label: string, url: string) {
  process.env.DATABASE_URL = url
  process.env.DIRECT_URL = url
  const { prisma } = await import("../src/lib/prisma")
  try {
    await prisma.$queryRaw`SELECT 1 AS ok`
    await prisma.$disconnect()
    console.log("OK", label)
    console.log(url)
    return true
  } catch (e) {
    const msg = e instanceof Error ? e.message.split("\n").pop() : String(e)
    console.log("FAIL", label, msg)
    await prisma.$disconnect().catch(() => {})
    return false
  }
}

async function main() {
  for (const url of urls) {
    if (await tryUrl(url.slice(0, 60), url)) return
  }
  console.log("NO_MATCH")
}

main().catch(console.error)
