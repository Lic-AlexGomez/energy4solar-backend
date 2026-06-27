"use server"

import { redirect } from "next/navigation"
import { setAdminSession } from "@/lib/admin-auth"

export async function loginAction(formData: FormData) {
  const passkey = String(formData.get("passkey") ?? "")
  const ok = await setAdminSession(passkey)
  if (!ok) {
    throw new Error("Invalid admin key")
  }
  redirect("/admin")
}
