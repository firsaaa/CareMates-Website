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
  const secret = process.env.JWT_SECRET || "V4ldick999!"
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, secret, { expiresIn: "24h" })
}

export function verifyToken(token) {
  const secret = process.env.JWT_SECRET || "V4ldick999!"
  try {
    return jwt.verify(token, secret)
  } catch (_) {
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

export function isAuthorized(user, allowedRoles) {
  if (!user) return false
  return allowedRoles.includes(user.role)
}
