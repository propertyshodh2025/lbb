"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UserManagementList from '@/components/UserManagementList';
import AddUserForm from '@/components/AddUserForm';
import { useSession } from '@/components/SessionContextProvider';
import { Skeleton } from '@/components/ui/skeleton';

const UserManagementPage = () => {
  const { profile, isLoading } = useSession();
  const [userListRefreshTrigger, setUserListRefreshTrigger] = useState(false);

  const handleUserAdded = () => {
    setUserListRefreshTrigger(!userListRefreshTrigger);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-neutral-950">
        <Card className="w-full max-w-4xl bg-neutral-900 rounded-2xl glass-border">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2 bg-neutral-700" />
            <Skeleton className="h-4 w-1/2 bg-neutral-700" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full bg-neutral-700" />
            <Skeleton className="h-20 w-full bg-neutral-700" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-neutral-950">
        <Card className="w-full max-w-md text-center bg-neutral-900 rounded-2xl glass-border">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-destructive-foreground">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/70">You do not have administrative privileges to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-neutral-950">
      <Card className="w-full max-w-4xl shadow-lg mt-8 mb-8 bg-neutral-900 rounded-2xl glass-border">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-white/90">User Management</CardTitle>
          <p className="text-lg text-white/70">Manage user roles and accounts.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 border border-neutral-800 rounded-2xl bg-neutral-900 glass-border">
            <h3 className="text-xl font-semibold mb-4 text-white/90">Add New User</h3>
            <AddUserForm onUserAdded={handleUserAdded} />
          </div>
          <div className="p-6 border border-neutral-800 rounded-2xl bg-neutral-900 glass-border">
            <h3 className="text-xl font-semibold mb-4 text-white/90">Existing Users</h3>
            <UserManagementList refreshTrigger={userListRefreshTrigger} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagementPage;