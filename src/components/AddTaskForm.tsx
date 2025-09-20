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
  attachments: z.any().optional(),
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

    setIsUploading(true);

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
      attachments: attachmentUrls,
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
        fileInputRef.current.value = '';
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
              <FormLabel className="text-white/70">Project</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={!!defaultProjectId || isUploading}>
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
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Task Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter task title" {...field} disabled={isUploading} className="bg-neutral-800 text-white/90 border-neutral-700 focus:ring-lime-400 focus:border-lime-400 rounded-full" />
              </FormControl>
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
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isUploading}>
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
        <FormField
          control={form.control}
          name="attachments"
          render={({ field: { value, onChange, ...fieldProps } }) => (
            <FormItem>
              <FormLabel className="text-white/70">Raw Files (Optional)</FormLabel>
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
                  className="bg-neutral-800 text-white/90 border-neutral-700 focus:ring-lime-400 focus:border-lime-400 rounded-full"
                />
              </FormControl>
              <FormMessage className="text-destructive-foreground" />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full rounded-full bg-lime-400 px-6 text-black hover:bg-lime-300" disabled={isSessionLoading || isUploading}>
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