"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { DraggableProvided } from '@dnd-kit/core';
import { Link } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    due_date: string | null;
    created_at: string;
    project_id: string | null;
    assigned_to: string | null;
    projects: { title: string } | null;
    profiles: { first_name: string; last_name: string } | null;
  };
  dragHandleProps?: any;
  listeners?: any;
  style?: React.CSSProperties;
  isDragging?: boolean;
}

const TaskCard = ({ task, dragHandleProps, listeners, style, isDragging }: TaskCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Raw files received': return 'bg-lime-950 text-lime-400';
      case 'Unassigned': return 'bg-neutral-700 text-white/70';
      case 'Assigned': return 'bg-yellow-900 text-yellow-400';
      case 'In Progress': return 'bg-orange-900 text-orange-400';
      case 'Completed': return 'bg-green-900 text-green-400';
      case 'Under Review': return 'bg-purple-900 text-purple-400';
      default: return 'bg-neutral-700 text-white/70';
    }
  };

  return (
    <Card
      className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow bg-neutral-800 rounded-2xl glass-border ${isDragging ? 'shadow-2xl opacity-70' : ''}`}
      style={style}
      {...dragHandleProps}
      {...listeners}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-medium text-white/90">
            <Link to={`/tasks/${task.id}`} className="hover:underline text-lime-300">
              {task.title}
            </Link>
          </CardTitle>
          <Badge className={getStatusColor(task.status)}>
            {task.status}
          </Badge>
        </div>
        {task.projects && (
          <p className="text-xs text-white/70">
            Project: {task.projects.title}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {task.description && (
          <p className="text-xs text-white/70 mb-2 line-clamp-2">{task.description}</p>
        )}
        <div className="flex items-center justify-between text-xs text-white/70 mt-2">
          {task.due_date && (
            <div className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3 text-white/70" />
              Due: {format(new Date(task.due_date), 'MMM dd')}
            </div>
          )}
          {task.assigned_to && task.profiles && (
            <div className="flex items-center gap-1">
              Assigned: {task.profiles.first_name}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;