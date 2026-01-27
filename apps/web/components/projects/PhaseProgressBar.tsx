"use client";

import React from 'react';
import { ProjectPhase } from '@/types';
import { cn } from '@/lib/utils';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface PhaseProgressBarProps {
  phases: ProjectPhase[];
  onPhaseClick?: (phase: ProjectPhase) => void;
  activePhaseId?: string;
}

export default function PhaseProgressBar({ phases, onPhaseClick, activePhaseId }: PhaseProgressBarProps) {
  const sorted = [...phases].sort((a, b) => a.order - b.order);

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center min-w-max px-2 py-4">
        {sorted.map((phase, index) => {
          const isActive = activePhaseId ? phase.id === activePhaseId : phase.status === 'active';
          const isCompleted = phase.status === 'completed';
          const isSkipped = phase.status === 'skipped';

          return (
            <React.Fragment key={phase.id}>
              <button
                onClick={() => onPhaseClick?.(phase)}
                className={cn(
                  'flex flex-col items-center gap-1.5 min-w-[80px] transition-all',
                  onPhaseClick && 'cursor-pointer hover:scale-105',
                  !onPhaseClick && 'cursor-default'
                )}
              >
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                    isCompleted && 'bg-green-500 text-white',
                    isActive && 'bg-blue-600 text-white ring-2 ring-blue-300 ring-offset-2',
                    isSkipped && 'bg-gray-300 text-gray-500 line-through',
                    !isCompleted && !isActive && !isSkipped && 'bg-gray-200 text-gray-500'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircleIcon className="h-5 w-5" />
                  ) : (
                    phase.order
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium text-center leading-tight max-w-[90px]',
                    isActive && 'text-blue-700',
                    isCompleted && 'text-green-700',
                    isSkipped && 'text-gray-400 line-through',
                    !isActive && !isCompleted && !isSkipped && 'text-gray-500'
                  )}
                >
                  {phase.name}
                </span>
              </button>
              {index < sorted.length - 1 && (
                <div
                  className={cn(
                    'flex-shrink-0 w-8 h-0.5 mx-1',
                    isCompleted ? 'bg-green-400' : 'bg-gray-200'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
