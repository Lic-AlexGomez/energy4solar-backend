"use client"

import { useState, useTransition } from "react"
import { importMediaImagesAction } from "./actions"

export function MediaImportButton({ configured }: { configured: boolean }) {
  const [pending, start] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="admin-media-import">
      <button
        type="button"
        className="admin-btn admin-btn-secondary"
        disabled={pending || !configured}
        title={configured ? undefined : "Media storage credentials not configured on the server"}
        onClick={() => {
          if (!confirm("Import product images from BigBattery media storage? This may take a few minutes.")) {
            return
          }
          setMessage(null)
          setError(null)
          start(async () => {
            try {
              const result = await importMediaImagesAction()
              if (!result.ok) {
                setError(result.message)
                return
              }
              setMessage(
                `${result.message} Scanned ${result.filesScanned.toLocaleString()} files · ${result.updated} updated · ${result.stillMissing} still without image.`,
              )
            } catch (e) {
              setError(e instanceof Error ? e.message : "Import failed")
            }
          })
        }}
      >
        {pending ? "Importing images…" : "Import product images"}
      </button>
      {!configured ? (
        <p className="admin-media-import-hint">
          Media storage is not configured on the server yet.
        </p>
      ) : null}
      {error ? (
        <p className="admin-price-bulk-feedback admin-price-bulk-error" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="admin-price-bulk-feedback admin-price-bulk-success" role="status">
          {message}
        </p>
      ) : null}
    </div>
  )
}
