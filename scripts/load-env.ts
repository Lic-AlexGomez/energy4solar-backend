import { readFileSync } from "node:fs"
import { resolve } from "node:path"

export function loadEnvFile(filename = ".env", override = false) {
  const path = resolve(__dirname, "..", filename)
  try {
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const t = line.trim()
      if (!t || t.startsWith("#")) continue
      const i = t.indexOf("=")
      if (i < 0) continue
      const key = t.slice(0, i).trim()
      if (override || !process.env[key]) process.env[key] = t.slice(i + 1).trim()
    }
  } catch {
    /* optional */
  }
}
