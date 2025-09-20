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

const KanbanColumn = ({ id, title, tasks, color = 'bg-neutral-900' }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <Card className={`flex-1 min-w-[280px] max-w-[350px] ${color} flex flex-col rounded-2xl glass-border`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-white/90">
            {title}
          </CardTitle>
          <Badge variant="secondary" className="ml-2 bg-lime-400 text-black">
            {tasks.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <div
          ref={setNodeRef}
          className={`space-y-3 p-2 rounded-lg transition-colors min-h-[150px] ${
            isOver ? 'bg-lime-950/30 border-2 border-lime-400/50 border-dashed' : 'bg-transparent'
          }`}
        >
          <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </SortableContext>
          {tasks.length === 0 && (
            <div className="flex items-center justify-center h-24 text-white/70 text-sm">
              No tasks
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KanbanColumn;