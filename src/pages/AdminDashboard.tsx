"use client";

import React, { useState } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import AddProjectForm from '@/components/AddProjectForm';
import ProjectList from '@/components/ProjectList'; // Import the new component

const AdminDashboard = () => {
  const { profile, isLoading } = useSession();
  const [projectRefreshTrigger, setProjectRefreshTrigger] = useState(false); // State to trigger project list refresh

  const handleProjectChange = () => {
    setProjectRefreshTrigger(!projectRefreshTrigger); // Toggle to trigger a re-fetch or re-render of project list
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
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
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-800 dark:text-white">Admin Dashboard</CardTitle>
          <p className="text-lg text-gray-600 dark:text-gray-400">Manage all projects, tasks, and users.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Welcome, Admin! Use the form below to add new projects.
          </p>
          <div className="p-6 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Add New Project</h3>
            <AddProjectForm onProjectAdded={handleProjectChange} />
          </div>
          <div className="p-6 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">All Projects</h3>
            <ProjectList refreshTrigger={projectRefreshTrigger} onProjectUpdated={handleProjectChange} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;