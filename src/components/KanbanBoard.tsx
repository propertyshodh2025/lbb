"use client";

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  UniqueIdentifier,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { useSession } from './SessionContextProvider';

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

interface KanbanColumnData {
  id: string;
  title: string;
  statusMap: string[]; // Array of statuses that belong to this column
  assignedToId?: string | null; // Specific editor ID for this column, or null for unassigned
  color?: string;
}

interface KanbanBoardProps {
  initialTasks: Task[];
  columns: KanbanColumnData[];
  onTaskMove?: () => void; // Callback for when a task is moved
}

const KanbanBoard = ({ initialTasks, columns, onTaskMove }: KanbanBoardProps) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const { profile, isLoading: isSessionLoading } = useSession();

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newColumnId = over.id as string;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newColumn = columns.find(col => col.id === newColumnId);
    if (!newColumn) return;

    const newStatus = newColumn.statusMap[0]; // Use the first status in the map for the new status
    const newAssignedTo = newColumn.assignedToId === undefined ? task.assigned_to : newColumn.assignedToId; // If assignedToId is explicitly set in column, use it, otherwise keep current

    // Prevent unauthorized moves
    const canMove = !isSessionLoading && (profile?.role === 'admin' || profile?.role === 'manager' || (profile?.role === 'editor' && task.assigned_to === profile.id));
    if (!canMove) {
      showError("You don't have permission to move this task.");
      return;
    }

    // If status and assignment haven't changed, do nothing
    if (task.status === newStatus && task.assigned_to === newAssignedTo) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          assigned_to: newAssignedTo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) {
        console.error('Error updating task status/assignment:', error);
        showError('Failed to update task.');
      } else {
        // Insert into task_status_history
        const { error: historyError } = await supabase
          .from('task_status_history')
          .insert({
            task_id: taskId,
            status: newStatus,
            notes: `Task moved to ${newStatus}${newAssignedTo ? ` and assigned to ${newColumn.title}` : ''}`,
            updated_by: profile?.id,
          });

        if (historyError) {
          console.error('Error logging task status history:', historyError);
          // Don't show error to user, as task update was successful
        }

        showSuccess('Task updated successfully!');
        onTaskMove?.(); // Trigger a re-fetch in parent component
      }
    } catch (error) {
      console.error('Unexpected error during task move:', error);
      showError('An unexpected error occurred.');
    }
  };

  const getTasksForColumn = (column: KanbanColumnData) => {
    return tasks.filter(task => {
      const matchesStatus = column.statusMap.includes(task.status);
      const matchesAssignment = column.assignedToId === undefined || task.assigned_to === column.assignedToId;
      return matchesStatus && matchesAssignment;
    });
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            tasks={getTasksForColumn(column)}
            color={column.color}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <TaskCard task={activeTask} isDragging={true} />
        )}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;