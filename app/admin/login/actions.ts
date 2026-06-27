"use server"

import { redirect } from "next/navigation"
import { setAdminSession } from "@/lib/admin-auth"

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") ?? "")
  const password = String(formData.get("password") ?? "")
  const ok = await setAdminSession(username, password)
  if (!ok) {
    redirect("/admin/login?error=invalid")
  }
  redirect("/admin")
}
