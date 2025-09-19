"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UserManagementList from '@/components/UserManagementList';
import AddUserForm from '@/components/AddUserForm'; // Import the new component
import { useSession } from '@/components/SessionContextProvider';
import { Skeleton } from '@/components/ui/skeleton';

const UserManagementPage = () => {
  const { profile, isLoading } = useSession();
  const [userListRefreshTrigger, setUserListRefreshTrigger] = useState(false); // State to trigger user list refresh

  const handleUserAdded = () => {
    setUserListRefreshTrigger(!userListRefreshTrigger); // Toggle to trigger a re-fetch of the user list
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300">You do not have administrative privileges to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-4xl shadow-lg mt-8 mb-8">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-800 dark:text-white">User Management</CardTitle>
          <p className="text-lg text-gray-600 dark:text-gray-400">Manage user roles and accounts.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Add New User</h3>
            <AddUserForm onUserAdded={handleUserAdded} />
          </div>
          <div className="p-6 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Existing Users</h3>
            <UserManagementList refreshTrigger={userListRefreshTrigger} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagementPage;