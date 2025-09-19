"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { DraggableProvided } from '@dnd-kit/core'; // This is not directly used with @dnd-kit/sortable, but good to keep in mind for context
import { Link } from 'react-router-dom';

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
  dragHandleProps?: any; // Props from useSortable
  listeners?: any; // Listeners from useSortable
  style?: React.CSSProperties; // Style from useSortable
  isDragging?: boolean;
}

const TaskCard = ({ task, dragHandleProps, listeners, style, isDragging }: TaskCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Raw files received': return 'bg-blue-100 text-blue-800';
      case 'Unassigned': return 'bg-gray-100 text-gray-800';
      case 'Assigned': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-orange-100 text-orange-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Under Review': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card
      className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${isDragging ? 'shadow-2xl opacity-70' : ''}`}
      style={style}
      {...dragHandleProps}
      {...listeners}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-medium">
            <Link to={`/tasks/${task.id}`} className="hover:underline">
              {task.title}
            </Link>
          </CardTitle>
          <Badge className={getStatusColor(task.status)}>
            {task.status}
          </Badge>
        </div>
        {task.projects && (
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Project: {task.projects.title}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {task.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{task.description}</p>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          {task.due_date && (
            <div className="flex items-center gap-1">
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