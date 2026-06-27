import Link from "next/link"

export default function HomePage() {
  return (
    <main style={{ maxWidth: 720, margin: "4rem auto", padding: "0 1.5rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Energy4Solar Backend</h1>
      <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>
        REST API and Zoho Books sync service for the Energy4Solar affiliate platform. Products are
        synchronized from Zoho Books; checkout happens on BigBattery.
      </p>
      <ul style={{ marginTop: "2rem", lineHeight: 2 }}>
        <li>
          <Link href="/api/health">GET /api/health</Link>
        </li>
        <li>
          <Link href="/api/products">GET /api/products</Link>
        </li>
        <li>
          <Link href="/admin">Admin dashboard</Link>
        </li>
      </ul>
    </main>
  )
}
