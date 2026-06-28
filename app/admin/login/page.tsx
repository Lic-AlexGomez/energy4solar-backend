import Link from "next/link"
import { loginAction } from "./actions"
import "../admin.css"

export const metadata = {
  robots: { index: false, follow: false },
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const siteUrl = process.env.SITE_URL ?? "https://www.energy4solar.com"

  return (
    <main className="admin-login">
      <div className="admin-login-card">
        <h1>Energy4Solar Admin</h1>
        <p>Enter your admin key to continue.</p>
        {error === "invalid" ? (
          <p className="admin-error" role="alert">
            Invalid admin key.
          </p>
        ) : null}
        <form action={loginAction} className="admin-form">
          <label>
            Admin key
            <input type="password" name="password" autoComplete="current-password" required />
          </label>
          <button type="submit">Sign in</button>
        </form>
        <p className="admin-login-footer">
          <Link href={siteUrl}>← Back to site</Link>
        </p>
      </div>
    </main>
  )
}
