export type WooStoreImage = {
  id: number
  src: string
  thumbnail?: string
  alt?: string
}

export type WooStoreProduct = {
  id: number
  name: string
  slug: string
  sku: string
  permalink: string
  images: WooStoreImage[]
  short_description?: string
  description?: string
}

export type WooCatalogEntry = {
  images: string[]
  permalink?: string
  name?: string
}

export type WooImageCatalog = Map<string, WooCatalogEntry>
