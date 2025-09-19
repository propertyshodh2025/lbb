"use client";

import React, { useState, useEffect, useRef } from 'react';
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
import { UploadCloud, Loader2 } from 'lucide-react';

const formSchema = z.object({
  project_id: z.string().uuid({ message: 'Please select a project.' }),
  title: z.string().min(1, { message: 'Task title is required.' }),
  assigned_to: z.string().uuid({ message: 'Please select an editor.' }).optional().or(z.literal('')),
  attachments: z.any().optional(), // For file input
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
  defaultProjectId?: string;
}

const AddTaskForm = ({ onTaskAdded, defaultProjectId }: AddTaskFormProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editors, setEditors] = useState<Editor[]>([]);
  const { user, isLoading: isSessionLoading } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      project_id: defaultProjectId || '',
      title: '',
      assigned_to: '',
    },
  });

  useEffect(() => {
    form.reset({
      project_id: defaultProjectId || '',
      title: '',
      assigned_to: '',
      attachments: undefined,
    });
  }, [defaultProjectId, form]);

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

  const onSubmit = async (values: TaskFormValues) => {
    if (!user) {
      showError('You must be logged in to add a task.');
      return;
    }

    setIsUploading(true); // Start loading for form submission and upload

    let attachmentUrls: string[] = [];
    const files = values.attachments instanceof FileList ? Array.from(values.attachments) : [];

    if (files.length > 0) {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('task_attachments')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          showError(`Failed to upload file: ${file.name}`);
          setIsUploading(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from('task_attachments')
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          attachmentUrls.push(publicUrlData.publicUrl);
        }
      }
    }

    const initialStatus = values.assigned_to ? 'Assigned' : 'Raw files received';
    const assignedToUuid = values.assigned_to === '' ? null : values.assigned_to;

    const { data: newTaskData, error: taskError } = await supabase.from('tasks').insert({
      project_id: values.project_id,
      title: values.title,
      assigned_to: assignedToUuid,
      status: initialStatus,
      created_by: user.id,
      attachments: attachmentUrls, // Save attachment URLs
    }).select().single();

    if (taskError) {
      console.error('Error adding task:', taskError);
      showError('Failed to add task.');
    } else {
      const { error: historyError } = await supabase.from('task_status_history').insert({
        task_id: newTaskData.id,
        status: initialStatus,
        notes: values.assigned_to ? `Task created and assigned to editor.` : `Task created. Raw files received.`,
        updated_by: user.id,
      });

      if (historyError) {
        console.error('Error adding task history:', historyError);
      }

      showSuccess('Task added successfully!');
      form.reset({
        project_id: defaultProjectId || '',
        title: '',
        assigned_to: '',
        attachments: undefined,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Clear the file input
      }
      onTaskAdded();
    }
    setIsUploading(false);
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
              <Select onValueChange={field.onChange} value={field.value} disabled={!!defaultProjectId || isUploading}>
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
                <Input placeholder="Enter task title" {...field} disabled={isUploading} />
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
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isUploading}>
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
        <FormField
          control={form.control}
          name="attachments"
          render={({ field: { value, onChange, ...fieldProps } }) => (
            <FormItem>
              <FormLabel>Raw Files (Optional)</FormLabel>
              <FormControl>
                <Input
                  {...fieldProps}
                  type="file"
                  multiple
                  onChange={(event) => {
                    onChange(event.target.files && event.target.files.length > 0 ? event.target.files : undefined);
                  }}
                  disabled={isUploading}
                  ref={fileInputRef}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSessionLoading || isUploading}>
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding Task...
            </>
          ) : (
            'Add Task'
          )}
        </Button>
      </form>
    </Form>
  );
};

export default AddTaskForm;