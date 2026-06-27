import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().optional(),
  ZOHO_CLIENT_ID: z.string().min(1),
  ZOHO_CLIENT_SECRET: z.string().min(1),
  ZOHO_REFRESH_TOKEN: z.string().min(1),
  ZOHO_ORGANIZATION_ID: z.string().min(1),
  ZOHO_ACCOUNTS_DOMAIN: z.string().default("accounts.zoho.com"),
  ZOHO_API_DOMAIN: z.string().default("www.zohoapis.com"),
  ZOHO_BOOKS_BASE_URL: z.string().default("https://www.zohoapis.com/books/v3"),
  AFFILIATE_BASE_URL: z.string().default("https://bigbattery.com"),
  AFFILIATE_UTM_SOURCE: z.string().default("energy4solar"),
  AFFILIATE_UTM_MEDIUM: z.string().default("affiliate"),
  CRON_SECRET: z.string().optional(),
  ADMIN_API_KEY: z.string().optional(),
  SITE_URL: z.string().default("https://www.energy4solar.com"),
})

export type Env = z.infer<typeof envSchema>

let cached: Env | null = null

export function getEnv(): Env {
  if (cached) return cached
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ")
    throw new Error(`Invalid environment: ${missing}`)
  }
  cached = parsed.data
  return cached
}
