import { z } from "zod"

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

export const productListSchema = paginationSchema.extend({
  category: z.string().optional(),
  brand: z.string().optional(),
  useCase: z.enum(["home", "rv", "cabin", "marine", "commercial", "golf-cart"]).optional(),
  inStock: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  sort: z.enum(["featured", "price-asc", "price-desc", "rating", "newest"]).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
})

export const searchSchema = z.object({
  q: z.string().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(50).optional(),
})

export const compareSchema = z.object({
  ids: z.array(z.string()).min(1).max(4),
})

export const finderSchema = z.object({
  application: z.enum(["home", "rv", "cabin", "marine", "commercial", "golf-cart"]),
  budget: z.coerce.number().positive().optional(),
  capacityKwh: z.coerce.number().positive().optional(),
  backupDays: z.coerce.number().positive().optional(),
  voltage: z.enum(["any", "12V", "24V", "36V", "48V"]).optional(),
})

export const affiliateClickSchema = z.object({
  productId: z.string().min(1),
  referrer: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  locale: z.string().optional(),
})
