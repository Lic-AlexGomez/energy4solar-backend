import Link from "next/link"
import { AdminNav } from "../components/admin-nav"
import { requireAdminPage } from "@/lib/admin-auth"
import { logoutAction } from "../logout/actions"
import "../admin.css"

export const dynamic = "force-dynamic"

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage()
  const siteUrl = process.env.SITE_URL ?? "https://www.energy4solar.com"

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-icon">⚡</span>
          Energy4Solar
        </div>
        <p className="admin-brand-sub">Admin console</p>
        <AdminNav />
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
