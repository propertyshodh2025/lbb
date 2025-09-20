"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Users, Briefcase, FileText, Link as LinkIcon, Handshake, Swords, Trophy } from 'lucide-react'; // Added new icons
import { Link } from 'react-router-dom';

interface RoleCounts {
  admin: number;
  manager: number;
  editor: number;
  sales_manager: number;
  warrior: number;
  deal_closer: number;
  client: number; // Keep client for existing data
  total: number;
}

const WorkOverviewCards = () => {
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
          sales_manager: 0,
          warrior: 0,
          deal_closer: 0,
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

    const subscription = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, payload => {
        console.log('Profile change received in WorkOverviewCards!', payload);
        fetchUserStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="w-full bg-neutral-900 rounded-2xl glass-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-6 w-1/2 bg-neutral-700" />
            <Skeleton className="h-6 w-6 rounded-full bg-neutral-700" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-3/4 bg-neutral-700" />
          </CardContent>
        </Card>
        <Card className="w-full bg-neutral-900 rounded-2xl glass-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-6 w-1/2 bg-neutral-700" />
            <Skeleton className="h-6 w-6 rounded-full bg-neutral-700" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-3/4 bg-neutral-700" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!roleCounts) {
    return (
      <Card className="w-full bg-neutral-900 rounded-2xl glass-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white/90">Work Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-white/70">Could not load work overview statistics.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Link to="/admin/departments/media/clients" className="block"> {/* Updated link */}
        <Card className="h-full flex flex-col justify-between shadow-lg bg-neutral-900 rounded-2xl glass-border hover:border-lime-400 transition-colors duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold text-white/90">Clients</CardTitle>
            <Users className="h-8 w-8 text-lime-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white/90">{roleCounts.client}</p>
            <p className="text-sm text-white/70">Total clients</p>
          </CardContent>
        </Card>
      </Link>

      <Link to="/tasks" className="block">
        <Card className="h-full flex flex-col justify-between shadow-lg bg-neutral-900 rounded-2xl glass-border hover:border-lime-400 transition-colors duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold text-white/90">Tasks</CardTitle>
            <FileText className="h-8 w-8 text-lime-400" />
          </CardHeader>
          <CardContent>
            {/* This count would ideally come from a task query, but for now, we'll use a placeholder or fetch it */}
            <p className="text-2xl font-bold text-white/90">...</p> 
            <p className="text-sm text-white/70">View all tasks</p>
          </CardContent>
        </Card>
      </Link>

      <Link to="/users?role=manager" className="block">
        <Card className="h-full flex flex-col justify-between shadow-lg bg-neutral-900 rounded-2xl glass-border hover:border-lime-400 transition-colors duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold text-white/90">Managers</CardTitle>
            <Briefcase className="h-8 w-8 text-lime-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white/90">{roleCounts.manager}</p>
            <p className="text-sm text-white/70">Total managers</p>
          </CardContent>
        </Card>
      </Link>

      <Link to="/users?role=editor" className="block">
        <Card className="h-full flex flex-col justify-between shadow-lg bg-neutral-900 rounded-2xl glass-border hover:border-lime-400 transition-colors duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold text-white/90">Editors</CardTitle>
            <Users className="h-8 w-8 text-lime-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white/90">{roleCounts.editor}</p>
            <p className="text-sm text-white/70">Total editors</p>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
};

export default WorkOverviewCards;