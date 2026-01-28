"use client";

import React, { useState } from 'react';
import { SubAssignment, Subcontractor, ProjectPhase, Task } from '@/types';
import { Button, Input } from '@/components/ui';
import { PlusIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface SubAssignmentManagerProps {
  assignments: SubAssignment[];
  subs: Subcontractor[];
  phases: ProjectPhase[];
  tasks: Task[];
  onCreateAssignment: (data: Omit<SubAssignment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateAssignment: (id: string, data: Partial<SubAssignment>) => Promise<void>;
  projectId: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  accepted: { bg: 'bg-blue-100', text: 'text-blue-700' },
  in_progress: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  completed: { bg: 'bg-green-100', text: 'text-green-700' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-500' },
};

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function SubAssignmentManager({ assignments, subs, phases, tasks, onCreateAssignment, onUpdateAssignment, projectId }: SubAssignmentManagerProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [subId, setSubId] = useState('');
  const [type, setType] = useState<'phase' | 'task'>('phase');
  const [targetId, setTargetId] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!subId || !targetId || !amount) return;
    setSaving(true);
    try {
      await onCreateAssignment({
        subId,
        projectId,
        type,
        phaseId: type === 'phase' ? targetId : undefined,
        taskId: type === 'task' ? targetId : undefined,
        status: 'pending',
        agreedAmount: parseFloat(amount),
        paidAmount: 0,
        paymentSchedule: [],
      });
      setShowAdd(false);
      setSubId('');
      setTargetId('');
      setAmount('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">Sub Assignments</h4>
        <Button variant="secondary" size="sm" onClick={() => setShowAdd(true)} icon={<PlusIcon className="h-4 w-4" />}>
          Assign Sub
        </Button>
      </div>

      {/* Assignment list */}
      {assignments.length === 0 && !showAdd && (
        <p className="text-xs text-gray-400">No subcontractors assigned to this project yet.</p>
      )}

      <div className="space-y-2">
        {assignments.map((a) => {
          const sub = subs.find(s => s.id === a.subId);
          const target = a.type === 'phase'
            ? phases.find(p => p.id === a.phaseId)?.name
            : tasks.find(t => t.id === a.taskId)?.title;
          const style = STATUS_STYLES[a.status] || STATUS_STYLES.pending;

          return (
            <div key={a.id} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">{sub?.companyName || a.subId}</p>
                <p className="text-xs text-gray-500">
                  {a.type === 'phase' ? 'Phase' : 'Task'}: {target || 'Unknown'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-900">{fmt(a.agreedAmount)}</span>
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full capitalize', style.bg, style.text)}>
                  {a.status.replace('_', ' ')}
                </span>
                <select
                  value={a.status}
                  onChange={(e) => onUpdateAssignment(a.id, { status: e.target.value as SubAssignment['status'] })}
                  className="text-xs border border-gray-300 rounded px-1 py-0.5"
                >
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/50 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Subcontractor</label>
              <select value={subId} onChange={(e) => setSubId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select sub...</option>
                {subs.map((s) => (
                  <option key={s.id} value={s.id}>{s.companyName} ({s.trade})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Assignment Type</label>
              <select value={type} onChange={(e) => { setType(e.target.value as 'phase' | 'task'); setTargetId(''); }} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="phase">Phase</option>
                <option value="task">Task</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{type === 'phase' ? 'Phase' : 'Task'}</label>
              <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select...</option>
                {type === 'phase'
                  ? phases.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)
                  : tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)
                }
              </select>
            </div>
            <Input label="Agreed Amount ($)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min={0} step="0.01" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleCreate} disabled={saving || !subId || !targetId || !amount}>
              {saving ? 'Assigning...' : 'Assign'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
