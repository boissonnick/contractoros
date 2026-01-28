"use client";

import React, { useState } from 'react';
import { ProjectPhase, PhaseMilestone } from '@/types';
import { Button, Input } from '@/components/ui';
import { PlusIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

interface PhaseMilestonesProps {
  phase: ProjectPhase;
  onUpdate: (milestones: PhaseMilestone[]) => void;
}

export default function PhaseMilestones({ phase, onUpdate }: PhaseMilestonesProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');

  const addMilestone = () => {
    if (!title.trim() || !date) return;
    const ms: PhaseMilestone = {
      id: Date.now().toString(),
      title: title.trim(),
      date: new Date(date),
      completed: false,
    };
    onUpdate([...phase.milestones, ms]);
    setTitle('');
    setDate('');
  };

  const toggleComplete = (id: string) => {
    onUpdate(
      phase.milestones.map((m) =>
        m.id === id
          ? { ...m, completed: !m.completed, completedAt: !m.completed ? new Date() : undefined }
          : m
      )
    );
  };

  const removeMilestone = (id: string) => {
    onUpdate(phase.milestones.filter((m) => m.id !== id));
  };

  const sorted = [...phase.milestones].sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-900">Milestones</h4>

      {sorted.length === 0 && (
        <p className="text-xs text-gray-400">No milestones set.</p>
      )}

      <div className="space-y-2">
        {sorted.map((ms) => (
          <div key={ms.id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
            <button onClick={() => toggleComplete(ms.id)} className="flex-shrink-0">
              {ms.completed ? (
                <CheckCircleSolid className="h-5 w-5 text-green-500" />
              ) : (
                <CheckCircleIcon className="h-5 w-5 text-gray-300" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${ms.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                {ms.title}
              </p>
              <p className="text-xs text-gray-500">
                {ms.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <button onClick={() => removeMilestone(ms.id)} className="p-1 text-gray-400 hover:text-red-500">
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add form */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Milestone title"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMilestone())}
          />
        </div>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-36" />
        <Button variant="secondary" size="sm" onClick={addMilestone} disabled={!title.trim() || !date}>
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
