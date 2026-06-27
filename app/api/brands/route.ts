import { jsonError, jsonOk } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const revalidate = 300

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } })
    return jsonOk(
      brands.map((b) => ({
        id: b.slug,
        slug: b.slug,
        name: b.name,
        description: b.description,
        tagline: b.tagline,
        productCount: b.productCount,
        founded: b.founded,
        headquarters: b.headquarters,
      })),
    )
  } catch (error) {
    return jsonError(error)
  }
}
