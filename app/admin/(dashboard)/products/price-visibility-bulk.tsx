"use client"

import { useState, useTransition } from "react"
import {
  bulkHideByPriceAction,
  bulkShowByPriceAction,
  previewPriceVisibilityAction,
} from "./actions"

type Preview = { total: number; visible: number; hidden: number }

export function PriceVisibilityBulk() {
  const [open, setOpen] = useState(false)
  const [hideZero, setHideZero] = useState(false)
  const [hideBelow, setHideBelow] = useState("")
  const [hideAbove, setHideAbove] = useState("")
  const [preview, setPreview] = useState<Preview | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function formData() {
    const fd = new FormData()
    fd.set("hideZero", String(hideZero))
    fd.set("hideBelow", hideBelow)
    fd.set("hideAbove", hideAbove)
    return fd
  }

  function runPreview() {
    setMessage(null)
    startTransition(async () => {
      const result = await previewPriceVisibilityAction(formData())
      setPreview(result)
    })
  }

  function applyHide() {
    if (!preview?.visible) return
    if (!confirm(`Hide ${preview.visible} visible product(s) matching these rules?`)) return

    setMessage(null)
    startTransition(async () => {
      const { updated } = await bulkHideByPriceAction(formData())
      setMessage(`Hidden ${updated} product(s).`)
      const result = await previewPriceVisibilityAction(formData())
      setPreview(result)
    })
  }

  function applyShow() {
    if (!preview?.hidden) return
    if (!confirm(`Show ${preview.hidden} hidden product(s) matching these rules?`)) return

    setMessage(null)
    startTransition(async () => {
      const { updated } = await bulkShowByPriceAction(formData())
      setMessage(`Restored visibility for ${updated} product(s).`)
      const result = await previewPriceVisibilityAction(formData())
      setPreview(result)
    })
  }

  function applyPreset(preset: "zero" | "under-1000") {
    setMessage(null)
    setPreview(null)
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
    <div className="admin-panel admin-price-bulk">
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
            <em>or</em> anything under $1,000.
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
                  setPreview(null)
                  setMessage(null)
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
                  placeholder="e.g. 1000"
                  value={hideBelow}
                  onChange={(e) => {
                    setHideBelow(e.target.value)
                    setPreview(null)
                    setMessage(null)
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
                    setPreview(null)
                    setMessage(null)
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
              Preview
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-sm admin-btn-warn"
              onClick={applyHide}
              disabled={pending || !preview?.visible}
            >
              Hide matching
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-sm admin-btn-ghost"
              onClick={applyShow}
              disabled={pending || !preview?.hidden}
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
          ) : null}

          {message ? <p className="admin-price-bulk-message">{message}</p> : null}
        </div>
      ) : null}
    </div>
  )
}
