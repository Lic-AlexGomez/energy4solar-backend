import { prisma } from "@/lib/prisma"
import { saveBlogPostAction } from "./actions"
import { BlogList } from "./blog-list"

const CATEGORIES = ["Technology", "Buying Guide", "Installation", "Savings", "Reviews"]

export default async function AdminBlogPage() {
  const posts = await prisma.blogPost.findMany({ orderBy: { updatedAt: "desc" } })
  const published = posts.filter((p) => p.published).length

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Blog</h1>
          <p className="admin-subtitle">
            Articles shown on energy4solar.com/blog. Use Markdown in the body (## headings supported).
          </p>
        </div>
        <span className="admin-badge admin-badge-muted">
          {published} / {posts.length} live
        </span>
      </div>

      <BlogList
        posts={posts.map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          category: p.category,
          published: p.published,
          featured: p.featured,
          updatedAt: p.updatedAt,
        }))}
      />

      <section className="admin-panel admin-section">
        <h2>New article</h2>
        <form action={saveBlogPostAction} className="admin-form admin-form-wide">
          <label>
            Title
            <input name="title" required placeholder="Article title" />
          </label>
          <label>
            Excerpt
            <input name="excerpt" required placeholder="Short summary for cards and SEO" />
          </label>
          <label>
            Category
            <select name="category" defaultValue="Technology" className="admin-select">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            Author
            <input name="author" defaultValue="Energy4Solar Team" />
          </label>
          <label>
            Cover image URL
            <input name="imageUrl" placeholder="https://..." type="url" />
          </label>
          <label>
            SEO title (optional)
            <input name="seoTitle" placeholder="Overrides H1 for search" />
          </label>
          <label>
            Meta description (optional)
            <input name="metaDescription" placeholder="Overrides excerpt in search" />
          </label>
          <label>
            Body (Markdown)
            <textarea
              name="content"
              required
              rows={12}
              placeholder={"## Section heading\n\nParagraph text...\n\n### Subsection\n\nMore content."}
            />
          </label>
          <label className="admin-checkbox">
            <input type="checkbox" name="featured" />
            Featured on blog home
          </label>
          <label className="admin-checkbox">
            <input type="checkbox" name="published" />
            Publish immediately
          </label>
          <button type="submit" className="admin-btn">
            Create article
          </button>
        </form>
      </section>
    </div>
  )
}
