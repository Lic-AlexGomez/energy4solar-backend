import { prisma } from "@/lib/prisma"
import { saveGuideAction } from "./actions"
import { GuideList } from "./guide-list"

export default async function AdminGuidesPage() {
  const guides = await prisma.guide.findMany({ orderBy: { updatedAt: "desc" } })
  const published = guides.filter((g) => g.published).length

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Guides & articles</h1>
          <p className="admin-subtitle">
            Editorial buying guides. Toggle visibility without deleting content.
          </p>
        </div>
        <span className="admin-badge admin-badge-muted">
          {published} / {guides.length} published
        </span>
      </div>

      <GuideList
        guides={guides.map((g) => ({
          id: g.id,
          title: g.title,
          slug: g.slug,
          published: g.published,
          updatedAt: g.updatedAt,
        }))}
      />

      <section className="admin-panel admin-section">
        <h2>Create new guide</h2>
        <form action={saveGuideAction} className="admin-form admin-form-wide">
          <label>
            Title
            <input name="title" placeholder="How to size a home battery" required />
          </label>
          <label>
            Excerpt
            <input name="excerpt" placeholder="Short summary for cards and SEO" required />
          </label>
          <label>
            Content (Markdown)
            <textarea name="content" placeholder="# Guide title..." required rows={10} />
          </label>
          <label className="admin-checkbox">
            <input type="checkbox" name="published" />
            Publish immediately
          </label>
          <button type="submit" className="admin-btn">
            Create guide
          </button>
        </form>
      </section>
    </div>
  )
}
