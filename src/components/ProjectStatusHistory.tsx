"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface StatusHistoryEntry {
  id: string;
  status: string;
  timestamp: string;
}

interface ProjectStatusHistoryProps {
  projectId: string;
}

const ProjectStatusHistory = ({ projectId }: ProjectStatusHistoryProps) => {
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('project_status_history')
        .select('id, status, timestamp')
        .eq('project_id', projectId)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching project status history:', error);
        showError('Failed to load project status history.');
        setHistory([]);
      } else {
        setHistory(data || []);
      }
      setIsLoading(false);
    };

    if (projectId) {
      fetchHistory();
    }
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full bg-neutral-700" />
        <Skeleton className="h-10 w-full bg-neutral-700" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <p className="text-center text-white/70">No status history available.</p>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-md font-semibold text-white/90">Status History:</h4>
      {history.map((entry) => (
        <div key={entry.id} className="flex justify-between items-center text-sm text-white/70">
          <span className="font-medium capitalize">{entry.status}</span>
          <span>{format(new Date(entry.timestamp), 'MMM dd, yyyy HH:mm')}</span>
        </div>
      ))}
    </div>
  );
};

export default ProjectStatusHistory;