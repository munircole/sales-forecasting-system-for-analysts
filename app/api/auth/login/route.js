import { NextResponse } from "next/server"
import { authenticateUser } from "@/lib/database"

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password are required" }, { status: 400 })
    }

    const result = await authenticateUser(email, password)

    if (result.success) {
      const response = NextResponse.json({
        success: true,
        user: result.user,
        message: "Login successful",
      })

      // Set HTTP-only cookie for token
      response.cookies.set("auth-token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: result.user.sessionTimeout * 60, // Convert minutes to seconds
      })

      return response
    } else {
      return NextResponse.json({ success: false, message: result.message }, { status: 401 })
    }
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, message: error.message || "Login failed" }, { status: 401 })
  }
}
