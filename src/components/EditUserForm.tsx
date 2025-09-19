"use client";

import React, { useEffect, useState } from 'react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon } from 'lucide-react';
import { useSession } from '@/components/SessionContextProvider'; // Import useSession

const editUserFormSchema = z.object({
  first_name: z.string().min(1, { message: 'First name is required.' }).optional().or(z.literal('')),
  last_name: z.string().min(1, { message: 'Last name is required.' }).optional().or(z.literal('')),
  avatar_url: z.string().url({ message: 'Must be a valid URL.' }).optional().or(z.literal('')),
  role: z.enum(['admin', 'manager', 'editor', 'client'], { message: 'Please select a valid role.' }),
});

type EditUserFormValues = z.infer<typeof editUserFormSchema>;

interface EditUserFormProps {
  userId: string;
  initialData: EditUserFormValues & { email: string }; // Include email for display
  onUserUpdated: () => void;
  onClose: () => void;
}

const USER_ROLES = ['admin', 'manager', 'editor', 'client'];

const EditUserForm = ({ userId, initialData, onUserUpdated, onClose }: EditUserFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { profile: currentUserProfile } = useSession(); // Get current user's profile

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: {
      first_name: initialData.first_name || '',
      last_name: initialData.last_name || '',
      avatar_url: initialData.avatar_url || '',
      role: initialData.role,
    },
  });

  useEffect(() => {
    form.reset({
      first_name: initialData.first_name || '',
      last_name: initialData.last_name || '',
      avatar_url: initialData.avatar_url || '',
      role: initialData.role,
    });
  }, [initialData, form]);

  const onSubmit = async (values: EditUserFormValues) => {
    setIsSubmitting(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: values.first_name || null,
        last_name: values.last_name || null,
        avatar_url: values.avatar_url || null,
        role: values.role, // Update the role
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user profile:', error);
      showError('Failed to update user profile.');
    } else {
      showSuccess('User profile updated successfully!');
      onUserUpdated(); // Notify parent component to refresh
      onClose(); // Close the dialog
    }
    setIsSubmitting(false);
  };

  // Disable role change if editing own account
  const isEditingOwnRole = userId === currentUserProfile?.id;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={initialData.avatar_url || undefined} alt={`${initialData.first_name} ${initialData.last_name}`} />
            <AvatarFallback>
              <UserIcon className="h-12 w-12 text-gray-400" />
            </AvatarFallback>
          </Avatar>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {initialData.email}
          </p>
        </div>
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input placeholder="User's first name" {...field} />
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
                <Input placeholder="User's last name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="avatar_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Avatar URL</FormLabel>
              <FormControl>
                <Input placeholder="URL to user's avatar image" {...field} />
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
              <Select onValueChange={field.onChange} value={field.value} disabled={isEditingOwnRole}>
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
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Update User Profile'}
        </Button>
      </form>
    </Form>
  );
};

export default EditUserForm;