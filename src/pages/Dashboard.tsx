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
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4">
        <Card className="w-full max-w-2xl bg-neutral-900 rounded-2xl glass-border">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2 bg-neutral-700" />
            <Skeleton className="h-4 w-1/2 bg-neutral-700" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-full bg-neutral-700" />
            <Skeleton className="h-6 w-full bg-neutral-700" />
            <Skeleton className="h-10 w-24 self-end bg-neutral-700" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4">
        <p className="text-lg text-white/70">Not authenticated. Redirecting...</p>
      </div>
    );
  }

  const displayName = profile.first_name || user.email;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 p-4">
      <Card className="w-full max-w-2xl shadow-lg bg-neutral-900 rounded-2xl glass-border">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-white/90">
            Welcome, {displayName}!
          </CardTitle>
          <p className="text-lg text-white/70">
            Your role: <span className="font-semibold capitalize text-lime-300">{profile.role}</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {profile.role === 'admin' && (
            <div className="text-center p-4 bg-neutral-800 rounded-md border border-lime-400/30">
              <p className="text-lime-300">
                You have full administrative access. Manage projects, tasks, and users.
              </p>
            </div>
          )}
          {profile.role === 'manager' && (
            <div className="text-center p-4 bg-neutral-800 rounded-md border border-lime-400/30">
              <p className="text-lime-300">
                You are a project manager. Oversee project progress and assign tasks.
              </p>
            </div>
          )}
          {profile.role === 'client' && (
            <div className="text-center p-4 bg-neutral-800 rounded-md border border-lime-400/30">
              <p className="text-lime-300">
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