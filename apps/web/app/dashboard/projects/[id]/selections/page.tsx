"use client";

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useSelections } from '@/lib/hooks/useSelections';
import { Card, Button, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { SelectionStatus } from '@/types';
import {
  PlusIcon,
  SwatchIcon,
  CheckCircleIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const STATUS_CONFIG: Record<SelectionStatus, { label: string; color: string }> = {
  pending: { label: 'Pending Selection', color: 'bg-gray-100 text-gray-700' },
  selected: { label: 'Client Selected', color: 'bg-blue-100 text-blue-700' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700' },
  ordered: { label: 'Ordered', color: 'bg-purple-100 text-purple-700' },
  installed: { label: 'Installed', color: 'bg-emerald-100 text-emerald-700' },
};

export default function ProjectSelectionsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const {
    selections, loading,
    addSelection, approveSelection, markOrdered, markInstalled, deleteSelection,
  } = useSelections({ projectId });

  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<SelectionStatus | 'all'>('all');

  // New selection form state
  const [form, setForm] = useState({
    categoryName: '',
    room: '',
    budgetAmount: '',
    notes: '',
    options: [{ name: '', price: '', description: '', supplierName: '', isRecommended: false }] as {
      name: string; price: string; description: string; supplierName: string; isRecommended: boolean;
    }[],
  });

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return selections;
    return selections.filter((s) => s.status === statusFilter);
  }, [selections, statusFilter]);

  const stats = useMemo(() => {
    const total = selections.length;
    const pending = selections.filter((s) => s.status === 'pending').length;
    const totalBudget = selections.reduce((sum, s) => sum + s.budgetAmount, 0);
    const totalSelected = selections
      .filter((s) => s.selectedPrice !== undefined)
      .reduce((sum, s) => sum + (s.selectedPrice || 0), 0);
    const variance = totalBudget - totalSelected;
    return { total, pending, totalBudget, totalSelected, variance };
  }, [selections]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  const addOptionRow = () => {
    setForm((prev) => ({
      ...prev,
      options: [...prev.options, { name: '', price: '', description: '', supplierName: '', isRecommended: false }],
    }));
  };

  const removeOptionRow = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== idx),
    }));
  };

  const handleAddSelection = async () => {
    if (!form.categoryName) {
      toast.error('Category name is required');
      return;
    }
    try {
      await addSelection({
        categoryName: form.categoryName,
        room: form.room,
        budgetAmount: parseFloat(form.budgetAmount) || 0,
        notes: form.notes,
        options: form.options
          .filter((o) => o.name)
          .map((o, i) => ({
            categoryId: '',
            name: o.name,
            price: parseFloat(o.price) || 0,
            description: o.description,
            supplierName: o.supplierName,
            isRecommended: o.isRecommended,
            order: i,
          })),
      });
      setForm({ categoryName: '', room: '', budgetAmount: '', notes: '', options: [{ name: '', price: '', description: '', supplierName: '', isRecommended: false }] });
      setShowAddForm(false);
      toast.success('Selection category added');
    } catch {
      toast.error('Failed to add selection');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveSelection(id);
      toast.success('Selection approved');
    } catch {
      toast.error('Failed to approve');
    }
  };

  const handleMarkOrdered = async (id: string) => {
    try {
      await markOrdered(id);
      toast.success('Marked as ordered');
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleMarkInstalled = async (id: string) => {
    try {
      await markInstalled(id);
      toast.success('Marked as installed');
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this selection category?')) return;
    try {
      await deleteSelection(id);
      toast.success('Selection deleted');
    } catch {
      toast.error('Failed to delete');
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
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 tracking-tight">{stats.total}</p>
          <p className="text-xs text-gray-500">Total Items</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-orange-600 tracking-tight">{stats.pending}</p>
          <p className="text-xs text-gray-500">Awaiting Selection</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 tracking-tight">{formatCurrency(stats.totalBudget)}</p>
          <p className="text-xs text-gray-500">Total Budget</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 tracking-tight">{formatCurrency(stats.totalSelected)}</p>
          <p className="text-xs text-gray-500">Selected Total</p>
        </Card>
        <Card className={cn('p-4 text-center', stats.variance >= 0 ? 'ring-1 ring-green-200' : 'ring-1 ring-red-200')}>
          <p className={cn('text-2xl font-bold tracking-tight', stats.variance >= 0 ? 'text-green-700' : 'text-red-700')}>
            {formatCurrency(stats.variance)}
          </p>
          <p className="text-xs text-gray-500">Budget Variance</p>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {(['all', 'pending', 'selected', 'approved', 'ordered', 'installed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                statusFilter === s ? 'bg-brand-100 text-brand-primary' : 'text-gray-500 hover:bg-gray-100'
              )}
            >
              {s === 'all' ? 'All' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowAddForm(true)}>
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Selection
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 tracking-tight mb-4">New Selection Category</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input
                  type="text"
                  value={form.categoryName}
                  onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  placeholder="e.g., Kitchen Countertops"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room / Location</label>
                <input
                  type="text"
                  value={form.room}
                  onChange={(e) => setForm({ ...form, room: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  placeholder="e.g., Kitchen"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allowance / Budget ($)</label>
                <input
                  type="number"
                  value={form.budgetAmount}
                  onChange={(e) => setForm({ ...form, budgetAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  placeholder="5000"
                />
              </div>
            </div>

            {/* Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
              <div className="space-y-2">
                {form.options.map((opt, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      value={opt.name}
                      onChange={(e) => {
                        const next = [...form.options];
                        next[idx] = { ...next[idx], name: e.target.value };
                        setForm({ ...form, options: next });
                      }}
                      className="col-span-4 px-3 py-2 border border-gray-300 rounded-xl text-sm"
                      placeholder="Option name"
                    />
                    <input
                      type="number"
                      value={opt.price}
                      onChange={(e) => {
                        const next = [...form.options];
                        next[idx] = { ...next[idx], price: e.target.value };
                        setForm({ ...form, options: next });
                      }}
                      className="col-span-2 px-3 py-2 border border-gray-300 rounded-xl text-sm"
                      placeholder="Price"
                    />
                    <input
                      type="text"
                      value={opt.supplierName}
                      onChange={(e) => {
                        const next = [...form.options];
                        next[idx] = { ...next[idx], supplierName: e.target.value };
                        setForm({ ...form, options: next });
                      }}
                      className="col-span-3 px-3 py-2 border border-gray-300 rounded-xl text-sm"
                      placeholder="Supplier"
                    />
                    <label className="col-span-2 flex items-center gap-1 text-xs text-gray-500">
                      <input
                        type="checkbox"
                        checked={opt.isRecommended}
                        onChange={(e) => {
                          const next = [...form.options];
                          next[idx] = { ...next[idx], isRecommended: e.target.checked };
                          setForm({ ...form, options: next });
                        }}
                      />
                      Recommended
                    </label>
                    <button
                      onClick={() => removeOptionRow(idx)}
                      className="col-span-1 p-2 text-gray-400 hover:text-red-600"
                      disabled={form.options.length <= 1}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={addOptionRow} className="mt-2 text-sm text-brand-600 hover:text-brand-700">
                + Add Option
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                rows={2}
                placeholder="Any notes for the client..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleAddSelection}>Add Selection</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Selections List */}
      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <SwatchIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No selections yet</p>
          <p className="text-sm text-gray-400 mt-1">Add selection categories for clients to choose finishes and materials.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((sel) => {
            const isExpanded = expandedId === sel.id;
            const _selectedOpt = sel.options.find((o) => o.id === sel.selectedOptionId);
            return (
              <Card key={sel.id} className="overflow-hidden">
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedId(isExpanded ? null : sel.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <SwatchIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">{sel.categoryName}</p>
                        <Badge className={STATUS_CONFIG[sel.status].color}>
                          {STATUS_CONFIG[sel.status].label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {sel.room && <span className="text-xs text-gray-400">{sel.room}</span>}
                        <span className="text-xs text-gray-400">
                          Budget: {formatCurrency(sel.budgetAmount)}
                        </span>
                        {sel.selectedPrice !== undefined && (
                          <span className={cn('text-xs font-medium', sel.budgetVariance >= 0 ? 'text-green-600' : 'text-red-600')}>
                            {sel.budgetVariance >= 0 ? 'Under' : 'Over'} budget by {formatCurrency(Math.abs(sel.budgetVariance))}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {sel.selectedOptionName && (
                      <span className="text-sm text-gray-600 hidden sm:block">{sel.selectedOptionName}</span>
                    )}
                    {isExpanded ? (
                      <ChevronUpIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    {/* Options */}
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Options ({sel.options.length})</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                      {sel.options.map((opt) => (
                        <div
                          key={opt.id}
                          className={cn(
                            'p-3 rounded-lg border-2 transition-colors',
                            opt.id === sel.selectedOptionId
                              ? 'border-brand-primary bg-brand-50'
                              : 'border-gray-200 bg-white'
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-gray-900">{opt.name}</p>
                            {opt.isRecommended && (
                              <Badge className="bg-yellow-100 text-yellow-700 text-xs">Recommended</Badge>
                            )}
                          </div>
                          <p className="text-lg font-bold text-gray-900">{formatCurrency(opt.price)}</p>
                          {opt.supplierName && (
                            <p className="text-xs text-gray-400 mt-1">{opt.supplierName}</p>
                          )}
                          {opt.leadTimeDays && (
                            <p className="text-xs text-gray-400">{opt.leadTimeDays} day lead time</p>
                          )}
                          {opt.id === sel.selectedOptionId && (
                            <div className="flex items-center gap-1 mt-2 text-brand-primary">
                              <CheckCircleIcon className="h-4 w-4" />
                              <span className="text-xs font-medium">Selected</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Client notes */}
                    {sel.clientNote && (
                      <div className="p-3 bg-yellow-50 rounded-lg mb-4">
                        <p className="text-xs font-medium text-yellow-700 mb-1">Client Note</p>
                        <p className="text-sm text-yellow-800">{sel.clientNote}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {sel.status === 'selected' && (
                        <Button size="sm" variant="primary" onClick={() => handleApprove(sel.id)}>
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Approve Selection
                        </Button>
                      )}
                      {sel.status === 'approved' && (
                        <Button size="sm" variant="outline" onClick={() => handleMarkOrdered(sel.id)}>
                          <TruckIcon className="h-4 w-4 mr-1" />
                          Mark Ordered
                        </Button>
                      )}
                      {sel.status === 'ordered' && (
                        <Button size="sm" variant="outline" onClick={() => handleMarkInstalled(sel.id)}>
                          <WrenchScrewdriverIcon className="h-4 w-4 mr-1" />
                          Mark Installed
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleDelete(sel.id)}>
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>

                    {/* Timeline */}
                    {(sel.selectedAt || sel.approvedAt || sel.orderedAt || sel.installedAt) && (
                      <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
                        {sel.selectedAt && <span>Selected: {format(sel.selectedAt, 'MMM d')}</span>}
                        {sel.approvedAt && <span>Approved: {format(sel.approvedAt, 'MMM d')}</span>}
                        {sel.orderedAt && <span>Ordered: {format(sel.orderedAt, 'MMM d')}</span>}
                        {sel.installedAt && <span>Installed: {format(sel.installedAt, 'MMM d')}</span>}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
