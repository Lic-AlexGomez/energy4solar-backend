import { prisma } from "@/lib/prisma"
import { createHash } from "crypto"

export const affiliateService = {
  async recordClick(input: {
    productId: string
    referrer?: string
    utmSource?: string
    utmMedium?: string
    utmCampaign?: string
    userAgent?: string
    ip?: string
    locale?: string
  }) {
    const product = await prisma.product.findUnique({
      where: { id: input.productId },
      select: { id: true, affiliateUrl: true },
    })
    if (!product) return null

    const ipHash = input.ip
      ? createHash("sha256").update(input.ip).digest("hex").slice(0, 16)
      : undefined

    await prisma.$transaction([
      prisma.affiliateClick.create({
        data: {
          productId: product.id,
          affiliateUrl: product.affiliateUrl,
          referrer: input.referrer,
          utmSource: input.utmSource,
          utmMedium: input.utmMedium,
          utmCampaign: input.utmCampaign,
          userAgent: input.userAgent,
          ipHash,
          locale: input.locale,
        },
      }),
      prisma.affiliateLink.updateMany({
        where: { productId: product.id, isPrimary: true },
        data: { clickCount: { increment: 1 } },
      }),
    ])

    return product.affiliateUrl
  },

  async getRedirectUrlBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true, affiliateUrl: true },
    })
    return product
  },
}
