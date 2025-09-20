"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Trash2, Edit } from 'lucide-react';
import {
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import EditTaskForm from './EditTaskForm';

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
  filterByStatus?: string | null;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onTaskUpdated?: () => void;
}

const TASK_STATUSES = ['Raw files received', 'Unassigned', 'Assigned', 'In Progress', 'Completed', 'Under Review'];

const TaskList = ({
  refreshTrigger,
  filterByAssignedTo = null,
  filterByProjectId = null,
  filterByStatus = null,
  sortBy = 'created_at',
  sortOrder = 'desc',
  onTaskUpdated
}: TaskListProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editors, setEditors] = useState<Editor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentTaskToEdit, setCurrentTaskToEdit] = useState<Task | null>(null);
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

  const canEditTaskDetails = () => {
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
        `);

    if (filterByAssignedTo) {
      if (filterByAssignedTo === 'unassigned') {
        query = query.is('assigned_to', null);
      } else {
        query = query.eq('assigned_to', filterByAssignedTo);
      }
    }
    if (filterByProjectId) {
      query = query.eq('project_id', filterByProjectId);
    }
    if (filterByStatus) {
      query = query.eq('status', filterByStatus);
    }

    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

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

  useEffect(() => {
    fetchTasksAndEditors();

    const subscription = supabase
      .channel('public:tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, payload => {
        console.log('Task change received!', payload);
        fetchTasksAndEditors();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [
    refreshTrigger,
    filterByAssignedTo,
    filterByProjectId,
    filterByStatus,
    sortBy,
    sortOrder,
    isSessionLoading,
    isEditDialogOpen
  ]);

  const handleStatusChange = async (taskId: string, newStatus: string, currentAssignedTo: string | null) => {
    if (!user) {
      showError('You must be logged in to update task status.');
      return;
    }

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task status:', error);
      showError('Failed to update task status.');
    } else {
      const { error: historyError } = await supabase.from('task_status_history').insert({
        task_id: taskId,
        status: newStatus,
        notes: `Status changed to ${newStatus}.`,
        updated_by: user.id,
      });

      if (historyError) {
        console.error('Error adding task history:', historyError);
      }

      showSuccess('Task status updated successfully!');
      onTaskUpdated?.();
    }
  };

  const handleAssignmentChange = async (taskId: string, newAssignedTo: string, currentStatus: string) => {
    if (!user) {
      showError('You must be logged in to update task assignment.');
      return;
    }

    const assignedToUuid = newAssignedTo === '' ? null : newAssignedTo;
    const newStatus = assignedToUuid ? 'Assigned' : 'Raw files received';

    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;

    if (assignedToUuid === taskToUpdate.assigned_to && newStatus === taskToUpdate.status) return;

    const { error } = await supabase
      .from('tasks')
      .update({ assigned_to: assignedToUuid, status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task assignment:', error);
      showError('Failed to update task assignment.');
    } else {
      const { error: historyError } = await supabase.from('task_status_history').insert({
        task_id: taskId,
        status: newStatus,
        notes: assignedToUuid ? `Task assigned to editor.` : `Task unassigned.`,
        updated_by: user.id,
      });

      if (historyError) {
        console.error('Error adding task history:', historyError);
      }

      showSuccess('Task assignment updated successfully!');
      onTaskUpdated?.();
    }
  };

  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    if (!user) {
      showError('You must be logged in to delete a task.');
      return;
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      showError(`Failed to delete task "${taskTitle}".`);
    } else {
      const { error: historyDeleteError } = await supabase
        .from('task_status_history')
        .delete()
        .eq('task_id', taskId);

      if (historyDeleteError) {
        console.error('Error deleting task history:', historyDeleteError);
      }

      showSuccess(`Task "${taskTitle}" deleted successfully!`);
      onTaskUpdated?.();
    }
  };

  const handleEditClick = (task: Task) => {
    setCurrentTaskToEdit(task);
    setIsEditDialogOpen(true);
  };

  const handleTaskDetailsUpdated = () => {
    onTaskUpdated?.();
    setIsEditDialogOpen(false);
  };

  if (isLoading || isSessionLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full bg-neutral-700" />
        <Skeleton className="h-24 w-full bg-neutral-700" />
        <Skeleton className="h-24 w-full bg-neutral-700" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <p className="text-center text-white/70">No tasks found matching the criteria.</p>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Card key={task.id} className="shadow-sm bg-neutral-900 rounded-2xl glass-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold text-white/90">
              <Link to={`/tasks/${task.id}`} className="hover:underline text-lime-300">
                {task.title}
              </Link>
            </CardTitle>
            <div className="flex items-center gap-2">
              {canEditTaskDetails() && (
                <Button variant="outline" size="icon" className="h-8 w-8 bg-neutral-800 text-lime-300 hover:bg-neutral-700 border-neutral-700 rounded-full" onClick={() => handleEditClick(task)}>
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit Task</span>
                </Button>
              )}
              {canDeleteTask() && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" className="h-8 w-8 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full">
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete Task</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-neutral-900 text-white/90 rounded-2xl glass-border border-neutral-800">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white/90">Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription className="text-white/70">
                        This action cannot be undone. This will permanently delete the task
                        "{task.title}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-full bg-neutral-800 text-white/70 hover:bg-neutral-700 border-neutral-700">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteTask(task.id, task.title)} className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-white/70">
              Project: {task.projects?.title || 'N/A'}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-sm text-white/70">Status:</p>
              <Select
                value={task.status}
                onValueChange={(value) => handleStatusChange(task.id, value, task.assigned_to)}
                disabled={!canEditTask(task)}
              >
                <SelectTrigger className="w-[180px] bg-neutral-800 text-white/90 border-neutral-700 focus:ring-lime-400 focus:border-lime-400 rounded-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 text-white/90 border-neutral-800">
                  {TASK_STATUSES.map((status) => (
                    <SelectItem key={status} value={status} className="hover:bg-neutral-800 focus:bg-neutral-800">
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <p className="text-sm text-white/70">Assigned To:</p>
              <Select
                value={task.assigned_to || ''}
                onValueChange={(value) => handleAssignmentChange(task.id, value, task.status)}
                disabled={!canReassignTask()}
              >
                <SelectTrigger className="w-[180px] bg-neutral-800 text-white/90 border-neutral-700 focus:ring-lime-400 focus:border-lime-400 rounded-full">
                  <SelectValue placeholder="Select editor" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 text-white/90 border-neutral-800">
                  <SelectItem value="" className="hover:bg-neutral-800 focus:bg-neutral-800">Unassigned</SelectItem>
                  {editors.map((editor) => (
                    <SelectItem key={editor.id} value={editor.id} className="hover:bg-neutral-800 focus:bg-neutral-800">
                      {editor.first_name} {editor.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-white/70">
              Created: {new Date(task.created_at).toLocaleString()}
            </p>
            <p className="text-xs text-white/70">
              Last Updated: {new Date(task.updated_at).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      ))}

      {currentTaskToEdit && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-neutral-900 text-white/90 rounded-2xl glass-border border-neutral-800">
            <DialogHeader>
              <DialogTitle className="text-white/90">Edit Task</DialogTitle>
              <DialogDescription className="text-white/70">
                Make changes to the task details here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <EditTaskForm
              taskId={currentTaskToEdit.id}
              initialData={{
                title: currentTaskToEdit.title,
                project_id: currentTaskToEdit.project_id || '',
                assigned_to: currentTaskToEdit.assigned_to || '',
                currentStatus: currentTaskToEdit.status,
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