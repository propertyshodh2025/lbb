"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Package, Truck, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface TaskStatusHistoryEntry {
  id: string;
  status: string;
  notes: string | null;
  timestamp: string;
}

interface TaskWithHistory {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  due_date: string | null;
  task_status_history: TaskStatusHistoryEntry[];
  projects: { title: string } | null;
}

interface TimelineTrackerProps {
  tasks: TaskWithHistory[];
}

const getStatusIcon = (status: string, isActive: boolean = false) => {
  const baseClasses = "w-5 h-5";
  const activeClasses = isActive ? "text-lime-400" : "text-white/70";

  switch (status) {
    case 'Raw files received':
      return <Package className={`${baseClasses} ${activeClasses}`} />;
    case 'Assigned':
    case 'In Progress':
    case 'Under Review':
      return <Clock className={`${baseClasses} ${activeClasses}`} />;
    case 'Completed':
      return <CheckCircle className={`${baseClasses} ${activeClasses}`} />;
    default:
      return <AlertCircle className={`${baseClasses} ${activeClasses}`} />;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'Raw files received': return 'Raw Files Received';
    case 'Unassigned': return 'Queued for Assignment';
    case 'Assigned': return 'Assigned to Editor';
    case 'In Progress': return 'Editing in Progress';
    case 'Under Review': return 'Under Review';
    case 'Completed': return 'Editing Complete';
    default: return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Raw files received': return 'bg-lime-950 text-lime-400';
    case 'Unassigned': return 'bg-neutral-700 text-white/70';
    case 'Assigned': return 'bg-yellow-900 text-yellow-400';
    case 'In Progress': return 'bg-orange-900 text-orange-400';
    case 'Under Review': return 'bg-purple-900 text-purple-400';
    case 'Completed': return 'bg-green-900 text-green-400';
    default: return 'bg-neutral-700 text-white/70';
  }
};

const TimelineTracker = ({ tasks }: TimelineTrackerProps) => {
  const orderedStatuses = [
    'Raw files received',
    'Assigned',
    'In Progress',
    'Under Review',
    'Completed',
  ];

  return (
    <div className="space-y-6">
      {tasks.length === 0 && (
        <Card className="bg-neutral-900 rounded-2xl glass-border">
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 text-white/70 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white/90 mb-2">
              No tasks yet
            </h3>
            <p className="text-white/70">
              Your video editing tasks will appear here once they're created.
            </p>
          </CardContent>
        </Card>
      )}

      {tasks.map((task) => {
        const currentStatusIndex = orderedStatuses.indexOf(task.status);

        return (
          <Card key={task.id} className="overflow-hidden shadow-sm bg-neutral-900 rounded-2xl glass-border">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg text-white/90">{task.title}</CardTitle>
                  {task.projects && (
                    <p className="text-white/70 text-sm mt-1">Project: {task.projects.title}</p>
                  )}
                </div>
                <Badge className={getStatusColor(task.status)}>
                  {getStatusLabel(task.status)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute left-4 top-4 bottom-0 w-0.5 bg-neutral-700" />

                {/* Steps */}
                <div className="space-y-6">
                  {orderedStatuses.map((statusStep, index) => {
                    const historyEntry = task.task_status_history.find(h => h.status === statusStep);
                    const isActive = task.status === statusStep;
                    const isCompleted = currentStatusIndex > index;

                    return (
                      <div key={statusStep} className="relative flex items-start">
                        {/* Step Icon */}
                        <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                          isCompleted || isActive
                            ? 'border-lime-400 bg-lime-400'
                            : 'border-neutral-700 bg-neutral-900'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4 text-black" />
                          ) : (
                            getStatusIcon(statusStep, isActive)
                          )}
                        </div>

                        {/* Step Content */}
                        <div className="ml-4 flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${
                              isCompleted || isActive ? 'text-white/90' : 'text-white/70'
                            }`}>
                              {getStatusLabel(statusStep)}
                            </p>
                            {historyEntry?.timestamp && (
                              <p className="text-xs text-white/70">
                                {format(new Date(historyEntry.timestamp), 'MMM dd, yyyy HH:mm')}
                              </p>
                            )}
                          </div>

                          {isActive && (
                            <p className="text-xs text-lime-400 mt-1">
                              Currently in progress
                            </p>
                          )}
                          {historyEntry?.notes && (
                            <p className="text-xs text-white/70 mt-1">
                              {historyEntry.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Task Details */}
              <div className="mt-6 pt-4 border-t border-neutral-800">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-white/70">Created</p>
                    <p className="font-medium text-white/90">
                      {format(new Date(task.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  {task.due_date && (
                    <div>
                      <p className="text-white/70">Due Date</p>
                      <p className="font-medium text-white/90">
                        {format(new Date(task.due_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  )}
                </div>

                {task.description && (
                  <div className="mt-4">
                    <p className="text-white/70 text-sm">Description</p>
                    <p className="text-sm mt-1 text-white/90">{task.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default TimelineTracker;