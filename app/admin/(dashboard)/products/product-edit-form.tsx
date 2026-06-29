"use client"

import { useEffect, useState } from "react"
import { updateProductAction, type AdminProductEdit } from "./actions"
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/product-image-url"

export function ProductEditForm({
  product,
  siteUrl,
  storageEnabled,
}: {
  product: AdminProductEdit
  siteUrl: string
  storageEnabled: boolean
}) {
  const [imageUrl, setImageUrl] = useState(product.imageUrl)
  const [filePreview, setFilePreview] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview)
    }
  }, [filePreview])

  const previewUrl = filePreview || (imageUrl.trim() || DEFAULT_PRODUCT_IMAGE)

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (filePreview) URL.revokeObjectURL(filePreview)
    if (file) {
      setFilePreview(URL.createObjectURL(file))
    } else {
      setFilePreview(null)
    }
  }

  return (
    <form action={updateProductAction} className="admin-form admin-form-wide admin-product-edit" encType="multipart/form-data">
      <input type="hidden" name="productId" value={product.id} />

      <div className="admin-product-edit-layout">
        <div className="admin-product-edit-main">
          <label>
            Name
            <input name="name" required defaultValue={product.name} />
          </label>

          <label>
            Short description
            <textarea name="shortDescription" rows={2} defaultValue={product.shortDescription} />
          </label>

          <label>
            Full description
            <textarea name="description" rows={8} defaultValue={product.description} />
          </label>

          <div className="admin-form-row">
            <label>
              Price (USD)
              <input name="price" type="number" step="0.01" min="0" required defaultValue={product.price} />
            </label>
            <label>
              Badge
              <input name="badge" placeholder="e.g. Best seller" defaultValue={product.badge ?? ""} />
            </label>
          </div>

          <div className="admin-form-row admin-form-row-3">
            <label>
              Capacity
              <input name="capacity" placeholder="e.g. 5 kWh" defaultValue={product.capacity ?? ""} />
            </label>
            <label>
              Voltage
              <input name="voltage" placeholder="e.g. 48V" defaultValue={product.voltage ?? ""} />
            </label>
            <label>
              Chemistry
              <input name="chemistry" placeholder="e.g. LiFePO4" defaultValue={product.chemistry ?? ""} />
            </label>
          </div>

          <div className="admin-form-row admin-form-row-3">
            <label>
              Warranty
              <input name="warranty" placeholder="e.g. 10 years" defaultValue={product.warranty ?? ""} />
            </label>
            <label>
              Cycle life
              <input
                name="cycleLife"
                type="number"
                min="0"
                placeholder="6000"
                defaultValue={product.cycleLife ?? ""}
              />
            </label>
            <label>
              Weight (lbs)
              <input
                name="weightLbs"
                type="number"
                step="0.1"
                min="0"
                placeholder="120"
                defaultValue={product.weightLbs ?? ""}
              />
            </label>
          </div>
        </div>

        <aside className="admin-product-edit-aside">
          <div className="admin-product-image-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt=""
              onError={(e) => {
                e.currentTarget.src = DEFAULT_PRODUCT_IMAGE
              }}
            />
          </div>

          {storageEnabled ? (
            <label>
              Upload photo
              <input
                name="imageFile"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                onChange={onFileChange}
              />
            </label>
          ) : (
            <p className="admin-hint admin-hint-warn">
              File upload is off — set <code>SUPABASE_SERVICE_ROLE_KEY</code> on the backend to enable Supabase Storage.
            </p>
          )}
          <p className="admin-hint">
            {storageEnabled
              ? "Upload saves to Supabase Storage (max 4 MB). Or paste an external URL below."
              : "Paste a public image URL below."}
          </p>

          <label>
            Image URL
            <input
              name="imageUrl"
              type="url"
              placeholder="https://bigbattery.com/wp-content/uploads/..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </label>
          <p className="admin-hint">If you upload a file, it takes priority over the URL field on save.</p>

          <div className="admin-product-edit-toggles">
            <label className="admin-checkbox">
              <input type="checkbox" name="inStock" value="true" defaultChecked={product.inStock} />
              In stock
            </label>
            <label className="admin-checkbox">
              <input type="checkbox" name="isVisible" value="true" defaultChecked={product.isVisible} />
              Visible on site
            </label>
            <label className="admin-checkbox">
              <input type="checkbox" name="contentLocked" value="true" defaultChecked={product.contentLocked} />
              Lock from Zoho sync
            </label>
          </div>
          <p className="admin-hint">
            When locked, Zoho sync will not overwrite name, descriptions, price, specs, or images for this product.
          </p>

          <div className="admin-product-edit-meta">
            {product.sku ? (
              <p>
                SKU: <code>{product.sku}</code>
              </p>
            ) : null}
            {product.brandName ? <p>Brand: {product.brandName}</p> : null}
            {product.categoryName ? <p>Category: {product.categoryName}</p> : null}
            <p>
              Slug: <code>{product.slug}</code>
            </p>
            <a href={`${siteUrl}/product/${product.slug}`} target="_blank" rel="noreferrer" className="admin-link-sm">
              View on site →
            </a>
          </div>
        </aside>
      </div>

      <div className="admin-form-actions">
        <button type="submit" className="admin-btn">
          Save changes
        </button>
      </div>
    </form>
  )
}
