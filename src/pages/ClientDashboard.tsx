"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import ClientProjectCard from '@/components/ClientProjectCard'; // Import the new component

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

const ClientDashboard = () => {
  const { profile, isLoading, user } = useSession();
  const [clientProjects, setClientProjects] = useState<Project[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);

  useEffect(() => {
    const fetchClientProjects = async () => {
      if (user?.id && profile?.role === 'client') {
        setIsProjectsLoading(true);
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
          .eq('client_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching client projects:', error);
          showError('Failed to load your projects.');
          setClientProjects([]);
        } else {
          setClientProjects(data || []);
        }
        setIsProjectsLoading(false);
      } else if (!isLoading) {
        // If not a client or user not available, stop loading projects
        setIsProjectsLoading(false);
      }
    };

    fetchClientProjects();
  }, [user, profile, isLoading]);

  if (isLoading || isProjectsLoading) {
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

  if (profile?.role !== 'client' && profile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300">You do not have client privileges to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-800 dark:text-white">Client Dashboard</CardTitle>
          <p className="text-lg text-gray-600 dark:text-gray-400">Track the progress of your projects.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Welcome, {profile?.first_name || 'Client'}! Here are your projects:
          </p>
          {clientProjects.length > 0 ? (
            <div className="space-y-4">
              {clientProjects.map((project) => (
                <ClientProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">You currently have no projects.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientDashboard;