"use client";

import React from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import DepartmentCard from '@/components/DepartmentCard';
import { Briefcase, Users, Settings, Code, DollarSign, Scale, TrendingUp, Megaphone, Building2, FlaskConical, UserRound, Handshake } from 'lucide-react'; // Added Handshake icon for Sales Management
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const AdminDashboard = () => {
  const { profile, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-neutral-950">
        <Card className="w-full max-w-6xl bg-neutral-900 rounded-2xl glass-border">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2 bg-neutral-700" />
            <Skeleton className="h-4 w-1/2 bg-neutral-700" />
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-40 w-full bg-neutral-700" />
            <Skeleton className="h-40 w-full bg-neutral-700" />
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
          <CardTitle className="text-3xl font-bold text-white/90">Welcome to the Command Center!</CardTitle>
          <CardDescription className="text-lg text-white/70">
            Navigate through your departments and manage your empire.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DepartmentCard
              title="Media Production"
              description="Oversee video editing, post-production, and content creation workflows."
              icon={Briefcase}
              to="/admin/departments/media"
            />
            <DepartmentCard
              title="User Management"
              description="Manage all employee and client profiles, roles, and team onboarding."
              icon={Users}
              to="/users"
            />
            <DepartmentCard
              title="Operations"
              description="Access overall project statistics, administrative tasks, and system settings."
              icon={Settings}
              to="/admin/overview"
            />
            <DepartmentCard
              title="Tech Department"
              description="Explore technical resources, development projects, and infrastructure."
              icon={Code}
              to="/admin/departments/tech"
            />
            <DepartmentCard
              title="Finance Department"
              description="Handle budgeting, invoicing, and financial reporting."
              icon={DollarSign}
              to="/admin/departments/finance"
            />
            <DepartmentCard
              title="Legal Department"
              description="Manage contracts, compliance, and legal documentation."
              icon={Scale}
              to="/admin/departments/legal"
            />
            <DepartmentCard
              title="Sales Department"
              description="Track client acquisition, sales pipelines, and revenue growth."
              icon={TrendingUp}
              to="/admin/departments/sales"
            />
            {/* Removed Sales Manager Management card */}
            <DepartmentCard
              title="Marketing Department"
              description="Plan campaigns, analyze market trends, and manage brand presence."
              icon={Megaphone}
              to="/admin/departments/marketing"
            />
            <DepartmentCard
              title="Research & Development"
              description="Innovate and explore new technologies and creative solutions."
              icon={FlaskConical}
              to="/admin/departments/research"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;