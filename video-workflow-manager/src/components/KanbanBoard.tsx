'use client'

import React from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { KanbanColumn } from './KanbanColumn'
import { TaskCard } from './TaskCard'
import { Task, TaskStatus, Project } from '@prisma/client'
import { emitTaskUpdate } from '@/contexts/SocketContext' // Import emitTaskUpdate

interface TaskWithProject extends Task {
  project: Project & {
    client: {
      id: string // Ensure client ID is available
      name: string
    }
  }
}

interface KanbanBoardProps {
  tasks: TaskWithProject[]
  columns: {
    id: string
    title: string
    status: TaskStatus[]
    color?: string
  }[]
  onTaskMove: (taskId: string, newStatus: TaskStatus, newPosition?: number) => Promise<void>
  showProject?: boolean
}

export function KanbanBoard({ 
  tasks, 
  columns, 
  onTaskMove, 
  showProject = false 
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = React.useState<Task | null>(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = active.id as string
    const newColumnId = over.id as string

    // Find the column and its corresponding status
    const newColumn = columns.find(col => col.id === newColumnId)
    if (!newColumn) return

    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    // Get the new status - use the first status of the column
    const newStatus = newColumn.status[0]

    // If the task is already in the correct status, no need to update
    if (task.status === newStatus) return

    try {
      await onTaskMove(taskId, newStatus)
      
      // Emit socket event after successful DB update
      emitTaskUpdate({
        taskId: task.id,
        taskTitle: task.title,
        status: newStatus,
        assignedToId: task.assignedToId, // Keep current assignedToId for now, actual assignment logic is in manager dashboard
        clientId: task.project.client.id,
      })

    } catch (error) {
      console.error('Failed to move task:', error)
    }
  }

  const getTasksForColumn = (column: { status: TaskStatus[] }) => {
    return tasks.filter(task => column.status.includes(task.status))
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            tasks={getTasksForColumn(column)}
            showProject={showProject}
            color={column.color}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <TaskCard task={activeTask} showProject={showProject} />
        )}
      </DragOverlay>
    </DndContext>
  )
}