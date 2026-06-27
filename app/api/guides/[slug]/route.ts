import { jsonError, jsonOk } from "@/lib/api-response"
import { guideService } from "@/modules/guides/guide.service"

export const dynamic = "force-dynamic"

type Params = { params: Promise<{ slug: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    const { slug } = await params
    const guide = await guideService.getBySlug(slug)
    return jsonOk(guide)
  } catch (error) {
    return jsonError(error)
  }
}
