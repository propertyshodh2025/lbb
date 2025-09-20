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
import { useSession } from './SessionContextProvider';

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
  initialData: TaskFormValues & { currentStatus: string };
  onTaskUpdated: () => void;
  onClose: () => void;
}

const EditTaskForm = ({ taskId, initialData, onTaskUpdated, onClose }: EditTaskFormProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editors, setEditors] = useState<Editor[]>([]);
  const { user, isLoading: isSessionLoading } = useSession();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  useEffect(() => {
    const fetchData = async () => {
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
    const newStatus = assignedToUuid ? 'Assigned' : 'Raw files received';

    const { error } = await supabase
      .from('tasks')
      .update({
        title: values.title,
        project_id: values.project_id,
        assigned_to: assignedToUuid,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
      showError('Failed to update task.');
    } else {
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
      onTaskUpdated();
      onClose();
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
              <FormLabel className="text-white/70">Task Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter task title" {...field} className="bg-neutral-800 text-white/90 border-neutral-700 focus:ring-lime-400 focus:border-lime-400 rounded-full" />
              </FormControl>
              <FormMessage className="text-destructive-foreground" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="project_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Project</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-neutral-800 text-white/90 border-neutral-700 focus:ring-lime-400 focus:border-lime-400 rounded-full">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-neutral-900 text-white/90 border-neutral-800">
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id} className="hover:bg-neutral-800 focus:bg-neutral-800">
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-destructive-foreground" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="assigned_to"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Assign To (Editor)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <FormControl>
                  <SelectTrigger className="bg-neutral-800 text-white/90 border-neutral-700 focus:ring-lime-400 focus:border-lime-400 rounded-full">
                    <SelectValue placeholder="Select an editor (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-neutral-900 text-white/90 border-neutral-800">
                  <SelectItem value="" className="hover:bg-neutral-800 focus:bg-neutral-800">Unassigned</SelectItem>
                  {editors.map((editor) => (
                    <SelectItem key={editor.id} value={editor.id} className="hover:bg-neutral-800 focus:bg-neutral-800">
                      {editor.first_name} {editor.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-destructive-foreground" />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full rounded-full bg-lime-400 px-6 text-black hover:bg-lime-300" disabled={isSessionLoading}>
          Update Task
        </Button>
      </form>
    </Form>
  );
};

export default EditTaskForm;