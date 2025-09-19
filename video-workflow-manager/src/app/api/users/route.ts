import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Only admins and managers can fetch user lists
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    let whereClause: any = {}
    if (role && Object.values(UserRole).includes(role as UserRole)) {
      whereClause.role = role as UserRole
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ users })

  } catch (error) {
    console.error('Users fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}