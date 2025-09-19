'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Clock } from 'lucide-react'
import { Task } from '@prisma/client'
import { format } from 'date-fns'

interface TaskCardProps {
  task: Task & {
    project?: {
      title: string
      client?: {
        name: string
      }
    }
  }
  showProject?: boolean
}

export function TaskCard({ task, showProject = false }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'Low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        isDragging ? 'shadow-2xl' : ''
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-medium">{task.title}</CardTitle>
          <Badge className={getPriorityColor(task.priority || 'Medium')}>
            {task.priority || 'Medium'}
          </Badge>
        </div>
        {showProject && task.project && (
          <p className="text-xs text-gray-600">
            {task.project.title}
            {task.project.client && ` - ${task.project.client.name}`}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {task.description && (
          <p className="text-xs text-gray-600 mb-2">{task.description}</p>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500">
          {task.dueDate && (
            <div className="flex items-center gap-1">
              <CalendarDays className="w-3 h-3" />
              {format(new Date(task.dueDate), 'MMM dd')}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {format(new Date(task.createdAt), 'MMM dd')}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}