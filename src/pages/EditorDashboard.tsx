"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import KanbanBoard from '@/components/KanbanBoard';
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

      const subscription = supabase
        .channel(`editor_tasks:${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `assigned_to=eq.${user.id}` }, payload => {
          console.log('Editor task change received!', payload);
          fetchEditorTasks(); // Re-fetch tasks on any change relevant to this editor
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
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
      color: 'bg-neutral-900',
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      statusMap: ['In Progress'],
      assignedToId: user?.id || null,
      color: 'bg-neutral-900',
    },
    {
      id: 'under-review',
      title: 'Under Review',
      statusMap: ['Under Review'],
      assignedToId: user?.id || null,
      color: 'bg-neutral-900',
    },
    {
      id: 'completed',
      title: 'Completed',
      statusMap: ['Completed'],
      assignedToId: user?.id || null,
      color: 'bg-neutral-900',
    },
  ];

  if (isSessionLoading || isTasksLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-neutral-950">
        <Card className="w-full max-w-6xl bg-neutral-900 rounded-2xl glass-border">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2 bg-neutral-700" />
            <Skeleton className="h-4 w-1/2 bg-neutral-700" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full bg-neutral-700" />
            <Skeleton className="h-20 w-full bg-neutral-700" />
            <div className="flex gap-4 overflow-hidden">
              <Skeleton className="h-64 w-1/3 bg-neutral-700" />
              <Skeleton className="h-64 w-1/3 bg-neutral-700" />
              <Skeleton className="h-64 w-1/3 bg-neutral-700" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profile?.role !== 'editor' && profile?.role !== 'admin' && profile?.role !== 'manager') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-neutral-950">
        <Card className="w-full max-w-md text-center bg-neutral-900 rounded-2xl glass-border">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-destructive-foreground">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/70">You do not have editor privileges to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-neutral-950">
      <Card className="w-full max-w-6xl shadow-lg mt-8 mb-8 bg-neutral-900 rounded-2xl glass-border">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-white/90">Editor Dashboard</CardTitle>
          <p className="text-lg text-white/70">Your personal Kanban board for assigned tasks.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-white/70 mb-6">
            Welcome, {profile?.first_name || 'Editor'}! Here are the tasks assigned to you.
          </p>
          <div className="p-6 border border-neutral-800 rounded-2xl bg-neutral-900 glass-border">
            <h3 className="text-xl font-semibold mb-4 text-white/90">My Assigned Tasks</h3>
            {user && <KanbanBoard initialTasks={tasks} columns={kanbanColumns} onTaskMove={handleTaskChange} />}
            {!user && <p className="text-center text-white/70">Please log in to view your tasks.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditorDashboard;