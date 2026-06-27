"use client"

import { useState, useTransition } from "react"
import { triggerSyncAction } from "./actions"

export function SyncTriggerButton() {
  const [pending, start] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setMessage(null)
            try {
              const result = await triggerSyncAction()
              setMessage(`Sync ${result.status}: ${result.itemsUpserted} products updated`)
            } catch (e) {
              setMessage(e instanceof Error ? e.message : "Sync failed")
            }
          })
        }
        style={{
          padding: "0.6rem 1rem",
          borderRadius: 8,
          border: "none",
          background: pending ? "#64748b" : "#22c55e",
          color: "#052e16",
          fontWeight: 600,
          cursor: pending ? "wait" : "pointer",
        }}
      >
        {pending ? "Syncing…" : "Force sync now"}
      </button>
      {message ? <p style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>{message}</p> : null}
    </div>
  )
}
