import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

export interface TokenPayload {
  userId: string
  email: string
  role: UserRole
  name: string
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
  } catch {
    return null
  }
}

export function getTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null
  const parts = authHeader.split(' ')
  return parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : null
}