"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/slug"

export async function saveBlogPostAction(formData: FormData) {
  const id = String(formData.get("id") ?? "")
  const title = String(formData.get("title") ?? "")
  const excerpt = String(formData.get("excerpt") ?? "")
  const content = String(formData.get("content") ?? "")
  const category = String(formData.get("category") ?? "Technology")
  const author = String(formData.get("author") ?? "Energy4Solar Team")
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || null
  const published = formData.get("published") === "on"
  const featured = formData.get("featured") === "on"
  const seoTitle = String(formData.get("seoTitle") ?? "").trim() || null
  const metaDescription = String(formData.get("metaDescription") ?? "").trim() || null

  const slug = slugify(title)

  if (id) {
    await prisma.blogPost.update({
      where: { id },
      data: {
        title,
        excerpt,
        content,
        category,
        author,
        imageUrl,
        published,
        featured,
        seoTitle,
        metaDescription,
        publishedAt: published ? new Date() : null,
      },
    })
  } else {
    await prisma.blogPost.create({
      data: {
        slug,
        title,
        excerpt,
        content,
        category,
        author,
        imageUrl,
        published,
        featured,
        seoTitle,
        metaDescription,
        publishedAt: published ? new Date() : null,
      },
    })
  }

  revalidatePath("/admin/blog")
}

export async function toggleBlogPublishedAction(formData: FormData) {
  const id = String(formData.get("id") ?? "")
  const published = formData.get("published") === "true"

  await prisma.blogPost.update({
    where: { id },
    data: {
      published,
      publishedAt: published ? new Date() : null,
    },
  })

  revalidatePath("/admin/blog")
}

export async function toggleBlogFeaturedAction(formData: FormData) {
  const id = String(formData.get("id") ?? "")
  const featured = formData.get("featured") === "true"

  await prisma.blogPost.update({
    where: { id },
    data: { featured },
  })

  revalidatePath("/admin/blog")
}

export async function deleteBlogPostAction(formData: FormData) {
  const id = String(formData.get("id") ?? "")
  await prisma.blogPost.delete({ where: { id } })
  revalidatePath("/admin/blog")
}
