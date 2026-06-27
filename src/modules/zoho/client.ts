import { getEnv } from "@/config/env"
import { ZohoApiError, ZohoAuthError } from "@/lib/errors"
import { logger } from "@/lib/logger"
import type { ZohoItemsPage } from "./types"

const MAX_RETRIES = 4
const BASE_DELAY_MS = 500
const RATE_LIMIT_CODES = new Set([429, 503])

type TokenCache = {
  accessToken: string
  expiresAt: number
}

let tokenCache: TokenCache | null = null

export class ZohoBooksClient {
  private readonly env = getEnv()

  private get tokenUrl(): string {
    return `https://${this.env.ZOHO_ACCOUNTS_DOMAIN}/oauth/v2/token`
  }

  private get apiBase(): string {
    return this.env.ZOHO_BOOKS_BASE_URL.replace(/\/$/, "")
  }

  async getAccessToken(): Promise<string> {
    if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
      return tokenCache.accessToken
    }

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: this.env.ZOHO_CLIENT_ID,
      client_secret: this.env.ZOHO_CLIENT_SECRET,
      refresh_token: this.env.ZOHO_REFRESH_TOKEN,
    })

    const res = await fetch(this.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    })

    const payload = (await res.json()) as Record<string, unknown>

    if (!res.ok || typeof payload.access_token !== "string") {
      const code = String(payload.error ?? "unknown")
      const desc = String(payload.error_description ?? payload.message ?? res.statusText)
      logger.error("Zoho token refresh failed", { code, desc })
      throw new ZohoAuthError(`Zoho auth failed: ${code} — ${desc}`)
    }

    const expiresIn = Number(payload.expires_in_sec ?? payload.expires_in ?? 3600)
    tokenCache = {
      accessToken: payload.access_token,
      expiresAt: Date.now() + expiresIn * 1000,
    }

    logger.info("Zoho access token refreshed")
    return tokenCache.accessToken
  }

  async request<T>(path: string, init?: RequestInit): Promise<T> {
    let attempt = 0
    let lastError: unknown

    while (attempt < MAX_RETRIES) {
      attempt += 1
      try {
        const token = await this.getAccessToken()
        const url = path.startsWith("http")
          ? path
          : `${this.apiBase}${path.startsWith("/") ? path : `/${path}`}`

        const res = await fetch(url, {
          ...init,
          headers: {
            Authorization: `Zoho-oauthtoken ${token}`,
            "Content-Type": "application/json",
            ...(init?.headers ?? {}),
          },
        })

        if (RATE_LIMIT_CODES.has(res.status)) {
          const delay = BASE_DELAY_MS * 2 ** attempt
          logger.warn("Zoho rate limit", { status: res.status, attempt, delay })
          await sleep(delay)
          continue
        }

        const payload = (await res.json()) as T & { code?: number; message?: string }

        if (!res.ok || (typeof payload.code === "number" && payload.code !== 0)) {
          throw new ZohoApiError(
            payload.message ?? `Zoho API error HTTP ${res.status}`,
            res.status,
            payload,
          )
        }

        return payload
      } catch (err) {
        lastError = err
        if (err instanceof ZohoAuthError) throw err
        if (attempt >= MAX_RETRIES) break
        await sleep(BASE_DELAY_MS * 2 ** attempt)
      }
    }

    throw lastError instanceof Error ? lastError : new ZohoApiError("Zoho request failed after retries")
  }

  async *listItems(perPage = 200): AsyncGenerator<ZohoItemsPage["items"]> {
    let page = 1
    let hasMore = true
    const org = this.env.ZOHO_ORGANIZATION_ID

    while (hasMore) {
      const data = await this.request<ZohoItemsPage>(
        `/items?organization_id=${org}&page=${page}&per_page=${perPage}&filter_by=Status.Active`,
      )
      yield data.items ?? []
      hasMore = Boolean(data.page_context?.has_more_page)
      page += 1
    }
  }

  async getItem(itemId: string) {
    const org = this.env.ZOHO_ORGANIZATION_ID
    return this.request<{ item: import("./types").ZohoItem }>(
      `/items/${itemId}?organization_id=${org}`,
    )
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

let client: ZohoBooksClient | null = null

export function getZohoClient(): ZohoBooksClient {
  if (!client) client = new ZohoBooksClient()
  return client
}
