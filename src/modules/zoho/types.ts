export type ZohoItem = {
  item_id: string
  name: string
  sku?: string
  description?: string
  rate: number
  purchase_rate?: number
  stock_on_hand?: number
  item_type?: string
  product_type?: string
  status?: string
  unit?: string
  image_name?: string
  image_document_id?: string
  brand?: string
  manufacturer?: string
  custom_fields?: Array<{ api_name?: string; value?: string; label?: string }>
  tags?: string[]
  cf_capacity?: string
  cf_voltage?: string
  [key: string]: unknown
}

export type ZohoListResponse<T> = {
  code: number
  message: string
  page_context?: { page: number; per_page: number; has_more_page: boolean }
} & T

export type ZohoItemsPage = ZohoListResponse<{ items: ZohoItem[] }>
