import { prisma } from "@/lib/prisma"
import { saveProductSeoAction } from "./actions"

export default async function AdminSeoPage() {
  const products = await prisma.product.findMany({
    take: 50,
    orderBy: { updatedAt: "desc" },
    include: { seo: true },
  })

  return (
    <div>
      <h1>SEO metadata</h1>
      <p style={{ color: "#94a3b8" }}>Override meta tags for product pages. Catalog data remains read-only from Zoho.</p>
      <div style={{ marginTop: "2rem", display: "grid", gap: "2rem" }}>
        {products.map((p) => (
          <form
            key={p.id}
            action={saveProductSeoAction}
            style={{ padding: "1rem", borderRadius: 12, border: "1px solid #334155", display: "grid", gap: "0.5rem" }}
          >
            <input type="hidden" name="productId" value={p.id} />
            <strong>{p.name}</strong>
            <input
              name="metaTitle"
              placeholder="Meta title"
              defaultValue={p.seo?.metaTitle ?? ""}
              style={inputStyle}
            />
            <textarea
              name="metaDescription"
              placeholder="Meta description"
              defaultValue={p.seo?.metaDescription ?? ""}
              rows={2}
              style={inputStyle}
            />
            <input
              name="keywords"
              placeholder="keywords, comma, separated"
              defaultValue={p.seo?.keywords.join(", ") ?? ""}
              style={inputStyle}
            />
            <button type="submit" style={buttonStyle}>
              Save SEO
            </button>
          </form>
        ))}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: "0.6rem",
  borderRadius: 8,
  border: "1px solid #334155",
  background: "#0f172a",
  color: "#fff",
}

const buttonStyle: React.CSSProperties = {
  padding: "0.5rem 1rem",
  borderRadius: 8,
  border: "none",
  background: "#22c55e",
  color: "#052e16",
  fontWeight: 600,
  cursor: "pointer",
  width: "fit-content",
}
