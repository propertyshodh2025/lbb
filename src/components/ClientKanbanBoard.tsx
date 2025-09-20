"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ClientTaskCard from './ClientTaskCard'; // Import the new ClientTaskCard

interface TaskWithHistory {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  due_date: string | null;
  attachments: string[];
  projects: { title: string } | null;
  profiles: { // For assigned editor
    first_name: string;
    last_name: string;
  } | null;
  task_status_history: {
    id: string;
    status: string;
    notes: string | null;
    timestamp: string;
  }[];
}

interface ClientKanbanBoardProps {
  tasks: TaskWithHistory[];
}

const ClientKanbanBoard = ({ tasks }: ClientKanbanBoardProps) => {
  const columns = [
    {
      id: 'raw-files-received',
      title: 'Raw Files Received',
      statusMap: ['Raw files received', 'Unassigned'],
      color: 'bg-gray-50 dark:bg-gray-800',
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      statusMap: ['Assigned', 'In Progress', 'Under Review'],
      color: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      id: 'completed',
      title: 'Completed',
      statusMap: ['Completed'],
      color: 'bg-green-50 dark:bg-green-950',
    },
  ];

  const getTasksForColumn = (columnStatusMap: string[]) => {
    return tasks.filter(task => columnStatusMap.includes(task.status));
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 overflow-x-auto pb-4">
      {columns.map((column) => (
        <Card key={column.id} className={`flex-1 min-w-[280px] max-w-[350px] ${column.color} flex flex-col`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {column.title}
              </CardTitle>
              <Badge variant="secondary" className="ml-2">
                {getTasksForColumn(column.statusMap).length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <div className="space-y-3 p-2 rounded-lg bg-transparent min-h-[150px]">
              {getTasksForColumn(column.statusMap).map((task) => (
                <ClientTaskCard key={task.id} task={task} />
              ))}
              {getTasksForColumn(column.statusMap).length === 0 && (
                <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
                  No tasks
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ClientKanbanBoard;