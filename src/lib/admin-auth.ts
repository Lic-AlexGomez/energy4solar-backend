import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const COOKIE = "e4s_admin"

export async function isAdminAuthenticated(): Promise<boolean> {
  const key = process.env.ADMIN_API_KEY
  if (!key) return process.env.NODE_ENV === "development"
  const jar = await cookies()
  return jar.get(COOKIE)?.value === key
}

export async function setAdminSession(passkey: string): Promise<boolean> {
  const key = process.env.ADMIN_API_KEY
  if (!key || passkey !== key) return false
  const jar = await cookies()
  jar.set(COOKIE, key, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
  return true
}

export async function requireAdminPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login")
  }
}
