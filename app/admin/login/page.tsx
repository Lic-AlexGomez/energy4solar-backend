import Link from "next/link"
import { loginAction } from "./actions"
import { LoginPasswordField } from "./login-password-field"

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const siteUrl = process.env.SITE_URL ?? "https://www.energy4solar.com"

  return (
    <main className="admin-login">
      <div className="admin-login-bg" aria-hidden>
        <div className="admin-login-orb admin-login-orb-a" />
        <div className="admin-login-orb admin-login-orb-b" />
        <div className="admin-login-grid" />
      </div>

      <div className="admin-login-card">
        <header className="admin-login-brand">
          <span className="admin-brand-mark admin-login-mark" aria-hidden>
            E4S
          </span>
          <div>
            <div className="admin-brand-name">Energy4Solar</div>
            <div className="admin-brand-sub">Admin</div>
          </div>
        </header>

        <div className="admin-login-intro">
          <h1>Sign in</h1>
          <p>Private dashboard for products, commissions, and site analytics.</p>
        </div>

        {error === "invalid" ? (
          <div className="admin-login-alert" role="alert">
            <span className="admin-login-alert-icon" aria-hidden>
              !
            </span>
            <span>Invalid admin key. Please try again.</span>
          </div>
        ) : null}

        <form action={loginAction} className="admin-login-form">
          <LoginPasswordField />
          <button type="submit" className="admin-login-submit">
            Sign in
          </button>
        </form>

        <footer className="admin-login-footer">
          <Link href={siteUrl} className="admin-login-back">
            ← Back to site
          </Link>
        </footer>
      </div>
    </main>
  )
}
