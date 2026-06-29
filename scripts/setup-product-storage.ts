import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { PRODUCT_IMAGES_BUCKET } from "../src/modules/storage/product-image-storage"
import { getSupabaseAdmin, isSupabaseStorageConfigured } from "../src/lib/supabase-admin"

for (const line of readFileSync(resolve(__dirname, "../.env"), "utf8").split(/\r?\n/)) {
  const t = line.trim()
  if (!t || t.startsWith("#")) continue
  const i = t.indexOf("=")
  if (i < 0) continue
  process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
}

async function main() {
  if (!isSupabaseStorageConfigured()) {
    console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env")
    process.exit(1)
  }

  const supabase = getSupabaseAdmin()!
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  if (listError) throw listError

  if (buckets?.some((b) => b.name === PRODUCT_IMAGES_BUCKET)) {
    console.log(`Bucket "${PRODUCT_IMAGES_BUCKET}" already exists.`)
    return
  }

  const { error: createError } = await supabase.storage.createBucket(PRODUCT_IMAGES_BUCKET, {
    public: true,
    fileSizeLimit: 4 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"],
  })
  if (createError) throw createError

  console.log(`Created public bucket "${PRODUCT_IMAGES_BUCKET}".`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
