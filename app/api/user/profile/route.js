import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { updateUserProfile } from "@/lib/database"

export async function PUT(request) {
  try {
    const user = await requireAuth(request)
    const profileData = await request.json()

    const result = await updateUserProfile(user.id, profileData)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
      })
    } else {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 })
    }
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ success: false, message: error.message || "Profile update failed" }, { status: 500 })
  }
}
