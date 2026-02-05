'use client';

import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ClockIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export interface TimelinePhase {
  id: string;
  name: string;
  description?: string;
  status: 'completed' | 'current' | 'upcoming';
  startDate?: Date | null;
  endDate?: Date | null;
  completedDate?: Date | null;
}

interface ProjectTimelineProps {
  phases: TimelinePhase[];
  className?: string;
}

export function ProjectTimeline({ phases, className }: ProjectTimelineProps) {
  if (phases.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No timeline available yet</p>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

      <div className="space-y-6">
        {phases.map((phase) => {
          const isCompleted = phase.status === 'completed';
          const isCurrent = phase.status === 'current';
          const isUpcoming = phase.status === 'upcoming';

          return (
            <div key={phase.id} className="relative pl-12">
              {/* Status indicator */}
              <div
                className={cn(
                  'absolute left-0 w-8 h-8 rounded-full flex items-center justify-center',
                  'ring-4 ring-white',
                  isCompleted && 'bg-green-500',
                  isCurrent && 'bg-blue-500 animate-pulse',
                  isUpcoming && 'bg-gray-200'
                )}
              >
                {isCompleted ? (
                  <CheckCircleIcon className="w-5 h-5 text-white" />
                ) : isCurrent ? (
                  <div className="w-3 h-3 bg-white rounded-full" />
                ) : (
                  <div className="w-3 h-3 bg-gray-400 rounded-full" />
                )}
              </div>

              {/* Content */}
              <div
                className={cn(
                  'bg-white rounded-lg border p-4 shadow-sm',
                  isCurrent && 'border-blue-300 ring-2 ring-blue-100',
                  isCompleted && 'border-green-200',
                  isUpcoming && 'border-gray-200 opacity-60'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3
                      className={cn(
                        'font-semibold',
                        isCompleted && 'text-green-700',
                        isCurrent && 'text-blue-700',
                        isUpcoming && 'text-gray-500'
                      )}
                    >
                      {phase.name}
                    </h3>
                    {phase.description && (
                      <p className="text-sm text-gray-500 mt-1">{phase.description}</p>
                    )}
                  </div>

                  {/* Status badge */}
                  <span
                    className={cn(
                      'text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap',
                      isCompleted && 'bg-green-100 text-green-700',
                      isCurrent && 'bg-blue-100 text-blue-700',
                      isUpcoming && 'bg-gray-100 text-gray-500'
                    )}
                  >
                    {isCompleted ? 'Completed' : isCurrent ? 'In Progress' : 'Upcoming'}
                  </span>
                </div>

                {/* Dates */}
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                  {phase.startDate && (
                    <span>Started: {format(new Date(phase.startDate), 'MMM d, yyyy')}</span>
                  )}
                  {phase.completedDate && isCompleted && (
                    <span>
                      Completed: {format(new Date(phase.completedDate), 'MMM d, yyyy')}
                    </span>
                  )}
                  {phase.endDate && !isCompleted && (
                    <span>Est. End: {format(new Date(phase.endDate), 'MMM d, yyyy')}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProjectTimeline;
