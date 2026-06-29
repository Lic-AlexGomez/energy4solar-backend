import { prisma } from "@/lib/prisma"
import { isMediaImportConfigured } from "@/modules/media/media-import.service"
import { MediaImportButton } from "./media-import-button"
import { SyncTriggerButton } from "./sync-button"

export const maxDuration = 300

export default async function AdminSyncPage() {
  const [logs, imageStats] = await Promise.all([
    prisma.syncLog.findMany({
      orderBy: { startedAt: "desc" },
      take: 30,
    }),
    Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { images: { some: {} } } }),
    ]),
  ])

  const [totalProducts, withImages] = imageStats
  const mediaConfigured = isMediaImportConfigured()

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Sync</h1>
          <p className="admin-subtitle">Zoho catalog sync and product image import.</p>
        </div>
      </header>

      <div className="admin-grid-2">
        <section className="admin-panel">
          <h2>Zoho catalog</h2>
          <p className="admin-sync-desc">
            Automatic sync runs daily on Vercel (08:00 UTC). Force sync pulls the latest products and
            prices from Zoho Books.
          </p>
          <SyncTriggerButton />
        </section>

        <section className="admin-panel">
          <h2>Product images</h2>
          <p className="admin-sync-desc">
            Import images from BigBattery media storage and link them to products by SKU. Currently{" "}
            <strong>{withImages}</strong> of <strong>{totalProducts}</strong> products have an image
            on file.
          </p>
          <MediaImportButton configured={mediaConfigured} />
        </section>
      </div>

      <section className="admin-panel admin-section">
        <h2>Sync history</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Started</th>
                <th>Status</th>
                <th>Fetched</th>
                <th>Upserted</th>
                <th>Failed</th>
                <th>Price changes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.startedAt.toLocaleString()}</td>
                  <td>{log.status}</td>
                  <td>{log.itemsFetched}</td>
                  <td>{log.itemsUpserted}</td>
                  <td>{log.itemsFailed}</td>
                  <td>{log.priceChanges}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {logs.some((l) => l.errorMessage) ? (
        <details className="admin-panel admin-panel-error admin-section">
          <summary>Recent sync errors</summary>
          <pre className="admin-pre">
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
