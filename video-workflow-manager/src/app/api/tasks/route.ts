import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { TaskStatus, UserRole } from '@prisma/client'

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

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const assignedToId = searchParams.get('assignedToId')

    let whereClause: any = {}

    // Role-based filtering
    if (user.role === 'CLIENT') {
      // Clients can only see tasks from their own projects
      const userProjects = await prisma.project.findMany({
        where: { clientId: user.userId },
        select: { id: true }
      })
      whereClause.projectId = {
        in: userProjects.map(p => p.id)
      }
    } else if (user.role === 'EDITOR') {
      // Editors can only see tasks assigned to them
      whereClause.assignedToId = user.userId
    }

    // Additional filters
    if (projectId) whereClause.projectId = projectId
    if (assignedToId) whereClause.assignedToId = assignedToId

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        project: {
          include: {
            client: {
              select: { id: true, name: true }
            }
          }
        },
        assignedTo: {
          select: { id: true, name: true, role: true }
        },
        statusHistory: {
          orderBy: { timestamp: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ tasks })

  } catch (error) {
    console.error('Tasks fetch error:', error)
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

    const { title, description, projectId, dueDate, notes, priority } = await request.json()

    if (!title || !projectId) {
      return NextResponse.json({ error: 'Title and project ID are required' }, { status: 400 })
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        createdById: user.userId,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
        priority: priority || 'Medium',
        status: TaskStatus.RAW_FILES_RECEIVED
      },
      include: {
        project: {
          include: {
            client: {
              select: { id: true, name: true }
            }
          }
        }
      }
    })

    // Create initial status history entry
    await prisma.taskStatusHistory.create({
      data: {
        taskId: task.id,
        status: TaskStatus.RAW_FILES_RECEIVED,
        notes: 'Task created',
        updatedBy: user.userId
      }
    })

    return NextResponse.json({ task }, { status: 201 })

  } catch (error) {
    console.error('Task creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}