"use server"

import { revalidatePath } from "next/cache"
import { commissionService } from "@/modules/admin/commission.service"

export async function importCommissionsAction(formData: FormData) {
  const file = formData.get("csv") as File | null
  if (!file || file.size === 0) {
    return { imported: 0, skipped: 0, errors: ["No file selected."] }
  }

  const text = await file.text()
  const result = await commissionService.importCsv(text)
  revalidatePath("/admin/commissions")
  return result
}

export async function clearCommissionsAction() {
  const { prisma } = await import("@/lib/prisma")
  await prisma.commissionRecord.deleteMany()
  revalidatePath("/admin/commissions")
}
