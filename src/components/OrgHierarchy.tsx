"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { User as UserIcon, ChevronRight } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  email: string;
  avatar_url: string | null;
}

interface GroupedUsers {
  [role: string]: UserProfile[];
}

const OrgHierarchy = () => {
  const [groupedUsers, setGroupedUsers] = useState<GroupedUsers | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openRoles, setOpenRoles] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role, email, avatar_url')
        .order('role', { ascending: true })
        .order('first_name', { ascending: true });

      if (error) {
        console.error('Error fetching users for hierarchy:', error);
        showError('Failed to load organizational hierarchy.');
        setGroupedUsers(null);
      } else {
        const groups: GroupedUsers = {};
        data?.forEach(user => {
          if (!groups[user.role]) {
            groups[user.role] = [];
          }
          groups[user.role].push(user);
        });
        setGroupedUsers(groups);
      }
      setIsLoading(false);
    };

    fetchUsers();

    const subscription = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, payload => {
        console.log('Profile change received in OrgHierarchy!', payload);
        fetchUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const toggleRole = (role: string) => {
    setOpenRoles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(role)) {
        newSet.delete(role);
      } else {
        newSet.add(role);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <Card className="w-full bg-neutral-900 rounded-2xl glass-border">
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2 bg-neutral-700" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full bg-neutral-700" />
          <Skeleton className="h-16 w-full bg-neutral-700" />
          <Skeleton className="h-16 w-full bg-neutral-700" />
        </CardContent>
      </Card>
    );
  }

  if (!groupedUsers || Object.keys(groupedUsers).length === 0) {
    return (
      <Card className="w-full bg-neutral-900 rounded-2xl glass-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white/90">Organizational Hierarchy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-white/70">No users found to display hierarchy.</p>
        </CardContent>
      </Card>
    );
  }

  const roleOrder = ['admin', 'manager', 'sales_manager', 'warrior', 'deal_closer', 'editor', 'client'];

  return (
    <Card className="w-full bg-neutral-900 rounded-2xl glass-border">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-white/90">Organizational Hierarchy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {roleOrder.map(role => {
          const usersInRole = groupedUsers[role];
          if (!usersInRole || usersInRole.length === 0) return null;

          const isOpen = openRoles.has(role);

          return (
            <Collapsible key={role} open={isOpen} onOpenChange={() => toggleRole(role)} className="w-full">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between px-4 py-2 text-white/90 hover:bg-neutral-800 hover:text-lime-300 rounded-lg">
                  <span className="text-lg font-medium capitalize">{role}s</span>
                  <ChevronRight className={cn("h-4 w-4 transition-transform", isOpen && "rotate-90")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pl-6 pt-2 data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden">
                {usersInRole.map(user => (
                  <div key={user.id} className="flex items-center gap-3 p-2 bg-neutral-800 rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || undefined} alt={`${user.first_name} ${user.last_name}`} />
                      <AvatarFallback className="bg-neutral-700 text-white/70">
                        {user.first_name?.charAt(0).toUpperCase() || ''}
                        {user.last_name?.charAt(0).toUpperCase() || ''}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-white/90">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-white/70">{user.email}</p>
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default OrgHierarchy;