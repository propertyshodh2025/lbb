"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

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
}

const ProjectList = ({ refreshTrigger }: ProjectListProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
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
        .order('created_at', { ascending: false });

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
  }, [refreshTrigger]); // Re-fetch when refreshTrigger changes

  if (isLoading) {
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
          <CardHeader>
            <CardTitle className="text-xl font-semibold">{project.title}</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Client: {project.profiles ? `${project.profiles.first_name} ${project.profiles.last_name}` : 'N/A'}
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {project.description && (
              <p className="text-gray-700 dark:text-gray-300">{project.description}</p>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Status: <span className="font-medium capitalize">{project.current_status}</span>
            </p>
            {project.due_date && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Due: {format(new Date(project.due_date), 'PPP')}
              </p>
            )}
            {project.notes && (
              <p className="text-sm text-gray-600 dark:text-gray-400">Notes: {project.notes}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProjectList;