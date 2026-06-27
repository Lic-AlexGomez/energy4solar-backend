import { jsonError, jsonOk } from "@/lib/api-response"
import { guideService } from "@/modules/guides/guide.service"

export const dynamic = "force-dynamic"
export const revalidate = 60

export async function GET() {
  try {
    const guides = await guideService.list()
    return jsonOk(guides)
  } catch (error) {
    return jsonError(error)
  }
}
