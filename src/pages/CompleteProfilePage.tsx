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
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-neutral-950">
        <Card className="w-full max-w-md bg-neutral-900 rounded-2xl glass-border">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2 bg-neutral-700" />
            <Skeleton className="h-4 w-1/2 bg-neutral-700" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full bg-neutral-700" />
            <Skeleton className="h-10 w-full bg-neutral-700" />
            <Skeleton className="h-10 w-full bg-neutral-700" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (profile && profile.role) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-neutral-950">
      <Card className="w-full max-w-md shadow-lg bg-neutral-900 rounded-2xl glass-border">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-white/90">Complete Your Profile</CardTitle>
          <p className="text-lg text-white/70">Please provide your basic information to continue.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProfileForm isInitialProfileSetup={true} />
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteProfilePage;