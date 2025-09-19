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
  refreshTrigger?: boolean; // Prop to trigger re-fetch
  filterByAssignedTo?: string | null; // Optional: filter tasks by assigned editor ID
  filterByProjectId?: string | null; // New: Optional filter tasks by project ID
  onTaskUpdated?: () => void; // Callback for when a task is updated
}

const TASK_STATUSES = ['Unassigned', 'Assigned', 'In Progress', 'Completed', 'Under Review'];

const TaskList = ({ refreshTrigger, filterByAssignedTo = null, filterByProjectId = null, onTaskUpdated }: TaskListProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editors, setEditors] = useState<Editor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, profile, isLoading: isSessionLoading } = useSession();

  const canEditTask = (task: Task) => {
    if (isSessionLoading || !profile) return false;
    // Admins and Managers can edit any task
    if (profile.role === 'admin' || profile.role === 'manager') {
      return true;
    }
    // Editors can edit tasks assigned to them
    if (profile.role === 'editor' && user?.id === task.assigned_to) {
      return true;
    }
    return false;
  };

  const canReassignTask = () => {
    if (isSessionLoading || !profile) return false;
    // Admins and Managers can reassign tasks
    return profile.role === 'admin' || profile.role === 'manager';
  };

  useEffect(() => {
    const fetchTasksAndEditors = async () => {
      setIsLoading(true);

      // Fetch tasks
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

    fetchTasksAndEditors();
  }, [refreshTrigger, filterByAssignedTo, filterByProjectId, isSessionLoading]); // Re-fetch when refreshTrigger, filters, or session loading changes

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
      onTaskUpdated?.(); // Notify parent to refresh
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
      onTaskUpdated?.(); // Notify parent to refresh
    }
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
          <CardHeader>
            <CardTitle className="text-xl font-semibold">{task.title}</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Project: {task.projects?.title || 'N/A'}
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
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
    </div>
  );
};

export default TaskList;