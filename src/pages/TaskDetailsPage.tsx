"use client";

import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useSession } from '@/components/SessionContextProvider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react'; // Import Trash2 icon
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { // Import AlertDialog components
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import EditTaskForm from '@/components/EditTaskForm';

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
    id: string;
    first_name: string;
    last_name: string;
    role: string;
  } | null;
}

interface Editor {
  id: string;
  first_name: string;
  last_name: string;
}

const TASK_STATUSES = ['Raw files received', 'Unassigned', 'Assigned', 'In Progress', 'Completed', 'Under Review'];

const TaskDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate(); // Initialize useNavigate
  const [task, setTask] = useState<Task | null>(null);
  const [editors, setEditors] = useState<Editor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { user, profile, isLoading: isSessionLoading } = useSession();

  const canEditTaskDetails = (currentTask: Task | null) => {
    if (isSessionLoading || !profile || !currentTask) return false;
    // Admins and Managers can edit any task details
    if (profile.role === 'admin' || profile.role === 'manager') {
      return true;
    }
    return false;
  };

  const canEditTaskStatus = (currentTask: Task | null) => {
    if (isSessionLoading || !profile || !currentTask) return false;
    // Admins and Managers can edit any task status
    if (profile.role === 'admin' || profile.role === 'manager') {
      return true;
    }
    // Editors can edit tasks assigned to them
    if (profile.role === 'editor' && user?.id === currentTask.assigned_to) {
      return true;
    }
    return false;
  };

  const canReassignTask = () => {
    if (isSessionLoading || !profile) return false;
    // Admins and Managers can reassign tasks
    return profile.role === 'admin' || profile.role === 'manager';
  };

  const canDeleteTask = () => { // New function to check delete permission
    if (isSessionLoading || !profile) return false;
    return profile.role === 'admin' || profile.role === 'manager';
  };

  const fetchTaskDetailsAndEditors = async () => {
    if (!id) return;

    setIsLoading(true);
    // Fetch task details
    const { data: taskData, error: taskError } = await supabase
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
        profiles (id, first_name, last_name, role)
      `)
      .eq('id', id)
      .single();

    if (taskError) {
      console.error('Error fetching task details:', taskError);
      showError('Failed to load task details.');
      setTask(null);
    } else {
      setTask(taskData);
    }

    // Fetch editors for assignment dropdown
    const { data: editorsData, error: editorsError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('role', 'editor');

    if (editorsError) {
      console.error('Error fetching editors:', editorsError);
      showError('Failed to load editors for assignment.');
    } else {
      setEditors(editorsData || []);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchTaskDetailsAndEditors();
  }, [id, isEditDialogOpen]);

  const handleStatusChange = async (newStatus: string) => {
    if (!task || newStatus === task.status) return;
    if (!user) {
      showError('You must be logged in to update task status.');
      return;
    }

    setIsUpdating(true);
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', task.id);

    if (error) {
      console.error('Error updating task status:', error);
      showError('Failed to update task status.');
    } else {
      // Insert into task_status_history
      const { error: historyError } = await supabase.from('task_status_history').insert({
        task_id: task.id,
        status: newStatus,
        notes: `Status changed to ${newStatus}.`,
        updated_by: user.id,
      });

      if (historyError) {
        console.error('Error adding task history:', historyError);
      }

      showSuccess('Task status updated successfully!');
      setTask(prev => prev ? { ...prev, status: newStatus } : null);
    }
    setIsUpdating(false);
  };

  const handleAssignmentChange = async (newAssignedTo: string) => {
    if (!task) return;
    if (!user) {
      showError('You must be logged in to update task assignment.');
      return;
    }

    const assignedToUuid = newAssignedTo === '' ? null : newAssignedTo;
    const newStatus = assignedToUuid ? 'Assigned' : 'Raw files received';

    if (assignedToUuid === task.assigned_to && newStatus === task.status) return;

    setIsUpdating(true);
    const { error } = await supabase
      .from('tasks')
      .update({ assigned_to: assignedToUuid, status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', task.id);

    if (error) {
      console.error('Error updating task assignment:', error);
      showError('Failed to update task assignment.');
    } else {
      // Insert into task_status_history
      const { error: historyError } = await supabase.from('task_status_history').insert({
        task_id: task.id,
        status: newStatus,
        notes: assignedToUuid ? `Task assigned to editor.` : `Task unassigned.`,
        updated_by: user.id,
      });

      if (historyError) {
        console.error('Error adding task history:', historyError);
      }

      showSuccess('Task assignment updated successfully!');
      setTask(prev => prev ? { ...prev, assigned_to: assignedToUuid, status: newStatus } : null);
    }
    setIsUpdating(false);
  };

  const handleTaskDetailsUpdated = () => {
    fetchTaskDetailsAndEditors();
    setIsEditDialogOpen(false);
  };

  const handleDeleteTask = async () => {
    if (!id || !task) return;
    if (!user) {
      showError('You must be logged in to delete a task.');
      return;
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      showError('Failed to delete task.');
    } else {
      // Delete associated history entries
      const { error: historyDeleteError } = await supabase
        .from('task_status_history')
        .delete()
        .eq('task_id', id);

      if (historyDeleteError) {
        console.error('Error deleting task history:', historyDeleteError);
      }

      showSuccess('Task deleted successfully!');
      navigate(profile?.role === 'editor' ? '/editor' : '/manager'); // Redirect after deletion
    }
  };

  if (isLoading || isSessionLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
        <Card className="w-full max-w-4xl dark:bg-gray-800">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
        <Card className="w-full max-w-md text-center dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">Task Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300">The task you are looking for does not exist or you do not have access.</p>
            <Button asChild className="mt-4">
              <Link to={profile?.role === 'editor' ? '/editor' : '/manager'}>Back to Tasks</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initialTaskFormValues = {
    title: task.title,
    project_id: task.project_id || '',
    assigned_to: task.assigned_to || '',
    currentStatus: task.status, // Pass current status
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-4xl shadow-lg mt-8 mb-8 dark:bg-gray-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild>
              <Link to={profile?.role === 'editor' ? '/editor' : '/manager'} className="flex items-center text-primary hover:underline">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Tasks
              </Link>
            </Button>
            <CardTitle className="text-3xl font-bold text-gray-800 dark:text-white text-center flex-grow">
              {task.title}
            </CardTitle>
            <div className="flex items-center gap-2">
              {canEditTaskDetails(task) && (
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit Task</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Edit Task</DialogTitle>
                      <DialogDescription>
                        Make changes to the task details here. Click save when you're done.
                      </DialogDescription>
                    </DialogHeader>
                    <EditTaskForm
                      taskId={task.id}
                      initialData={initialTaskFormValues}
                      onTaskUpdated={handleTaskDetailsUpdated}
                      onClose={() => setIsEditDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              )}
              {canDeleteTask() && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon">
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete Task</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the task
                        "{task.title}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 text-center">
            Project: {task.projects?.title || 'N/A'}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200">Current Status:</h4>
            <div className="flex items-center gap-2">
              <Select
                value={task.status}
                onValueChange={handleStatusChange}
                disabled={!canEditTaskStatus(task) || isUpdating}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200">Assigned To:</h4>
            <div className="flex items-center gap-2">
              <Select
                value={task.assigned_to || ''}
                onValueChange={handleAssignmentChange}
                disabled={!canReassignTask() || isUpdating}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select editor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {editors.map((editor) => (
                    <SelectItem key={editor.id} value={editor.id}>
                      {editor.first_name} {editor.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t pt-6 mt-6 dark:border-gray-700">
            <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200">Task Dates:</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Created: {format(new Date(task.created_at), 'PPP HH:mm')}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Last Updated: {format(new Date(task.updated_at), 'PPP HH:mm')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskDetailsPage;