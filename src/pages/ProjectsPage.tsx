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
  const canAddProjects = !isSessionLoading && profile?.role === 'admin';

  const handleProjectAdded = () => {
    setProjectRefreshTrigger(prev => !prev);
    setIsAddProjectDialogOpen(false);
  };

  const handleProjectUpdated = () => {
    setProjectRefreshTrigger(prev => !prev);
  };

  if (isSessionLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-neutral-950">
        <Card className="w-full max-w-4xl bg-neutral-900 rounded-2xl glass-border">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2 bg-neutral-700" />
            <Skeleton className="h-4 w-1/2 bg-neutral-700" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full bg-neutral-700" />
            <Skeleton className="h-20 w-full bg-neutral-700" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canViewProjects) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-neutral-950">
        <Card className="w-full max-w-md text-center bg-neutral-900 rounded-2xl glass-border">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-destructive-foreground">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/70">You do not have permission to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-neutral-950">
      <Card className="w-full max-w-6xl shadow-lg mt-8 mb-8 bg-neutral-900 rounded-2xl glass-border">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-white/90">Project Management</CardTitle>
          <p className="text-lg text-white/70">View and manage all projects.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {canAddProjects && (
            <div className="flex justify-end mb-4">
              <Dialog open={isAddProjectDialogOpen} onOpenChange={setIsAddProjectDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-full bg-lime-400 px-6 text-black hover:bg-lime-300">
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
            </div>
          )}

          <div className="p-6 border border-neutral-800 rounded-2xl bg-neutral-900 glass-border">
            <h3 className="text-xl font-semibold mb-4 text-white/90">All Projects</h3>
            <ProjectList refreshTrigger={projectRefreshTrigger} onProjectUpdated={handleProjectUpdated} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectsPage;