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
  const result = await importProductImagesFromMediaStorage()
  revalidatePath("/admin/sync")
  revalidatePath("/admin")
  revalidatePath("/admin/products")
  return result
}
