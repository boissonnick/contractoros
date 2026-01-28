"use client";

import React, { useState } from 'react';
import { ProjectPhase, PhaseDocument, PhaseMilestone } from '@/types';
import { Button } from '@/components/ui';
import { XMarkIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import PhaseBudget from './PhaseBudget';
import PhaseTeamAssignment from './PhaseTeamAssignment';
import PhaseDocuments from './PhaseDocuments';
import PhaseMilestones from './PhaseMilestones';
import PhaseForm from './PhaseForm';
import { formatDate } from '@/lib/date-utils';

type Tab = 'details' | 'budget' | 'team' | 'docs' | 'milestones';

const TABS: { id: Tab; label: string }[] = [
  { id: 'details', label: 'Details' },
  { id: 'budget', label: 'Budget' },
  { id: 'team', label: 'Team' },
  { id: 'docs', label: 'Documents' },
  { id: 'milestones', label: 'Milestones' },
];

interface PhaseDetailModalProps {
  phase: ProjectPhase;
  projectId: string;
  allPhases: ProjectPhase[];
  onClose: () => void;
  onUpdate: (phaseId: string, data: Partial<ProjectPhase>) => Promise<void>;
  onDelete: (phaseId: string) => Promise<void>;
}

const STATUS_LABELS: Record<string, string> = {
  upcoming: 'Upcoming',
  active: 'Active',
  completed: 'Completed',
  skipped: 'Skipped',
};

export default function PhaseDetailModal({ phase, projectId, allPhases, onClose, onUpdate, onDelete }: PhaseDetailModalProps) {
  const [tab, setTab] = useState<Tab>('details');
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleFormSubmit = async (data: Omit<ProjectPhase, 'id' | 'createdAt' | 'updatedAt' | 'progressPercent' | 'tasksTotal' | 'tasksCompleted'>) => {
    await onUpdate(phase.id, data);
    setEditing(false);
  };

  const handleDelete = async () => {
    await onDelete(phase.id);
    onClose();
  };

  const taskPct = phase.tasksTotal > 0 ? Math.round((phase.tasksCompleted / phase.tasksTotal) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{phase.name}</h2>
            <p className="text-sm text-gray-500">{STATUS_LABELS[phase.status]} · {taskPct}% complete</p>
          </div>
          <div className="flex items-center gap-1">
            {!editing && (
              <>
                <button onClick={() => setEditing(true)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button onClick={() => setConfirmDelete(true)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100">
                  <TrashIcon className="h-4 w-4" />
                </button>
              </>
            )}
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        {!editing && (
          <div className="flex border-b border-gray-200 px-5">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                  tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {editing ? (
            <PhaseForm
              initialData={phase}
              allPhases={allPhases}
              projectId={projectId}
              onSubmit={handleFormSubmit}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              {tab === 'details' && (
                <div className="space-y-4">
                  {phase.description && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Description</p>
                      <p className="text-sm text-gray-700">{phase.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Start Date</p>
                      <p className="text-sm text-gray-900">{formatDate(phase.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">End Date</p>
                      <p className="text-sm text-gray-900">{formatDate(phase.endDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Est. Duration</p>
                      <p className="text-sm text-gray-900">{phase.estimatedDuration ? `${phase.estimatedDuration} days` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Tasks</p>
                      <p className="text-sm text-gray-900">{phase.tasksCompleted} / {phase.tasksTotal}</p>
                    </div>
                  </div>
                  {phase.dependencies.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Dependencies</p>
                      <div className="flex flex-wrap gap-1">
                        {phase.dependencies.map((depId) => {
                          const dep = allPhases.find(p => p.id === depId);
                          return (
                            <span key={depId} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                              {dep?.name || depId}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {/* Progress bar */}
                  <div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', phase.status === 'completed' ? 'bg-green-500' : 'bg-blue-500')}
                        style={{ width: `${taskPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
              {tab === 'budget' && <PhaseBudget phase={phase} />}
              {tab === 'team' && (
                <PhaseTeamAssignment
                  phase={phase}
                  onUpdate={(data) => onUpdate(phase.id, data)}
                />
              )}
              {tab === 'docs' && (
                <PhaseDocuments
                  phase={phase}
                  projectId={projectId}
                  onUpdate={(documents) => onUpdate(phase.id, { documents })}
                />
              )}
              {tab === 'milestones' && (
                <PhaseMilestones
                  phase={phase}
                  onUpdate={(milestones) => onUpdate(phase.id, { milestones })}
                />
              )}
            </>
          )}
        </div>

        {/* Delete confirmation */}
        {confirmDelete && (
          <div className="px-5 py-4 border-t border-gray-200 bg-red-50">
            <p className="text-sm text-red-700 mb-3">Delete this phase? This cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleDelete} className="!bg-red-600 hover:!bg-red-700">
                Delete Phase
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
