import { jsonError, jsonOk, requireAdminKey } from "@/lib/api-response"
import { zohoSyncService } from "@/modules/sync/sync.service"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const maxDuration = 300

export async function POST(request: Request) {
  try {
    requireAdminKey(request)
    const result = await zohoSyncService.runFullSync()
    return jsonOk(result)
  } catch (error) {
    return jsonError(error)
  }
}

export async function GET(request: Request) {
  try {
    requireAdminKey(request)
    const logs = await prisma.syncLog.findMany({
      orderBy: { startedAt: "desc" },
      take: 20,
    })
    return jsonOk(logs)
  } catch (error) {
    return jsonError(error)
  }
}
