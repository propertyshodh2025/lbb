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
import { Trash2, Edit, ArrowUpNarrowWide, ArrowDownNarrowWide } from 'lucide-react'; // Import sorting icons
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import EditUserForm from './EditUserForm';

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  email: string;
  avatar_url: string | null;
}

interface UserManagementListProps {
  refreshTrigger?: boolean;
}

const USER_ROLES_FILTER = ['all', 'admin', 'manager', 'editor', 'client'];
const SORT_OPTIONS = [
  { value: 'first_name', label: 'First Name' },
  { value: 'last_name', label: 'Last Name' },
  { value: 'email', label: 'Email' },
  { value: 'role', label: 'Role' },
];

const SUPABASE_PROJECT_ID = 'lzwxlbanmacwhycmvnhu';
const DELETE_USER_FUNCTION_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/delete-user`;
const LIST_USERS_FUNCTION_BASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/list-users`;

const UserManagementList = ({ refreshTrigger }: UserManagementListProps) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentUserToEdit, setCurrentUserToEdit] = useState<UserProfile | null>(null);
  const { profile: currentUserProfile, isLoading: isSessionLoading, session } = useSession();

  const canEditUserDetails = !isSessionLoading && currentUserProfile?.role === 'admin';
  const canDeleteUsers = !isSessionLoading && currentUserProfile?.role === 'admin';

  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('first_name');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const url = new URL(LIST_USERS_FUNCTION_BASE_URL);
        if (selectedRoleFilter !== 'all') {
          url.searchParams.append('role', selectedRoleFilter);
        }
        url.searchParams.append('sortBy', sortBy);
        url.searchParams.append('sortOrder', sortOrder);

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
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
  }, [refreshTrigger, isSessionLoading, session?.access_token, isEditDialogOpen, selectedRoleFilter, sortBy, sortOrder]);

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
      const response = await fetch(DELETE_USER_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
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
    setUsers([]);
    setIsLoading(true);
    setIsEditDialogOpen(false);
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
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
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1">
          <label htmlFor="role-filter" className="sr-only">Filter by Role</label>
          <Select value={selectedRoleFilter} onValueChange={setSelectedRoleFilter}>
            <SelectTrigger id="role-filter" className="w-full">
              <SelectValue placeholder="Filter by Role" />
            </SelectTrigger>
            <SelectContent>
              {USER_ROLES_FILTER.map((role) => (
                <SelectItem key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 flex items-center gap-2">
          <label htmlFor="sort-by" className="sr-only">Sort By</label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger id="sort-by" className="flex-1">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={toggleSortOrder} className="flex-shrink-0">
            {sortOrder === 'asc' ? <ArrowUpNarrowWide className="h-4 w-4" /> : <ArrowDownNarrowWide className="h-4 w-4" />}
            <span className="sr-only">Toggle sort order</span>
          </Button>
        </div>
      </div>

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
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Role: <span className="font-medium capitalize">{user.role}</span>
            </p>
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
                email: currentUserToEdit.email,
                role: currentUserToEdit.role,
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