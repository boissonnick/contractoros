"use client";

import React, { useState } from 'react';
import { ProjectPhase, PhaseStatus } from '@/types';
import { Button, Input, Textarea } from '@/components/ui';

interface PhaseFormProps {
  initialData?: Partial<ProjectPhase>;
  allPhases: ProjectPhase[];
  projectId: string;
  onSubmit: (data: Omit<ProjectPhase, 'id' | 'createdAt' | 'updatedAt' | 'progressPercent' | 'tasksTotal' | 'tasksCompleted'>) => Promise<void>;
  onCancel: () => void;
}

export default function PhaseForm({ initialData, allPhases, projectId, onSubmit, onCancel }: PhaseFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [status, setStatus] = useState<PhaseStatus>(initialData?.status || 'upcoming');
  const [startDate, setStartDate] = useState(initialData?.startDate ? toInputDate(initialData.startDate) : '');
  const [endDate, setEndDate] = useState(initialData?.endDate ? toInputDate(initialData.endDate) : '');
  const [estimatedDuration, setEstimatedDuration] = useState(initialData?.estimatedDuration?.toString() || '');
  const [budgetAmount, setBudgetAmount] = useState(initialData?.budgetAmount?.toString() || '');
  const [dependencies, setDependencies] = useState<string[]>(initialData?.dependencies || []);
  const [saving, setSaving] = useState(false);

  function toInputDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        projectId,
        name: name.trim(),
        description: description.trim() || undefined,
        order: initialData?.order ?? allPhases.length,
        status,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
        budgetAmount: budgetAmount ? parseFloat(budgetAmount) : undefined,
        actualCost: initialData?.actualCost,
        assignedTeamMembers: initialData?.assignedTeamMembers || [],
        assignedSubcontractors: initialData?.assignedSubcontractors || [],
        dependencies,
        documents: initialData?.documents || [],
        milestones: initialData?.milestones || [],
      });
    } finally {
      setSaving(false);
    }
  };

  const otherPhases = allPhases.filter(p => p.id !== initialData?.id);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Phase Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PhaseStatus)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="skipped">Skipped</option>
          </select>
        </div>
        <Input
          label="Est. Duration (days)"
          type="number"
          value={estimatedDuration}
          onChange={(e) => setEstimatedDuration(e.target.value)}
          min={1}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <Input label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>

      <Input
        label="Budget Amount ($)"
        type="number"
        value={budgetAmount}
        onChange={(e) => setBudgetAmount(e.target.value)}
        min={0}
        step="0.01"
      />

      {otherPhases.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dependencies</label>
          <div className="space-y-1 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
            {otherPhases.map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={dependencies.includes(p.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setDependencies([...dependencies, p.id]);
                    } else {
                      setDependencies(dependencies.filter(id => id !== p.id));
                    }
                  }}
                  className="rounded border-gray-300"
                />
                {p.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" size="sm" onClick={onCancel} type="button">Cancel</Button>
        <Button variant="primary" size="sm" type="submit" disabled={saving || !name.trim()}>
          {saving ? 'Saving...' : initialData?.id ? 'Update Phase' : 'Add Phase'}
        </Button>
      </div>
    </form>
  );
}
