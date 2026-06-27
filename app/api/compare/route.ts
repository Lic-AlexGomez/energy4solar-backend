import { NextRequest } from "next/server"
import { jsonError, jsonOk } from "@/lib/api-response"
import { productService } from "@/modules/products/product.service"
import { compareSchema } from "@/schemas/api.schemas"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const idsParam = request.nextUrl.searchParams.get("ids") ?? ""
    const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean)
    const { ids: validIds } = compareSchema.parse({ ids })
    const products = await productService.compare(validIds)
    return jsonOk(products)
  } catch (error) {
    return jsonError(error)
  }
}
