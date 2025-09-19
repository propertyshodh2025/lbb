"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle } = '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useSession } from '@/components/SessionContextProvider'; // Import useSession
import UpdateProjectStatusForm from './UpdateProjectStatusForm'; // Import the new component
import { Link } from 'react-router-dom'; // Import Link
import { Button } from '@/components/ui/button'; // Import Button
import { Trash2 } from 'lucide-react'; // Import Trash2 icon
import { // Import AlertDialog components
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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

interface ProjectListProps {
  refreshTrigger?: boolean; // Prop to trigger re-fetch
  filterByClientId?: string | null; // New prop to filter projects by client ID
  onProjectUpdated?: () => void; // Callback for when a project is updated
}

const ProjectList = ({ refreshTrigger, filterByClientId = null, onProjectUpdated }: ProjectListProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { profile, isLoading: isSessionLoading } = useSession(); // Get session and profile

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      let query = supabase
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
        .order('created_at', { ascending: false });

      if (filterByClientId) {
        query = query.eq('client_id', filterByClientId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching projects:', error);
        showError('Failed to load projects.');
        setProjects([]);
      } else {
        setProjects(data || []);
      }
      setIsLoading(false);
    };

    fetchProjects();
  }, [refreshTrigger, filterByClientId]); // Re-fetch when refreshTrigger or filterByClientId changes

  const canManageProjects = profile?.role === 'admin' || profile?.role === 'manager';
  const canDeleteProject = profile?.role === 'admin'; // Only admins can delete projects

  const handleDeleteProject = async (projectId: string, projectTitle: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('Error deleting project:', error);
      showError(`Failed to delete project "${projectTitle}".`);
    } else {
      showSuccess(`Project "${projectTitle}" deleted successfully!`);
      onProjectUpdated?.(); // Notify parent to refresh the list
    }
  };

  if (isLoading || isSessionLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400">No projects found.</p>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <Card key={project.id} className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold">
              <Link to={`/projects/${project.id}`} className="hover:underline text-primary dark:text-primary-foreground">
                {project.title}
              </Link>
            </CardTitle>
            {canDeleteProject && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon" className="h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete Project</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the project
                      "{project.title}" and all associated tasks and status history.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteProject(project.id, project.title)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Client: {project.profiles ? `${project.profiles.first_name} ${project.profiles.last_name}` : 'N/A'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Current Status: <span className="font-medium capitalize">{project.current_status}</span>
            </p>
            {project.due_date && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Due: {format(new Date(project.due_date), 'PPP')}
              </p>
            )}
            {project.notes && (
              <p className="text-sm text-gray-600 dark:text-gray-400">Notes: {project.notes}</p>
            )}
            {canManageProjects && (
              <div className="pt-4">
                <UpdateProjectStatusForm
                  projectId={project.id}
                  currentStatus={project.current_status}
                  onStatusUpdated={onProjectUpdated || (() => {})} // Pass callback
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProjectList;