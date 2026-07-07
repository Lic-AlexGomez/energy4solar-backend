import { prisma } from "@/lib/prisma"
import { NotFoundError } from "@/lib/errors"

export const guideService = {
  async list() {
    const guides = await prisma.guide.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      include: { category: true, seo: true },
    })
    return guides.map(serializeGuide)
  },

  async getBySlug(slug: string) {
    const guide = await prisma.guide.findFirst({
      where: { slug, published: true },
      include: { category: true, seo: true },
    })
    if (!guide) throw new NotFoundError("Guide not found")
    return serializeGuide(guide)
  },
}

function serializeGuide(g: {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  imageUrl: string | null
  readTime: string
  difficulty: string
  publishedAt: Date | null
  relatedProductSlugs?: string[]
  category: { name: string; slug: string } | null
  seo: { metaTitle: string | null; metaDescription: string | null; keywords: string[] } | null
}) {
  return {
    id: g.id,
    slug: g.slug,
    title: g.title,
    excerpt: g.excerpt,
    content: g.content,
    image: g.imageUrl,
    readTime: g.readTime,
    difficulty: g.difficulty,
    category: g.category?.name ?? "Guide",
    relatedProductSlugs: g.relatedProductSlugs ?? [],
    publishedAt: g.publishedAt?.toISOString(),
    seo: g.seo
      ? {
          metaTitle: g.seo.metaTitle,
          metaDescription: g.seo.metaDescription,
          keywords: g.seo.keywords,
        }
      : undefined,
  }
}
