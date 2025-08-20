import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getStorageUsage } from "@/lib/database"

export async function GET(request) {
  try {
    const user = await requireAuth(request)
    const result = await getStorageUsage(user.id)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Get storage usage error:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
