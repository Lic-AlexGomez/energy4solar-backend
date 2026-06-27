"use client"

import { useTransition } from "react"
import {
  deleteBlogPostAction,
  toggleBlogFeaturedAction,
  toggleBlogPublishedAction,
} from "./actions"

type BlogRow = {
  id: string
  title: string
  slug: string
  category: string
  published: boolean
  featured: boolean
  updatedAt: Date
}

export function BlogList({ posts }: { posts: BlogRow[] }) {
  return (
    <div className="admin-panel">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Article</th>
            <th>Category</th>
            <th>Featured</th>
            <th>Published</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {posts.map((p) => (
            <BlogRowItem key={p.id} post={p} />
          ))}
          {!posts.length ? (
            <tr>
              <td colSpan={5} className="admin-empty">
                No blog posts yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
}

function BlogRowItem({ post }: { post: BlogRow }) {
  const [pending, startTransition] = useTransition()

  return (
    <tr className={pending ? "admin-row-pending" : undefined}>
      <td>
        <div className="admin-product-name">{post.title}</div>
        <code className="admin-code">/blog/{post.slug}</code>
        {!post.published ? <span className="admin-badge admin-badge-muted">Draft</span> : null}
      </td>
      <td>{post.category}</td>
      <td>
        <form
          action={(fd) => startTransition(() => toggleBlogFeaturedAction(fd))}
          className="admin-toggle-form"
        >
          <input type="hidden" name="id" value={post.id} />
          <input type="hidden" name="featured" value={String(!post.featured)} />
          <button
            type="submit"
            className={`admin-toggle${post.featured ? " admin-toggle-on" : ""}`}
          >
            <span className="admin-toggle-knob" />
          </button>
        </form>
      </td>
      <td>
        <form
          action={(fd) => startTransition(() => toggleBlogPublishedAction(fd))}
          className="admin-toggle-form"
        >
          <input type="hidden" name="id" value={post.id} />
          <input type="hidden" name="published" value={String(!post.published)} />
          <button
            type="submit"
            className={`admin-toggle${post.published ? " admin-toggle-on" : ""}`}
          >
            <span className="admin-toggle-knob" />
          </button>
          <span className="admin-toggle-label">{post.published ? "Live" : "Hidden"}</span>
        </form>
      </td>
      <td>
        <form
          action={(fd) => {
            if (confirm("Delete this article?")) startTransition(() => deleteBlogPostAction(fd))
          }}
        >
          <input type="hidden" name="id" value={post.id} />
          <button type="submit" className="admin-btn-sm admin-btn-ghost">
            Delete
          </button>
        </form>
      </td>
    </tr>
  )
}
