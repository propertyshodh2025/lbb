"use client";

import React, { useEffect, useState, useRef } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { useSession } from '@/components/SessionContextProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon, UploadCloud, Loader2 } from 'lucide-react'; // Import Loader2 for loading state

const profileFormSchema = z.object({
  first_name: z.string().min(1, { message: 'First name is required.' }).optional().or(z.literal('')),
  last_name: z.string().min(1, { message: 'Last name is required.' }).optional().or(z.literal('')),
  // avatar_url is now managed by the upload logic, not directly by form input
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const ProfileForm = () => {
  const { user, profile, isLoading: isSessionLoading } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
    },
  });

  useEffect(() => {
    if (profile && !isSessionLoading) {
      form.reset({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
      });
    }
  }, [profile, isSessionLoading, form]);

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) {
      showError('You must be logged in to update your profile.');
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: values.first_name || null,
        last_name: values.last_name || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating profile:', error);
      showError('Failed to update profile.');
    } else {
      showSuccess('Profile updated successfully!');
      // Optionally, trigger a session refresh or re-fetch profile in SessionContextProvider
    }
    setIsSubmitting(false);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      showError('You must be logged in to upload an avatar.');
      return;
    }
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      // Upload the file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true, // Overwrite existing file if any
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL of the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        throw new Error('Could not get public URL for avatar.');
      }

      // Update the profile table with the new avatar_url
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrlData.publicUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateProfileError) {
        throw updateProfileError;
      }

      showSuccess('Avatar uploaded successfully!');
      // Trigger a re-fetch of the session/profile to update the UI
      // This is handled by SessionContextProvider's onAuthStateChange
    } catch (error: any) {
      console.error('Error uploading avatar:', error.message);
      showError(`Failed to upload avatar: ${error.message}`);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Clear the file input
      }
    }
  };

  if (isSessionLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
        <Skeleton className="h-6 w-32 mx-auto mb-6" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-24" />
      </div>
    );
  }

  if (!user || !profile) {
    return <p className="text-center text-gray-500 dark:text-gray-400">Please log in to manage your profile.</p>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.avatar_url || undefined} alt={`${profile.first_name} ${profile.last_name}`} />
            <AvatarFallback>
              <UserIcon className="h-12 w-12 text-gray-400" />
            </AvatarFallback>
          </Avatar>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {user.email}
          </p>
          <div className="relative">
            <Input
              type="file"
              id="avatar-upload"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              disabled={isUploadingAvatar}
              ref={fileInputRef}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="flex items-center gap-2"
            >
              {isUploadingAvatar ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" /> Upload Avatar
                </>
              )}
            </Button>
          </div>
        </div>
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input placeholder="Your first name" {...field} />
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
                <Input placeholder="Your last name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Removed avatar_url direct input as it's now handled by file upload */}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Update Profile'}
        </Button>
      </form>
    </Form>
  );
};

export default ProfileForm;