import { NextRequest } from "next/server"
import { jsonError, jsonOk } from "@/lib/api-response"
import { finderService } from "@/modules/finder/finder.service"
import { finderSchema } from "@/schemas/api.schemas"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = finderSchema.parse(await request.json())
    const recommendations = await finderService.recommend(body)
    return jsonOk(recommendations)
  } catch (error) {
    return jsonError(error)
  }
}
