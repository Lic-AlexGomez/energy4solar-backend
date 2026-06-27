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

async function main() {
  const { zohoSyncService } = await import("@/modules/sync/sync.service")
  console.log("[sync] Starting manual Zoho Books sync…")
  const result = await zohoSyncService.runFullSync()
  console.log("[sync] Finished:", result)
  process.exit(result.status === "FAILED" ? 1 : 0)
}

main().catch((err) => {
  console.error("[sync] Fatal error:", err)
  process.exit(1)
})
