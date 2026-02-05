"use client";

import React, { useState } from 'react';
import { ScopeItem, ProjectPhase, Subcontractor } from '@/types';
import { Button, Input, Textarea } from '@/components/ui';

interface BidSolicitationFormProps {
  scopeItems: ScopeItem[];
  phases: ProjectPhase[];
  subs: Subcontractor[];
  projectId: string;
  onSubmit: (data: {
    title: string;
    description?: string;
    scopeItemIds: string[];
    phaseIds: string[];
    trade?: string;
    invitedSubIds: string[];
    deadline: Date;
    projectId: string;
    status: 'open';
  }) => Promise<void>;
  onCancel: () => void;
}

const TRADES = [
  'Electrical', 'Plumbing', 'HVAC', 'Framing', 'Roofing', 'Flooring',
  'Painting', 'Drywall', 'Concrete', 'Landscaping', 'Demolition', 'General',
];

export default function BidSolicitationForm({ scopeItems, phases: _phases, subs, projectId, onSubmit, onCancel }: BidSolicitationFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedScopeIds, setSelectedScopeIds] = useState<string[]>([]);
  const [selectedPhaseIds] = useState<string[]>([]);
  const [trade, setTrade] = useState('');
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);
  const [deadline, setDeadline] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredSubs = trade
    ? subs.filter(s => s.trade.toLowerCase() === trade.toLowerCase() && s.isActive)
    : subs.filter(s => s.isActive);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadline || selectedSubIds.length === 0) return;
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        scopeItemIds: selectedScopeIds,
        phaseIds: selectedPhaseIds,
        trade: trade || undefined,
        invitedSubIds: selectedSubIds,
        deadline: new Date(deadline),
        projectId,
        status: 'open',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleScopeItem = (id: string) => {
    setSelectedScopeIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSub = (id: string) => {
    setSelectedSubIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g., Electrical Phase 1 Bid Request" />
      <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Scope details, requirements..." />

      {/* Trade filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Trade</label>
        <select value={trade} onChange={(e) => setTrade(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All trades</option>
          {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Scope items */}
      {scopeItems.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Scope Items to Include</label>
          <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y">
            {scopeItems.map(item => (
              <label key={item.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm">
                <input type="checkbox" checked={selectedScopeIds.includes(item.id)} onChange={() => toggleScopeItem(item.id)} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                <span>{item.title}</span>
                {item.estimatedCost && <span className="ml-auto text-xs text-gray-400">${item.estimatedCost.toLocaleString()}</span>}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Invite subs */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Invite Subcontractors ({filteredSubs.length} available{trade && ` in ${trade}`})
        </label>
        {filteredSubs.length === 0 ? (
          <p className="text-xs text-gray-400">No matching subcontractors found.</p>
        ) : (
          <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y">
            {filteredSubs.map(sub => (
              <label key={sub.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm">
                <input type="checkbox" checked={selectedSubIds.includes(sub.id)} onChange={() => toggleSub(sub.id)} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                <div>
                  <span className="font-medium">{sub.companyName}</span>
                  <span className="text-gray-400 ml-2">{sub.trade}</span>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <Input label="Deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" size="sm" type="button" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" size="sm" type="submit" disabled={saving || !title.trim() || !deadline || selectedSubIds.length === 0}>
          {saving ? 'Sending...' : 'Send Solicitation'}
        </Button>
      </div>
    </form>
  );
}
