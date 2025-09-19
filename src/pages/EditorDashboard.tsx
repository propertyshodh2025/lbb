"use client";

import React, { useState } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import TaskList from '@/components/TaskList'; // Import the new component

const EditorDashboard = () => {
  const { profile, isLoading, user } = useSession();
  const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(false); // State to trigger task list refresh

  // This function would be called if an editor updates a task, e.g., changes status
  const handleTaskChange = () => {
    setTaskRefreshTrigger(!taskRefreshTrigger); // Toggle to trigger a re-fetch or re-render of task list
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

  if (profile?.role !== 'editor' && profile?.role !== 'admin' && profile?.role !== 'manager') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300">You do not have editor privileges to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-6xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-800 dark:text-white">Editor Dashboard</CardTitle>
          <p className="text-lg text-gray-600 dark:text-gray-400">Your personal Kanban board for assigned tasks.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Welcome, {profile?.first_name || 'Editor'}! Here are the tasks assigned to you.
          </p>
          <div className="p-6 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">My Assigned Tasks</h3>
            {user && <TaskList refreshTrigger={taskRefreshTrigger} filterByAssignedTo={user.id} onTaskUpdated={handleTaskChange} />}
            {!user && <p className="text-center text-gray-500 dark:text-gray-400">Please log in to view your tasks.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditorDashboard;