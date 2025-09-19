"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSession } from '@/components/SessionContextProvider';

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  email: string; // Assuming email can be fetched or derived
}

interface UserManagementListProps {
  refreshTrigger?: boolean;
}

const USER_ROLES = ['admin', 'manager', 'editor', 'client'];

const UserManagementList = ({ refreshTrigger }: UserManagementListProps) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { profile: currentUserProfile, isLoading: isSessionLoading } = useSession();

  const canEditRoles = !isSessionLoading && currentUserProfile?.role === 'admin';

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role');

      if (profilesError) {
        console.error('Error fetching user profiles:', profilesError);
        showError('Failed to load user profiles.');
        setUsers([]);
        setIsLoading(false);
        return;
      }

      // Fetch user emails from auth.users table (requires service role key or RLS on auth.users)
      // For simplicity, we'll assume the email is available or can be fetched.
      // In a real app, you might need a server-side function or a more complex RLS setup
      // to expose emails to admins. For now, we'll mock it or fetch if possible.
      const userIds = profilesData.map(p => p.id);
      const { data: authUsersData, error: authUsersError } = await supabase.auth.admin.listUsers();

      let usersWithEmails: UserProfile[] = [];
      if (authUsersError) {
        console.warn('Could not fetch auth.users for emails (might need service role key or specific RLS):', authUsersError.message);
        // Fallback: create profiles without emails
        usersWithEmails = profilesData.map(profile => ({
          ...profile,
          email: 'Email not available', // Placeholder
        }));
      } else {
        const authUsersMap = new Map(authUsersData.users.map(u => [u.id, u.email]));
        usersWithEmails = profilesData.map(profile => ({
          ...profile,
          email: authUsersMap.get(profile.id) || 'Email not found',
        }));
      }
      
      setUsers(usersWithEmails || []);
      setIsLoading(false);
    };

    fetchUsers();
  }, [refreshTrigger, isSessionLoading]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!canEditRoles) {
      showError('You do not have permission to change roles.');
      return;
    }

    // Prevent admin from changing their own role or demoting the last admin
    if (userId === currentUserProfile?.id && newRole !== 'admin') {
      const adminCount = users.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) {
        showError('Cannot demote the last admin.');
        return;
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user role:', error);
      showError('Failed to update user role.');
    } else {
      showSuccess('User role updated successfully!');
      // Optimistically update UI or trigger a refresh
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
    }
  };

  if (isLoading || isSessionLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400">No users found.</p>
    );
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <Card key={user.id} className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              {user.first_name} {user.last_name}
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Role:</p>
              <Select
                value={user.role}
                onValueChange={(value) => handleRoleChange(user.id, value)}
                disabled={!canEditRoles || user.id === currentUserProfile?.id} // Disable changing own role
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default UserManagementList;