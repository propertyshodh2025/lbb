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
  project_id: z.string().uuid({ message: 'Please select a project.' }),
  title: z.string().min(1, { message: 'Task title is required.' }),
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

interface AddTaskFormProps {
  onTaskAdded: () => void;
  defaultProjectId?: string; // New optional prop
}

const AddTaskForm = ({ onTaskAdded, defaultProjectId }: AddTaskFormProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editors, setEditors] = useState<Editor[]>([]);
  const { user, isLoading: isSessionLoading } = useSession(); // Get current user

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      project_id: defaultProjectId || '', // Use defaultProjectId if provided
      title: '',
      assigned_to: '',
    },
  });

  // Reset form with defaultProjectId if it changes
  useEffect(() => {
    form.reset({
      project_id: defaultProjectId || '',
      title: '',
      assigned_to: '',
    });
  }, [defaultProjectId, form]);

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

  const onSubmit = async (values: TaskFormValues) => {
    if (!user) {
      showError('You must be logged in to add a task.');
      return;
    }

    const initialStatus = values.assigned_to ? 'Assigned' : 'Raw files received'; // Initial status based on assignment
    const assignedToUuid = values.assigned_to === '' ? null : values.assigned_to;

    const { data: newTaskData, error: taskError } = await supabase.from('tasks').insert({
      project_id: values.project_id,
      title: values.title,
      assigned_to: assignedToUuid,
      status: initialStatus,
      created_by: user.id, // Set created_by to the current user's ID
    }).select().single();

    if (taskError) {
      console.error('Error adding task:', taskError);
      showError('Failed to add task.');
    } else {
      // Insert initial status into task_status_history
      const { error: historyError } = await supabase.from('task_status_history').insert({
        task_id: newTaskData.id,
        status: initialStatus,
        notes: values.assigned_to ? `Task created and assigned to editor.` : `Task created. Raw files received.`,
        updated_by: user.id,
      });

      if (historyError) {
        console.error('Error adding task history:', historyError);
        // Don't block, but log the error
      }

      showSuccess('Task added successfully!');
      form.reset({
        project_id: defaultProjectId || '', // Reset to defaultProjectId or empty
        title: '',
        assigned_to: '',
      });
      onTaskAdded(); // Notify parent component
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="project_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={!!defaultProjectId}>
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
          name="assigned_to"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assign To (Editor)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
          Add Task
        </Button>
      </form>
    </Form>
  );
};

export default AddTaskForm;