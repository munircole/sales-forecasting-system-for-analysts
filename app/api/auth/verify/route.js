import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/database"

export async function GET(request) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ success: false, message: "No token provided" }, { status: 401 })
    }

    const result = await verifyToken(token)

    if (result.success) {
      return NextResponse.json({
        success: true,
        user: result.user,
      })
    } else {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 })
    }
  } catch (error) {
    console.error("Token verification error:", error)
    return NextResponse.json({ success: false, message: "Token verification failed" }, { status: 401 })
  }
}
