"use client";

import React, { useState } from 'react';
import { Bid, BidStatus, ProjectPhase } from '@/types';
import { Button, Input, Textarea } from '@/components/ui';

interface BidFormProps {
  initialData?: Partial<Bid>;
  phases: ProjectPhase[];
  projectId: string;
  subId: string;
  onSubmit: (data: Omit<Bid, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

export default function BidForm({ initialData, phases, projectId, subId, onSubmit, onCancel }: BidFormProps) {
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [laborCost, setLaborCost] = useState(initialData?.laborCost?.toString() || '');
  const [materialCost, setMaterialCost] = useState(initialData?.materialCost?.toString() || '');
  const [timeline, setTimeline] = useState(initialData?.timeline || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [phaseIds, setPhaseIds] = useState<string[]>(initialData?.phaseIds || []);
  const [proposedStartDate, setProposedStartDate] = useState(
    initialData?.proposedStartDate ? initialData.proposedStartDate.toISOString().split('T')[0] : ''
  );
  const [proposedEndDate, setProposedEndDate] = useState(
    initialData?.proposedEndDate ? initialData.proposedEndDate.toISOString().split('T')[0] : ''
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    setSaving(true);
    try {
      await onSubmit({
        projectId,
        subId,
        phaseIds: phaseIds.length > 0 ? phaseIds : undefined,
        amount: parseFloat(amount),
        laborCost: laborCost ? parseFloat(laborCost) : undefined,
        materialCost: materialCost ? parseFloat(materialCost) : undefined,
        proposedStartDate: proposedStartDate ? new Date(proposedStartDate) : undefined,
        proposedEndDate: proposedEndDate ? new Date(proposedEndDate) : undefined,
        timeline: timeline.trim() || undefined,
        description: description.trim() || undefined,
        status: initialData?.status || 'draft',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Total Bid Amount ($)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required min={0} step="0.01" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Labor Cost ($)" type="number" value={laborCost} onChange={(e) => setLaborCost(e.target.value)} min={0} step="0.01" />
        <Input label="Material Cost ($)" type="number" value={materialCost} onChange={(e) => setMaterialCost(e.target.value)} min={0} step="0.01" />
      </div>
      <Input label="Timeline" value={timeline} onChange={(e) => setTimeline(e.target.value)} placeholder="e.g. 2 weeks" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Proposed Start" type="date" value={proposedStartDate} onChange={(e) => setProposedStartDate(e.target.value)} />
        <Input label="Proposed End" type="date" value={proposedEndDate} onChange={(e) => setProposedEndDate(e.target.value)} />
      </div>
      <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />

      {phases.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phases</label>
          <div className="space-y-1 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
            {phases.map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={phaseIds.includes(p.id)}
                  onChange={(e) => {
                    if (e.target.checked) setPhaseIds([...phaseIds, p.id]);
                    else setPhaseIds(phaseIds.filter(id => id !== p.id));
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
        <Button variant="secondary" size="sm" type="button" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" size="sm" type="submit" disabled={saving || !amount}>
          {saving ? 'Saving...' : initialData?.id ? 'Update Bid' : 'Submit Bid'}
        </Button>
      </div>
    </form>
  );
}
