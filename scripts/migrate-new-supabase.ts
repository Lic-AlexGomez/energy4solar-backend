import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { execSync } from "node:child_process"
import pg from "pg"
import { loadEnvFile } from "./load-env"

const REF = "lpcqeljhfxzpebxusqjo"
const BACKUP = process.argv[2] ?? "backups/energy4solar-2026-06-29"

function readPassword(): string {
  const fromEnv = process.env.NEW_DB_PASSWORD?.trim()
  if (fromEnv) return fromEnv

  const path = resolve(__dirname, "../.db-password")
  try {
    const pw = readFileSync(path, "utf8").trim()
    if (pw) return pw
  } catch {
    /* missing */
  }

  throw new Error(
    "Set NEW_DB_PASSWORD env var or create energy4solar-backend/.db-password with your Supabase database password (one line).",
  )
}

async function discoverDatabaseUrl(password: string): Promise<{ databaseUrl: string; directUrl: string }> {
  const enc = encodeURIComponent(password)
  const candidates: string[] = [
    `postgresql://postgres:${enc}@db.${REF}.supabase.co:5432/postgres`,
  ]

  const regions = ["us-west-2", "us-west-1", "us-east-1", "eu-west-1", "eu-central-1", "ap-southeast-1"]
  for (const region of regions) {
    for (const aws of [0, 1]) {
      candidates.push(
        `postgresql://postgres.${REF}:${enc}@aws-${aws}-${region}.pooler.supabase.com:5432/postgres`,
      )
      candidates.push(
        `postgresql://postgres.${REF}:${enc}@aws-${aws}-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true`,
      )
    }
  }

  for (const url of candidates) {
    const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 6000 })
    try {
      await client.connect()
      await client.query("SELECT 1")
      await client.end()
      const directUrl = url.includes(":6543")
        ? url.replace(":6543", ":5432").replace("?pgbouncer=true", "")
        : url
      return { databaseUrl: url, directUrl }
    } catch {
      try {
        await client.end()
      } catch {
        /* ignore */
      }
    }
  }

  throw new Error("Could not connect to the new Supabase database. Check the password and project status.")
}

function patchEnvFile(databaseUrl: string, directUrl: string) {
  const envPath = resolve(__dirname, "../.env")
  let content = readFileSync(envPath, "utf8")
  const lines = content.split(/\r?\n/)
  const set = (key: string, value: string) => {
    const i = lines.findIndex((l) => l.startsWith(`${key}=`))
    const row = `${key}=${value}`
    if (i >= 0) lines[i] = row
    else lines.push(row)
  }
  set("DATABASE_URL", databaseUrl)
  set("DIRECT_URL", directUrl)
  set("SUPABASE_URL", `https://${REF}.supabase.co`)
  writeFileSync(envPath, lines.join("\n"), "utf8")
}

async function main() {
  loadEnvFile(".env", true)
  const password = readPassword()
  console.log("Discovering connection URL...")
  const { databaseUrl, directUrl } = await discoverDatabaseUrl(password)
  console.log("Connected. Updating .env...")

  patchEnvFile(databaseUrl, directUrl)

  console.log("Creating schema...")
  const client = new pg.Client({ connectionString: directUrl, connectionTimeoutMillis: 10000 })
  await client.connect()
  await client.query(`CREATE SCHEMA IF NOT EXISTS energy4solar`)
  await client.end()

  console.log("Pushing Prisma schema...")
  execSync("npx prisma db push", { stdio: "inherit", cwd: resolve(__dirname, "..") })

  console.log("Importing backup...")
  execSync(`npx tsx scripts/import-energy4solar.ts "${BACKUP}"`, {
    stdio: "inherit",
    cwd: resolve(__dirname, ".."),
  })

  console.log("Pushing env to Vercel (production)...")
  const root = resolve(__dirname, "..")
  for (const [key, value] of [
    ["DATABASE_URL", databaseUrl],
    ["DIRECT_URL", directUrl],
    ["SUPABASE_URL", `https://${REF}.supabase.co`],
  ] as const) {
    try {
      execSync(`npx vercel env rm ${key} production --yes`, { stdio: "pipe", cwd: root })
    } catch {
      /* ignore */
    }
    execSync(`npx vercel env add ${key} production`, {
      input: value,
      stdio: ["pipe", "inherit", "inherit"],
      cwd: root,
    })
  }

  console.log("\nMigration complete. Run: npx vercel --prod (or redeploy in dashboard)")
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
