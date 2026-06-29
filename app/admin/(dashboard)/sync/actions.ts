"use server"

import { revalidatePath } from "next/cache"
import { importProductImagesFromMediaStorage } from "@/modules/media/media-import.service"
import { zohoSyncService } from "@/modules/sync/sync.service"

export async function triggerSyncAction() {
  const result = await zohoSyncService.runFullSync()
  revalidatePath("/admin/sync")
  revalidatePath("/admin")
  return result
}

export async function importMediaImagesAction() {
  try {
    const result = await importProductImagesFromMediaStorage()
    if (result.ok) {
      revalidatePath("/admin/sync")
      revalidatePath("/admin")
      revalidatePath("/admin/products")
    }
    return result
  } catch (err) {
    return {
      ok: false,
      configured: true,
      message: err instanceof Error ? err.message : "Import failed unexpectedly",
      filesScanned: 0,
      productsChecked: 0,
      matched: 0,
      updated: 0,
      stillMissing: 0,
    }
  }
}
