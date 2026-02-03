"use client";

import React, { useState, useCallback } from 'react';
import { ScopeChange, ScopeChangeType, ChangeOrderImpact, ProjectPhase } from '@/types';
import { Button, Input, Textarea } from '@/components/ui';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface ChangeOrderFormProps {
  phases: ProjectPhase[];
  onSubmit: (data: {
    title: string;
    description: string;
    reason: string;
    scopeChanges: ScopeChange[];
    impact: ChangeOrderImpact;
  }) => Promise<void>;
  onCancel: () => void;
}

export default function ChangeOrderForm({ phases, onSubmit, onCancel }: ChangeOrderFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');
  const [scopeChanges, setScopeChanges] = useState<ScopeChange[]>([]);
  const [costChange, setCostChange] = useState('');
  const [scheduleChange, setScheduleChange] = useState('');
  const [saving, setSaving] = useState(false);

  const addScopeChange = useCallback(() => {
    setScopeChanges(prev => [...prev, {
      id: Date.now().toString(),
      type: 'add',
      proposedDescription: '',
      costImpact: 0,
    }]);
  }, []);

  const updateScopeChange = useCallback((index: number, updates: Partial<ScopeChange>) => {
    setScopeChanges(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  }, []);

  const removeScopeChange = useCallback((index: number) => {
    setScopeChanges(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !reason.trim()) return;
    setSaving(true);
    try {
      const affectedPhaseIds = Array.from(new Set(scopeChanges.filter(sc => sc.phaseId).map(sc => sc.phaseId!)));
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        reason: reason.trim(),
        scopeChanges,
        impact: {
          costChange: costChange ? parseFloat(costChange) : scopeChanges.reduce((sum, sc) => sum + sc.costImpact, 0),
          scheduleChange: scheduleChange ? parseInt(scheduleChange) : 0,
          affectedPhaseIds,
          affectedTaskIds: [],
        },
      });
    } finally {
      setSaving(false);
    }
  }, [title, description, reason, scopeChanges, costChange, scheduleChange, onSubmit]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Add master bath shower upgrade" />
      <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} required rows={3} />
      <Textarea label="Reason for Change" value={reason} onChange={(e) => setReason(e.target.value)} required rows={2} placeholder="Client request, unforeseen condition, etc." />

      {/* Scope Changes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Scope Changes</label>
          <Button variant="secondary" size="sm" type="button" onClick={addScopeChange} icon={<PlusIcon className="h-3.5 w-3.5" />}>
            Add Change
          </Button>
        </div>
        <div className="space-y-3">
          {scopeChanges.map((sc, i) => (
            <div key={sc.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="flex gap-2">
                <select
                  value={sc.type}
                  onChange={(e) => updateScopeChange(i, { type: e.target.value as ScopeChangeType })}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-28"
                >
                  <option value="add">Add</option>
                  <option value="remove">Remove</option>
                  <option value="modify">Modify</option>
                </select>
                <select
                  value={sc.phaseId || ''}
                  onChange={(e) => updateScopeChange(i, { phaseId: e.target.value || undefined })}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm flex-1"
                >
                  <option value="">No phase</option>
                  {phases.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <button type="button" onClick={() => removeScopeChange(i)} className="p-1.5 text-gray-400 hover:text-red-500">
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
              {sc.type === 'modify' && (
                <Input value={sc.originalDescription || ''} onChange={(e) => updateScopeChange(i, { originalDescription: e.target.value })} placeholder="Original scope description" />
              )}
              <Input value={sc.proposedDescription} onChange={(e) => updateScopeChange(i, { proposedDescription: e.target.value })} placeholder="Proposed change description" />
              <Input
                type="number"
                value={sc.costImpact.toString()}
                onChange={(e) => updateScopeChange(i, { costImpact: parseFloat(e.target.value) || 0 })}
                placeholder="Cost impact ($)"
                step="0.01"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Impact summary */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Total Cost Impact ($)"
          type="number"
          value={costChange || scopeChanges.reduce((sum, sc) => sum + sc.costImpact, 0).toString()}
          onChange={(e) => setCostChange(e.target.value)}
          step="0.01"
        />
        <Input
          label="Schedule Impact (days)"
          type="number"
          value={scheduleChange}
          onChange={(e) => setScheduleChange(e.target.value)}
          placeholder="e.g. 5 or -2"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" size="sm" type="button" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" size="sm" type="submit" disabled={saving || !title.trim()}>
          {saving ? 'Creating...' : 'Create Change Order'}
        </Button>
      </div>
    </form>
  );
}
