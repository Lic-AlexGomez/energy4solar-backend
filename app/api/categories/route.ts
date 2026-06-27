import { jsonError, jsonOk } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const revalidate = 300

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    })
    return jsonOk(
      categories.map((c) => ({
        id: c.slug,
        slug: c.slug,
        name: c.name,
        tagline: c.tagline,
        description: c.description,
        image: c.imageUrl,
        count: c._count.products,
      })),
    )
  } catch (error) {
    return jsonError(error)
  }
}
