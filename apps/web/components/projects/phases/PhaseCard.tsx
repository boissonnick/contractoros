"use client";

import React from 'react';
import { ProjectPhase } from '@/types';
import { cn } from '@/lib/utils';
import {
  CalendarDaysIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

interface PhaseCardProps {
  phase: ProjectPhase;
  onClick?: (phase: ProjectPhase) => void;
}

import { formatDate } from '@/lib/date-utils';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  upcoming: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Upcoming' },
  active: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Active' },
  completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
  skipped: { bg: 'bg-gray-100', text: 'text-gray-400', label: 'Skipped' },
};

function formatCurrency(n?: number): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function PhaseCard({ phase, onClick }: PhaseCardProps) {
  const style = STATUS_STYLES[phase.status] || STATUS_STYLES.upcoming;
  const taskPct = phase.tasksTotal > 0 ? Math.round((phase.tasksCompleted / phase.tasksTotal) * 100) : 0;
  const _budgetPct = phase.budgetAmount ? Math.round(((phase.actualCost || 0) / phase.budgetAmount) * 100) : 0;
  const teamCount = phase.assignedTeamMembers.length + phase.assignedSubcontractors.length;

  return (
    <div
      onClick={() => onClick?.(phase)}
      className={cn(
        'border border-gray-200 rounded-xl p-4 bg-white hover:shadow-md transition-shadow',
        onClick && 'cursor-pointer'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{phase.name}</h3>
          {phase.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{phase.description}</p>
          )}
        </div>
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full ml-2', style.bg, style.text)}>
          {style.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>{phase.tasksCompleted}/{phase.tasksTotal} tasks</span>
          <span>{taskPct}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              phase.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
            )}
            style={{ width: `${taskPct}%` }}
          />
        </div>
      </div>

      {/* Metrics row */}
      <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
        <span className="inline-flex items-center gap-1">
          <CalendarDaysIcon className="h-3.5 w-3.5" />
          {formatDate(phase.startDate, { month: 'short', day: 'numeric' })} – {formatDate(phase.endDate, { month: 'short', day: 'numeric' })}
        </span>

        {phase.budgetAmount != null && (
          <span className="inline-flex items-center gap-1">
            <CurrencyDollarIcon className="h-3.5 w-3.5" />
            {formatCurrency(phase.actualCost || 0)} / {formatCurrency(phase.budgetAmount)}
          </span>
        )}

        {teamCount > 0 && (
          <span className="inline-flex items-center gap-1">
            <UsersIcon className="h-3.5 w-3.5" />
            {teamCount}
          </span>
        )}

        {phase.milestones.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <CheckCircleIcon className="h-3.5 w-3.5" />
            {phase.milestones.filter(m => m.completed).length}/{phase.milestones.length} milestones
          </span>
        )}
      </div>
    </div>
  );
}
