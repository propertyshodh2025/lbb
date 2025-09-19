"use client";

import React, { useState } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import AddTaskForm from '@/components/AddTaskForm';
import TaskList from '@/components/TaskList';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Briefcase, ListChecks, PlusCircle } from 'lucide-react'; // Import ListChecks and PlusCircle icons
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const ManagerDashboard = () => {
  const { profile, isLoading } = useSession();
  const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(false); // State to trigger task list re-fetch
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);

  const handleTaskChange = () => {
    setTaskRefreshTrigger(!taskRefreshTrigger); // Toggle to trigger a re-fetch or re-render of task list
    setIsAddTaskDialogOpen(false); // Close the dialog
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

  if (profile?.role !== 'manager' && profile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300">You do not have manager privileges to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-6xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-800 dark:text-white">Manager Dashboard</CardTitle>
          <p className="text-lg text-gray-600 dark:text-gray-400">Oversee projects and tasks, and assign work to editors.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Welcome, Manager! Here you can manage projects and tasks.
          </p>
          
          <div className="p-6 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Project Overview</h3>
            <Button asChild variant="outline" className="w-full">
              <Link to="/projects">
                <Briefcase className="mr-2 h-4 w-4" /> View All Projects
              </Link>
            </Button>
          </div>

          <div className="p-6 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Task Actions</h3>
            <div className="space-y-4">
              <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                    <DialogDescription>
                      Fill in the details to create a new task.
                    </DialogDescription>
                  </DialogHeader>
                  <AddTaskForm onTaskAdded={handleTaskChange} />
                </DialogContent>
              </Dialog>
              <Button asChild variant="outline" className="w-full">
                <Link to="/tasks">
                  <ListChecks className="mr-2 h-4 w-4" /> View All Tasks
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerDashboard;