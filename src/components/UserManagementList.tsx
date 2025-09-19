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
import { Button } from '@/components/ui/button';
import { Trash2, Edit } from 'lucide-react'; // Import Edit icon
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog, // Import Dialog components
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import EditUserForm from './EditUserForm'; // Import the new EditUserForm

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  email: string;
  avatar_url: string | null; // Add avatar_url to UserProfile
}

interface UserManagementListProps {
  refreshTrigger?: boolean;
}

const USER_ROLES = ['admin', 'manager', 'editor', 'client'];

const UserManagementList = ({ refreshTrigger }: UserManagementListProps) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // State for edit dialog
  const [currentUserToEdit, setCurrentUserToEdit] = useState<UserProfile | null>(null); // State to hold user being edited
  const { profile: currentUserProfile, isLoading: isSessionLoading, session } = useSession();

  const canEditRoles = !isSessionLoading && currentUserProfile?.role === 'admin';
  const canEditUserDetails = !isSessionLoading && currentUserProfile?.role === 'admin'; // Only admins can edit user details
  const canDeleteUsers = !isSessionLoading && currentUserProfile?.role === 'admin';

  const SUPABASE_PROJECT_ID = 'lzwxlbanmacwhycmvnhu'; // Your Supabase Project ID
  const DELETE_USER_FUNCTION_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/delete-user`;
  const LIST_USERS_FUNCTION_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/list-users`; // New Edge Function URL

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(LIST_USERS_FUNCTION_URL, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`, // Pass the user's JWT
          },
        });

        const result = await response.json();

        if (!response.ok) {
          console.error('Error from list-users Edge Function:', result.error);
          showError(`Failed to load user profiles: ${result.error}`);
          setUsers([]);
          return;
        }
        
        setUsers(result || []);
      } catch (error) {
        console.error('Error invoking list-users Edge Function:', error);
        showError('An unexpected error occurred while loading user profiles.');
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [refreshTrigger, isSessionLoading, session?.access_token, isEditDialogOpen]); // Depend on session.access_token and isEditDialogOpen

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

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!canDeleteUsers) {
      showError('You do not have permission to delete users.');
      return;
    }

    if (userId === currentUserProfile?.id) {
      showError('You cannot delete your own account.');
      return;
    }

    const adminCount = users.filter(u => u.role === 'admin').length;
    const userToDelete = users.find(u => u.id === userId);

    if (userToDelete?.role === 'admin' && adminCount <= 1) {
      showError('Cannot delete the last admin account.');
      return;
    }

    try {
      // Invoke the Edge Function to delete the user from auth.users
      const response = await fetch(DELETE_USER_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`, // Pass the user's JWT
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Error from Edge Function:', result.error);
        showError(`Failed to delete user "${userEmail}": ${result.error}`);
        return;
      }

      showSuccess(`User "${userEmail}" deleted successfully!`);
      // Trigger a refresh of the user list
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Error invoking Edge Function:', error);
      showError(`An unexpected error occurred while deleting user "${userEmail}".`);
    }
  };

  const handleEditClick = (user: UserProfile) => {
    setCurrentUserToEdit(user);
    setIsEditDialogOpen(true);
  };

  const handleUserUpdated = () => {
    // Trigger a refresh of the user list
    // This will cause the useEffect to re-fetch users, including updated profile data
    setUsers([]); // Clear current users to force re-fetch
    setIsLoading(true); // Set loading state
    // The useEffect will handle the actual fetching
    setIsEditDialogOpen(false); // Close the dialog
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold">
              {user.first_name} {user.last_name}
            </CardTitle>
            <div className="flex items-center gap-2">
              {canEditUserDetails && (
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEditClick(user)}>
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit User Details</span>
                </Button>
              )}
              {canDeleteUsers && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      disabled={user.id === currentUserProfile?.id || (user.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete User</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the user
                        "{user.first_name} {user.last_name} ({user.email})" and all associated data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteUser(user.id, user.email)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
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

      {currentUserToEdit && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit User Profile</DialogTitle>
              <DialogDescription>
                Make changes to the user's profile details here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <EditUserForm
              userId={currentUserToEdit.id}
              initialData={{
                first_name: currentUserToEdit.first_name || '',
                last_name: currentUserToEdit.last_name || '',
                avatar_url: currentUserToEdit.avatar_url || '',
                email: currentUserToEdit.email, // Pass email for display
              }}
              onUserUpdated={handleUserUpdated}
              onClose={() => setIsEditDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default UserManagementList;