"use client";

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useSelections } from '@/lib/hooks/useSelections';
import { Card, Button, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { SelectionStatus } from '@/types';
import {
  SwatchIcon,
  CheckCircleIcon,
  ClockIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';

const STATUS_LABELS: Record<SelectionStatus, string> = {
  pending: 'Needs Your Selection',
  selected: 'Awaiting Approval',
  approved: 'Approved',
  ordered: 'Ordered',
  installed: 'Installed',
};

const STATUS_COLORS: Record<SelectionStatus, string> = {
  pending: 'bg-orange-100 text-orange-700',
  selected: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  ordered: 'bg-purple-100 text-purple-700',
  installed: 'bg-emerald-100 text-emerald-700',
};

export default function ClientSelectionsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { selections, loading, selectOption, addClientNote } = useSelections({ projectId });

  const [noteInput, setNoteInput] = useState<Record<string, string>>({});
  const [showNoteFor, setShowNoteFor] = useState<string | null>(null);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  const pendingCount = selections.filter((s) => s.status === 'pending').length;

  const handleSelect = async (selectionId: string, optionId: string) => {
    try {
      await selectOption(selectionId, optionId);
      toast.success('Selection made! Your contractor will review and approve.');
    } catch {
      toast.error('Failed to save selection');
    }
  };

  const handleAddNote = async (selectionId: string) => {
    const note = noteInput[selectionId];
    if (!note?.trim()) return;
    try {
      await addClientNote(selectionId, note.trim());
      setNoteInput((prev) => ({ ...prev, [selectionId]: '' }));
      setShowNoteFor(null);
      toast.success('Note added');
    } catch {
      toast.error('Failed to add note');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading tracking-tight text-gray-900">Selections</h1>
        <p className="text-gray-500 mt-1">Choose your finishes, fixtures, and materials</p>
      </div>

      {pendingCount > 0 && (
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-sm text-orange-800 font-medium">
            {pendingCount} selection{pendingCount !== 1 ? 's' : ''} need{pendingCount === 1 ? 's' : ''} your input. Please review and choose your preferred options below.
          </p>
        </div>
      )}

      {selections.length === 0 ? (
        <Card className="p-8 text-center">
          <SwatchIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No selections available yet</p>
          <p className="text-sm text-gray-400 mt-1">Your contractor will add selection categories as the project progresses.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {selections.map((sel) => (
            <Card key={sel.id} className="overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold font-heading tracking-tight text-gray-900">{sel.categoryName}</h3>
                      <Badge className={STATUS_COLORS[sel.status]}>
                        {STATUS_LABELS[sel.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {sel.room && <span className="text-sm text-gray-500">{sel.room}</span>}
                      <span className="text-sm text-gray-500">
                        Allowance: {formatCurrency(sel.budgetAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contractor notes */}
                {sel.notes && (
                  <div className="p-3 bg-blue-50 rounded-lg mb-4">
                    <p className="text-xs font-medium text-blue-700 mb-1">From your contractor</p>
                    <p className="text-sm text-blue-800">{sel.notes}</p>
                  </div>
                )}

                {/* Options grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sel.options.map((opt) => {
                    const isSelected = opt.id === sel.selectedOptionId;
                    const overBudget = opt.price > sel.budgetAmount;
                    const variance = sel.budgetAmount - opt.price;

                    return (
                      <div
                        key={opt.id}
                        className={cn(
                          'p-4 rounded-xl border-2 transition-all',
                          isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 bg-white',
                          sel.status === 'pending' && 'cursor-pointer hover:shadow-md'
                        )}
                        onClick={() => {
                          if (sel.status === 'pending') handleSelect(sel.id, opt.id);
                        }}
                      >
                        {opt.isRecommended && (
                          <Badge className="bg-yellow-100 text-yellow-700 text-xs mb-2">
                            Contractor Recommended
                          </Badge>
                        )}
                        <p className="font-medium text-gray-900">{opt.name}</p>
                        {opt.description && (
                          <p className="text-sm text-gray-500 mt-1">{opt.description}</p>
                        )}
                        <p className="text-xl font-bold text-gray-900 mt-2">{formatCurrency(opt.price)}</p>
                        <p className={cn(
                          'text-xs mt-1',
                          overBudget ? 'text-red-600' : 'text-green-600'
                        )}>
                          {overBudget
                            ? `${formatCurrency(Math.abs(variance))} over allowance`
                            : `${formatCurrency(variance)} under allowance`}
                        </p>
                        {opt.supplierName && (
                          <p className="text-xs text-gray-400 mt-2">{opt.supplierName}</p>
                        )}
                        {opt.leadTimeDays && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                            <ClockIcon className="h-3 w-3" />
                            {opt.leadTimeDays} day lead time
                          </div>
                        )}

                        {isSelected && (
                          <div className="flex items-center gap-1 mt-3 text-blue-600">
                            <CheckCircleIcon className="h-5 w-5" />
                            <span className="text-sm font-medium">Your Choice</span>
                          </div>
                        )}

                        {sel.status === 'pending' && !isSelected && (
                          <p className="text-xs text-gray-400 mt-3">Click to select</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Client note section */}
                <div className="mt-4">
                  {sel.clientNote && (
                    <div className="p-3 bg-yellow-50 rounded-lg mb-2">
                      <p className="text-xs font-medium text-yellow-700">Your note</p>
                      <p className="text-sm text-yellow-800">{sel.clientNote}</p>
                    </div>
                  )}
                  {showNoteFor === sel.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={noteInput[sel.id] || ''}
                        onChange={(e) => setNoteInput((prev) => ({ ...prev, [sel.id]: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Add a note or question about this selection..."
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddNote(sel.id); }}
                      />
                      <Button size="sm" variant="primary" onClick={() => handleAddNote(sel.id)}>Send</Button>
                      <Button size="sm" variant="outline" onClick={() => setShowNoteFor(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowNoteFor(sel.id)}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600"
                    >
                      <ChatBubbleLeftIcon className="h-4 w-4" />
                      Add a note
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
