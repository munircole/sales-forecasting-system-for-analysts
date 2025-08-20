import { NextResponse } from "next/server"
import { logoutUser } from "@/lib/database"

export async function POST(request) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (token) {
      await logoutUser(token)
    }

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    })

    // Clear the auth cookie
    response.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
    })

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ success: false, message: "Logout failed" }, { status: 500 })
  }
}
