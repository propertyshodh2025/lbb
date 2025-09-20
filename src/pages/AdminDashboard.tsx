"use client";

import React from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import DepartmentCard from '@/components/DepartmentCard';
import { Briefcase, Users, Settings, BarChart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const AdminDashboard = () => {
  const { profile, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-neutral-950">
        <Card className="w-full max-w-4xl bg-neutral-900 rounded-2xl glass-border">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2 bg-neutral-700" />
            <Skeleton className="h-4 w-1/2 bg-neutral-700" />
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-40 w-full bg-neutral-700" />
            <Skeleton className="h-40 w-full bg-neutral-700" />
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
      <Card className="w-full max-w-6xl shadow-lg mt-8 mb-8 bg-neutral-900 rounded-2xl glass-border">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-white/90">Company Office</CardTitle>
          <p className="text-lg text-white/70">Select a department to manage.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DepartmentCard
              title="Media Production"
              description="Manage video editing, post-production, and content creation."
              icon={Briefcase}
              to="/admin/departments/media"
            />
            <DepartmentCard
              title="Human Resources"
              description="Oversee employee management, roles, and onboarding."
              icon={Users}
              to="/users" // Link to existing user management for now
            />
            <DepartmentCard
              title="Operations"
              description="View overall project statistics and administrative tasks."
              icon={Settings}
              to="/admin/overview" // Link to the old AdminDashboard content
            />
            {/* Add more department cards as needed */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;