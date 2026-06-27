import { jsonError, jsonOk } from "@/lib/api-response"
import { productService } from "@/modules/products/product.service"

export const dynamic = "force-dynamic"

type Params = { params: Promise<{ slug: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    const { slug } = await params
    const product = await productService.getBySlug(slug)
    return jsonOk(product)
  } catch (error) {
    return jsonError(error)
  }
}
