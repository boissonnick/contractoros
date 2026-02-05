"use client";

import React from 'react';
import { TaskStatus, TaskPriority } from '@/types';
import { cn } from '@/lib/utils';
import { XMarkIcon } from '@heroicons/react/24/outline';

export interface TaskFilterState {
  status: TaskStatus[];
  priority: TaskPriority[];
  assignedTo: string[];
  trade: string;
  phaseId: string;
  search: string;
}

export const emptyFilters: TaskFilterState = {
  status: [],
  priority: [],
  assignedTo: [],
  trade: '',
  phaseId: '',
  search: '',
};

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'pending', label: 'To Do' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'review', label: 'Review' },
  { value: 'completed', label: 'Done' },
];

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

interface TaskFiltersProps {
  filters: TaskFilterState;
  onChange: (filters: TaskFilterState) => void;
  phases?: { id: string; name: string }[];
  teamMembers?: { uid: string; displayName: string }[];
  trades?: string[];
}

export default function TaskFilters({
  filters,
  onChange,
  phases = [],
  teamMembers = [],
  trades = [],
}: TaskFiltersProps) {
  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.priority.length > 0 ||
    filters.assignedTo.length > 0 ||
    filters.trade !== '' ||
    filters.phaseId !== '' ||
    filters.search !== '';

  const toggleArrayFilter = <T extends string>(
    key: 'status' | 'priority' | 'assignedTo',
    value: T
  ) => {
    const arr = filters[key] as T[];
    const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
    onChange({ ...filters, [key]: next });
  };

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
        />
        {hasActiveFilters && (
          <button
            onClick={() => onChange(emptyFilters)}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 px-2 py-1.5"
          >
            <XMarkIcon className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-4">
        {/* Phase */}
        {phases.length > 0 && (
          <div>
            <span className="text-xs font-medium text-gray-500 block mb-1">Phase</span>
            <select
              value={filters.phaseId}
              onChange={(e) => onChange({ ...filters, phaseId: e.target.value })}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            >
              <option value="">All phases</option>
              {phases.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Status chips */}
        <div>
          <span className="text-xs font-medium text-gray-500 block mb-1">Status</span>
          <div className="flex flex-wrap gap-1">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggleArrayFilter('status', opt.value)}
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium transition-colors',
                  filters.status.includes(opt.value)
                    ? 'bg-brand-100 text-brand-primary'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Priority chips */}
        <div>
          <span className="text-xs font-medium text-gray-500 block mb-1">Priority</span>
          <div className="flex flex-wrap gap-1">
            {priorityOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggleArrayFilter('priority', opt.value)}
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium transition-colors',
                  filters.priority.includes(opt.value)
                    ? 'bg-brand-100 text-brand-primary'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Assignee */}
        {teamMembers.length > 0 && (
          <div>
            <span className="text-xs font-medium text-gray-500 block mb-1">Assignee</span>
            <div className="flex flex-wrap gap-1">
              {teamMembers.map((m) => (
                <button
                  key={m.uid}
                  onClick={() => toggleArrayFilter('assignedTo', m.uid)}
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium transition-colors',
                    filters.assignedTo.includes(m.uid)
                      ? 'bg-brand-100 text-brand-primary'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {m.displayName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Trade */}
        {trades.length > 0 && (
          <div>
            <span className="text-xs font-medium text-gray-500 block mb-1">Trade</span>
            <select
              value={filters.trade}
              onChange={(e) => onChange({ ...filters, trade: e.target.value })}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            >
              <option value="">All trades</option>
              {trades.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
