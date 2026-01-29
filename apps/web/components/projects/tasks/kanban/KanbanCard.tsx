"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types';
import TaskCard from '@/components/tasks/TaskCard';
import { cn } from '@/lib/utils';

interface KanbanCardProps {
  task: Task;
  onClick: (task: Task) => void;
  phaseName?: string;
}

export default function KanbanCard({ task, onClick, phaseName }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        isDragging && 'opacity-50 z-50'
      )}
    >
      <TaskCard task={task} onClick={onClick} phaseName={phaseName} />
    </div>
  );
}
