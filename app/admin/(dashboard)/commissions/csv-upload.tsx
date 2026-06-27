"use client"

import { useState, useTransition } from "react"
import { importCommissionsAction } from "./actions"

export function CsvUploadForm() {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(
    null,
  )

  return (
    <div className="admin-panel">
      <h2>Import your commission CSV</h2>
      <p className="admin-subtitle" style={{ marginTop: "0.5rem" }}>
        Export from your BigBattery affiliate portal and upload here. Columns: commission, amount, order_date, sku,
        product_name, order_id, status.
      </p>
      <form
        className="admin-upload-form"
        onSubmit={(e) => {
          e.preventDefault()
          const fd = new FormData(e.currentTarget)
          startTransition(async () => {
            const res = await importCommissionsAction(fd)
            setResult(res)
            e.currentTarget.reset()
          })
        }}
      >
        <input type="file" name="csv" accept=".csv,text/csv" required disabled={pending} />
        <button type="submit" className="admin-btn" disabled={pending}>
          {pending ? "Importing…" : "Upload CSV"}
        </button>
      </form>
      {result ? (
        <div className={`admin-import-result${result.errors.length ? " admin-import-warn" : ""}`}>
          <strong>
            Imported {result.imported} rows ({result.skipped} skipped)
          </strong>
          {result.errors.length ? (
            <ul>
              {result.errors.slice(0, 5).map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
