"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"

export async function saveProductSeoAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "")
  const metaTitle = String(formData.get("metaTitle") ?? "") || null
  const metaDescription = String(formData.get("metaDescription") ?? "") || null
  const keywords = String(formData.get("keywords") ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean)

  await prisma.productSEO.upsert({
    where: { productId },
    create: { productId, metaTitle, metaDescription, keywords },
    update: { metaTitle, metaDescription, keywords },
  })
  revalidatePath("/admin/seo")
}
