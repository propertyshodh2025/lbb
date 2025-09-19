"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import TimelineTracker from '@/components/TimelineTracker'; // Import the new component
import { Package, Clock, CheckCircle } from 'lucide-react';

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
          // Sort history entries by timestamp for correct timeline display
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

          {/* Stats Overview */}
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

          {/* Active Tasks Section */}
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

          {/* Completed Tasks Section */}
          {completedTasks.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Completed Tasks</h2>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {completedTasks.length} task{completedTasks.length !== 1 ? 's' : ''} completed
                </div>
              </div>
              <TimelineTracker tasks={completedTasks} />
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