"use client";

import React, { useState } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import AddProjectForm from '@/components/AddProjectForm';
import UserStatsCard from '@/components/UserStatsCard';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { PlusCircle, Briefcase, ListChecks, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const AdminDashboard = () => {
  const { profile, isLoading } = useSession();
  const [projectRefreshTrigger, setProjectRefreshTrigger] = useState(false);
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);

  const handleProjectAdded = () => {
    setProjectRefreshTrigger(!projectRefreshTrigger);
    setIsAddProjectDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-neutral-950">
        <Card className="w-full max-w-2xl bg-neutral-900 rounded-2xl glass-border">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2 bg-neutral-700" />
            <Skeleton className="h-4 w-1/2 bg-neutral-700" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-full bg-neutral-700" />
            <Skeleton className="h-6 w-full bg-neutral-700" />
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
      <Card className="w-full max-w-4xl shadow-lg mt-8 mb-8 bg-neutral-900 rounded-2xl glass-border">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-white/90">Admin Dashboard</CardTitle>
          <p className="text-lg text-white/70">Manage all projects, tasks, and users.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-white/70 mb-6">
            Welcome, Admin! Use the sections below to manage your application.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 border border-neutral-800 rounded-2xl bg-neutral-900 glass-border">
              <h3 className="text-xl font-semibold mb-4 text-white/90">User Overview</h3>
              <UserStatsCard />
              <Button asChild variant="outline" className="w-full mt-4 rounded-full bg-neutral-800 text-lime-300 hover:bg-neutral-700 border-neutral-700">
                <Link to="/users">
                  <Users className="mr-2 h-4 w-4" /> Manage Users
                </Link>
              </Button>
            </div>
            <div className="p-6 border border-neutral-800 rounded-2xl bg-neutral-900 glass-border">
              <h3 className="text-xl font-semibold mb-4 text-white/90">Project & Task Actions</h3>
              <div className="space-y-4">
                <Dialog open={isAddProjectDialogOpen} onOpenChange={setIsAddProjectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full rounded-full bg-lime-400 px-6 text-black hover:bg-lime-300">
                      <PlusCircle className="mr-2 h-4 w-4" /> Add New Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-neutral-900 text-white/90 rounded-2xl glass-border border-neutral-800">
                    <DialogHeader>
                      <DialogTitle className="text-white/90">Add New Project</DialogTitle>
                      <DialogDescription className="text-white/70">
                        Fill in the details to create a new project.
                      </DialogDescription>
                    </DialogHeader>
                    <AddProjectForm onProjectAdded={handleProjectAdded} />
                  </DialogContent>
                </Dialog>
                <Button asChild variant="outline" className="w-full rounded-full bg-neutral-800 text-lime-300 hover:bg-neutral-700 border-neutral-700">
                  <Link to="/projects">
                    <Briefcase className="mr-2 h-4 w-4" /> View All Projects
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full rounded-full bg-neutral-800 text-lime-300 hover:bg-neutral-700 border-neutral-700">
                  <Link to="/tasks">
                    <ListChecks className="mr-2 h-4 w-4" /> View All Tasks
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;