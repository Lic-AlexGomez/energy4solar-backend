import { jsonError, jsonOk } from "@/lib/api-response"
import { blogService } from "@/modules/blog/blog.service"

export const dynamic = "force-dynamic"
export const revalidate = 60

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const post = await blogService.getBySlug(slug)
    return jsonOk(post)
  } catch (error) {
    return jsonError(error)
  }
}
