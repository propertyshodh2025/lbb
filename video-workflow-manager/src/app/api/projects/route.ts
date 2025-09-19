import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

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

    let whereClause: any = {}

    // Role-based filtering
    if (user.role === 'CLIENT') {
      whereClause.clientId = user.userId
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        client: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { tasks: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ projects })

  } catch (error) {
    console.error('Projects fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { title, description, clientId } = await request.json()

    if (!title || !clientId) {
      return NextResponse.json({ error: 'Title and client ID are required' }, { status: 400 })
    }

    const project = await prisma.project.create({
      data: {
        title,
        description,
        clientId
      },
      include: {
        client: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json({ project }, { status: 201 })

  } catch (error) {
    console.error('Project creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}