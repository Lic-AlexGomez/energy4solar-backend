"use client"

import { useState, useTransition } from "react"
import { importMediaImagesAction } from "./actions"

export function MediaImportButton({ configured }: { configured: boolean }) {
  const [pending, start] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showSetup, setShowSetup] = useState(!configured)

  function runImport() {
    if (!configured) {
      setShowSetup(true)
      return
    }
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
  }

  return (
    <div className="admin-media-import">
      <button
        type="button"
        className={`admin-btn admin-btn-secondary${!configured ? " admin-btn-disabled" : ""}`}
        disabled={pending}
        onClick={runImport}
      >
        {pending ? "Importing images…" : "Import product images"}
      </button>

      {!configured ? (
        <div className="admin-media-setup">
          <p className="admin-media-setup-title">Setup required before first import</p>
          <p className="admin-media-import-hint">
            The button does nothing until BigBattery media credentials are added in{" "}
            <strong>Vercel → energy4solar-backend → Settings → Environment Variables</strong>, then
            redeploy.
          </p>
          {showSetup ? (
            <ul className="admin-media-setup-list">
              <li>
                <code>MEDIA_IMPORT_HOST</code> — e.g. Pressable SFTP host
              </li>
              <li>
                <code>MEDIA_IMPORT_USER</code> — your username
              </li>
              <li>
                <code>MEDIA_IMPORT_PASSWORD</code> — your password
              </li>
              <li>
                <code>MEDIA_IMPORT_REMOTE_PATH</code> — uploads folder (often{" "}
                <code>/wp-content/uploads</code>)
              </li>
              <li>
                <code>MEDIA_IMPORT_PUBLIC_URL</code> —{" "}
                <code>https://bigbattery.com/wp-content/uploads</code>
              </li>
            </ul>
          ) : (
            <button type="button" className="admin-link-sm" onClick={() => setShowSetup(true)}>
              Show required variables →
            </button>
          )}
        </div>
      ) : (
        <p className="admin-media-import-hint admin-media-import-ready">Media storage connected — ready to import.</p>
      )}

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
