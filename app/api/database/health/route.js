import { NextResponse } from "next/server"
import { requireAuth, requirePermission } from "@/lib/auth"
import { getDatabaseHealth } from "@/lib/database"

export async function GET(request) {
  try {
    const user = await requireAuth(request)
    await requirePermission(user, "admin")

    const result = await getDatabaseHealth()

    return NextResponse.json(result)
  } catch (error) {
    console.error("Database health check error:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
