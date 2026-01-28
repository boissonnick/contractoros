"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ProjectPhase, PhaseStatus } from '@/types';
import { cn } from '@/lib/utils';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { toast } from '@/components/ui';

interface PhaseProgressBarProps {
  phases: ProjectPhase[];
  onPhaseClick?: (phase: ProjectPhase) => void;
  activePhaseId?: string;
  projectId?: string;
  onPhasesChange?: (phases: ProjectPhase[]) => void;
}

const PHASE_ACTIONS: { status: PhaseStatus; label: string; color: string }[] = [
  { status: 'active', label: 'Mark Active', color: 'text-blue-600' },
  { status: 'completed', label: 'Mark Completed', color: 'text-green-600' },
  { status: 'skipped', label: 'Skip Phase', color: 'text-gray-500' },
  { status: 'upcoming', label: 'Reset to Upcoming', color: 'text-gray-700' },
];

export default function PhaseProgressBar({
  phases,
  onPhaseClick,
  activePhaseId,
  projectId,
  onPhasesChange,
}: PhaseProgressBarProps) {
  const sorted = [...phases].sort((a, b) => a.order - b.order);
  const [menuPhaseId, setMenuPhaseId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
      // If marking active, ensure only one phase is active
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

      // Write all updates
      await Promise.all(
        updates.map(u =>
          updateDoc(doc(db, 'projects', projectId, 'phases', u.id), {
            status: u.status,
            updatedAt: Timestamp.now(),
          })
        )
      );

      // Update local state
      const updatedPhases = phases.map(p => {
        const update = updates.find(u => u.id === p.id);
        return update ? { ...p, status: update.status } : p;
      });
      onPhasesChange(updatedPhases);
      toast.success(`Phase updated`);
    } catch (error) {
      console.error('Error updating phase:', error);
      toast.error('Failed to update phase');
    }
  };

  const handleContextMenu = (e: React.MouseEvent, phaseId: string) => {
    if (!projectId || !onPhasesChange) return;
    e.preventDefault();
    setMenuPhaseId(menuPhaseId === phaseId ? null : phaseId);
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center min-w-max px-2 py-4">
        {sorted.map((phase, index) => {
          const isActive = activePhaseId ? phase.id === activePhaseId : phase.status === 'active';
          const isCompleted = phase.status === 'completed';
          const isSkipped = phase.status === 'skipped';
          const showMenu = menuPhaseId === phase.id;

          return (
            <React.Fragment key={phase.id}>
              <div className="relative">
                <button
                  onClick={() => onPhaseClick?.(phase)}
                  onContextMenu={(e) => handleContextMenu(e, phase.id)}
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
                  {/* Budget indicator */}
                  {phase.budgetAmount != null && phase.budgetAmount > 0 && (
                    <span className={cn(
                      'text-[10px] leading-none',
                      (phase.actualCost || 0) > phase.budgetAmount ? 'text-red-500' : 'text-gray-400'
                    )}>
                      ${Math.round((phase.actualCost || 0) / 1000)}k / ${Math.round(phase.budgetAmount / 1000)}k
                    </span>
                  )}
                  {/* Date range */}
                  {phase.startDate && (
                    <span className="text-[10px] text-gray-400 leading-none">
                      {phase.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {phase.endDate && ` – ${phase.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                    </span>
                  )}
                  {/* Team count */}
                  {(phase.assignedTeamMembers?.length > 0 || phase.assignedSubcontractors?.length > 0) && (
                    <span className="text-[10px] text-gray-400 leading-none">
                      {(phase.assignedTeamMembers?.length || 0) + (phase.assignedSubcontractors?.length || 0)} people
                    </span>
                  )}
                </button>

                {/* Context menu */}
                {showMenu && (
                  <div
                    ref={menuRef}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 min-w-[160px]"
                  >
                    {PHASE_ACTIONS
                      .filter(a => a.status !== phase.status)
                      .map((action) => (
                        <button
                          key={action.status}
                          onClick={() => handlePhaseStatusChange(phase.id, action.status)}
                          className={cn(
                            'w-full text-left px-4 py-2 text-sm hover:bg-gray-50',
                            action.color
                          )}
                        >
                          {action.label}
                        </button>
                      ))}
                  </div>
                )}
              </div>
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
      {projectId && onPhasesChange && (
        <p className="text-xs text-gray-400 text-center mt-1">Right-click a phase to change its status</p>
      )}
    </div>
  );
}
