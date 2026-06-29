import Link from "next/link"
import { notFound } from "next/navigation"
import { getAdminProductForEdit } from "../actions"
import { ProductEditForm } from "../product-edit-form"
import {
  getProductImageUploadProvider,
  isProductImageUploadConfigured,
} from "@/modules/storage/product-image-storage"

const UPLOAD_ERRORS: Record<string, string> = {
  "invalid-image": "Image URL must be a valid public http(s) link. Zoho document URLs are not supported.",
  "storage-not-configured":
    "Photo upload is not configured. Add Cloudinary env vars (recommended) or SUPABASE_SERVICE_ROLE_KEY on the backend.",
  "invalid-file-type": "Only JPEG, PNG, WebP, GIF and AVIF images are allowed.",
  "file-too-large": "Image file is too large. Maximum size is 4 MB.",
  "upload-failed": "Could not upload the image. Check Cloudinary or Supabase Storage settings and try again.",
}

export default async function AdminProductEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ saved?: string; error?: string }>
}) {
  const { id } = await params
  const { saved, error } = await searchParams
  const product = await getAdminProductForEdit(id)
  if (!product) notFound()

  const siteUrl = process.env.SITE_URL ?? "https://www.energy4solar.com"
  const storageEnabled = isProductImageUploadConfigured()
  const uploadProvider = getProductImageUploadProvider()

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <Link href="/admin/products" className="admin-back-link">
            ← Products
          </Link>
          <h1 className="admin-page-title">Edit product</h1>
          <p className="admin-subtitle">{product.name}</p>
        </div>
        {product.contentLocked ? (
          <span className="admin-badge admin-badge-warn" title="Zoho sync will not overwrite content">
            Locked
          </span>
        ) : null}
      </header>

      {saved ? (
        <div className="admin-alert admin-alert-success" role="status">
          Product saved successfully.
        </div>
      ) : null}
      {error && UPLOAD_ERRORS[error] ? (
        <div className="admin-alert admin-alert-error" role="alert">
          {UPLOAD_ERRORS[error]}
        </div>
      ) : null}

      <section className="admin-panel admin-section">
        <ProductEditForm product={product} siteUrl={siteUrl} storageEnabled={storageEnabled} uploadProvider={uploadProvider} />
      </section>
    </div>
  )
}
