"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/components/SessionContextProvider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button'; // Import Button
import { Trash2, Edit } from 'lucide-react'; // Import Trash2 and Edit icons
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
import {
  Dialog, // Import Dialog components
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import EditTaskForm from './EditTaskForm'; // Import the EditTaskForm

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

interface TaskListProps {
  refreshTrigger?: boolean;
  filterByAssignedTo?: string | null;
  filterByProjectId?: string | null;
  onTaskUpdated?: () => void;
}

const TASK_STATUSES = ['Unassigned', 'Assigned', 'In Progress', 'Completed', 'Under Review'];

const TaskList = ({ refreshTrigger, filterByAssignedTo = null, filterByProjectId = null, onTaskUpdated }: TaskListProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editors, setEditors] = useState<Editor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // State for edit dialog
  const [currentTaskToEdit, setCurrentTaskToEdit] = useState<Task | null>(null); // State to hold task being edited
  const { user, profile, isLoading: isSessionLoading } = useSession();

  const canEditTask = (task: Task) => {
    if (isSessionLoading || !profile) return false;
    if (profile.role === 'admin' || profile.role === 'manager') {
      return true;
    }
    if (profile.role === 'editor' && user?.id === task.assigned_to) {
      return true;
    }
    return false;
  };

  const canEditTaskDetails = () => { // New function to check if user can edit task details (title, project, assignment)
    if (isSessionLoading || !profile) return false;
    return profile.role === 'admin' || profile.role === 'manager';
  };

  const canReassignTask = () => {
    if (isSessionLoading || !profile) return false;
    return profile.role === 'admin' || profile.role === 'manager';
  };

  const canDeleteTask = () => {
    if (isSessionLoading || !profile) return false;
    return profile.role === 'admin' || profile.role === 'manager';
  };

  useEffect(() => {
    const fetchTasksAndEditors = async () => {
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
          profiles (id, first_name, last_name, role)
        `)
        .order('created_at', { ascending: false });

      if (filterByAssignedTo) {
        query = query.eq('assigned_to', filterByAssignedTo);
      }
      if (filterByProjectId) {
        query = query.eq('project_id', filterByProjectId);
      }

      const { data: tasksData, error: tasksError } = await query;

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
        showError('Failed to load tasks.');
        setTasks([]);
      } else {
        setTasks(tasksData || []);
      }

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

    fetchTasksAndEditors();
  }, [refreshTrigger, filterByAssignedTo, filterByProjectId, isSessionLoading, isEditDialogOpen]); // Re-fetch when dialog closes

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task status:', error);
      showError('Failed to update task status.');
    } else {
      showSuccess('Task status updated successfully!');
      onTaskUpdated?.();
    }
  };

  const handleAssignmentChange = async (taskId: string, newAssignedTo: string) => {
    const assignedToUuid = newAssignedTo === '' ? null : newAssignedTo;
    const newStatus = assignedToUuid ? 'Assigned' : 'Unassigned';

    const { error } = await supabase
      .from('tasks')
      .update({ assigned_to: assignedToUuid, status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task assignment:', error);
      showError('Failed to update task assignment.');
    } else {
      showSuccess('Task assignment updated successfully!');
      onTaskUpdated?.();
    }
  };

  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      showError(`Failed to delete task "${taskTitle}".`);
    } else {
      showSuccess(`Task "${taskTitle}" deleted successfully!`);
      onTaskUpdated?.(); // Notify parent to refresh the list
    }
  };

  const handleEditClick = (task: Task) => {
    setCurrentTaskToEdit(task);
    setIsEditDialogOpen(true);
  };

  const handleTaskDetailsUpdated = () => {
    onTaskUpdated?.(); // Trigger a refresh of the task list
    setIsEditDialogOpen(false); // Close the dialog
  };

  if (isLoading || isSessionLoading) {
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold">
              <Link to={`/tasks/${task.id}`} className="hover:underline text-primary dark:text-primary-foreground">
                {task.title}
              </Link>
            </CardTitle>
            <div className="flex items-center gap-2">
              {canEditTaskDetails() && (
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEditClick(task)}>
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit Task</span>
                </Button>
              )}
              {canDeleteTask() && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" className="h-8 w-8">
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
                      <AlertDialogAction onClick={() => handleDeleteTask(task.id, task.title)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Project: {task.projects?.title || 'N/A'}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Status:</p>
              <Select
                value={task.status}
                onValueChange={(value) => handleStatusChange(task.id, value)}
                disabled={!canEditTask(task)}
              >
                <SelectTrigger className="w-[180px]">
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

            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Assigned To:</p>
              <Select
                value={task.assigned_to || ''}
                onValueChange={(value) => handleAssignmentChange(task.id, value)}
                disabled={!canReassignTask()}
              >
                <SelectTrigger className="w-[180px]">
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
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Created: {new Date(task.created_at).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Last Updated: {new Date(task.updated_at).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      ))}

      {currentTaskToEdit && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>
                Make changes to the task details here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <EditTaskForm
              taskId={currentTaskToEdit.id}
              initialData={{
                title: currentTaskToEdit.title,
                project_id: currentTaskToEdit.project_id || '',
                assigned_to: currentTaskToEdit.assigned_to || '',
              }}
              onTaskUpdated={handleTaskDetailsUpdated}
              onClose={() => setIsEditDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TaskList;