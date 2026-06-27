import { NextResponse } from "next/server"
import { AppError } from "./errors"
import { logger } from "./logger"

export type ApiSuccess<T> = {
  data: T
  meta?: Record<string, unknown>
}

export function jsonOk<T>(data: T, meta?: Record<string, unknown>, init?: ResponseInit) {
  const body: ApiSuccess<T> = meta ? { data, meta } : { data }
  return NextResponse.json(body, { status: 200, ...init })
}

export function jsonError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: { message: error.message, code: error.code } },
      { status: error.statusCode },
    )
  }
  logger.error("Unhandled API error", {
    message: error instanceof Error ? error.message : String(error),
  })
  return NextResponse.json(
    { error: { message: "Internal server error", code: "INTERNAL_ERROR" } },
    { status: 500 },
  )
}

export function requireAdminKey(request: Request) {
  const key = process.env.ADMIN_API_KEY
  if (!key) return
  const header = request.headers.get("x-admin-key") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (header !== key) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED")
  }
}

export function requireCronSecret(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return
  const auth = request.headers.get("authorization")
  if (auth !== `Bearer ${secret}`) {
    throw new AppError("Unauthorized cron", 401, "UNAUTHORIZED")
  }
}
