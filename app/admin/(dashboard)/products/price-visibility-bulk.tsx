"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import {
  bulkHideByPriceAction,
  bulkShowByPriceAction,
  previewPriceVisibilityAction,
} from "./actions"

type Preview = { total: number; visible: number; hidden: number }

export function PriceVisibilityBulk() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [hideZero, setHideZero] = useState(false)
  const [hideBelow, setHideBelow] = useState("")
  const [hideAbove, setHideAbove] = useState("")
  const [preview, setPreview] = useState<Preview | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function formData() {
    const fd = new FormData()
    fd.set("hideZero", String(hideZero))
    fd.set("hideBelow", hideBelow)
    fd.set("hideAbove", hideAbove)
    return fd
  }

  function invalidatePreview() {
    setPreview(null)
    setMessage(null)
    setError(null)
  }

  async function fetchPreview(): Promise<Preview> {
    const result = await previewPriceVisibilityAction(formData())
    setPreview(result)
    return result
  }

  function runPreview() {
    setMessage(null)
    setError(null)
    startTransition(async () => {
      try {
        await fetchPreview()
      } catch {
        setError("Preview failed. Refresh the page and try again.")
      }
    })
  }

  function applyHide() {
    if (!hasRules) return

    setMessage(null)
    setError(null)
    startTransition(async () => {
      try {
        const current = preview ?? (await fetchPreview())

        if (!current.total) {
          setMessage("No products match these price rules.")
          return
        }
        if (!current.visible) {
          setMessage(
            `${current.total} product(s) match but all are already hidden. Use “Show matching” to restore them.`,
          )
          return
        }

        if (!confirm(`Hide ${current.visible} visible product(s) matching these rules?`)) return

        const { updated } = await bulkHideByPriceAction(formData())
        setMessage(`Done — hidden ${updated} product(s). The table below will update.`)
        router.refresh()
        await fetchPreview()
      } catch {
        setError("Could not hide products. Refresh the page and try again.")
      }
    })
  }

  function applyShow() {
    if (!hasRules) return

    setMessage(null)
    setError(null)
    startTransition(async () => {
      try {
        const current = preview ?? (await fetchPreview())

        if (!current.total) {
          setMessage("No products match these price rules.")
          return
        }
        if (!current.hidden) {
          setMessage(`${current.total} product(s) match and all are already visible.`)
          return
        }

        if (!confirm(`Show ${current.hidden} hidden product(s) matching these rules?`)) return

        const { updated } = await bulkShowByPriceAction(formData())
        setMessage(`Done — restored visibility for ${updated} product(s).`)
        router.refresh()
        await fetchPreview()
      } catch {
        setError("Could not restore products. Refresh the page and try again.")
      }
    })
  }

  function applyPreset(preset: "zero" | "under-1000") {
    invalidatePreview()
    if (preset === "zero") {
      setHideZero(true)
      setHideBelow("")
      setHideAbove("")
    } else {
      setHideZero(false)
      setHideBelow("1000")
      setHideAbove("")
    }
  }

  const hasRules = hideZero || hideBelow.trim() !== "" || hideAbove.trim() !== ""

  return (
    <div className={`admin-panel admin-price-bulk${pending ? " admin-price-bulk-pending" : ""}`}>
      <button
        type="button"
        className="admin-price-bulk-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>Hide by price range</span>
        <span className="admin-price-bulk-chevron" aria-hidden>
          {open ? "▾" : "▸"}
        </span>
      </button>

      {open ? (
        <div className="admin-price-bulk-body">
          <p className="admin-price-bulk-hint">
            Bulk hide or restore products by price. Rules combine with OR — e.g. hide $0{" "}
            <em>or</em> anything under $3,000. Click <strong>Preview</strong> or go straight to{" "}
            <strong>Hide matching</strong> (preview runs automatically).
          </p>

          <div className="admin-price-bulk-presets">
            <span className="admin-sort-label">Quick</span>
            <button
              type="button"
              className="admin-btn admin-btn-sm admin-btn-ghost"
              onClick={() => applyPreset("zero")}
              disabled={pending}
            >
              Hide $0
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-sm admin-btn-ghost"
              onClick={() => applyPreset("under-1000")}
              disabled={pending}
            >
              Hide &lt; $1,000
            </button>
          </div>

          <div className="admin-price-bulk-fields">
            <label className="admin-price-bulk-check">
              <input
                type="checkbox"
                checked={hideZero}
                onChange={(e) => {
                  setHideZero(e.target.checked)
                  invalidatePreview()
                }}
              />
              Hide products priced at <strong>$0</strong>
            </label>

            <label className="admin-price-bulk-field">
              <span>Hide if price is less than</span>
              <div className="admin-price-input-wrap">
                <span className="admin-price-prefix">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 3000"
                  value={hideBelow}
                  onChange={(e) => {
                    setHideBelow(e.target.value)
                    invalidatePreview()
                  }}
                />
              </div>
            </label>

            <label className="admin-price-bulk-field">
              <span>Hide if price is greater than</span>
              <div className="admin-price-input-wrap">
                <span className="admin-price-prefix">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="optional"
                  value={hideAbove}
                  onChange={(e) => {
                    setHideAbove(e.target.value)
                    invalidatePreview()
                  }}
                />
              </div>
            </label>
          </div>

          <div className="admin-price-bulk-actions">
            <button
              type="button"
              className="admin-btn admin-btn-sm"
              onClick={runPreview}
              disabled={pending || !hasRules}
            >
              {pending && !preview ? "Loading…" : "Preview"}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-sm admin-btn-warn"
              onClick={applyHide}
              disabled={pending || !hasRules}
              title={!hasRules ? "Set at least one price rule" : "Preview runs automatically if needed"}
            >
              {pending ? "Working…" : "Hide matching"}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-sm admin-btn-ghost"
              onClick={applyShow}
              disabled={pending || !hasRules}
            >
              Show matching
            </button>
          </div>

          {preview && hasRules ? (
            <p className="admin-price-bulk-preview">
              <strong>{preview.total}</strong> match ·{" "}
              <span className="admin-metric-warn">
                <strong>{preview.visible}</strong> visible
              </span>{" "}
              · <strong>{preview.hidden}</strong> already hidden
            </p>
          ) : hasRules ? (
            <p className="admin-price-bulk-preview admin-price-bulk-preview-muted">
              Set your rules, then Preview or Hide matching.
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
      ) : null}
    </div>
  )
}
