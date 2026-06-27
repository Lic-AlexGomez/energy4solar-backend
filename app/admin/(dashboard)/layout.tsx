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
        <div className="admin-sidebar-top">
          <div className="admin-brand">
            <span className="admin-brand-mark">E4S</span>
            <div>
              <div className="admin-brand-name">Energy4Solar</div>
              <div className="admin-brand-sub">Admin</div>
            </div>
          </div>
          <AdminNav />
        </div>
        <div className="admin-sidebar-footer">
          <a href={siteUrl} target="_blank" rel="noreferrer" className="admin-footer-link">
            Live site ↗
          </a>
          <form action={logoutAction}>
            <button type="submit" className="admin-logout">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="admin-main-wrap">
        <main className="admin-main">{children}</main>
      </div>
    </div>
  )
}
