import { jsonError, jsonOk, requireCronSecret } from "@/lib/api-response"
import { zohoSyncService } from "@/modules/sync/sync.service"

export const dynamic = "force-dynamic"
export const maxDuration = 300

export async function GET(request: Request) {
  try {
    requireCronSecret(request)
    const result = await zohoSyncService.runFullSync()
    return jsonOk(result)
  } catch (error) {
    return jsonError(error)
  }
}
