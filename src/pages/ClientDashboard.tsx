"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import ClientKanbanBoard from '@/components/ClientKanbanBoard'; // Import the new ClientKanbanBoard
import { Package, Clock, CheckCircle, Download } from 'lucide-react';

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

const ClientDashboard = () => {
  const { profile, isLoading: isSessionLoading, user } = useSession();
  const [clientTasks, setClientTasks] = useState<TaskWithHistory[]>([]);
  const [isTasksLoading, setIsTasksLoading] = useState(true);

  useEffect(() => {
    const fetchClientTasks = async () => {
      if (!user?.id || profile?.role !== 'client') {
        setIsTasksLoading(false);
        setClientTasks([]);
        return;
      }

      setIsTasksLoading(true);

      const { data: clientProjects, error: projectsError } = await supabase
        .from('projects')
        .select('id')
        .eq('client_id', user.id);

      if (projectsError) {
        console.error('Error fetching client projects:', projectsError);
        showError('Failed to load your projects.');
        setClientTasks([]);
        setIsTasksLoading(false);
        return;
      }

      const projectIds = clientProjects?.map(p => p.id) || [];

      if (projectIds.length === 0) {
        setClientTasks([]);
        setIsTasksLoading(false);
        return;
      }

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
            id,
            title,
            description,
            status,
            created_at,
            due_date,
            attachments,
            projects (title),
            profiles (first_name, last_name),
            task_status_history (id, status, notes, timestamp)
          `)
        .in('project_id', projectIds)
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.error('Error fetching client tasks:', tasksError);
        showError('Failed to load your tasks.');
        setClientTasks([]);
      } else {
        const sortedTasks = tasksData?.map(task => ({
          ...task,
          task_status_history: task.task_status_history.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        })) || [];
        setClientTasks(sortedTasks);
      }
      setIsTasksLoading(false);
    };

    fetchClientTasks();

    const tasksSubscription = supabase
      .channel(`client_tasks:${user?.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, payload => {
        console.log('Client task change received!', payload);
        fetchClientTasks();
      })
      .subscribe();

    const projectsSubscription = supabase
      .channel(`client_projects:${user?.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `client_id=eq.${user?.id}` }, payload => {
        console.log('Client project change received!', payload);
        fetchClientTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tasksSubscription);
      supabase.removeChannel(projectsSubscription);
    };
  }, [user, profile, isSessionLoading]);

  if (isSessionLoading || isTasksLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
        <Card className="w-full max-w-4xl dark:bg-gray-800">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profile?.role !== 'client' && profile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
        <Card className="w-full max-w-md text-center dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300">You do not have client privileges to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalTasks = clientTasks.length;
  const inProgressTasksCount = clientTasks.filter(t => ['Assigned', 'In Progress', 'Under Review'].includes(t.status)).length;
  const completedTasksCount = clientTasks.filter(t => t.status === 'Completed').length;

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-6xl shadow-lg mt-8 mb-8 dark:bg-gray-800">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-800 dark:text-white">Client Dashboard</CardTitle>
          <p className="text-lg text-gray-600 dark:text-gray-400">Track the progress of your video projects.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Welcome, {profile?.first_name || 'Client'}! Here's an overview of your projects:
          </p>

          {/* Stats Overview */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="dark:bg-gray-900">
              <CardContent className="p-6 flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Videos</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTasks}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-900">
              <CardContent className="p-6 flex items-center">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{inProgressTasksCount}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-900">
              <CardContent className="p-6 flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedTasksCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Kanban Board */}
          <div className="p-6 border rounded-lg bg-gray-50 dark:bg-gray-900">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Project Status Overview</h3>
            <ClientKanbanBoard tasks={clientTasks} />
          </div>

          {clientTasks.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400">You currently have no tasks.</p>
          )}

          {/* Help Section */}
          <Card className="mt-10 bg-blue-50 dark:bg-blue-900">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Understanding Your Project Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <Package className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                    <span><strong>Raw Files Received:</strong> Your files have been received and catalogued.</span>
                  </div>
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400 mr-2" />
                    <span><strong>In Progress:</strong> Our editors are actively working on your project.</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
                    <span><strong>Completed:</strong> Editing is finished, and the project is ready.</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientDashboard;