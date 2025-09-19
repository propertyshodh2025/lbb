"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProfileForm from '@/components/ProfileForm';
import { useSession } from '@/components/SessionContextProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { Navigate } from 'react-router-dom';

const CompleteProfilePage = () => {
  const { profile, isLoading, session } = useSession();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // If there's no session, redirect to login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // If profile exists and has a role, redirect to dashboard
  if (profile && profile.role) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-800 dark:text-white">Complete Your Profile</CardTitle>
          <p className="text-lg text-gray-600 dark:text-gray-400">Please provide your basic information to continue.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProfileForm isInitialProfileSetup={true} />
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteProfilePage;