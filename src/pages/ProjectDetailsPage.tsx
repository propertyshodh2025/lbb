"use client";

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useSession } from '@/components/SessionContextProvider';
import UpdateProjectStatusForm from '@/components/UpdateProjectStatusForm';
import ProjectStatusHistory from '@/components/ProjectStatusHistory';
import AddTaskForm from '@/components/AddTaskForm';
import TaskList from '@/components/TaskList';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string | null;
  client_id: string;
  due_date: string | null;
  notes: string | null;
  current_status: string;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
  } | null;
}

const ProjectDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(false);
  const [projectRefreshTrigger, setProjectRefreshTrigger] = useState(false); // To refresh project details after status update
  const { profile, isLoading: isSessionLoading } = useSession();

  const canManageProjects = !isSessionLoading && (profile?.role === 'admin' || profile?.role === 'manager');

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!id) return;

      setIsLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          description,
          client_id,
          due_date,
          notes,
          current_status,
          created_at,
          profiles (first_name, last_name)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching project details:', error);
        showError('Failed to load project details.');
        setProject(null);
      } else {
        setProject(data);
      }
      setIsLoading(false);
    };

    fetchProjectDetails();
  }, [id, projectRefreshTrigger]); // Re-fetch if ID changes or projectRefreshTrigger toggles

  const handleTaskAdded = () => {
    setTaskRefreshTrigger(!taskRefreshTrigger); // Toggle to refresh task list
  };

  const handleProjectStatusUpdated = () => {
    setProjectRefreshTrigger(!projectRefreshTrigger); // Toggle to refresh project details and history
  };

  if (isLoading || isSessionLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">Project Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300">The project you are looking for does not exist or you do not have access.</p>
            <Button asChild className="mt-4">
              <Link to="/manager">Back to Projects</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-4xl shadow-lg mt-8 mb-8">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild>
              <Link to="/manager" className="flex items-center text-primary hover:underline">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Projects
              </Link>
            </Button>
            <CardTitle className="text-3xl font-bold text-gray-800 dark:text-white text-center flex-grow">
              {project.title}
            </CardTitle>
            <div className="w-32"></div> {/* Spacer to balance the back button */}
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 text-center">
            Client: {project.profiles ? `${project.profiles.first_name} ${project.profiles.last_name}` : 'N/A'}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {project.description && (
            <div>
              <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200">Description:</h4>
              <p className="text-gray-700 dark:text-gray-300">{project.description}</p>
            </div>
          )}
          <div>
            <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200">Current Status:</h4>
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium capitalize text-primary dark:text-primary-foreground">
                {project.current_status}
              </span>
              {canManageProjects && (
                <UpdateProjectStatusForm
                  projectId={project.id}
                  currentStatus={project.current_status}
                  onStatusUpdated={handleProjectStatusUpdated}
                />
              )}
            </div>
          </div>
          {project.due_date && (
            <div>
              <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200">Due Date:</h4>
              <p className="text-gray-700 dark:text-gray-300">{format(new Date(project.due_date), 'PPP')}</p>
            </div>
          )}
          {project.notes && (
            <div>
              <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200">Notes:</h4>
              <p className="text-gray-700 dark:text-gray-300">{project.notes}</p>
            </div>
          )}

          <div className="border-t pt-6 mt-6">
            <ProjectStatusHistory projectId={project.id} />
          </div>

          {canManageProjects && (
            <div className="border-t pt-6 mt-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Add New Task for this Project</h3>
              <AddTaskForm onTaskAdded={handleTaskAdded} defaultProjectId={project.id} />
            </div>
          )}

          <div className="border-t pt-6 mt-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Tasks for this Project</h3>
            <TaskList refreshTrigger={taskRefreshTrigger} filterByProjectId={project.id} onTaskUpdated={handleTaskAdded} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectDetailsPage;