"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { useSession } from './SessionContextProvider'; // Import useSession

const formSchema = z.object({
  title: z.string().min(1, { message: 'Task title is required.' }),
  project_id: z.string().uuid({ message: 'Please select a project.' }),
  assigned_to: z.string().uuid({ message: 'Please select an editor.' }).optional().or(z.literal('')),
});

type TaskFormValues = z.infer<typeof formSchema>;

interface Project {
  id: string;
  title: string;
}

interface Editor {
  id: string;
  first_name: string;
  last_name: string;
}

interface EditTaskFormProps {
  taskId: string;
  initialData: TaskFormValues & { currentStatus: string }; // Include currentStatus
  onTaskUpdated: () => void;
  onClose: () => void;
}

const EditTaskForm = ({ taskId, initialData, onTaskUpdated, onClose }: EditTaskFormProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editors, setEditors] = useState<Editor[]>([]);
  const { user, isLoading: isSessionLoading } = useSession(); // Get current user

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  useEffect(() => {
    const fetchData = async () => {
      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, title')
        .order('title', { ascending: true });

      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
        showError('Failed to load projects.');
      } else {
        setProjects(projectsData || []);
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
    };
    fetchData();
  }, []);

  useEffect(() => {
    form.reset(initialData);
  }, [initialData, form]);

  const onSubmit = async (values: TaskFormValues) => {
    if (!user) {
      showError('You must be logged in to update a task.');
      return;
    }

    const assignedToUuid = values.assigned_to === '' ? null : values.assigned_to;
    const newStatus = assignedToUuid ? 'Assigned' : 'Raw files received'; // Update status based on assignment

    const { error } = await supabase
      .from('tasks')
      .update({
        title: values.title,
        project_id: values.project_id,
        assigned_to: assignedToUuid,
        status: newStatus, // Update status based on assignment
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
      showError('Failed to update task.');
    } else {
      // Insert into task_status_history if status or assignment changed
      if (newStatus !== initialData.currentStatus || assignedToUuid !== initialData.assigned_to) {
        const { error: historyError } = await supabase.from('task_status_history').insert({
          task_id: taskId,
          status: newStatus,
          notes: `Task details updated. Status changed to ${newStatus}${assignedToUuid ? ` and assigned to editor.` : ''}`,
          updated_by: user.id,
        });

        if (historyError) {
          console.error('Error adding task history:', historyError);
        }
      }

      showSuccess('Task updated successfully!');
      onTaskUpdated(); // Notify parent component
      onClose(); // Close the dialog
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter task title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="project_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="assigned_to"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assign To (Editor)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an editor (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {editors.map((editor) => (
                    <SelectItem key={editor.id} value={editor.id}>
                      {editor.first_name} {editor.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSessionLoading}>
          Update Task
        </Button>
      </form>
    </Form>
  );
};

export default EditTaskForm;