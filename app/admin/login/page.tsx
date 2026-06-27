import Link from "next/link"
import { loginAction } from "./actions"

export default function AdminLoginPage() {
  return (
    <main style={{ maxWidth: 400, margin: "6rem auto", padding: "0 1.5rem" }}>
      <h1>Admin login</h1>
      <p style={{ color: "#94a3b8" }}>Enter your admin API key to continue.</p>
      <form action={loginAction} style={{ marginTop: "1.5rem", display: "grid", gap: "1rem" }}>
        <input
          type="password"
          name="passkey"
          placeholder="Admin API key"
          required
          style={{ padding: "0.75rem", borderRadius: 8, border: "1px solid #334155", background: "#1e293b", color: "#fff" }}
        />
        <button
          type="submit"
          style={{ padding: "0.75rem", borderRadius: 8, border: "none", background: "#22c55e", color: "#052e16", fontWeight: 600, cursor: "pointer" }}
        >
          Sign in
        </button>
      </form>
      <p style={{ marginTop: "1.5rem" }}>
        <Link href="/">← Back to API home</Link>
      </p>
    </main>
  )
}
