"use client";

import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSession } from '@/components/SessionContextProvider';

interface UpdateProjectStatusFormProps {
  projectId: string;
  currentStatus: string;
  onStatusUpdated: () => void;
}

const PROJECT_STATUSES = [
  'Raw files received',
  'In progress',
  'Under review',
  'Revisions needed',
  'Approved by client',
  'Completed',
  'Archived',
];

const UpdateProjectStatusForm = ({ projectId, currentStatus, onStatusUpdated }: UpdateProjectStatusFormProps) => {
  const { profile, isLoading: isSessionLoading } = useSession();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return; // No change, do nothing

    setIsUpdating(true);
    const { error: projectUpdateError } = await supabase
      .from('projects')
      .update({ current_status: newStatus })
      .eq('id', projectId);

    if (projectUpdateError) {
      console.error('Error updating project status:', projectUpdateError);
      showError('Failed to update project status.');
      setIsUpdating(false);
      return;
    }

    // Insert into project_status_history
    const { error: historyInsertError } = await supabase
      .from('project_status_history')
      .insert({ project_id: projectId, status: newStatus });

    if (historyInsertError) {
      console.error('Error logging project status history:', historyInsertError);
      showError('Failed to log status history.');
      // Even if history fails, project status is updated, so we proceed
    }

    showSuccess('Project status updated successfully!');
    setIsUpdating(false);
    onStatusUpdated(); // Notify parent to refresh
  };

  // Only admins and managers can update project status
  const canUpdateStatus = !isSessionLoading && (profile?.role === 'admin' || profile?.role === 'manager');

  return (
    <div className="flex items-center gap-2">
      <p className="text-sm text-gray-600 dark:text-gray-400">Update Status:</p>
      <Select
        value={currentStatus}
        onValueChange={handleStatusChange}
        disabled={!canUpdateStatus || isUpdating}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select new status" />
        </SelectTrigger>
        <SelectContent>
          {PROJECT_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default UpdateProjectStatusForm;