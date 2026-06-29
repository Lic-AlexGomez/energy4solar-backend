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
        className="admin-btn"
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
      >
        {pending ? "Syncing…" : "Force sync now"}
      </button>
      {message ? <p className="admin-sync-message">{message}</p> : null}
    </div>
  )
}
