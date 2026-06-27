import { zohoSyncService } from "@/modules/sync/sync.service"

async function main() {
  console.log("[sync] Starting manual Zoho Books sync…")
  const result = await zohoSyncService.runFullSync()
  console.log("[sync] Finished:", result)
  process.exit(result.status === "FAILED" ? 1 : 0)
}

main().catch((err) => {
  console.error("[sync] Fatal error:", err)
  process.exit(1)
})
