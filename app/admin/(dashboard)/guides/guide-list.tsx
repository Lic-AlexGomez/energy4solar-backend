"use client"

import { useTransition } from "react"
import { toggleGuidePublishedAction } from "./actions"

type GuideRow = {
  id: string
  title: string
  slug: string
  published: boolean
  updatedAt: Date
}

export function GuideList({ guides }: { guides: GuideRow[] }) {
  return (
    <div className="admin-panel">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Slug</th>
            <th>Updated</th>
            <th>Published</th>
          </tr>
        </thead>
        <tbody>
          {guides.map((g) => (
            <GuideRowItem key={g.id} guide={g} />
          ))}
          {!guides.length ? (
            <tr>
              <td colSpan={4} className="admin-empty">
                No guides yet. Create one below.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
}

function GuideRowItem({ guide }: { guide: GuideRow }) {
  const [pending, startTransition] = useTransition()

  return (
    <tr className={pending ? "admin-row-pending" : undefined}>
      <td>
        <div className="admin-product-name">{guide.title}</div>
        {!guide.published ? <span className="admin-badge admin-badge-muted">Draft</span> : null}
      </td>
      <td>
        <code className="admin-code">/guides/{guide.slug}</code>
      </td>
      <td>{new Date(guide.updatedAt).toLocaleDateString()}</td>
      <td>
        <form
          action={(fd) => startTransition(() => toggleGuidePublishedAction(fd))}
          className="admin-toggle-form"
        >
          <input type="hidden" name="id" value={guide.id} />
          <input type="hidden" name="published" value={String(!guide.published)} />
          <button
            type="submit"
            className={`admin-toggle${guide.published ? " admin-toggle-on" : ""}`}
          >
            <span className="admin-toggle-knob" />
          </button>
          <span className="admin-toggle-label">{guide.published ? "Live" : "Hidden"}</span>
        </form>
      </td>
    </tr>
  )
}
