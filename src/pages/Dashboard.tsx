"use client";

import React from 'react';
import { useSession } from '@/components/SessionContextProvider';
import LogoutButton from '@/components/LogoutButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  const { user, profile, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-10 w-24 self-end" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || !profile) {
    // This case should ideally be handled by ProtectedRoute, but good for fallback
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <p className="text-lg text-gray-700 dark:text-gray-300">Not authenticated. Redirecting...</p>
      </div>
    );
  }

  const displayName = profile.first_name || user.email;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-800 dark:text-white">
            Welcome, {displayName}!
          </CardTitle>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Your role: <span className="font-semibold capitalize">{profile.role}</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {profile.role === 'admin' && (
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-md">
              <p className="text-blue-800 dark:text-blue-200">
                You have full administrative access. Manage projects, tasks, and users.
              </p>
            </div>
          )}
          {profile.role === 'manager' && (
            <div className="text-center p-4 bg-green-50 dark:bg-green-900 rounded-md">
              <p className="text-green-800 dark:text-green-200">
                You are a project manager. Oversee project progress and assign tasks.
              </p>
            </div>
          )}
          {profile.role === 'client' && (
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900 rounded-md">
              <p className="text-purple-800 dark:text-purple-200">
                You are a client. View the status of your projects.
              </p>
            </div>
          )}
          <div className="flex justify-center mt-6">
            <LogoutButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;