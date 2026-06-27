import { NextRequest, NextResponse } from "next/server"
import { affiliateService } from "@/modules/affiliate/affiliate.service"

export const dynamic = "force-dynamic"

type Params = { params: Promise<{ slug: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const { slug } = await params
  const product = await affiliateService.getRedirectUrlBySlug(slug)
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }

  await affiliateService.recordClick({
    productId: product.id,
    referrer: request.headers.get("referer") ?? undefined,
    utmSource: request.nextUrl.searchParams.get("utm_source") ?? "energy4solar",
    utmMedium: request.nextUrl.searchParams.get("utm_medium") ?? "affiliate",
    utmCampaign: request.nextUrl.searchParams.get("utm_campaign") ?? "redirect",
    userAgent: request.headers.get("user-agent") ?? undefined,
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
  })

  return NextResponse.redirect(product.affiliateUrl, 302)
}
