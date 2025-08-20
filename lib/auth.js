import { verifyToken, logoutUser } from "./database.js"

export async function requireAuth(req) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("No valid authorization token provided")
  }

  const token = authHeader.substring(7)
  const result = await verifyToken(token)

  if (!result.success) {
    throw new Error("Invalid or expired token")
  }

  return result.user
}

export async function requirePermission(user, requiredPermission) {
  if (!user.permissions.includes(requiredPermission) && !user.permissions.includes("admin")) {
    throw new Error(`Insufficient permissions. Required: ${requiredPermission}`)
  }
  return true
}

export async function logout(token) {
  return await logoutUser(token)
}
