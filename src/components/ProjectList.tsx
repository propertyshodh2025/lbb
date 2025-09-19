"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useSession } from '@/components/SessionContextProvider'; // Import useSession
import UpdateProjectStatusForm from './UpdateProjectStatusForm'; // Import the new component
import { Link } from 'react-router-dom'; // Import Link

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

  const canManageProjects = profile?.role === 'admin' || profile?.role === 'manager';

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <Card key={project.id} className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              <Link to={`/projects/${project.id}`} className="hover:underline text-primary dark:text-primary-foreground">
                {project.title}
              </Link>
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Client: {project.profiles ? `${project.profiles.first_name} ${project.profiles.last_name}` : 'N/A'}
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {project.description && (
              <p className="text-gray-700 dark:text-gray-300">{project.description}</p>
            )}
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