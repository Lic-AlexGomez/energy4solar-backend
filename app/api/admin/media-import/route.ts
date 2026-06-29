import { jsonError, jsonOk } from "@/lib/api-response"
import { AppError } from "@/lib/errors"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { importProductImagesFromMediaStorage } from "@/modules/media/media-import.service"
import { revalidatePath } from "next/cache"

export const dynamic = "force-dynamic"
export const maxDuration = 300

export async function POST() {
  try {
    if (!(await isAdminAuthenticated())) {
      return jsonError(new AppError("Unauthorized", 401, "UNAUTHORIZED"))
    }

    const result = await importProductImagesFromMediaStorage()

    if (result.ok) {
      revalidatePath("/admin/sync")
      revalidatePath("/admin")
      revalidatePath("/admin/products")
    }

    return jsonOk(result)
  } catch (error) {
    return jsonError(error)
  }
}
