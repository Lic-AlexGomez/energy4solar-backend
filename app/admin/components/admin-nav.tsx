"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const nav = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/earnings", label: "Earnings" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/guides", label: "Guides" },
  { href: "/admin/sync", label: "Sync" },
  { href: "/admin/seo", label: "SEO" },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="admin-nav">
      {nav.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
        return (
          <Link key={item.href} href={item.href} className={active ? "admin-nav-active" : undefined}>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
