import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { TaskStatus } from '@prisma/client'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const taskId = params.id
    const { status, assignedToId, notes } = await request.json()

    // Get current task to check permissions
    const currentTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    })

    if (!currentTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Permission checks
    const canUpdate = 
      user.role === 'ADMIN' || 
      user.role === 'MANAGER' || 
      (user.role === 'EDITOR' && currentTask.assignedToId === user.userId) ||
      (user.role === 'CLIENT' && currentTask.project.clientId === user.userId)

    if (!canUpdate) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Prepare update data
    const updateData: any = {}
    if (status) updateData.status = status
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
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
        }
      }
    })

    // Create status history entry if status changed
    if (status && status !== currentTask.status) {
      await prisma.taskStatusHistory.create({
        data: {
          taskId,
          status,
          notes: notes || `Status changed to ${status}`,
          updatedBy: user.userId
        }
      })
    }

    return NextResponse.json({ task: updatedTask })

  } catch (error) {
    console.error('Task update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}