"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UserManagementList from '@/components/UserManagementList';
import AddUserForm from '@/components/AddUserForm';
import { useSession } from '@/components/SessionContextProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MediaClientManagementPage = () => {
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

  if (profile?.role !== 'admin' && profile?.role !== 'manager') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-neutral-950">
        <Card className="w-full max-w-md text-center bg-neutral-900 rounded-2xl glass-border">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-destructive-foreground">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/70">You do not have sufficient privileges to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-neutral-950">
      <Card className="w-full max-w-4xl shadow-lg mt-8 mb-8 bg-neutral-900 rounded-2xl glass-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild className="text-lime-300 hover:text-lime-400">
              <Link to="/admin/departments/media" className="flex items-center">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Media Department
              </Link>
            </Button>
            <CardTitle className="text-3xl font-bold text-white/90 text-center flex-grow">
              Media Client Management
            </CardTitle>
            <div className="w-10" /> {/* Spacer to balance the back button */}
          </div>
          <p className="text-lg text-white/70 text-center">Manage clients specific to the Media Production department.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 border border-neutral-800 rounded-2xl bg-neutral-900 glass-border">
            <h3 className="text-xl font-semibold mb-4 text-white/90">Add New Media Client</h3>
            <AddUserForm onUserAdded={handleUserAdded} defaultRole="media_client" hideRoleSelection={true} />
          </div>
          <div className="p-6 border border-neutral-800 rounded-2xl bg-neutral-900 glass-border">
            <h3 className="text-xl font-semibold mb-4 text-white/90">Existing Media Clients</h3>
            <UserManagementList refreshTrigger={userListRefreshTrigger} filterByRole="media_client" hideFilters={true} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MediaClientManagementPage;