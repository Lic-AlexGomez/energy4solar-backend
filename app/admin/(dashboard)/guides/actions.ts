"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/slug"

export async function saveGuideAction(formData: FormData) {
  const id = String(formData.get("id") ?? "")
  const title = String(formData.get("title") ?? "")
  const excerpt = String(formData.get("excerpt") ?? "")
  const content = String(formData.get("content") ?? "")
  const published = formData.get("published") === "on"
  const relatedProductSlugs = String(formData.get("relatedProductSlugs") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  const slug = slugify(title)

  if (id) {
    await prisma.guide.update({
      where: { id },
      data: {
        title,
        excerpt,
        content,
        published,
        relatedProductSlugs,
        publishedAt: published ? new Date() : null,
      },
    })
  } else {
    await prisma.guide.create({
      data: {
        slug,
        title,
        excerpt,
        content,
        published,
        relatedProductSlugs,
        publishedAt: published ? new Date() : null,
      },
    })
  }
  revalidatePath("/admin/guides")
}

export async function deleteGuideAction(id: string) {
  await prisma.guide.delete({ where: { id } })
  revalidatePath("/admin/guides")
}

export async function toggleGuidePublishedAction(formData: FormData) {
  const id = String(formData.get("id") ?? "")
  const published = formData.get("published") === "true"

  await prisma.guide.update({
    where: { id },
    data: {
      published,
      publishedAt: published ? new Date() : null,
    },
  })

  revalidatePath("/admin/guides")
}
