"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/components/SessionContextProvider';

interface Task {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  project_id: string | null;
  assigned_to: string | null;
  projects: {
    title: string;
  } | null;
  profiles: {
    first_name: string;
    last_name: string;
  } | null;
}

interface TaskListProps {
  refreshTrigger?: boolean; // Prop to trigger re-fetch
  filterByAssignedTo?: string | null; // Optional: filter tasks by assigned editor ID
}

const TaskList = ({ refreshTrigger, filterByAssignedTo = null }: TaskListProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      let query = supabase
        .from('tasks')
        .select(`
          id,
          title,
          status,
          created_at,
          updated_at,
          project_id,
          assigned_to,
          projects (title),
          profiles (first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (filterByAssignedTo) {
        query = query.eq('assigned_to', filterByAssignedTo);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching tasks:', error);
        showError('Failed to load tasks.');
        setTasks([]);
      } else {
        setTasks(data || []);
      }
      setIsLoading(false);
    };

    fetchTasks();
  }, [refreshTrigger, filterByAssignedTo]); // Re-fetch when refreshTrigger or filter changes

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400">No tasks found.</p>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Card key={task.id} className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">{task.title}</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Project: {task.projects?.title || 'N/A'}
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Status: <span className="font-medium capitalize">{task.status}</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Assigned To: {task.profiles ? `${task.profiles.first_name} ${task.profiles.last_name}` : 'Unassigned'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Created: {new Date(task.created_at).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TaskList;