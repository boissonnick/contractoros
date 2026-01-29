"use client";

import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { Task, TaskStatus, ProjectPhase } from '@/types';
import KanbanColumn, { ColumnConfig } from './KanbanColumn';
import TaskCard from '@/components/tasks/TaskCard';

const columns: ColumnConfig[] = [
  { id: 'pending', title: 'To Do', color: 'bg-gray-400', bgColor: 'bg-gray-50' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-500', bgColor: 'bg-blue-50' },
  { id: 'review', title: 'Review', color: 'bg-yellow-500', bgColor: 'bg-yellow-50' },
  { id: 'completed', title: 'Done', color: 'bg-green-500', bgColor: 'bg-green-50' },
];

interface TaskKanbanProps {
  tasks: Task[];
  phases?: ProjectPhase[];
  onTaskClick: (task: Task) => void;
  onMoveTask: (taskId: string, newStatus: TaskStatus) => Promise<void>;
}

export default function TaskKanban({ tasks, phases = [], onTaskClick, onMoveTask }: TaskKanbanProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const tasksByStatus = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const col of columns) {
      map[col.id] = [];
    }
    for (const task of tasks) {
      const status = task.status as string;
      if (map[status]) {
        map[status].push(task);
      } else {
        // Tasks with statuses not in columns go to pending
        map['pending'].push(task);
      }
    }
    return map;
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task | undefined;
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overData = over.data.current;

    let newStatus: TaskStatus | undefined;

    if (overData?.type === 'column') {
      newStatus = overData.status as TaskStatus;
    } else if (overData?.type === 'task') {
      // Dropped onto another task — take that task's status
      const overTask = overData.task as Task;
      newStatus = overTask.status;
    }

    if (!newStatus) return;

    // Only move if status actually changed
    const currentTask = tasks.find((t) => t.id === taskId);
    if (currentTask && currentTask.status !== newStatus) {
      onMoveTask(taskId, newStatus);
    }
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // Could implement cross-column preview here if needed
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasksByStatus[column.id] || []}
            phases={phases}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>

      {/* Drag overlay — shows the card being dragged */}
      <DragOverlay>
        {activeTask ? (
          <div className="rotate-2 scale-105">
            <TaskCard
              task={activeTask}
              phaseName={phases.find(p => p.id === activeTask.phaseId)?.name}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
