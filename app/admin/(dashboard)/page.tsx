import { prisma } from "@/lib/prisma"

export default async function AdminOverviewPage() {
  const [productCount, clickCount, lastSync] = await Promise.all([
    prisma.product.count(),
    prisma.affiliateClick.count(),
    prisma.syncLog.findFirst({ orderBy: { startedAt: "desc" } }),
  ])

  return (
    <div>
      <h1>Dashboard</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginTop: "1.5rem" }}>
        <StatCard label="Products synced" value={productCount} />
        <StatCard label="Affiliate clicks" value={clickCount} />
        <StatCard
          label="Last sync"
          value={lastSync ? lastSync.status : "—"}
          sub={lastSync?.finishedAt?.toISOString() ?? "Never"}
        />
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ padding: "1.25rem", borderRadius: 12, background: "#1e293b", border: "1px solid #334155" }}>
      <div style={{ color: "#94a3b8", fontSize: "0.875rem" }}>{label}</div>
      <div style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: "0.25rem" }}>{value}</div>
      {sub ? <div style={{ color: "#64748b", fontSize: "0.75rem", marginTop: "0.25rem" }}>{sub}</div> : null}
    </div>
  )
}
