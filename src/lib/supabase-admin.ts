import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let client: SupabaseClient | null | undefined

export function isSupabaseStorageConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())
}

/** Server-side Supabase client (service role). Never expose to the browser. */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (client !== undefined) return client

  const url = process.env.SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) {
    client = null
    return client
  }

  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  return client
}
