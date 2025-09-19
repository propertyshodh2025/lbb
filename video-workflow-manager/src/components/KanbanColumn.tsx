'use client'

import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { TaskCard } from './TaskCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Task, TaskStatus } from '@prisma/client'

interface KanbanColumnProps {
  id: string
  title: string
  tasks: (Task & {
    project?: {
      title: string
      client?: {
        name: string
      }
    }
  })[]
  showProject?: boolean
  color?: string
}

export function KanbanColumn({ 
  id, 
  title, 
  tasks, 
  showProject = false, 
  color = 'bg-gray-50' 
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  })

  return (
    <Card className={`flex-1 min-w-[300px] ${color}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-700">
            {title}
          </CardTitle>
          <Badge variant="secondary" className="ml-2">
            {tasks.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={setNodeRef}
          className={`space-y-2 min-h-[200px] rounded-lg p-2 transition-colors ${
            isOver ? 'bg-blue-50 border-2 border-blue-200 border-dashed' : 'bg-transparent'
          }`}
        >
          <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                showProject={showProject} 
              />
            ))}
          </SortableContext>
          {tasks.length === 0 && (
            <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
              No tasks
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}