"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

const formSchema = z.object({
  title: z.string().min(1, { message: 'Project title is required.' }),
  description: z.string().optional(),
  client_id: z.string().uuid({ message: 'Please select a client.' }),
  due_date: z.date().optional().nullable(),
  notes: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof formSchema>;

interface Client {
  id: string;
  first_name: string;
  last_name: string;
}

interface EditProjectFormProps {
  projectId: string;
  initialData: ProjectFormValues;
  onProjectUpdated: () => void;
  onClose: () => void;
}

const EditProjectForm = ({ projectId, initialData, onProjectUpdated, onClose }: EditProjectFormProps) => {
  const [clients, setClients] = useState<Client[]>([]);
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  useEffect(() => {
    const fetchClients = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'client');

      if (error) {
        console.error('Error fetching clients:', error);
        showError('Failed to load clients.');
      } else {
        setClients(data || []);
      }
    };
    fetchClients();
  }, []);

  useEffect(() => {
    form.reset(initialData);
  }, [initialData, form]);

  const onSubmit = async (values: ProjectFormValues) => {
    const { error } = await supabase
      .from('projects')
      .update({
        title: values.title,
        description: values.description,
        client_id: values.client_id,
        due_date: values.due_date ? values.due_date.toISOString() : null,
        notes: values.notes,
      })
      .eq('id', projectId);

    if (error) {
      console.error('Error updating project:', error);
      showError('Failed to update project.');
    } else {
      showSuccess('Project updated successfully!');
      onProjectUpdated();
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
              <FormLabel className="text-white/70">Project Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter project title" {...field} className="bg-neutral-800 text-white/90 border-neutral-700 focus:ring-lime-400 focus:border-lime-400 rounded-full" />
              </FormControl>
              <FormMessage className="text-destructive-foreground" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Project description (optional)" {...field} className="bg-neutral-800 text-white/90 border-neutral-700 focus:ring-lime-400 focus:border-lime-400 rounded-lg" />
              </FormControl>
              <FormMessage className="text-destructive-foreground" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="client_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Client</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-neutral-800 text-white/90 border-neutral-700 focus:ring-lime-400 focus:border-lime-400 rounded-full">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-neutral-900 text-white/90 border-neutral-800">
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id} className="hover:bg-neutral-800 focus:bg-neutral-800">
                      {client.first_name} {client.last_name}
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
          name="due_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="text-white/70">Due Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full pl-3 text-left font-normal bg-neutral-800 text-white/90 border-neutral-700 focus:ring-lime-400 focus:border-lime-400 rounded-full',
                        !field.value && 'text-white/70',
                      )}
                    >
                      {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50 text-white/70" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-neutral-900 text-white/90 border-neutral-800 rounded-2xl" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value || undefined}
                    onSelect={field.onChange}
                    initialFocus
                    className="bg-neutral-900 text-white/90"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage className="text-destructive-foreground" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Any additional notes (optional)" {...field} className="bg-neutral-800 text-white/90 border-neutral-700 focus:ring-lime-400 focus:border-lime-400 rounded-lg" />
              </FormControl>
              <FormMessage className="text-destructive-foreground" />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full rounded-full bg-lime-400 px-6 text-black hover:bg-lime-300">
          Update Project
        </Button>
      </form>
    </Form>
  );
};

export default EditProjectForm;