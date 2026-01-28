"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import {
  Squares2X2Icon,
  ListBulletIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

export type TaskView = 'kanban' | 'list' | 'gantt';

const views: { id: TaskView; label: string; icon: React.ElementType }[] = [
  { id: 'kanban', label: 'Board', icon: Squares2X2Icon },
  { id: 'list', label: 'List', icon: ListBulletIcon },
  { id: 'gantt', label: 'Gantt', icon: ChartBarIcon },
];

interface TaskViewToggleProps {
  active: TaskView;
  onChange: (view: TaskView) => void;
}

export default function TaskViewToggle({ active, onChange }: TaskViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
      {views.map((view) => {
        const Icon = view.icon;
        const isActive = active === view.id;
        return (
          <button
            key={view.id}
            onClick={() => onChange(view.id)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              isActive
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Icon className="h-4 w-4" />
            {view.label}
          </button>
        );
      })}
    </div>
  );
}
