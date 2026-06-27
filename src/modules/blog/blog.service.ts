import { prisma } from "@/lib/prisma"
import { NotFoundError } from "@/lib/errors"
import { markdownToBlocks } from "./blog-blocks"

function serializePost(g: {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  imageUrl: string | null
  category: string
  author: string
  readTime: string
  featured: boolean
  publishedAt: Date | null
  seoTitle: string | null
  metaDescription: string | null
  keywords: string[]
  createdAt: Date
}) {
  return {
    id: g.id,
    slug: g.slug,
    title: g.title,
    excerpt: g.excerpt,
    image: g.imageUrl ?? "/placeholder.svg",
    category: g.category,
    author: g.author,
    date: (g.publishedAt ?? g.createdAt).toISOString().slice(0, 10),
    readTime: g.readTime,
    featured: g.featured,
    seoTitle: g.seoTitle ?? undefined,
    metaDescription: g.metaDescription ?? undefined,
    keywords: g.keywords.length ? g.keywords : undefined,
    blocks: markdownToBlocks(g.content),
  }
}

export const blogService = {
  async list(publishedOnly = true) {
    const posts = await prisma.blogPost.findMany({
      where: publishedOnly ? { published: true } : undefined,
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    })
    return posts.map(serializePost)
  },

  async getBySlug(slug: string, publishedOnly = true) {
    const post = await prisma.blogPost.findFirst({
      where: { slug, ...(publishedOnly ? { published: true } : {}) },
    })
    if (!post) throw new NotFoundError("Blog post not found")
    return serializePost(post)
  },
}
