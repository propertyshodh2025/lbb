"use client";

import React, { useState } from 'react';
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
import { showSuccess, showError } from '@/utils/toast';
import { useSession } from '@/components/SessionContextProvider';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  first_name: z.string().min(1, { message: 'First name is required.' }),
  last_name: z.string().min(1, { message: 'Last name is required.' }),
  role: z.enum(['admin', 'manager', 'editor', 'client'], { message: 'Please select a valid role.' }),
});

type AddUserFormValues = z.infer<typeof formSchema>;

interface AddUserFormProps {
  onUserAdded: () => void;
  defaultRole?: 'admin' | 'manager' | 'editor' | 'client';
  hideRoleSelection?: boolean;
}

const USER_ROLES = ['admin', 'manager', 'editor', 'client'];
const SUPABASE_PROJECT_ID = 'lzwxlbanmacwhycmvnhu';
const CREATE_USER_FUNCTION_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/create-user`;

const AddUserForm = ({ onUserAdded, defaultRole, hideRoleSelection }: AddUserFormProps) => {
  const { session } = useSession();
  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role: defaultRole || 'client', // Set default role
    },
  });

  const onSubmit = async (values: AddUserFormValues) => {
    if (!session?.access_token) {
      showError('Authentication token missing. Please log in again.');
      return;
    }

    try {
      const response = await fetch(CREATE_USER_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Error from create-user Edge Function:', result.error);
        showError(`Failed to add user: ${result.error}`);
        return;
      }

      showSuccess('User added successfully!');
      form.reset({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: defaultRole || 'client', // Reset to default role
      });
      onUserAdded();
    } catch (error) {
      console.error('Error invoking create-user Edge Function:', error);
      showError('An unexpected error occurred while adding the user.');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="user@example.com" {...field} className="bg-neutral-800 text-white/90 border-neutral-700 focus:ring-lime-400 focus:border-lime-400 rounded-full" />
              </FormControl>
              <FormMessage className="text-destructive-foreground" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="********" {...field} className="bg-neutral-800 text-white/90 border-neutral-700 focus:ring-lime-400 focus:border-lime-400 rounded-full" />
              </FormControl>
              <FormMessage className="text-destructive-foreground" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">First Name</FormLabel>
              <FormControl>
                <Input placeholder="John" {...field} className="bg-neutral-800 text-white/90 border-neutral-700 focus:ring-lime-400 focus:border-lime-400 rounded-full" />
              </FormControl>
              <FormMessage className="text-destructive-foreground" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Last Name</FormLabel>
              <FormControl>
                <Input placeholder="Doe" {...field} className="bg-neutral-800 text-white/90 border-neutral-700 focus:ring-lime-400 focus:border-lime-400 rounded-full" />
              </FormControl>
              <FormMessage className="text-destructive-foreground" />
            </FormItem>
          )}
        />
        {!hideRoleSelection && (
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/70">Role</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-neutral-800 text-white/90 border-neutral-700 focus:ring-lime-400 focus:border-lime-400 rounded-full">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-neutral-900 text-white/90 border-neutral-800">
                    {USER_ROLES.map((role) => (
                      <SelectItem key={role} value={role} className="hover:bg-neutral-800 focus:bg-neutral-800">
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-destructive-foreground" />
              </FormItem>
            )}
          />
        )}
        <Button type="submit" className="w-full rounded-full bg-lime-400 px-6 text-black hover:bg-lime-300">
          Add User
        </Button>
      </form>
    </Form>
  );
};

export default AddUserForm;