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
}

const USER_ROLES = ['admin', 'manager', 'editor', 'client'];
const SUPABASE_PROJECT_ID = 'lzwxlbanmacwhycmvnhu'; // Your Supabase Project ID
const CREATE_USER_FUNCTION_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/create-user`;

const AddUserForm = ({ onUserAdded }: AddUserFormProps) => {
  const { session } = useSession();
  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role: 'client', // Default role
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
          'Authorization': `Bearer ${session.access_token}`, // Pass the user's JWT
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
      form.reset();
      onUserAdded(); // Notify parent component to refresh user list
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
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="user@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input placeholder="John" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input placeholder="Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {USER_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Add User
        </Button>
      </form>
    </Form>
  );
};

export default AddUserForm;