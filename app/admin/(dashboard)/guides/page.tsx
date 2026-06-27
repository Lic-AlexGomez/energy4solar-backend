import { prisma } from "@/lib/prisma"
import { saveGuideAction } from "./actions"

export default async function AdminGuidesPage() {
  const guides = await prisma.guide.findMany({ orderBy: { updatedAt: "desc" } })

  return (
    <div>
      <h1>Buying guides</h1>
      <p style={{ color: "#94a3b8" }}>Editorial content managed here. Products stay synced from Zoho.</p>

      <form action={saveGuideAction} style={{ marginTop: "2rem", display: "grid", gap: "0.75rem", maxWidth: 640 }}>
        <h2>New guide</h2>
        <input name="title" placeholder="Title" required style={inputStyle} />
        <input name="excerpt" placeholder="Excerpt" required style={inputStyle} />
        <textarea name="content" placeholder="Markdown content" required rows={8} style={inputStyle} />
        <label>
          <input type="checkbox" name="published" /> Publish
        </label>
        <button type="submit" style={buttonStyle}>
          Create guide
        </button>
      </form>

      <section style={{ marginTop: "3rem" }}>
        <h2>Existing guides ({guides.length})</h2>
        <ul style={{ marginTop: "1rem", lineHeight: 1.8 }}>
          {guides.map((g) => (
            <li key={g.id}>
              {g.published ? "✓" : "○"} {g.title}{" "}
              <span style={{ color: "#64748b" }}>/api/guides/{g.slug}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: "0.75rem",
  borderRadius: 8,
  border: "1px solid #334155",
  background: "#1e293b",
  color: "#fff",
}

const buttonStyle: React.CSSProperties = {
  padding: "0.75rem",
  borderRadius: 8,
  border: "none",
  background: "#22c55e",
  color: "#052e16",
  fontWeight: 600,
  cursor: "pointer",
  width: "fit-content",
}
