"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ProjectPhase, PhaseStatus } from '@/types';
import { cn } from '@/lib/utils';
import { CheckCircleIcon, PlayIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { toast } from '@/components/ui';
import { formatDate } from '@/lib/date-utils';
import { logger } from '@/lib/utils/logger';

interface PhaseProgressBarProps {
  phases: ProjectPhase[];
  onPhaseClick?: (phase: ProjectPhase) => void;
  activePhaseId?: string;
  projectId?: string;
  onPhasesChange?: (phases: ProjectPhase[]) => void;
  variant?: 'compact' | 'expanded';
}

const STATUS_CONFIG: Record<PhaseStatus, { icon: typeof CheckCircleIcon; label: string; color: string; bgColor: string }> = {
  completed: { icon: CheckCircleIcon, label: 'Completed', color: 'text-green-600', bgColor: 'bg-green-50' },
  active: { icon: PlayIcon, label: 'Active', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  upcoming: { icon: ClockIcon, label: 'Upcoming', color: 'text-gray-500', bgColor: 'bg-gray-50' },
  skipped: { icon: XCircleIcon, label: 'Skipped', color: 'text-gray-400', bgColor: 'bg-gray-50' },
};

const PHASE_ACTIONS: { status: PhaseStatus; label: string; color: string }[] = [
  { status: 'active', label: 'Mark Active', color: 'text-blue-600 hover:bg-blue-50' },
  { status: 'completed', label: 'Mark Completed', color: 'text-green-600 hover:bg-green-50' },
  { status: 'upcoming', label: 'Mark Upcoming', color: 'text-gray-600 hover:bg-gray-50' },
  { status: 'skipped', label: 'Skip Phase', color: 'text-gray-500 hover:bg-gray-50' },
];

export default function PhaseProgressBar({
  phases,
  onPhaseClick,
  activePhaseId,
  projectId,
  onPhasesChange,
  variant = 'compact',
}: PhaseProgressBarProps) {
  const sorted = [...phases].sort((a, b) => a.order - b.order);
  const [menuPhaseId, setMenuPhaseId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const canEdit = Boolean(projectId && onPhasesChange);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuPhaseId(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handlePhaseStatusChange = async (phaseId: string, newStatus: PhaseStatus) => {
    if (!projectId || !onPhasesChange) return;
    setMenuPhaseId(null);

    try {
      const updates: { id: string; status: PhaseStatus }[] = [];

      if (newStatus === 'active') {
        // Set all other active phases to upcoming
        for (const p of phases) {
          if (p.status === 'active' && p.id !== phaseId) {
            updates.push({ id: p.id, status: 'upcoming' });
          }
        }
      }
      updates.push({ id: phaseId, status: newStatus });

      await Promise.all(
        updates.map(u =>
          updateDoc(doc(db, 'projects', projectId, 'phases', u.id), {
            status: u.status,
            updatedAt: Timestamp.now(),
          })
        )
      );

      const updatedPhases = phases.map(p => {
        const update = updates.find(u => u.id === p.id);
        return update ? { ...p, status: update.status } : p;
      });
      onPhasesChange(updatedPhases);
      toast.success(`Phase updated`);
    } catch (error) {
      logger.error('Error updating phase', { error: error, component: 'PhaseProgressBar' });
      toast.error('Failed to update phase');
    }
  };

  // Calculate overall progress
  const completedCount = sorted.filter(p => p.status === 'completed').length;
  const progressPercent = sorted.length > 0 ? Math.round((completedCount / sorted.length) * 100) : 0;

  if (variant === 'expanded') {
    return (
      <div className="space-y-3">
        {/* Progress summary */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Project Phases</span>
            <span className="text-xs text-gray-500">
              {completedCount} of {sorted.length} complete ({progressPercent}%)
            </span>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Phase cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sorted.map((phase) => {
            const isActive = activePhaseId ? phase.id === activePhaseId : phase.status === 'active';
            const config = STATUS_CONFIG[phase.status];
            const StatusIcon = config.icon;
            const showMenu = menuPhaseId === phase.id;

            return (
              <div
                key={phase.id}
                className={cn(
                  'relative p-4 rounded-xl border transition-all',
                  isActive ? 'border-blue-300 bg-blue-50/50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300',
                  onPhaseClick && 'cursor-pointer'
                )}
                onClick={() => onPhaseClick?.(phase)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {/* Phase number */}
                    <div
                      className={cn(
                        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                        phase.status === 'completed' && 'bg-green-500 text-white',
                        phase.status === 'active' && 'bg-blue-600 text-white',
                        phase.status === 'upcoming' && 'bg-gray-200 text-gray-600',
                        phase.status === 'skipped' && 'bg-gray-100 text-gray-400'
                      )}
                    >
                      {phase.status === 'completed' ? (
                        <CheckCircleIcon className="h-5 w-5" />
                      ) : (
                        phase.order
                      )}
                    </div>
                    <div>
                      <h4 className={cn(
                        'font-medium text-sm',
                        phase.status === 'skipped' && 'line-through text-gray-400',
                        phase.status !== 'skipped' && 'text-gray-900'
                      )}>
                        {phase.name}
                      </h4>
                      {/* Status badge */}
                      <span className={cn('text-xs flex items-center gap-1 mt-0.5', config.color)}>
                        <StatusIcon className="h-3 w-3" />
                        {config.label}
                      </span>
                    </div>
                  </div>

                  {/* Actions menu */}
                  {canEdit && (
                    <div className="relative" ref={showMenu ? menuRef : undefined}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuPhaseId(showMenu ? null : phase.id);
                        }}
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        <EllipsisVerticalIcon className="h-5 w-5 text-gray-400" />
                      </button>

                      {showMenu && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 min-w-[140px]">
                          {PHASE_ACTIONS
                            .filter(a => a.status !== phase.status)
                            .map((action) => (
                              <button
                                key={action.status}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePhaseStatusChange(phase.id, action.status);
                                }}
                                className={cn('w-full text-left px-3 py-2 text-sm', action.color)}
                              >
                                {action.label}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Phase details */}
                <div className="mt-3 space-y-1">
                  {phase.startDate && (
                    <p className="text-xs text-gray-500">
                      {formatDate(phase.startDate, { month: 'short', day: 'numeric' })}
                      {phase.endDate && ` – ${formatDate(phase.endDate, { month: 'short', day: 'numeric' })}`}
                    </p>
                  )}
                  {phase.budgetAmount != null && phase.budgetAmount > 0 && (
                    <p className={cn(
                      'text-xs',
                      (phase.actualCost || 0) > phase.budgetAmount ? 'text-red-500' : 'text-gray-500'
                    )}>
                      ${((phase.actualCost || 0) / 1000).toFixed(1)}k / ${(phase.budgetAmount / 1000).toFixed(1)}k budget
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Compact variant - improved horizontal stepper
  return (
    <div className="w-full">
      {/* Progress bar background */}
      <div className="relative">
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full" />
        <div
          className="absolute top-5 left-0 h-1 bg-green-500 rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Phase dots */}
        <div className="relative flex items-start justify-between">
          {sorted.map((phase) => {
            const isActive = activePhaseId ? phase.id === activePhaseId : phase.status === 'active';
            const showMenu = menuPhaseId === phase.id;

            return (
              <div
                key={phase.id}
                className="flex flex-col items-center"
                style={{ flex: '1 1 0' }}
              >
                {/* Clickable dot with menu */}
                <div className="relative" ref={showMenu ? menuRef : undefined}>
                  <button
                    onClick={() => canEdit ? setMenuPhaseId(showMenu ? null : phase.id) : onPhaseClick?.(phase)}
                    className={cn(
                      'relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                      'border-2 border-white shadow-sm',
                      phase.status === 'completed' && 'bg-green-500 text-white',
                      phase.status === 'active' && 'bg-blue-600 text-white ring-2 ring-blue-200',
                      phase.status === 'upcoming' && 'bg-white text-gray-500 border-gray-300',
                      phase.status === 'skipped' && 'bg-gray-100 text-gray-400',
                      (onPhaseClick || canEdit) && 'cursor-pointer hover:scale-110'
                    )}
                  >
                    {phase.status === 'completed' ? (
                      <CheckCircleIcon className="h-5 w-5" />
                    ) : (
                      phase.order
                    )}
                  </button>

                  {/* Dropdown menu */}
                  {showMenu && canEdit && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 min-w-[140px]">
                      {PHASE_ACTIONS
                        .filter(a => a.status !== phase.status)
                        .map((action) => (
                          <button
                            key={action.status}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePhaseStatusChange(phase.id, action.status);
                            }}
                            className={cn('w-full text-left px-3 py-2 text-sm', action.color)}
                          >
                            {action.label}
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* Phase name */}
                <span
                  className={cn(
                    'mt-2 text-xs font-medium text-center max-w-[80px] leading-tight',
                    isActive && 'text-blue-700',
                    phase.status === 'completed' && 'text-green-700',
                    phase.status === 'skipped' && 'text-gray-400 line-through',
                    phase.status === 'upcoming' && 'text-gray-500'
                  )}
                >
                  {phase.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Helper text */}
      {canEdit && (
        <p className="text-xs text-gray-400 text-center mt-4">
          Click a phase to change its status
        </p>
      )}
    </div>
  );
}
