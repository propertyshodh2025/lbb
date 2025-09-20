"use client";

import React from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import OrgHierarchy from '@/components/OrgHierarchy';
import WorkOverviewCards from '@/components/WorkOverviewCards';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MediaDepartmentPage = () => {
  const { profile, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-neutral-950">
        <Card className="w-full max-w-6xl bg-neutral-900 rounded-2xl glass-border">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2 bg-neutral-700" />
            <Skeleton className="h-4 w-1/2 bg-neutral-700" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-96 w-full bg-neutral-700" />
              <Skeleton className="h-96 w-full bg-neutral-700" />
            </div>
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
      <Card className="w-full max-w-6xl shadow-lg mt-8 mb-8 bg-neutral-900 rounded-2xl glass-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild className="text-lime-300 hover:text-lime-400">
              <Link to="/admin" className="flex items-center">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Departments
              </Link>
            </Button>
            <CardTitle className="text-3xl font-bold text-white/90 text-center flex-grow">
              Media Department
            </CardTitle>
            <div className="w-10" /> {/* Spacer to balance the back button */}
          </div>
          <p className="text-lg text-white/70 text-center">
            Overview of the Media Production and Editing team.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Side: Work Overview */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white/90">Work Overview</h3>
              <WorkOverviewCards />
            </div>

            {/* Right Side: Organizational Hierarchy */}
            <div className="space-y-6">
              <OrgHierarchy />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MediaDepartmentPage;