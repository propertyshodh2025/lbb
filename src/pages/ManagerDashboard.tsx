"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import AddTaskForm from '@/components/AddTaskForm';
import KanbanBoard from '@/components/KanbanBoard';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Briefcase, ListChecks, PlusCircle, Users, Package, Clock, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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

interface Editor {
  id: string;
  first_name: string;
  last_name: string;
}

const ManagerDashboard = () => {
  const { profile, isLoading: isSessionLoading, user } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editors, setEditors] = useState<Editor[]>([]);
  const [isTasksLoading, setIsTasksLoading] = useState(true);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);

  const fetchTasksAndEditors = async () => {
    setIsTasksLoading(true);
    // Fetch all tasks
    const { data: tasksData, error: tasksError } = await supabase
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
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      showError('Failed to load tasks.');
      setTasks([]);
    } else {
      setTasks(tasksData || []);
    }

    // Fetch editors
    const { data: editorsData, error: editorsError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('role', 'editor');

    if (editorsError) {
      console.error('Error fetching editors:', editorsError);
      showError('Failed to load editors.');
    } else {
      setEditors(editorsData || []);
    }
    setIsTasksLoading(false);
  };

  useEffect(() => {
    if (!isSessionLoading && (profile?.role === 'manager' || profile?.role === 'admin')) {
      fetchTasksAndEditors();

      const tasksSubscription = supabase
        .channel('public:tasks')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, payload => {
          console.log('Task change received in ManagerDashboard!', payload);
          fetchTasksAndEditors(); // Re-fetch tasks on any change
        })
        .subscribe();

      const profilesSubscription = supabase
        .channel('public:profiles')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, payload => {
          console.log('Profile change received in ManagerDashboard!', payload);
          // Only re-fetch editors if a profile with role 'editor' changed
          if (payload.new?.role === 'editor' || payload.old?.role === 'editor') {
            fetchTasksAndEditors();
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(tasksSubscription);
        supabase.removeChannel(profilesSubscription);
      };
    }
  }, [isSessionLoading, profile]);

  const handleTaskChange = () => {
    fetchTasksAndEditors(); // Re-fetch tasks after a change
    setIsAddTaskDialogOpen(false); // Close the dialog
  };

  const kanbanColumns = [
    {
      id: 'unassigned-tasks',
      title: 'Unassigned Tasks',
      statusMap: ['Raw files received', 'Unassigned'],
      assignedToId: null, // Explicitly null for unassigned
      color: 'bg-red-50 dark:bg-red-950', // Highlighted color for unassigned tasks
    },
    ...editors.map(editor => ({
      id: editor.id, // Use editor ID as column ID
      title: `${editor.first_name} ${editor.last_name}`,
      statusMap: ['Assigned', 'In Progress', 'Under Review', 'Completed'], // All statuses for an assigned task
      assignedToId: editor.id,
      color: 'bg-yellow-50 dark:bg-yellow-950', // Example color for editor columns
    })),
  ];

  const totalTasks = tasks.length;
  const unassignedTasksCount = tasks.filter(t => t.status === 'Raw files received' || t.status === 'Unassigned').length;
  const activeTasksCount = tasks.filter(t => ['Assigned', 'In Progress', 'Under Review'].includes(t.status)).length;
  const completedTasksCount = tasks.filter(t => t.status === 'Completed').length;
  const editorsActiveCount = editors.length;

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

  if (profile?.role !== 'manager' && profile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
        <Card className="w-full max-w-md text-center dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300">You do not have manager privileges to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-6xl shadow-lg mt-8 mb-8 dark:bg-gray-800">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-800 dark:text-white">Manager Dashboard</CardTitle>
          <p className="text-lg text-gray-600 dark:text-gray-400">Oversee projects and tasks, and assign work to editors.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Welcome, {profile?.first_name || 'Manager'}! Here you can manage projects and tasks.
          </p>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="dark:bg-gray-900">
              <CardContent className="p-6 flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTasks}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-900">
              <CardContent className="p-6 flex items-center">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <Clock className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unassigned Tasks</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{unassignedTasksCount}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-900">
              <CardContent className="p-6 flex items-center">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <ListChecks className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Tasks</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeTasksCount}</p>
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
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedTasksCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end mb-4 gap-2">
            <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Task</DialogTitle>
                  <DialogDescription>
                    Fill in the details to create a new task.
                  </DialogDescription>
                </DialogHeader>
                <AddTaskForm onTaskAdded={handleTaskChange} />
              </DialogContent>
            </Dialog>
            <Button asChild variant="outline">
              <Link to="/tasks">
                <ListChecks className="mr-2 h-4 w-4" /> View All Tasks
              </Link>
            </Button>
          </div>

          <div className="p-6 border rounded-lg bg-gray-50 dark:bg-gray-900">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Task Kanban Board</h3>
            <KanbanBoard initialTasks={tasks} columns={kanbanColumns} onTaskMove={handleTaskChange} />
          </div>

          <div className="p-6 border rounded-lg bg-gray-50 dark:bg-gray-900">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Project Overview</h3>
            <Button asChild variant="outline" className="w-full">
              <Link to="/projects">
                <Briefcase className="mr-2 h-4 w-4" /> View All Projects
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerDashboard;