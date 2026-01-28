"use client";

import React from 'react';
import { cn } from '@/lib/utils';

export type GanttViewMode = 'Day' | 'Week' | 'Month';

const viewModes: { id: GanttViewMode; label: string }[] = [
  { id: 'Day', label: 'Day' },
  { id: 'Week', label: 'Week' },
  { id: 'Month', label: 'Month' },
];

interface GanttToolbarProps {
  viewMode: GanttViewMode;
  onViewModeChange: (mode: GanttViewMode) => void;
  taskCount: number;
}

export default function GanttToolbar({ viewMode, onViewModeChange, taskCount }: GanttToolbarProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm text-gray-500">
        {taskCount} task{taskCount !== 1 ? 's' : ''} on timeline
      </span>
      <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
        {viewModes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onViewModeChange(mode.id)}
            className={cn(
              'px-3 py-1 rounded-md text-xs font-medium transition-colors',
              viewMode === mode.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
}
