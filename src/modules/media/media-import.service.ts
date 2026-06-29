import { Client as FtpClient } from "basic-ftp"
import SftpClient from "ssh2-sftp-client"
import { prisma } from "@/lib/prisma"
import { filterPublicProductImageUrls } from "@/lib/product-image-url"
import { skuLookupVariants } from "@/modules/woocommerce/catalog"

const IMAGE_EXT = /\.(webp|jpe?g|png|gif|avif)$/i

export type MediaImportResult = {
  ok: boolean
  configured: boolean
  message: string
  filesScanned: number
  productsChecked: number
  matched: number
  updated: number
  stillMissing: number
}

type MediaImportConfig = {
  host: string
  port: number
  user: string
  password: string
  remoteRoot: string
  publicBase: string
  protocol: "sftp" | "ftp"
}

function normalizeKey(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/\.(WEBP|JPE?G|PNG|GIF|AVIF)$/i, "")
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function getMediaImportConfig(): MediaImportConfig | null {
  const host = process.env.MEDIA_IMPORT_HOST?.trim()
  const user = process.env.MEDIA_IMPORT_USER?.trim()
  const password = process.env.MEDIA_IMPORT_PASSWORD?.trim()
  if (!host || !user || !password) return null

  const protocol = process.env.MEDIA_IMPORT_PROTOCOL === "ftp" ? "ftp" : "sftp"
  const port = Number(process.env.MEDIA_IMPORT_PORT) || (protocol === "ftp" ? 21 : 22)
  const remoteRoot = (process.env.MEDIA_IMPORT_REMOTE_PATH ?? "/wp-content/uploads").replace(/\/$/, "")
  const publicBase = (
    process.env.MEDIA_IMPORT_PUBLIC_URL ?? "https://bigbattery.com/wp-content/uploads"
  ).replace(/\/$/, "")

  return { host, port, user, password, remoteRoot, publicBase, protocol }
}

function publicUrlForFile(config: MediaImportConfig, remotePath: string): string {
  const normalized = remotePath.replace(/\\/g, "/")
  const marker = "/wp-content/uploads"
  const idx = normalized.toLowerCase().indexOf(marker)
  const relative =
    idx >= 0
      ? normalized.slice(idx + marker.length).replace(/^\//, "")
      : normalized.replace(new RegExp(`^${config.remoteRoot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/?`), "")
  return `${config.publicBase}/${relative}`
}

type FileEntry = { remotePath: string; publicUrl: string; basename: string }

async function listRemoteImages(config: MediaImportConfig): Promise<FileEntry[]> {
  if (config.protocol === "ftp") {
    return listFtpImages(config)
  }
  return listSftpImages(config)
}

async function listSftpImages(config: MediaImportConfig): Promise<FileEntry[]> {
  const sftp = new SftpClient()
  const files: FileEntry[] = []

  async function walk(dir: string) {
    const entries = await sftp.list(dir)
    for (const entry of entries) {
      const remotePath = `${dir}/${entry.name}`.replace(/\/+/g, "/")
      if (entry.type === "d") {
        await walk(remotePath)
        continue
      }
      if (!IMAGE_EXT.test(entry.name)) continue
      files.push({
        remotePath,
        publicUrl: publicUrlForFile(config, remotePath),
        basename: entry.name,
      })
    }
  }

  try {
    await sftp.connect({
      host: config.host,
      port: config.port,
      username: config.user,
      password: config.password,
      readyTimeout: 20_000,
    })
    await walk(config.remoteRoot)
  } finally {
    await sftp.end().catch(() => {})
  }

  return files
}

async function listFtpImages(config: MediaImportConfig): Promise<FileEntry[]> {
  const client = new FtpClient(30_000)
  const files: FileEntry[] = []

  async function walk(dir: string) {
    const entries = await client.list(dir)
    for (const entry of entries) {
      const remotePath = `${dir}/${entry.name}`.replace(/\/+/g, "/")
      if (entry.isDirectory) {
        await walk(remotePath)
        continue
      }
      if (!IMAGE_EXT.test(entry.name)) continue
      files.push({
        remotePath,
        publicUrl: publicUrlForFile(config, remotePath),
        basename: entry.name,
      })
    }
  }

  try {
    await client.access({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      secure: process.env.MEDIA_IMPORT_SECURE !== "false",
    })
    await walk(config.remoteRoot)
  } finally {
    client.close()
  }

  return files
}

function buildImageIndex(files: FileEntry[]): Map<string, string> {
  const index = new Map<string, string>()

  for (const file of files) {
    const stem = file.basename.replace(IMAGE_EXT, "")
    const keys = new Set<string>([
      normalizeKey(stem),
      normalizeKey(file.basename),
      stem.trim().toUpperCase(),
    ])

    for (const key of keys) {
      if (!key) continue
      if (!index.has(key)) index.set(key, file.publicUrl)
    }
  }

  return index
}

function matchImageUrl(sku: string, index: Map<string, string>, files: FileEntry[]): string | null {
  for (const variant of skuLookupVariants(sku)) {
    const exact = index.get(normalizeKey(variant))
    if (exact) return exact

    const compact = variant.replace(/[^A-Z0-9]/gi, "").toUpperCase()
    if (compact.length >= 6) {
      for (const file of files) {
        const fileCompact = file.basename.replace(IMAGE_EXT, "").replace(/[^A-Z0-9]/gi, "").toUpperCase()
        if (fileCompact === compact || fileCompact.includes(compact) || compact.includes(fileCompact)) {
          return file.publicUrl
        }
      }
    }
  }

  const skuNorm = normalizeKey(sku)
  if (skuNorm.length >= 8) {
    for (const file of files) {
      const stem = normalizeKey(file.basename)
      if (stem.includes(skuNorm) || skuNorm.includes(stem)) return file.publicUrl
    }
  }

  return null
}

export function isMediaImportConfigured(): boolean {
  return getMediaImportConfig() != null
}

export async function importProductImagesFromMediaStorage(): Promise<MediaImportResult> {
  const config = getMediaImportConfig()
  if (!config) {
    return {
      ok: false,
      configured: false,
      message: "Media import is not configured. Add MEDIA_IMPORT_* environment variables on the backend.",
      filesScanned: 0,
      productsChecked: 0,
      matched: 0,
      updated: 0,
      stillMissing: 0,
    }
  }

  const files = await listRemoteImages(config)
  const index = buildImageIndex(files)

  const products = await prisma.product.findMany({
    where: { sku: { not: null } },
    select: { id: true, sku: true, images: { select: { url: true } } },
    orderBy: { sku: "asc" },
  })

  let matched = 0
  let updated = 0

  for (const product of products) {
    if (!product.sku?.trim()) continue
    const hasPublicImage = filterPublicProductImageUrls(product.images.map((i) => i.url)).length > 0
    if (hasPublicImage) continue

    const url = matchImageUrl(product.sku, index, files)
    if (!url) continue
    matched += 1

    await prisma.productImage.deleteMany({ where: { productId: product.id } })
    await prisma.productImage.create({
      data: { productId: product.id, url, sortOrder: 0, isPrimary: true },
    })
    updated += 1
  }

  const stillMissing = await prisma.product.count({ where: { images: { none: {} } } })

  return {
    ok: true,
    configured: true,
    message: `Linked ${updated} product image(s) from media storage.`,
    filesScanned: files.length,
    productsChecked: products.length,
    matched,
    updated,
    stillMissing,
  }
}
