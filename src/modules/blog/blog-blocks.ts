export type BlogBlock =
  | { type: "paragraph"; content: string }
  | { type: "heading"; content: string; level: 2 | 3 }
  | { type: "table"; headers: string[]; rows: string[][] }
  | {
      type: "callout"
      variant: "tip" | "warning" | "info"
      title: string
      content: string
    }
  | { type: "product"; productId: string }

export function markdownToBlocks(markdown: string): BlogBlock[] {
  const blocks: BlogBlock[] = []
  const chunks = markdown.split(/\n\n+/)

  for (const chunk of chunks) {
    const text = chunk.trim()
    if (!text) continue
    if (text.startsWith("### ")) {
      blocks.push({ type: "heading", content: text.slice(4).trim(), level: 3 })
    } else if (text.startsWith("## ")) {
      blocks.push({ type: "heading", content: text.slice(3).trim(), level: 2 })
    } else if (text.startsWith("# ")) {
      blocks.push({ type: "heading", content: text.slice(2).trim(), level: 2 })
    } else {
      blocks.push({ type: "paragraph", content: text })
    }
  }

  return blocks.length ? blocks : [{ type: "paragraph", content: markdown.trim() || " " }]
}
