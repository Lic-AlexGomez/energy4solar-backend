import { prisma } from "@/lib/prisma"
import { SyncTriggerButton } from "./sync-button"

export default async function AdminSyncPage() {
  const logs = await prisma.syncLog.findMany({
    orderBy: { startedAt: "desc" },
    take: 30,
  })

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Zoho sync</h1>
        <SyncTriggerButton />
      </div>
      <p style={{ color: "#94a3b8" }}>
        Automatic sync runs every 15 minutes via Vercel Cron. Products remain read-only; Zoho Books is the source of truth.
      </p>
      <table style={{ width: "100%", marginTop: "2rem", borderCollapse: "collapse", fontSize: "0.875rem" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #334155" }}>
            <th style={{ padding: "0.75rem 0" }}>Started</th>
            <th>Status</th>
            <th>Fetched</th>
            <th>Upserted</th>
            <th>Failed</th>
            <th>Price changes</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} style={{ borderBottom: "1px solid #1e293b" }}>
              <td style={{ padding: "0.75rem 0" }}>{log.startedAt.toISOString()}</td>
              <td>{log.status}</td>
              <td>{log.itemsFetched}</td>
              <td>{log.itemsUpserted}</td>
              <td>{log.itemsFailed}</td>
              <td>{log.priceChanges}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {logs.some((l) => l.errorMessage) ? (
        <details style={{ marginTop: "1.5rem" }}>
          <summary>Recent errors</summary>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.75rem", color: "#fca5a5" }}>
            {logs
              .filter((l) => l.errorMessage)
              .map((l) => l.errorMessage)
              .join("\n---\n")}
          </pre>
        </details>
      ) : null}
    </div>
  )
}
