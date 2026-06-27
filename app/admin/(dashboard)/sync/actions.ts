"use server"

import { revalidatePath } from "next/cache"
import { zohoSyncService } from "@/modules/sync/sync.service"

export async function triggerSyncAction() {
  const result = await zohoSyncService.runFullSync()
  revalidatePath("/admin/sync")
  return result
}
