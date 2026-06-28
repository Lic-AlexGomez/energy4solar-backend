"use client"

import { useState } from "react"

export function LoginPasswordField() {
  const [visible, setVisible] = useState(false)

  return (
    <label className="admin-login-field">
      <span>Admin key</span>
      <div className="admin-login-input-wrap">
        <input
          type={visible ? "text" : "password"}
          name="password"
          autoComplete="current-password"
          placeholder="Enter your key"
          required
        />
        <button
          type="button"
          className="admin-login-reveal"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </label>
  )
}
