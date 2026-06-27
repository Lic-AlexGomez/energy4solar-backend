import Link from "next/link"
import { requireAdminPage } from "@/lib/admin-auth"
import { logoutAction } from "../logout/actions"
import "../admin.css"

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
  const siteUrl = process.env.SITE_URL ?? "https://www.energy4solar.com"

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">Energy4Solar</div>
        <nav className="admin-nav">
          {nav.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <a href={siteUrl} target="_blank" rel="noreferrer">
            View live site ↗
          </a>
          <form action={logoutAction}>
            <button type="submit" className="admin-logout">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  )
}
