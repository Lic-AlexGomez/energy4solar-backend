import Link from "next/link"
import { requireAdminPage } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

const nav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/sync", label: "Sync" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/guides", label: "Guides" },
  { href: "/admin/seo", label: "SEO" },
]

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage()
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{ width: 220, padding: "1.5rem", borderRight: "1px solid #334155", background: "#1e293b" }}>
        <strong>Energy4Solar</strong>
        <nav style={{ marginTop: "1.5rem", display: "grid", gap: "0.5rem" }}>
          {nav.map((item) => (
            <Link key={item.href} href={item.href} style={{ color: "#94a3b8" }}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main style={{ flex: 1, padding: "2rem" }}>{children}</main>
    </div>
  )
}
