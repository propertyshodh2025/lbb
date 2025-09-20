"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import ProjectStatusHistory from './ProjectStatusHistory';

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

interface ClientProjectCardProps {
  project: Project;
}

const ClientProjectCard = ({ project }: ClientProjectCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="shadow-sm bg-neutral-900 rounded-2xl glass-border">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-white/90">{project.title}</CardTitle>
        <p className="text-sm text-white/70">
          Current Status: <span className="font-medium capitalize text-lime-300">{project.current_status}</span>
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {project.description && (
          <p className="text-white/70">{project.description}</p>
        )}
        {project.due_date && (
          <p className="text-sm text-white/70">
            Due Date: {format(new Date(project.due_date), 'PPP')}
          </p>
        )}
        {project.notes && (
          <p className="text-sm text-white/70">Notes: {project.notes}</p>
        )}

        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="w-full space-y-2 pt-4"
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between px-0 text-lime-300 hover:text-lime-400">
              <span className="text-sm font-medium">
                {isOpen ? 'Hide History' : 'View Status History'}
              </span>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden">
            <div className="rounded-md border border-neutral-700 px-4 py-3 font-mono text-sm bg-neutral-800 text-white/70">
              <ProjectStatusHistory projectId={project.id} />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default ClientProjectCard;