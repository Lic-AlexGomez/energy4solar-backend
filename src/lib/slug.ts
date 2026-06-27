export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 120)
}

export async function uniqueProductSlug(base: string, exists: (slug: string) => Promise<boolean>): Promise<string> {
  let slug = slugify(base) || "product"
  let n = 0
  while (await exists(n === 0 ? slug : `${slug}-${n}`)) {
    n += 1
  }
  return n === 0 ? slug : `${slug}-${n}`
}
