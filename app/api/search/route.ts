import { NextRequest } from "next/server"
import { jsonError, jsonOk } from "@/lib/api-response"
import { productService } from "@/modules/products/product.service"
import { searchSchema } from "@/schemas/api.schemas"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { q, limit } = searchSchema.parse(Object.fromEntries(request.nextUrl.searchParams))
    const items = await productService.search(q, limit)
    return jsonOk(items, { q, count: items.length })
  } catch (error) {
    return jsonError(error)
  }
}
