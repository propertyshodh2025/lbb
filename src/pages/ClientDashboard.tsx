"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import TimelineTracker from '@/components/TimelineTracker';
import { Package, Clock, CheckCircle, Download } from 'lucide-react'; // Import Download icon

interface TaskWithHistory {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  due_date: string | null;
  task_status_history: {
    id: string;
    status: string;
    notes: string | null;
    timestamp: string;
  }[];
  projects: { title: string } | null;
  attachments: string[]; // New attachments field
}

const ClientDashboard = () => {
  const { profile, isLoading: isSessionLoading, user } = useSession();
  const [clientTasks, setClientTasks] = useState<TaskWithHistory[]>([]);
  const [isTasksLoading, setIsTasksLoading] = useState(true);

  useEffect(() => {
    const fetchClientTasks = async () => {
      if (user?.id && profile?.role === 'client') {
        setIsTasksLoading(true);
        const { data, error } = await supabase
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
            task_status_history (id, status, notes, timestamp)
          `)
          .in('project_id', supabase.from('projects').select('id').eq('client_id', user.id))
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching client tasks:', error);
          showError('Failed to load your tasks.');
          setClientTasks([]);
        } else {
          const sortedTasks = data?.map(task => ({
            ...task,
            task_status_history: task.task_status_history.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          })) || [];
          setClientTasks(sortedTasks);
        }
        setIsTasksLoading(false);
      } else if (!isSessionLoading) {
        setIsTasksLoading(false);
      }
    };

    fetchClientTasks();

    // Subscribe to changes in tasks and projects relevant to the client
    const tasksSubscription = supabase
      .channel(`client_tasks:${user?.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, payload => {
        console.log('Client task change received!', payload);
        // Re-fetch tasks if the change is relevant to this client's projects
        // This is a broad re-fetch, can be optimized with more specific filters if needed
        fetchClientTasks();
      })
      .subscribe();

    const projectsSubscription = supabase
      .channel(`client_projects:${user?.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `client_id=eq.${user?.id}` }, payload => {
        console.log('Client project change received!', payload);
        fetchClientTasks(); // Re-fetch tasks if projects change
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

  const activeTasks = clientTasks.filter(t => t.status !== 'Completed');
  const completedTasks = clientTasks.filter(t => t.status === 'Completed');

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-6xl shadow-lg mt-8 mb-8 dark:bg-gray-800">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-800 dark:text-white">Client Dashboard</CardTitle>
          <p className="text-lg text-gray-600 dark:text-gray-400">Track the progress of your tasks.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Welcome, {profile?.first_name || 'Client'}! Here are your tasks:
          </p>

          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="dark:bg-gray-900">
              <CardContent className="p-6 flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{clientTasks.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-900">
              <CardContent className="p-6 flex items-center">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Tasks</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeTasks.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-900">
              <CardContent className="p-6 flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed Tasks</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedTasks.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {activeTasks.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Active Tasks</h2>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {activeTasks.length} task{activeTasks.length !== 1 ? 's' : ''} in progress
                </div>
              </div>
              <TimelineTracker tasks={activeTasks} />
            </div>
          )}

          {completedTasks.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Completed Tasks</h2>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {completedTasks.length} task{completedTasks.length !== 1 ? 's' : ''} completed
                </div>
              </div>
              <div className="space-y-4">
                {completedTasks.map((task) => (
                  <Card key={task.id} className="dark:bg-gray-900">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{task.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{task.projects?.title}</p>
                        </div>
                        <div className="text-right">
                          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </div>
                          {task.attachments && task.attachments.length > 0 && (
                            <div className="flex justify-end mt-1">
                              {task.attachments.map((url, index) => (
                                <Button key={index} variant="ghost" size="icon" asChild className="h-6 w-6">
                                  <a href={url} target="_blank" rel="noopener noreferrer" download>
                                    <Download className="h-3 w-3" />
                                    <span className="sr-only">Download file</span>
                                  </a>
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {clientTasks.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400">You currently have no tasks.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientDashboard;