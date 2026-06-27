import { createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const COOKIE = "e4s_admin"
const SESSION_SCOPE = "e4s-admin-session"

function getAdminPassword(): string | undefined {
  return process.env.ADMIN_PASSWORD ?? process.env.ADMIN_API_KEY
}

function sessionToken(): string | null {
  const password = getAdminPassword()
  if (!password) return null
  return createHmac("sha256", password).update(SESSION_SCOPE).digest("hex")
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

export async function setAdminSession(password: string): Promise<boolean> {
  const expected = getAdminPassword()
  const token = sessionToken()
  if (!expected || !token) return false
  if (!safeEqual(password, expected)) return false

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
