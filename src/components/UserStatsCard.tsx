"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Users as UsersIcon } from 'lucide-react';

interface RoleCounts {
  admin: number;
  manager: number;
  editor: number;
  client: number;
  total: number;
}

const UserStatsCard = () => {
  const [roleCounts, setRoleCounts] = useState<RoleCounts | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserStats = async () => {
      setIsLoading(true);
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('role');

      if (error) {
        console.error('Error fetching user profiles for stats:', error);
        showError('Failed to load user statistics.');
        setRoleCounts(null);
      } else {
        const counts: RoleCounts = {
          admin: 0,
          manager: 0,
          editor: 0,
          client: 0,
          total: 0,
        };

        profiles.forEach(profile => {
          if (profile.role in counts) {
            counts[profile.role as keyof Omit<RoleCounts, 'total'>]++;
          }
          counts.total++;
        });
        setRoleCounts(counts);
      }
      setIsLoading(false);
    };

    fetchUserStats();
  }, []);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (!roleCounts) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">User Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 dark:text-gray-400">Could not load user statistics.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold">User Statistics</CardTitle>
        <UsersIcon className="h-6 w-6 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Users:</p>
          <Badge variant="secondary" className="text-md">{roleCounts.total}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">Admins:</p>
          <Badge variant="outline">{roleCounts.admin}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">Managers:</p>
          <Badge variant="outline">{roleCounts.manager}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">Editors:</p>
          <Badge variant="outline">{roleCounts.editor}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">Clients:</p>
          <Badge variant="outline">{roleCounts.client}</Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserStatsCard;