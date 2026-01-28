"use client";

import React, { useState, useMemo } from 'react';
import { Scope, ScopeItem, ProjectPhase, QuoteSection } from '@/types';
import { Button } from '@/components/ui';
import { PlusIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import ScopeItemForm from './ScopeItemForm';
import ScopePhaseGroup from './ScopePhaseGroup';
import ScopeApprovalPanel from './ScopeApprovalPanel';
import ScopeQuoteLink from './ScopeQuoteLink';
import ScopeVersionHistory from './ScopeVersionHistory';

type Tab = 'items' | 'approvals' | 'quotes' | 'versions';

const TABS: { id: Tab; label: string }[] = [
  { id: 'items', label: 'Scope Items' },
  { id: 'quotes', label: 'Quote Links' },
  { id: 'approvals', label: 'Approvals' },
  { id: 'versions', label: 'Versions' },
];

interface ScopeBuilderProps {
  scope: Scope | null;
  allScopes: Scope[];
  phases: ProjectPhase[];
  quoteSections: QuoteSection[];
  onSaveItems: (items: ScopeItem[]) => Promise<void>;
  onSubmitForApproval: () => Promise<void>;
  onCreateNewVersion: (items: ScopeItem[], notes?: string) => Promise<void>;
  onSelectVersion: (scope: Scope) => void;
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function ScopeBuilder({
  scope,
  allScopes,
  phases,
  quoteSections,
  onSaveItems,
  onSubmitForApproval,
  onCreateNewVersion,
  onSelectVersion,
}: ScopeBuilderProps) {
  const [tab, setTab] = useState<Tab>('items');
  const [editingItem, setEditingItem] = useState<ScopeItem | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [items, setItems] = useState<ScopeItem[]>(scope?.items || []);

  // Group items by phase
  const groupedItems = useMemo(() => {
    const groups = new Map<string, ScopeItem[]>();
    const ungrouped: ScopeItem[] = [];

    const sorted = [...items].sort((a, b) => a.order - b.order);
    for (const item of sorted) {
      if (item.phaseId) {
        const existing = groups.get(item.phaseId) || [];
        existing.push(item);
        groups.set(item.phaseId, existing);
      } else {
        ungrouped.push(item);
      }
    }

    return { groups, ungrouped };
  }, [items]);

  const totalCost = items.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
  const totalHours = items.reduce((sum, item) => sum + (item.estimatedHours || 0), 0);
  const isDraft = !scope || scope.status === 'draft';

  const handleAddItem = (item: ScopeItem) => {
    const updated = [...items, { ...item, order: items.length }];
    setItems(updated);
    onSaveItems(updated);
    setShowAddItem(false);
  };

  const handleEditItem = (item: ScopeItem) => {
    const updated = items.map(i => i.id === item.id ? item : i);
    setItems(updated);
    onSaveItems(updated);
    setEditingItem(null);
  };

  const handleRemoveItem = (itemId: string) => {
    const updated = items.filter(i => i.id !== itemId);
    setItems(updated);
    onSaveItems(updated);
  };

  if (!scope) {
    return (
      <div className="border border-gray-200 rounded-xl p-12 text-center bg-gray-50">
        <p className="text-sm text-gray-500 mb-3">No scope of work created yet.</p>
        <Button variant="primary" size="sm" onClick={() => onCreateNewVersion([], undefined)}>
          Create Scope of Work
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Scope of Work — v{scope.version}
          </h3>
          <p className="text-sm text-gray-500">
            {items.length} items · {totalHours}h · {fmt(totalCost)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDraft && (
            <>
              <Button variant="secondary" size="sm" onClick={() => setShowAddItem(true)} icon={<PlusIcon className="h-4 w-4" />}>
                Add Item
              </Button>
              <Button variant="primary" size="sm" onClick={onSubmitForApproval} icon={<PaperAirplaneIcon className="h-4 w-4" />}>
                Submit for Approval
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'items' && (
        <div className="space-y-3">
          {/* Add/edit form */}
          {(showAddItem || editingItem) && (
            <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/50">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                {editingItem ? 'Edit Item' : 'New Scope Item'}
              </h4>
              <ScopeItemForm
                initialData={editingItem || undefined}
                phases={phases}
                quoteSections={quoteSections}
                onSubmit={editingItem ? handleEditItem : handleAddItem}
                onCancel={() => { setShowAddItem(false); setEditingItem(null); }}
              />
            </div>
          )}

          {/* Phase groups */}
          {Array.from(groupedItems.groups.entries()).map(([phaseId, phaseItems]) => {
            const phase = phases.find(p => p.id === phaseId);
            return (
              <ScopePhaseGroup
                key={phaseId}
                phaseName={phase?.name || 'Unknown Phase'}
                items={phaseItems}
                quoteSections={quoteSections}
                onEditItem={(item) => setEditingItem(item)}
                onRemoveItem={handleRemoveItem}
              />
            );
          })}

          {groupedItems.ungrouped.length > 0 && (
            <ScopePhaseGroup
              phaseName="Unassigned"
              items={groupedItems.ungrouped}
              quoteSections={quoteSections}
              onEditItem={(item) => setEditingItem(item)}
              onRemoveItem={handleRemoveItem}
            />
          )}

          {items.length === 0 && !showAddItem && (
            <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center">
              <p className="text-sm text-gray-400 mb-2">No scope items yet.</p>
              <Button variant="secondary" size="sm" onClick={() => setShowAddItem(true)}>
                Add First Item
              </Button>
            </div>
          )}
        </div>
      )}

      {tab === 'quotes' && (
        <ScopeQuoteLink items={items} quoteSections={quoteSections} />
      )}

      {tab === 'approvals' && (
        <ScopeApprovalPanel
          scope={scope}
          onSubmitForApproval={isDraft ? onSubmitForApproval : undefined}
        />
      )}

      {tab === 'versions' && (
        <ScopeVersionHistory
          scopes={allScopes}
          currentScopeId={scope.id}
          onSelect={onSelectVersion}
        />
      )}
    </div>
  );
}
