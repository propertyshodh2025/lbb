"use client";

import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useSession } from '@/components/SessionContextProvider';
import UpdateProjectStatusForm from '@/components/UpdateProjectStatusForm';
import ProjectStatusHistory from '@/components/ProjectStatusHistory';
import AddTaskForm from '@/components/AddTaskForm';
import TaskList from '@/components/TaskList';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2, Edit } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import EditProjectForm from '@/components/EditProjectForm';

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

const ProjectDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(false);
  const [projectRefreshTrigger, setProjectRefreshTrigger] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { profile, isLoading: isSessionLoading } = useSession();

  const canManageProjects = !isSessionLoading && (profile?.role === 'admin' || profile?.role === 'manager');
  const canDeleteProject = !isSessionLoading && profile?.role === 'admin';

  const fetchProjectDetails = async () => {
    if (!id) return;

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
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching project details:', error);
      showError('Failed to load project details.');
      setProject(null);
    } else {
      setProject(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProjectDetails();

    const projectSubscription = supabase
      .channel(`project_details:${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `id=eq.${id}` }, payload => {
        console.log('Project details change received!', payload);
        fetchProjectDetails();
      })
      .subscribe();

    const taskSubscription = supabase
      .channel(`project_tasks_for_details:${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${id}` }, payload => {
        console.log('Task change for project details received!', payload);
        setTaskRefreshTrigger(prev => !prev);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(projectSubscription);
      supabase.removeChannel(taskSubscription);
    };
  }, [id, projectRefreshTrigger, isEditDialogOpen]);

  const handleTaskAdded = () => {
    setTaskRefreshTrigger(!taskRefreshTrigger);
  };

  const handleProjectStatusUpdated = () => {
    setProjectRefreshTrigger(!projectRefreshTrigger);
  };

  const handleProjectDetailsUpdated = () => {
    setProjectRefreshTrigger(!projectRefreshTrigger);
    setIsEditDialogOpen(false);
  };

  const handleDeleteProject = async () => {
    if (!id) return;

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting project:', error);
      showError('Failed to delete project.');
    } else {
      showSuccess('Project deleted successfully!');
      navigate('/manager');
    }
  };

  if (isLoading || isSessionLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-neutral-950">
        <Card className="w-full max-w-4xl bg-neutral-900 rounded-2xl glass-border">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2 bg-neutral-700" />
            <Skeleton className="h-4 w-1/2 bg-neutral-700" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-full bg-neutral-700" />
            <Skeleton className="h-6 w-full bg-neutral-700" />
            <Skeleton className="h-40 w-full bg-neutral-700" />
            <Skeleton className="h-60 w-full bg-neutral-700" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-neutral-950">
        <Card className="w-full max-w-md text-center bg-neutral-900 rounded-2xl glass-border">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-destructive-foreground">Project Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/70">The project you are looking for does not exist or you do not have access.</p>
            <Button asChild className="mt-4 rounded-full bg-lime-400 px-6 text-black hover:bg-lime-300">
              <Link to="/manager">Back to Projects</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initialProjectFormValues = {
    title: project.title,
    description: project.description || '',
    client_id: project.client_id,
    due_date: project.due_date ? new Date(project.due_date) : null,
    notes: project.notes || '',
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-neutral-950">
      <Card className="w-full max-w-4xl shadow-lg mt-8 mb-8 bg-neutral-900 rounded-2xl glass-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild className="text-lime-300 hover:text-lime-400">
              <Link to="/manager" className="flex items-center">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Projects
              </Link>
            </Button>
            <CardTitle className="text-3xl font-bold text-white/90 text-center flex-grow">
              {project.title}
            </CardTitle>
            <div className="flex items-center gap-2">
              {canManageProjects && (
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="bg-neutral-800 text-lime-300 hover:bg-neutral-700 border-neutral-700">
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit Project</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-neutral-900 text-white/90 rounded-2xl glass-border border-neutral-800">
                    <DialogHeader>
                      <DialogTitle className="text-white/90">Edit Project</DialogTitle>
                      <DialogDescription className="text-white/70">
                        Make changes to the project details here. Click save when you're done.
                      </DialogDescription>
                    </DialogHeader>
                    <EditProjectForm
                      projectId={project.id}
                      initialData={initialProjectFormValues}
                      onProjectUpdated={handleProjectDetailsUpdated}
                      onClose={() => setIsEditDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              )}
              {canDeleteProject && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" className="bg-destructive text-destructive-foreground hover:bg-destructive/90 border-destructive">
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete Project</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-neutral-900 text-white/90 rounded-2xl glass-border border-neutral-800">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white/90">Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription className="text-white/70">
                        This action cannot be undone. This will permanently delete the project
                        "{project.title}" and all associated tasks and status history.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-full bg-neutral-800 text-white/70 hover:bg-neutral-700 border-neutral-700">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteProject} className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
          <p className="text-lg text-white/70 text-center">
            Client: {project.profiles ? `${project.profiles.first_name} ${project.profiles.last_name}` : 'N/A'}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {project.description && (
            <div>
              <h4 className="text-md font-semibold text-white/90">Description:</h4>
              <p className="text-white/70">{project.description}</p>
            </div>
          )}
          <div>
            <h4 className="text-md font-semibold text-white/90">Current Status:</h4>
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium capitalize text-lime-300">
                {project.current_status}
              </span>
              {canManageProjects && (
                <UpdateProjectStatusForm
                  projectId={project.id}
                  currentStatus={project.current_status}
                  onStatusUpdated={handleProjectStatusUpdated}
                />
              )}
            </div>
          </div>
          {project.due_date && (
            <div>
              <h4 className="text-md font-semibold text-white/90">Due Date:</h4>
              <p className="text-white/70">{format(new Date(project.due_date), 'PPP')}</p>
            </div>
          )}
          {project.notes && (
            <div>
              <h4 className="text-md font-semibold text-white/90">Notes:</h4>
              <p className="text-white/70">{project.notes}</p>
            </div>
          )}

          <div className="border-t border-neutral-800 pt-6 mt-6">
            <ProjectStatusHistory projectId={project.id} />
          </div>

          {canManageProjects && (
            <div className="border-t border-neutral-800 pt-6 mt-6">
              <h3 className="text-xl font-semibold mb-4 text-white/90">Add New Task for this Project</h3>
              <AddTaskForm onTaskAdded={handleTaskAdded} defaultProjectId={project.id} />
            </div>
          )}

          <div className="border-t border-neutral-800 pt-6 mt-6">
            <h3 className="text-xl font-semibold mb-4 text-white/90">Tasks for this Project</h3>
            <TaskList refreshTrigger={taskRefreshTrigger} filterByProjectId={project.id} onTaskUpdated={handleTaskAdded} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectDetailsPage;