"use client";

import React, { useState } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import AddProjectForm from '@/components/AddProjectForm';
import UserStatsCard from '@/components/UserStatsCard';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { PlusCircle, Briefcase } from 'lucide-react';
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
  const [projectRefreshTrigger, setProjectRefreshTrigger] = useState(false); // State to trigger project list refresh
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);

  const handleProjectAdded = () => {
    setProjectRefreshTrigger(!projectRefreshTrigger); // Toggle to trigger a re-fetch or re-render of project list
    setIsAddProjectDialogOpen(false); // Close the dialog
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
    <div className="flex flex-col items-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-4xl shadow-lg mt-8 mb-8">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-800 dark:text-white">Admin Dashboard</CardTitle>
          <p className="text-lg text-gray-600 dark:text-gray-400">Manage all projects, tasks, and users.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Welcome, Admin! Use the sections below to manage your application.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">User Overview</h3>
              <UserStatsCard />
            </div>
            <div className="p-6 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Project Actions</h3>
              <div className="space-y-4">
                <Dialog open={isAddProjectDialogOpen} onOpenChange={setIsAddProjectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <PlusCircle className="mr-2 h-4 w-4" /> Add New Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add New Project</DialogTitle>
                      <DialogDescription>
                        Fill in the details to create a new project.
                      </DialogDescription>
                    </DialogHeader>
                    <AddProjectForm onProjectAdded={handleProjectAdded} />
                  </DialogContent>
                </Dialog>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/projects">
                    <Briefcase className="mr-2 h-4 w-4" /> View All Projects
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