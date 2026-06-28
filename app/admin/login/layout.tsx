import type { Metadata } from "next"
import "../admin.css"

export const metadata: Metadata = {
  title: "Sign in · Energy4Solar Admin",
  robots: { index: false, follow: false },
}

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-login-root" lang="en">
      {children}
    </div>
  )
}
