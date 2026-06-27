import { jsonError, jsonOk } from "@/lib/api-response"
import { blogService } from "@/modules/blog/blog.service"

export const dynamic = "force-dynamic"
export const revalidate = 60

export async function GET() {
  try {
    const posts = await blogService.list()
    return jsonOk(posts)
  } catch (error) {
    return jsonError(error)
  }
}
