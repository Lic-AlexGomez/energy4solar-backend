import { randomBytes } from "node:crypto"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const PRODUCT_IMAGES_BUCKET = "product-images"
const MAX_BYTES = 4 * 1024 * 1024

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
])

function extensionForMime(mime: string): string {
  switch (mime) {
    case "image/png":
      return "png"
    case "image/webp":
      return "webp"
    case "image/gif":
      return "gif"
    case "image/avif":
      return "avif"
    default:
      return "jpg"
  }
}

function sanitizeSlug(slug: string): string {
  return slug.replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-").slice(0, 80) || "product"
}

async function ensureBucket() {
  const supabase = getSupabaseAdmin()
  if (!supabase) throw new Error("storage-not-configured")

  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  if (listError) throw listError
  if (buckets?.some((b) => b.name === PRODUCT_IMAGES_BUCKET)) return supabase

  const { error: createError } = await supabase.storage.createBucket(PRODUCT_IMAGES_BUCKET, {
    public: true,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: [...ALLOWED_TYPES],
  })
  if (createError) throw createError
  return supabase
}

export type ProductImageUploadError =
  | "storage-not-configured"
  | "invalid-file-type"
  | "file-too-large"
  | "upload-failed"

export async function uploadProductImageFile(
  productSlug: string,
  file: File,
): Promise<{ url: string } | { error: ProductImageUploadError; message?: string }> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return { error: "storage-not-configured" }

  if (!ALLOWED_TYPES.has(file.type)) return { error: "invalid-file-type" }
  if (file.size > MAX_BYTES) return { error: "file-too-large" }

  try {
    const client = await ensureBucket()
    const ext = extensionForMime(file.type)
    const objectName = `${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`
    const path = `${sanitizeSlug(productSlug)}/${objectName}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await client.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, buffer, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    })
    if (uploadError) {
      return { error: "upload-failed", message: uploadError.message }
    }

    const { data } = client.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path)
    return { url: data.publicUrl }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { error: "upload-failed", message }
  }
}
