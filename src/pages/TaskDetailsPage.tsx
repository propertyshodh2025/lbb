"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useSession } from '@/components/SessionContextProvider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2, Paperclip, UploadCloud, Loader2, Download } from 'lucide-react';
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
import EditTaskForm from '@/components/EditTaskForm';
import { Input } from '@/components/ui/input'; // Import Input for file upload

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
  attachments: string[];
}

interface Editor {
  id: string;
  first_name: string;
  last_name: string;
}

const TASK_STATUSES = ['Raw files received', 'Unassigned', 'Assigned', 'In Progress', 'Completed', 'Under Review'];

const TaskDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [editors, setEditors] = useState<Editor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, profile, isLoading: isSessionLoading } = useSession();

  const canEditTaskDetails = (currentTask: Task | null) => {
    if (isSessionLoading || !profile || !currentTask) return false;
    if (profile.role === 'admin' || profile.role === 'manager') {
      return true;
    }
    return false;
  };

  const canEditTaskStatus = (currentTask: Task | null) => {
    if (isSessionLoading || !profile || !currentTask) return false;
    if (profile.role === 'admin' || profile.role === 'manager') {
      return true;
    }
    if (profile.role === 'editor' && user?.id === currentTask.assigned_to) {
      return true;
    }
    return false;
  };

  const canReassignTask = () => {
    if (isSessionLoading || !profile) return false;
    return profile.role === 'admin' || profile.role === 'manager';
  };

  const canDeleteTask = () => {
    if (isSessionLoading || !profile) return false;
    return profile.role === 'admin' || profile.role === 'manager';
  };

  const canAddAttachments = (currentTask: Task | null) => {
    if (isSessionLoading || !profile || !currentTask) return false;
    return profile.role === 'admin' || profile.role === 'manager' || (profile.role === 'editor' && user?.id === currentTask.assigned_to);
  };

  const fetchTaskDetailsAndEditors = async () => {
    if (!id) return;

    setIsLoading(true);
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
        attachments,
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

    const subscription = supabase
      .channel(`task_details:${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `id=eq.${id}` }, payload => {
        console.log('Task details change received!', payload);
        fetchTaskDetailsAndEditors();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
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
      const { error: historyDeleteError } = await supabase
        .from('task_status_history')
        .delete()
        .eq('task_id', id);

      if (historyDeleteError) {
        console.error('Error deleting task history:', historyDeleteError);
      }

      showSuccess('Task deleted successfully!');
      navigate(profile?.role === 'editor' ? '/editor' : '/manager');
    }
  };

  const handleAttachmentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !task) {
      showError('You must be logged in to upload attachments.');
      return;
    }
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingAttachment(true);
    let newAttachmentUrls: string[] = [...(task.attachments || [])];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${task.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('task_attachments')
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from('task_attachments')
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          newAttachmentUrls.push(publicUrlData.publicUrl);
        }
      }

      const { error: updateError } = await supabase
        .from('tasks')
        .update({ attachments: newAttachmentUrls, updated_at: new Date().toISOString() })
        .eq('id', task.id);

      if (updateError) {
        throw updateError;
      }

      showSuccess('Attachments uploaded successfully!');
      fetchTaskDetailsAndEditors();
    } catch (error: any) {
      console.error('Error uploading attachments:', error.message);
      showError(`Failed to upload attachments: ${error.message}`);
    } finally {
      setIsUploadingAttachment(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (isLoading || isSessionLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-neutral-950">
        <Card className="w-full max-w-4xl bg-neutral-900 rounded-2xl glass-border">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2 bg-neutral-700" />
            <Skeleton className="h-4 w-1/2 bg-neutral-700" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-full bg-neutral-700" />
            <Skeleton className="h-6 w-full bg-neutral-700" />
            <Skeleton className="h-20 w-full bg-neutral-700" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-neutral-950">
        <Card className="w-full max-w-md text-center bg-neutral-900 rounded-2xl glass-border">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-destructive-foreground">Task Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/70">The task you are looking for does not exist or you do not have access.</p>
            <Button asChild className="mt-4 rounded-full bg-lime-400 px-6 text-black hover:bg-lime-300">
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
    currentStatus: task.status,
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-neutral-950">
      <Card className="w-full max-w-4xl shadow-lg mt-8 mb-8 bg-neutral-900 rounded-2xl glass-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild className="text-lime-300 hover:text-lime-400">
              <Link to={profile?.role === 'editor' ? '/editor' : '/manager'} className="flex items-center">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Tasks
              </Link>
            </Button>
            <CardTitle className="text-3xl font-bold text-white/90 text-center flex-grow">
              {task.title}
            </CardTitle>
            <div className="flex items-center gap-2">
              {canEditTaskDetails(task) && (
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="bg-neutral-800 text-lime-300 hover:bg-neutral-700 border-neutral-700">
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit Task</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-neutral-900 text-white/90 rounded-2xl glass-border border-neutral-800">
                    <DialogHeader>
                      <DialogTitle className="text-white/90">Edit Task</DialogTitle>
                      <DialogDescription className="text-white/70">
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
                    <Button variant="destructive" size="icon" className="bg-destructive text-destructive-foreground hover:bg-destructive/90 border-destructive">
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
                      <AlertDialogAction onClick={handleDeleteTask} className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
          <p className="text-lg text-white/70 text-center">
            Project: {task.projects?.title || 'N/A'}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="text-md font-semibold text-white/90">Current Status:</h4>
            <div className="flex items-center gap-2">
              <Select
                value={task.status}
                onValueChange={handleStatusChange}
                disabled={!canEditTaskStatus(task) || isUpdating}
              >
                <SelectTrigger className="w-[200px] bg-neutral-800 text-white/90 border-neutral-700 focus:ring-lime-400 focus:border-lime-400 rounded-full">
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
          </div>

          <div>
            <h4 className="text-md font-semibold text-white/90">Assigned To:</h4>
            <div className="flex items-center gap-2">
              <Select
                value={task.assigned_to || ''}
                onValueChange={handleAssignmentChange}
                disabled={!canReassignTask() || isUpdating}
              >
                <SelectTrigger className="w-[200px] bg-neutral-800 text-white/90 border-neutral-700 focus:ring-lime-400 focus:border-lime-400 rounded-full">
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
          </div>

          <div className="border-t pt-6 mt-6 border-neutral-800">
            <h4 className="text-md font-semibold text-white/90">Task Dates:</h4>
            <p className="text-white/70">
              Created: {format(new Date(task.created_at), 'PPP HH:mm')}
            </p>
            <p className="text-white/70">
              Last Updated: {format(new Date(task.updated_at), 'PPP HH:mm')}
            </p>
          </div>

          <div className="border-t pt-6 mt-6 border-neutral-800">
            <h4 className="text-md font-semibold text-white/90 mb-3">Attachments:</h4>
            {task.attachments && task.attachments.length > 0 ? (
              <div className="space-y-2">
                {task.attachments.map((url, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border border-neutral-700 rounded-md bg-neutral-800">
                    <div className="flex items-center">
                      <Paperclip className="h-4 w-4 mr-2 text-white/70" />
                      <span className="text-sm text-white/90 truncate">
                        {url.substring(url.lastIndexOf('/') + 1)}
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" asChild className="text-lime-300 hover:text-lime-400">
                      <a href={url} target="_blank" rel="noopener noreferrer" download>
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download attachment</span>
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/70 text-sm">No attachments.</p>
            )}
            {canAddAttachments(task) && (
              <div className="mt-4">
                <Input
                  type="file"
                  multiple
                  onChange={handleAttachmentUpload}
                  disabled={isUploadingAttachment}
                  ref={fileInputRef}
                  className="bg-neutral-800 text-white/90 border-neutral-700 focus:ring-lime-400 focus:border-lime-400 rounded-full"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAttachment}
                  className="mt-2 w-full rounded-full bg-neutral-800 text-lime-300 hover:bg-neutral-700 border-neutral-700"
                >
                  {isUploadingAttachment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="mr-2 h-4 w-4" /> Add More Attachments
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskDetailsPage;