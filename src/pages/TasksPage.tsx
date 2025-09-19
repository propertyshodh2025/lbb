"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from '@/components/SessionContextProvider';
import { Skeleton } from '@/components/ui/skeleton';
import TaskList from '@/components/TaskList';
import AddTaskForm from '@/components/AddTaskForm';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowUpNarrowWide, ArrowDownNarrowWide } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Project {
  id: string;
  title: string;
}

interface Editor {
  id: string;
  first_name: string;
  last_name: string;
}

const TASK_STATUSES_FILTER = ['all', 'Unassigned', 'Assigned', 'In Progress', 'Completed', 'Under Review'];
const SORT_OPTIONS = [
  { value: 'created_at', label: 'Created Date' },
  { value: 'updated_at', label: 'Last Updated' },
  { value: 'title', label: 'Title' },
  { value: 'status', label: 'Status' },
];

const TasksPage = () => {
  const { profile, isLoading: isSessionLoading } = useSession();
  const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(false);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [editors, setEditors] = useState<Editor[]>([]);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('all');
  const [selectedAssignedToFilter, setSelectedAssignedToFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc'); // Default to descending for dates

  const canViewTasks = !isSessionLoading && (profile?.role === 'admin' || profile?.role === 'manager' || profile?.role === 'editor');
  const canAddTasks = !isSessionLoading && (profile?.role === 'admin' || profile?.role === 'manager');

  useEffect(() => {
    if (!canViewTasks) return;

    const fetchData = async () => {
      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, title')
        .order('title', { ascending: true });

      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
        showError('Failed to load projects for filter.');
      } else {
        setProjects(projectsData || []);
      }

      // Fetch editors
      const { data: editorsData, error: editorsError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'editor');

      if (editorsError) {
        console.error('Error fetching editors:', editorsError);
        showError('Failed to load editors for filter.');
      } else {
        setEditors(editorsData || []);
      }
    };
    fetchData();
  }, [canViewTasks]);

  const handleTaskAdded = () => {
    setTaskRefreshTrigger(prev => !prev); // Toggle to trigger a re-fetch
    setIsAddTaskDialogOpen(false); // Close the dialog
  };

  const handleTaskUpdated = () => {
    setTaskRefreshTrigger(prev => !prev); // Toggle to trigger a re-fetch
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
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

  if (!canViewTasks) {
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
          <CardTitle className="text-3xl font-bold text-gray-800 dark:text-white">Task Management</CardTitle>
          <p className="text-lg text-gray-600 dark:text-gray-400">View, filter, and manage all tasks.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {canAddTasks && (
            <div className="flex justify-end mb-4">
              <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
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
                  <AddTaskForm onTaskAdded={handleTaskAdded} />
                </DialogContent>
              </Dialog>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                {TASK_STATUSES_FILTER.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedProjectFilter} onValueChange={setSelectedProjectFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedAssignedToFilter} onValueChange={setSelectedAssignedToFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Editor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Editors</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {editors.map((editor) => (
                  <SelectItem key={editor.id} value={editor.id}>
                    {editor.first_name} {editor.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort By:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={toggleSortOrder}>
              {sortOrder === 'asc' ? <ArrowUpNarrowWide className="h-4 w-4" /> : <ArrowDownNarrowWide className="h-4 w-4" />}
              <span className="sr-only">Toggle sort order</span>
            </Button>
          </div>

          <div className="p-6 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Task List</h3>
            <TaskList
              refreshTrigger={taskRefreshTrigger}
              filterByStatus={selectedStatusFilter === 'all' ? null : selectedStatusFilter}
              filterByProjectId={selectedProjectFilter === 'all' ? null : selectedProjectFilter}
              filterByAssignedTo={selectedAssignedToFilter === 'all' ? null : (selectedAssignedToFilter === 'unassigned' ? 'null' : selectedAssignedToFilter)}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onTaskUpdated={handleTaskUpdated}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TasksPage;