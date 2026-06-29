import { randomBytes } from "node:crypto"
import { v2 as cloudinary } from "cloudinary"
import { getCloudinaryConfig, isCloudinaryConfigured } from "@/lib/cloudinary"
import { getSupabaseAdmin, isSupabaseStorageConfigured } from "@/lib/supabase-admin"

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

export function isProductImageUploadConfigured(): boolean {
  return isCloudinaryConfigured() || isSupabaseStorageConfigured()
}

export function getProductImageUploadProvider(): "cloudinary" | "supabase" | null {
  if (isCloudinaryConfigured()) return "cloudinary"
  if (isSupabaseStorageConfigured()) return "supabase"
  return null
}

async function ensureSupabaseBucket() {
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

async function uploadToCloudinary(productSlug: string, file: File): Promise<string> {
  const config = getCloudinaryConfig()
  if (!config) throw new Error("storage-not-configured")

  cloudinary.config(config)
  const buffer = Buffer.from(await file.arrayBuffer())
  const publicId = `${sanitizeSlug(productSlug)}-${Date.now()}-${randomBytes(4).toString("hex")}`

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "energy4solar/products",
        public_id: publicId,
        resource_type: "image",
        overwrite: false,
      },
      (error, uploadResult) => {
        if (error || !uploadResult?.secure_url) {
          reject(error ?? new Error("Cloudinary upload returned no URL"))
          return
        }
        resolve({ secure_url: uploadResult.secure_url })
      },
    )
    stream.end(buffer)
  })

  return result.secure_url
}

async function uploadToSupabase(productSlug: string, file: File): Promise<string> {
  const client = await ensureSupabaseBucket()
  const ext = extensionForMime(file.type)
  const objectName = `${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`
  const path = `${sanitizeSlug(productSlug)}/${objectName}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await client.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, buffer, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  })
  if (uploadError) throw uploadError

  const { data } = client.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path)
  return data.publicUrl
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
  if (!isProductImageUploadConfigured()) return { error: "storage-not-configured" }
  if (!ALLOWED_TYPES.has(file.type)) return { error: "invalid-file-type" }
  if (file.size > MAX_BYTES) return { error: "file-too-large" }

  try {
    const url = isCloudinaryConfigured()
      ? await uploadToCloudinary(productSlug, file)
      : await uploadToSupabase(productSlug, file)
    return { url }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { error: "upload-failed", message }
  }
}
