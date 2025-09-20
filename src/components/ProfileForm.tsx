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
import { User as UserIcon, UploadCloud, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';

const profileFormSchema = z.object({
  first_name: z.string().min(1, { message: 'First name is required.' }),
  last_name: z.string().min(1, { message: 'Last name is required.' }),
});

const passwordFormSchema = z.object({
  new_password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match.",
  path: ["confirm_password"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

interface ProfileFormProps {
  isInitialProfileSetup?: boolean;
}

const ProfileForm = ({ isInitialProfileSetup = false }: ProfileFormProps) => {
  const { user, profile, isLoading: isSessionLoading } = useSession();
  const navigate = useNavigate();
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      new_password: '',
      confirm_password: '',
    },
  });

  useEffect(() => {
    if (profile && !isSessionLoading) {
      profileForm.reset({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
      });
    }
  }, [profile, isSessionLoading, profileForm]);

  const onProfileSubmit = async (values: ProfileFormValues) => {
    if (!user) {
      showError('You must be logged in to update your profile.');
      return;
    }

    setIsProfileSubmitting(true);

    if (isInitialProfileSetup) {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          first_name: values.first_name,
          last_name: values.last_name,
          role: 'client',
        });

      if (error) {
        console.error('Error creating initial profile:', error);
        showError('Failed to create profile.');
      } else {
        showSuccess('Profile created successfully!');
        navigate('/');
      }
    } else {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: values.first_name,
          last_name: values.last_name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        showError('Failed to update profile.');
      } else {
        showSuccess('Profile updated successfully!');
      }
    }
    setIsProfileSubmitting(false);
  };

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    if (!user) {
      showError('You must be logged in to change your password.');
      return;
    }

    setIsPasswordSubmitting(true);
    const { error } = await supabase.auth.updateUser({
      password: values.new_password,
    });

    if (error) {
      console.error('Error updating password:', error);
      showError(`Failed to update password: ${error.message}`);
    } else {
      showSuccess('Password updated successfully!');
      passwordForm.reset();
    }
    setIsPasswordSubmitting(false);
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
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        throw new Error('Could not get public URL for avatar.');
      }

      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrlData.publicUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateProfileError) {
        throw updateProfileError;
      }

      showSuccess('Avatar uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading avatar:', error.message);
      showError(`Failed to upload avatar: ${error.message}`);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (isSessionLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4 bg-neutral-700" />
        <Skeleton className="h-6 w-32 mx-auto mb-6 bg-neutral-700" />
        <Skeleton className="h-10 w-full bg-neutral-700" />
        <Skeleton className="h-10 w-full bg-neutral-700" />
        <Skeleton className="h-10 w-full bg-neutral-700" />
        <Skeleton className="h-10 w-24 bg-neutral-700" />
      </div>
    );
  }

  if (!user) {
    return <p className="text-center text-white/70">Please log in to manage your profile.</p>;
  }

  return (
    <div className="space-y-8">
      <Form {...profileForm}>
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
          {!isInitialProfileSetup && (
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url || undefined} alt={`${profile?.first_name} ${profile?.last_name}`} />
                <AvatarFallback className="bg-neutral-700 text-white/70">
                  <UserIcon className="h-12 w-12 text-white/50" />
                </AvatarFallback>
              </Avatar>
              <p className="text-sm text-white/70">
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
                  className="flex items-center gap-2 rounded-full bg-neutral-800 text-lime-300 hover:bg-neutral-700 border-neutral-700"
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
          )}
          <FormField
            control={profileForm.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/70">First Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your first name" {...field} className="bg-neutral-800 text-white/90 border-neutral-700 focus:ring-lime-400 focus:border-lime-400 rounded-full" />
                </FormControl>
                <FormMessage className="text-destructive-foreground" />
              </FormItem>
            )}
          />
          <FormField
            control={profileForm.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/70">Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your last name" {...field} className="bg-neutral-800 text-white/90 border-neutral-700 focus:ring-lime-400 focus:border-lime-400 rounded-full" />
                </FormControl>
                <FormMessage className="text-destructive-foreground" />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full rounded-full bg-lime-400 px-6 text-black hover:bg-lime-300" disabled={isProfileSubmitting}>
            {isProfileSubmitting ? 'Saving...' : (isInitialProfileSetup ? 'Complete Profile' : 'Update Profile')}
          </Button>
        </form>
      </Form>

      {!isInitialProfileSetup && (
        <>
          <Separator className="bg-neutral-800" />

          <h3 className="text-xl font-bold text-white/90">Change Password</h3>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
              <FormField
                control={passwordForm.control}
                name="new_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter new password" {...field} className="bg-neutral-800 text-white/90 border-neutral-700 focus:ring-lime-400 focus:border-lime-400 rounded-full" />
                    </FormControl>
                    <FormMessage className="text-destructive-foreground" />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirm new password" {...field} className="bg-neutral-800 text-white/90 border-neutral-700 focus:ring-lime-400 focus:border-lime-400 rounded-full" />
                    </FormControl>
                    <FormMessage className="text-destructive-foreground" />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full rounded-full bg-lime-400 px-6 text-black hover:bg-lime-300" disabled={isPasswordSubmitting}>
                {isPasswordSubmitting ? 'Changing Password...' : 'Change Password'}
              </Button>
            </form>
          </Form>
        </>
      )}
    </div>
  );
};

export default ProfileForm;