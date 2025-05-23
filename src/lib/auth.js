import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

export async function hashPassword(password) {
  const saltRounds = 10
  return bcrypt.hash(password, saltRounds)
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash)
}

export function generateToken(user) {
  const secret = process.env.JWT_SECRET 
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, secret, { expiresIn: "24h" })
}

export function verifyToken(token) {
  const secret = process.env.JWT_SECRET 
  try {
    return jwt.verify(token, secret)
  } catch {
    return null
  }
}

export function getUserFromRequest(req) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.substring(7)
  return verifyToken(token)
}

export function getUserIdFromToken(token) {
  try {
    // Basic JWT parsing
    const base64Url = token.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    )

    const decoded = JSON.parse(jsonPayload)
    return decoded.sub ? decoded.sub : decoded.id // Coba kedua field
  } catch (error) {
    console.error("Error decoding token:", error)
    return null
  }
}

export function isAuthorized(user, allowedRoles) {
  if (!user) return false
  return allowedRoles.includes(user.role)
}
