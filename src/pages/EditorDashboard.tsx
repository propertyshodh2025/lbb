"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import KanbanBoard from '@/components/KanbanBoard'; // Import KanbanBoard
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

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
  profiles: { id: string; first_name: string; last_name: string; role: string } | null;
}

const EditorDashboard = () => {
  const { profile, isLoading: isSessionLoading, user } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTasksLoading, setIsTasksLoading] = useState(true);

  const fetchEditorTasks = async () => {
    if (!user?.id) return;

    setIsTasksLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        description,
        status,
        due_date,
        created_at,
        project_id,
        assigned_to,
        projects (title),
        profiles (id, first_name, last_name, role)
      `)
      .eq('assigned_to', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching editor tasks:', error);
      showError('Failed to load your tasks.');
      setTasks([]);
    } else {
      setTasks(data || []);
    }
    setIsTasksLoading(false);
  };

  useEffect(() => {
    if (!isSessionLoading && user?.id && (profile?.role === 'editor' || profile?.role === 'admin' || profile?.role === 'manager')) {
      fetchEditorTasks();
    }
  }, [isSessionLoading, user, profile]);

  const handleTaskChange = () => {
    fetchEditorTasks(); // Re-fetch tasks after a change
  };

  const kanbanColumns = [
    {
      id: 'assigned-to-me',
      title: 'Assigned to Me',
      statusMap: ['Assigned'],
      assignedToId: user?.id || null,
      color: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      statusMap: ['In Progress'],
      assignedToId: user?.id || null,
      color: 'bg-orange-50 dark:bg-orange-950',
    },
    {
      id: 'under-review',
      title: 'Under Review',
      statusMap: ['Under Review'],
      assignedToId: user?.id || null,
      color: 'bg-purple-50 dark:bg-purple-950',
    },
    {
      id: 'completed',
      title: 'Completed',
      statusMap: ['Completed'],
      assignedToId: user?.id || null,
      color: 'bg-green-50 dark:bg-green-950',
    },
  ];

  if (isSessionLoading || isTasksLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
        <Card className="w-full max-w-6xl dark:bg-gray-800">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <div className="flex gap-4 overflow-hidden">
              <Skeleton className="h-64 w-1/3" />
              <Skeleton className="h-64 w-1/3" />
              <Skeleton className="h-64 w-1/3" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profile?.role !== 'editor' && profile?.role !== 'admin' && profile?.role !== 'manager') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
        <Card className="w-full max-w-md text-center dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300">You do not have editor privileges to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-6xl shadow-lg mt-8 mb-8 dark:bg-gray-800">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-800 dark:text-white">Editor Dashboard</CardTitle>
          <p className="text-lg text-gray-600 dark:text-gray-400">Your personal Kanban board for assigned tasks.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Welcome, {profile?.first_name || 'Editor'}! Here are the tasks assigned to you.
          </p>
          <div className="p-6 border rounded-lg bg-gray-50 dark:bg-gray-900">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">My Assigned Tasks</h3>
            {user && <KanbanBoard initialTasks={tasks} columns={kanbanColumns} onTaskMove={handleTaskChange} />}
            {!user && <p className="text-center text-gray-500 dark:text-gray-400">Please log in to view your tasks.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditorDashboard;