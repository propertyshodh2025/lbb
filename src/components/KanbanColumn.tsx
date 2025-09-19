"use client";

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TaskCard from './TaskCard';

interface Task {
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
}

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  color?: string;
}

const KanbanColumn = ({ id, title, tasks, color = 'bg-gray-50 dark:bg-gray-800' }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <Card className={`flex-1 min-w-[280px] max-w-[350px] ${color} flex flex-col`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {title}
          </CardTitle>
          <Badge variant="secondary" className="ml-2">
            {tasks.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <div
          ref={setNodeRef}
          className={`space-y-3 p-2 rounded-lg transition-colors min-h-[150px] ${
            isOver ? 'bg-blue-50 dark:bg-blue-900 border-2 border-blue-200 dark:border-blue-700 border-dashed' : 'bg-transparent'
          }`}
        >
          <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
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
  );
};

export default KanbanColumn;