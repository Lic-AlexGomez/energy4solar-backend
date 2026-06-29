import pg from "pg"

const ref = "lpcqeljhfxzpebxusqjo"
const passwords = ["BB400Maple.", "bb400maple", "BB400Maple"]
const regions = [
  "us-west-2",
  "us-west-1",
  "us-east-1",
  "us-east-2",
  "eu-west-1",
  "eu-central-1",
  "ap-southeast-1",
  "ap-northeast-1",
  "sa-east-1",
]

async function probe(label: string, url: string) {
  const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 5000 })
  try {
    await client.connect()
    await client.query("SELECT 1")
    await client.end()
    return label
  } catch {
    try {
      await client.end()
    } catch {
      /* ignore */
    }
    return null
  }
}

async function main() {
  for (const pw of passwords) {
    const enc = encodeURIComponent(pw)
    const direct = `postgresql://postgres:${enc}@db.${ref}.supabase.co:5432/postgres`
    const hit = await probe("direct", direct)
    if (hit) {
      console.log("OK", direct)
      return
    }

    for (const region of regions) {
      for (const aws of [0, 1]) {
        for (const port of [5432, 6543]) {
          const url = `postgresql://postgres.${ref}:${enc}@aws-${aws}-${region}.pooler.supabase.com:${port}/postgres`
          const ok = await probe(`${aws}-${region}:${port}`, url)
          if (ok) {
            console.log("OK", url)
            return
          }
        }
      }
    }
  }
  console.log("NO_MATCH")
}

main().catch(console.error)
