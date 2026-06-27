import { NextRequest } from "next/server"
import { jsonError, jsonOk } from "@/lib/api-response"
import { affiliateService } from "@/modules/affiliate/affiliate.service"
import { affiliateClickSchema } from "@/schemas/api.schemas"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = affiliateClickSchema.parse(await request.json())
    const url = await affiliateService.recordClick({
      productId: body.productId,
      referrer: body.referrer ?? request.headers.get("referer") ?? undefined,
      utmSource: body.utmSource,
      utmMedium: body.utmMedium,
      utmCampaign: body.utmCampaign,
      userAgent: request.headers.get("user-agent") ?? undefined,
      ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      locale: body.locale,
    })
    if (!url) {
      return jsonError(new Error("Product not found"))
    }
    return jsonOk({ redirectUrl: url })
  } catch (error) {
    return jsonError(error)
  }
}
