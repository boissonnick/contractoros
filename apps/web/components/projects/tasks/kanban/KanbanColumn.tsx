"use client";

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Task, TaskStatus } from '@/types';
import { cn } from '@/lib/utils';
import KanbanCard from './KanbanCard';

export interface ColumnConfig {
  id: TaskStatus;
  title: string;
  color: string;
  bgColor: string;
}

interface KanbanColumnProps {
  column: ColumnConfig;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export default function KanbanColumn({ column, tasks, onTaskClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'column', status: column.id },
  });

  return (
    <div
      className={cn(
        'rounded-xl p-3 min-h-[300px] flex flex-col',
        column.bgColor,
        isOver && 'ring-2 ring-blue-400 ring-inset'
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn('w-2.5 h-2.5 rounded-full', column.color)} />
          <h3 className="font-medium text-sm text-gray-700">{column.title}</h3>
        </div>
        <span className="text-xs text-gray-500 bg-white/60 rounded-full px-2 py-0.5 font-medium">
          {tasks.length}
        </span>
      </div>

      {/* Sortable cards */}
      <div ref={setNodeRef} className="flex-1 space-y-2">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onClick={onTaskClick} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="text-center py-8 text-xs text-gray-400">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}
