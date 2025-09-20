"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  CalendarDays,
  Clock,
  CheckCircle,
  Package,
  FileText,
  User,
  Download,
  Paperclip,
  ChevronRight,
} from 'lucide-react';
import TimelineTracker from './TimelineTracker';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface TaskWithHistory {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  due_date: string | null;
  attachments: string[];
  projects: { title: string } | null;
  profiles: {
    first_name: string;
    last_name: string;
  } | null;
  task_status_history: {
    id: string;
    status: string;
    notes: string | null;
    timestamp: string;
  }[];
}

interface ClientTaskCardProps {
  task: TaskWithHistory;
}

const ClientTaskCard = ({ task }: ClientTaskCardProps) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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

  const getStatusIcon = (status: string) => {
    const baseClasses = "h-4 w-4 mr-1";
    switch (status) {
      case 'Raw files received':
      case 'Unassigned':
        return <Package className={`${baseClasses} text-lime-400`} />;
      case 'Assigned':
      case 'In Progress':
      case 'Under Review':
        return <Clock className={`${baseClasses} text-orange-400`} />;
      case 'Completed':
        return <CheckCircle className={`${baseClasses} text-green-400`} />;
      default:
        return <FileText className={`${baseClasses} text-white/70`} />;
    }
  };

  const assignedEditorName = task.profiles
    ? `${task.profiles.first_name} ${task.profiles.last_name}`
    : 'Unassigned';

  return (
    <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-md transition-shadow bg-neutral-800 rounded-2xl glass-border">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-sm font-medium text-white/90">
                {task.title}
              </CardTitle>
              <Badge className={getStatusColor(task.status)}>
                {task.status}
              </Badge>
            </div>
            {task.projects && (
              <p className="text-xs text-white/70">
                Project: {task.projects.title}
              </p>
            )}
          </CardHeader>
          <CardContent className="pt-0">
            {task.description && (
              <p className="text-xs text-white/70 mb-2 line-clamp-2">{task.description}</p>
            )}
            <div className="flex items-center justify-between text-xs text-white/70 mt-2">
              <div className="flex items-center gap-1">
                {getStatusIcon(task.status)}
                <span>{task.status}</span>
              </div>
              {task.due_date && (
                <div className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3 text-white/70" />
                  Due: {format(new Date(task.due_date), 'MMM dd')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-neutral-900 text-white/90 rounded-2xl glass-border border-neutral-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white/90">{task.title}</DialogTitle>
          <DialogDescription className="text-white/70">
            Project: {task.projects?.title || 'N/A'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-white/90">Current Status:</p>
              <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
            </div>
            <div>
              <p className="font-semibold text-white/90">Assigned Editor:</p>
              <p className="text-white/70">{assignedEditorName}</p>
            </div>
            <div>
              <p className="font-semibold text-white/90">Date Uploaded:</p>
              <p className="text-white/70">{format(new Date(task.created_at), 'PPP HH:mm')}</p>
            </div>
            {task.due_date && (
              <div>
                <p className="font-semibold text-white/90">Estimated Completion:</p>
                <p className="text-white/70">{format(new Date(task.due_date), 'PPP')}</p>
              </div>
            )}
          </div>

          {task.description && (
            <>
              <Separator className="bg-neutral-800" />
              <div>
                <h4 className="font-semibold text-white/90">Description / Special Instructions:</h4>
                <p className="text-white/70 mt-1">{task.description}</p>
              </div>
            </>
          )}

          {task.task_status_history && task.task_status_history.length > 0 && (
            <>
              <Separator className="bg-neutral-800" />
              <div>
                <h4 className="font-semibold text-white/90">Activity Log:</h4>
                <TimelineTracker tasks={[task]} />
              </div>
            </>
          )}

          {task.attachments && task.attachments.length > 0 && (
            <>
              <Separator className="bg-neutral-800" />
              <div>
                <h4 className="font-semibold text-white/90 mb-2">Attachments:</h4>
                <div className="space-y-2">
                  {task.attachments.map((url, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border border-neutral-700 rounded-md bg-neutral-800">
                      <div className="flex items-center">
                        <Paperclip className="h-4 w-4 mr-2 text-white/70" />
                        <span className="text-sm text-white/90 truncate">
                          {url.substring(url.lastIndexOf('/') + 1)}
                        </span>
                      </div>
                      <Button variant="ghost" size="icon" asChild className="text-lime-300 hover:text-lime-400">
                        <a href={url} target="_blank" rel="noopener noreferrer" download>
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Download attachment</span>
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientTaskCard;