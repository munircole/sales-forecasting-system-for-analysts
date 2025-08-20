import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { changeUserPassword } from "@/lib/database"

export async function PUT(request) {
  try {
    const user = await requireAuth(request)
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Current password and new password are required" },
        { status: 400 },
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: "New password must be at least 8 characters long" },
        { status: 400 },
      )
    }

    const result = await changeUserPassword(user.id, currentPassword, newPassword)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
      })
    } else {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 })
    }
  } catch (error) {
    console.error("Password change error:", error)
    return NextResponse.json({ success: false, message: error.message || "Password change failed" }, { status: 500 })
  }
}
