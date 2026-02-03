"use client";

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  CalendarDaysIcon,
  ClockIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export interface PhaseProgress {
  name: string;
  progress: number; // 0-100
  status: 'not_started' | 'in_progress' | 'completed';
  tasksTotal: number;
  tasksCompleted: number;
}

export interface ProjectProgressCardProps {
  projectName: string;
  projectId: string;
  overallProgress: number;
  phases: PhaseProgress[];
  startDate: Date;
  targetEndDate: Date;
  daysRemaining?: number;
  onViewProject?: () => void;
  className?: string;
}

const STATUS_COLORS: Record<PhaseProgress['status'], { bar: string; text: string }> = {
  not_started: { bar: 'bg-gray-200', text: 'text-gray-500' },
  in_progress: { bar: 'bg-blue-500', text: 'text-blue-600' },
  completed: { bar: 'bg-green-500', text: 'text-green-600' },
};

export function ProjectProgressCard({
  projectName,
  projectId,
  overallProgress,
  phases,
  startDate,
  targetEndDate,
  daysRemaining,
  onViewProject,
  className,
}: ProjectProgressCardProps) {
  const circumference = 2 * Math.PI * 36; // r=36
  const strokeDasharray = `${(overallProgress / 100) * circumference} ${circumference}`;

  // Determine days remaining color
  const getDaysRemainingColor = () => {
    if (daysRemaining === undefined) return 'text-gray-500';
    if (daysRemaining < 0) return 'text-red-600';
    if (daysRemaining <= 7) return 'text-orange-600';
    if (daysRemaining <= 14) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getDaysRemainingText = () => {
    if (daysRemaining === undefined) return null;
    if (daysRemaining < 0) return `${Math.abs(daysRemaining)} days overdue`;
    if (daysRemaining === 0) return 'Due today';
    if (daysRemaining === 1) return '1 day remaining';
    return `${daysRemaining} days remaining`;
  };

  const handleClick = () => {
    if (onViewProject) {
      onViewProject();
    }
  };

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <Link
              href={`/dashboard/projects/${projectId}`}
              className="text-base sm:text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate block"
            >
              {projectName}
            </Link>
            {/* Timeline info */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs sm:text-sm text-gray-500">
              <span className="inline-flex items-center gap-1">
                <CalendarDaysIcon className="h-4 w-4" />
                Started: {format(startDate, 'MMM d, yyyy')}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarDaysIcon className="h-4 w-4" />
                Target: {format(targetEndDate, 'MMM d, yyyy')}
              </span>
            </div>
          </div>

          {/* Progress Circle */}
          <div className="flex-shrink-0">
            <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 80 80">
              {/* Background circle */}
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke={overallProgress >= 100 ? '#22C55E' : '#3B82F6'}
                strokeWidth="8"
                strokeDasharray={strokeDasharray}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
                className="transition-all duration-500"
              />
              {/* Percentage text */}
              <text
                x="40"
                y="44"
                textAnchor="middle"
                className="fill-gray-900 text-lg font-bold"
                style={{ fontSize: '16px', fontWeight: 700 }}
              >
                {overallProgress}%
              </text>
            </svg>
          </div>
        </div>

        {/* Days Remaining Badge */}
        {daysRemaining !== undefined && (
          <div className={cn(
            'mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
            daysRemaining < 0 ? 'bg-red-50' :
            daysRemaining <= 7 ? 'bg-orange-50' :
            daysRemaining <= 14 ? 'bg-yellow-50' :
            'bg-green-50',
            getDaysRemainingColor()
          )}>
            <ClockIcon className="h-3.5 w-3.5" />
            {getDaysRemainingText()}
          </div>
        )}
      </div>

      {/* Phase Breakdown */}
      <div className="p-4 sm:p-5">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Phase Breakdown
        </h4>
        <div className="space-y-3">
          {phases.map((phase, index) => {
            const colors = STATUS_COLORS[phase.status];
            return (
              <div key={index} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className={cn(
                    'font-medium truncate',
                    phase.status === 'completed' ? 'text-green-700' :
                    phase.status === 'in_progress' ? 'text-gray-900' :
                    'text-gray-500'
                  )}>
                    {phase.name}
                  </span>
                  <span className={cn('text-xs flex-shrink-0 ml-2', colors.text)}>
                    {phase.tasksCompleted}/{phase.tasksTotal} tasks
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      colors.bar
                    )}
                    style={{ width: `${phase.progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Action */}
      {onViewProject && (
        <div className="px-4 sm:px-5 py-3 bg-gray-50 border-t border-gray-100">
          <button
            onClick={handleClick}
            className="w-full flex items-center justify-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            View Project Details
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default ProjectProgressCard;
