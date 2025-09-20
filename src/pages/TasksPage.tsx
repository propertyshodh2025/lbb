"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from '@/components/SessionContextProvider';
import { Skeleton } from '@/components/ui/skeleton';
import AddTaskForm from '@/components/AddTaskForm';
import KanbanBoard from '@/components/KanbanBoard';
import TaskList from '@/components/TaskList';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowUpNarrowWide, ArrowDownNarrowWide, Search, CalendarIcon, LayoutGrid, List } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  title: string;
}

interface Editor {
  id: string;
  first_name: string;
  last_name: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  created_at: string;
  project_id: string | null;
  assigned_to: string | null;
  projects: { title: string } | null;
  profiles: { id: string; first_name: string; last_name: string; role: string } | null;
}

const TASK_STATUSES_FILTER = ['all', 'Raw files received', 'Unassigned', 'Assigned', 'In Progress', 'Completed', 'Under Review'];
const SORT_OPTIONS = [
  { value: 'created_at', label: 'Created Date' },
  { value: 'updated_at', label: 'Last Updated' },
  { value: 'title', label: 'Title' },
  { value: 'status', label: 'Status' },
  { value: 'due_date', label: 'Due Date' },
];

const TasksPage = () => {
  const { profile, isLoading: isSessionLoading, user } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTasksLoading, setIsTasksLoading] = useState(true);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [editors, setEditors] = useState<Editor[]>([]);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('all');
  const [selectedAssignedToFilter, setSelectedAssignedToFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDueDate, setSelectedDueDate] = useState<Date | undefined>(undefined);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const canViewTasks = !isSessionLoading && (profile?.role === 'admin' || profile?.role === 'manager' || profile?.role === 'editor');
  const canAddTasks = !isSessionLoading && (profile?.role === 'admin' || profile?.role === 'manager');

  const fetchTasksAndFilters = async () => {
    if (!canViewTasks) return;

    setIsTasksLoading(true);

    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('id, title')
      .order('title', { ascending: true });

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      showError('Failed to load projects for filter.');
    } else {
      setProjects(projectsData || []);
    }

    const { data: editorsData, error: editorsError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('role', 'editor');

    if (editorsError) {
      console.error('Error fetching editors:', editorsError);
      showError('Failed to load editors for filter.');
    } else {
      setEditors(editorsData || []);
    }

    let query = supabase
      .from('tasks')
      .select(`
        id,
        title,
        description,
        status,
        due_date,
        created_at,
        project_id,
        assigned_to,
        projects (title),
        profiles (id, first_name, last_name, role)
      `);

    if (selectedAssignedToFilter !== 'all') {
      if (selectedAssignedToFilter === 'unassigned') {
        query = query.is('assigned_to', null);
      } else {
        query = query.eq('assigned_to', selectedAssignedToFilter);
      }
    }
    if (selectedProjectFilter !== 'all') {
      query = query.eq('project_id', selectedProjectFilter);
    }
    if (selectedStatusFilter !== 'all') {
      query = query.eq('status', selectedStatusFilter);
    }
    if (selectedDueDate) {
      const formattedDate = format(selectedDueDate, 'yyyy-MM-dd');
      query = query.eq('due_date', formattedDate);
    }

    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data: tasksData, error: tasksError } = await query;

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      showError('Failed to load tasks.');
      setTasks([]);
    } else {
      const filteredBySearch = tasksData?.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.projects?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.profiles?.first_name && task.profiles.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (task.profiles?.last_name && task.profiles.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
      ) || [];
      setTasks(filteredBySearch);
    }
    setIsTasksLoading(false);
  };

  useEffect(() => {
    fetchTasksAndFilters();
  }, [
    isSessionLoading,
    profile,
    selectedStatusFilter,
    selectedProjectFilter,
    selectedAssignedToFilter,
    searchTerm,
    selectedDueDate,
    sortBy,
    sortOrder,
    isAddTaskDialogOpen
  ]);

  const handleTaskAdded = () => {
    fetchTasksAndFilters();
    setIsAddTaskDialogOpen(false);
  };

  const handleTaskUpdated = () => {
    fetchTasksAndFilters();
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const kanbanColumns = [
    {
      id: 'raw-files-unassigned',
      title: 'Raw Files / Unassigned',
      statusMap: ['Raw files received', 'Unassigned'],
      assignedToId: null,
      color: 'bg-neutral-800 border-lime-400/30 border-2',
    },
    ...editors.map(editor => ({
      id: editor.id,
      title: `${editor.first_name} ${editor.last_name}`,
      statusMap: ['Assigned', 'In Progress', 'Under Review'],
      assignedToId: editor.id,
      color: 'bg-neutral-900',
    })),
    {
      id: 'completed',
      title: 'Completed',
      statusMap: ['Completed'],
      color: 'bg-neutral-900',
    },
  ];

  if (isSessionLoading || isTasksLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-neutral-950">
        <Card className="w-full max-w-6xl bg-neutral-900 rounded-2xl glass-border">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2 bg-neutral-700" />
            <Skeleton className="h-4 w-1/2 bg-neutral-700" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full bg-neutral-700" />
            <Skeleton className="h-20 w-full bg-neutral-700" />
            <div className="flex gap-4 overflow-hidden">
              <Skeleton className="h-64 w-1/3 bg-neutral-700" />
              <Skeleton className="h-64 w-1/3 bg-neutral-700" />
              <Skeleton className="h-64 w-1/3 bg-neutral-700" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canViewTasks) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-neutral-950">
        <Card className="w-full max-w-md text-center bg-neutral-900 rounded-2xl glass-border">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-destructive-foreground">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/70">You do not have permission to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-neutral-950">
      <Card className="w-full max-w-6xl shadow-lg mt-8 mb-8 bg-neutral-900 rounded-2xl glass-border">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-white/90">Task Management</CardTitle>
          <p className="text-lg text-white/70">View, filter, and manage all tasks.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            {canAddTasks && (
              <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-full bg-lime-400 px-6 text-black hover:bg-lime-300">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-neutral-900 text-white/90 rounded-2xl glass-border border-neutral-800">
                  <DialogHeader>
                    <DialogTitle className="text-white/90">Add New Task</DialogTitle>
                    <DialogDescription className="text-white/70">
                      Fill in the details to create a new task.
                    </DialogDescription>
                  </DialogHeader>
                  <AddTaskForm onTaskAdded={handleTaskAdded} />
                </DialogContent>
              </Dialog>
            )}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'kanban' ? 'secondary' : 'outline'}
                size="icon"
                onClick={() => setViewMode('kanban')}
                title="Kanban View"
                className={cn("rounded-full", viewMode === 'kanban' ? "bg-lime-400 text-black hover:bg-lime-300" : "bg-neutral-800 text-lime-300 hover:bg-neutral-700 border-neutral-700")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
                title="List View"
                className={cn("rounded-full", viewMode === 'list' ? "bg-lime-400 text-black hover:bg-lime-300" : "bg-neutral-800 text-lime-300 hover:bg-neutral-700 border-neutral-700")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-neutral-800 text-white/90 border-neutral-700 focus:ring-lime-400 focus:border-lime-400 rounded-full"
              />
            </div>

            <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
              <SelectTrigger className="bg-neutral-800 text-white/90 border-neutral-700 focus:ring-lime-400 focus:border-lime-400 rounded-full">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 text-white/90 border-neutral-800">
                {TASK_STATUSES_FILTER.map((status) => (
                  <SelectItem key={status} value={status} className="hover:bg-neutral-800 focus:bg-neutral-800">
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedProjectFilter} onValueChange={setSelectedProjectFilter}>
              <SelectTrigger className="bg-neutral-800 text-white/90 border-neutral-700 focus:ring-lime-400 focus:border-lime-400 rounded-full">
                <SelectValue placeholder="Filter by Project" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 text-white/90 border-neutral-800">
                <SelectItem value="all" className="hover:bg-neutral-800 focus:bg-neutral-800">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id} className="hover:bg-neutral-800 focus:bg-neutral-800">
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedAssignedToFilter} onValueChange={setSelectedAssignedToFilter}>
              <SelectTrigger className="bg-neutral-800 text-white/90 border-neutral-700 focus:ring-lime-400 focus:border-lime-400 rounded-full">
                <SelectValue placeholder="Filter by Editor" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 text-white/90 border-neutral-800">
                <SelectItem value="all" className="hover:bg-neutral-800 focus:bg-neutral-800">All Editors</SelectItem>
                <SelectItem value="unassigned" className="hover:bg-neutral-800 focus:bg-neutral-800">Unassigned</SelectItem>
                {editors.map((editor) => (
                  <SelectItem key={editor.id} value={editor.id} className="hover:bg-neutral-800 focus:bg-neutral-800">
                    {editor.first_name} {editor.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm font-medium text-white/70">Sort By:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] bg-neutral-800 text-white/90 border-neutral-700 focus:ring-lime-400 focus:border-lime-400 rounded-full">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 text-white/90 border-neutral-800">
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="hover:bg-neutral-800 focus:bg-neutral-800">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={toggleSortOrder} className="bg-neutral-800 text-lime-300 hover:bg-neutral-700 border-neutral-700 rounded-full">
              {sortOrder === 'asc' ? <ArrowUpNarrowWide className="h-4 w-4" /> : <ArrowDownNarrowWide className="h-4 w-4" />}
              <span className="sr-only">Toggle sort order</span>
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-[200px] justify-start text-left font-normal bg-neutral-800 text-white/90 border-neutral-700 focus:ring-lime-400 focus:border-lime-400 rounded-full',
                    !selectedDueDate && 'text-white/70',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-white/70" />
                  {selectedDueDate ? format(selectedDueDate, 'PPP') : <span>Filter by Due Date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-neutral-900 text-white/90 border-neutral-800 rounded-2xl" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDueDate}
                  onSelect={setSelectedDueDate}
                  initialFocus
                  className="bg-neutral-900 text-white/90"
                />
                {selectedDueDate && (
                  <div className="p-2">
                    <Button variant="ghost" onClick={() => setSelectedDueDate(undefined)} className="w-full rounded-full bg-neutral-800 text-lime-300 hover:bg-neutral-700 border-neutral-700">
                      Clear Date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          <div className="p-6 border border-neutral-800 rounded-2xl bg-neutral-900 glass-border">
            <h3 className="text-xl font-semibold mb-4 text-white/90">
              {viewMode === 'kanban' ? 'Task Kanban Board' : 'All Tasks List'}
            </h3>
            {viewMode === 'kanban' ? (
              <KanbanBoard initialTasks={tasks} columns={kanbanColumns} onTaskMove={handleTaskUpdated} />
            ) : (
              <TaskList
                refreshTrigger={false}
                filterByAssignedTo={selectedAssignedToFilter === 'all' ? null : selectedAssignedToFilter}
                filterByProjectId={selectedProjectFilter === 'all' ? null : selectedProjectFilter}
                filterByStatus={selectedStatusFilter === 'all' ? null : selectedStatusFilter}
                sortBy={sortBy}
                sortOrder={sortOrder as 'asc' | 'desc'}
                onTaskUpdated={handleTaskUpdated}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TasksPage;