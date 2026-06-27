import Link from "next/link"
import { loginAction } from "./actions"
import "../admin.css"

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <main className="admin-login">
      <div className="admin-login-card">
        <h1>Energy4Solar Admin</h1>
        <p>Sign in to manage sync, analytics, and content.</p>
        {error === "invalid" ? (
          <p className="admin-error" role="alert">
            Invalid username or password.
          </p>
        ) : null}
        <form action={loginAction} className="admin-form">
          <label>
            Username
            <input type="text" name="username" defaultValue="admin" autoComplete="username" required />
          </label>
          <label>
            Password
            <input type="password" name="password" autoComplete="current-password" required />
          </label>
          <button type="submit">Sign in</button>
        </form>
        <p className="admin-login-footer">
          <Link href="/">← Back to API home</Link>
        </p>
      </div>
    </main>
  )
}
