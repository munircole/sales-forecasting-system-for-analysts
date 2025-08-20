import { NextResponse } from "next/server"
import { createUser } from "@/lib/database"

export async function POST(request) {
  try {
    const userData = await request.json()

    const { email, password, firstName, lastName, company, role, phone, timezone } = userData

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ success: false, message: "Required fields are missing" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, message: "Invalid email format" }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters long" },
        { status: 400 },
      )
    }

    const result = await createUser({
      email,
      password,
      firstName,
      lastName,
      company,
      role,
      phone,
      timezone,
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "User created successfully. You can now log in.",
        userId: result.userId,
      })
    } else {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 })
    }
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ success: false, message: error.message || "Registration failed" }, { status: 400 })
  }
}
