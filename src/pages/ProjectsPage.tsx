"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from '@/components/SessionContextProvider';
import { Skeleton } from '@/components/ui/skeleton';
import ProjectList from '@/components/ProjectList';
import AddProjectForm from '@/components/AddProjectForm';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const ProjectsPage = () => {
  const { profile, isLoading: isSessionLoading } = useSession();
  const [projectRefreshTrigger, setProjectRefreshTrigger] = useState(false);
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);

  const canViewProjects = !isSessionLoading && (profile?.role === 'admin' || profile?.role === 'manager');
  const canAddProjects = !isSessionLoading && profile?.role === 'admin'; // Only admins can add projects

  const handleProjectAdded = () => {
    setProjectRefreshTrigger(prev => !prev); // Toggle to trigger a re-fetch
    setIsAddProjectDialogOpen(false); // Close the dialog
  };

  const handleProjectUpdated = () => {
    setProjectRefreshTrigger(prev => !prev); // Toggle to trigger a re-fetch
  };

  if (isSessionLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canViewProjects) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300">You do not have permission to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-6xl shadow-lg mt-8 mb-8">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-800 dark:text-white">Project Management</CardTitle>
          <p className="text-lg text-gray-600 dark:text-gray-400">View and manage all projects.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {canAddProjects && (
            <div className="flex justify-end mb-4">
              <Dialog open={isAddProjectDialogOpen} onOpenChange={setIsAddProjectDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
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
            </div>
          )}

          <div className="p-6 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">All Projects</h3>
            <ProjectList refreshTrigger={projectRefreshTrigger} onProjectUpdated={handleProjectUpdated} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectsPage;