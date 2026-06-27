import { createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const COOKIE = "e4s_admin"

function getAdminCredentials() {
  const username = process.env.ADMIN_USERNAME ?? "admin"
  const password = process.env.ADMIN_PASSWORD ?? process.env.ADMIN_API_KEY
  return { username, password }
}

function sessionToken(): string | null {
  const { username, password } = getAdminCredentials()
  if (!password) return null
  return createHmac("sha256", password).update(`e4s-admin:${username}`).digest("hex")
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const token = sessionToken()
  if (!token) return process.env.NODE_ENV === "development"
  const jar = await cookies()
  const value = jar.get(COOKIE)?.value
  return Boolean(value && safeEqual(value, token))
}

export async function setAdminSession(username: string, password: string): Promise<boolean> {
  const expected = getAdminCredentials()
  const token = sessionToken()
  if (!token) return false
  if (!safeEqual(username.trim(), expected.username)) return false
  if (!safeEqual(password, expected.password ?? "")) return false

  const jar = await cookies()
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
  return true
}

export async function clearAdminSession() {
  const jar = await cookies()
  jar.delete(COOKIE)
}

export async function requireAdminPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login")
  }
}
