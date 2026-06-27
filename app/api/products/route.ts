import { NextRequest } from "next/server"
import { jsonError, jsonOk } from "@/lib/api-response"
import { productService } from "@/modules/products/product.service"
import { productListSchema } from "@/schemas/api.schemas"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const params = productListSchema.parse(Object.fromEntries(request.nextUrl.searchParams))
    const result = await productService.list(params)
    return jsonOk(result.items, result.meta)
  } catch (error) {
    return jsonError(error)
  }
}
