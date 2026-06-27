"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navGroups = [
  {
    label: "Main",
    items: [
      { href: "/admin", label: "Overview", icon: "◉", exact: true },
      { href: "/admin/products", label: "Products", icon: "▦" },
      { href: "/admin/commissions", label: "Commissions", icon: "$" },
      { href: "/admin/analytics", label: "Analytics", icon: "↗" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/blog", label: "Blog", icon: "✎" },
      { href: "/admin/guides", label: "Guides", icon: "☰" },
      { href: "/admin/seo", label: "SEO", icon: "⌕" },
    ],
  },
  {
    label: "System",
    items: [{ href: "/admin/sync", label: "Sync", icon: "↻" }],
  },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="admin-nav">
      {navGroups.map((group) => (
        <div key={group.label} className="admin-nav-group">
          <span className="admin-nav-group-label">{group.label}</span>
          {group.items.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-link${active ? " admin-nav-active" : ""}`}
              >
                <span className="admin-nav-icon" aria-hidden>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
