"use client";

import React, { useState, useMemo } from 'react';
import { Scope, ScopeItem } from '@/types';
import { Card, Button, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowsRightLeftIcon,
  PlusIcon,
  MinusIcon,
  PencilIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface ScopeVersionViewerProps {
  scopes: Scope[];
  currentScopeId?: string;
  onRestore?: (scope: Scope) => void;
}

type DiffType = 'added' | 'removed' | 'modified' | 'unchanged';

interface ItemDiff {
  type: DiffType;
  item: ScopeItem;
  previousItem?: ScopeItem;
  changes?: {
    field: string;
    oldValue: string | number | undefined;
    newValue: string | number | undefined;
  }[];
}

const STATUS_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string; label: string }> = {
  draft: { icon: DocumentTextIcon, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Draft' },
  pending_approval: { icon: ClockIcon, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Pending Approval' },
  approved: { icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-100', label: 'Approved' },
  superseded: { icon: XCircleIcon, color: 'text-gray-400', bg: 'bg-gray-100', label: 'Superseded' },
};

function computeDiff(currentItems: ScopeItem[], previousItems: ScopeItem[]): ItemDiff[] {
  const diffs: ItemDiff[] = [];
  const previousMap = new Map(previousItems.map(item => [item.id, item]));
  const currentMap = new Map(currentItems.map(item => [item.id, item]));

  // Check for added and modified items
  for (const item of currentItems) {
    const previousItem = previousMap.get(item.id);
    if (!previousItem) {
      diffs.push({ type: 'added', item });
    } else {
      const changes: ItemDiff['changes'] = [];

      if (item.title !== previousItem.title) {
        changes.push({ field: 'Title', oldValue: previousItem.title, newValue: item.title });
      }
      if (item.description !== previousItem.description) {
        changes.push({ field: 'Description', oldValue: previousItem.description, newValue: item.description });
      }
      if (item.estimatedHours !== previousItem.estimatedHours) {
        changes.push({ field: 'Estimated Hours', oldValue: previousItem.estimatedHours, newValue: item.estimatedHours });
      }
      if (item.estimatedCost !== previousItem.estimatedCost) {
        changes.push({ field: 'Estimated Cost', oldValue: previousItem.estimatedCost, newValue: item.estimatedCost });
      }
      if (item.specifications !== previousItem.specifications) {
        changes.push({ field: 'Specifications', oldValue: previousItem.specifications, newValue: item.specifications });
      }

      if (changes.length > 0) {
        diffs.push({ type: 'modified', item, previousItem, changes });
      } else {
        diffs.push({ type: 'unchanged', item });
      }
    }
  }

  // Check for removed items
  for (const item of previousItems) {
    if (!currentMap.has(item.id)) {
      diffs.push({ type: 'removed', item });
    }
  }

  // Sort by order, with removed items at the end
  return diffs.sort((a, b) => {
    if (a.type === 'removed' && b.type !== 'removed') return 1;
    if (a.type !== 'removed' && b.type === 'removed') return -1;
    return a.item.order - b.item.order;
  });
}

function formatCurrency(value?: number): string {
  if (value === undefined || value === null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export default function ScopeVersionViewer({ scopes, currentScopeId, onRestore }: ScopeVersionViewerProps) {
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const sortedScopes = useMemo(() => {
    return [...scopes].sort((a, b) => b.version - a.version);
  }, [scopes]);

  const selectedVersion = sortedScopes.find(s => s.id === selectedVersionId);
  const compareVersion = sortedScopes.find(s => s.id === compareVersionId);

  const diff = useMemo(() => {
    if (!selectedVersion || !compareVersion) return null;
    return computeDiff(selectedVersion.items, compareVersion.items);
  }, [selectedVersion, compareVersion]);

  const toggleItemExpand = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  if (scopes.length === 0) {
    return (
      <Card className="p-8 text-center">
        <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No scope versions available</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Version Selection */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Scope Version History</h3>
          {showDiff && (
            <Button variant="outline" size="sm" onClick={() => setShowDiff(false)}>
              <EyeIcon className="h-4 w-4 mr-1" />
              View Single Version
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Version List */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
              {showDiff ? 'New Version' : 'Select Version'}
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {sortedScopes.map((scope) => {
                const config = STATUS_CONFIG[scope.status] || STATUS_CONFIG.draft;
                const Icon = config.icon;
                const isSelected = scope.id === selectedVersionId;
                const isCurrent = scope.id === currentScopeId;

                return (
                  <button
                    key={scope.id}
                    onClick={() => setSelectedVersionId(scope.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors border',
                      isSelected
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50 border-gray-200'
                    )}
                  >
                    <Icon className={cn('h-5 w-5 flex-shrink-0', config.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">Version {scope.version}</span>
                        {isCurrent && (
                          <Badge className="bg-blue-100 text-blue-700 text-xs">Current</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className={config.color}>{config.label}</span>
                        <span>·</span>
                        <span>{formatDate(scope.createdAt)}</span>
                        <span>·</span>
                        <span>{scope.items.length} items</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compare Version or Actions */}
          {showDiff ? (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                Previous Version (Compare To)
              </label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sortedScopes
                  .filter(s => s.id !== selectedVersionId)
                  .map((scope) => {
                    const config = STATUS_CONFIG[scope.status] || STATUS_CONFIG.draft;
                    const Icon = config.icon;
                    const isSelected = scope.id === compareVersionId;

                    return (
                      <button
                        key={scope.id}
                        onClick={() => setCompareVersionId(scope.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors border',
                          isSelected
                            ? 'bg-orange-50 border-orange-200'
                            : 'hover:bg-gray-50 border-gray-200'
                        )}
                      >
                        <Icon className={cn('h-5 w-5 flex-shrink-0', config.color)} />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-900">Version {scope.version}</span>
                          <p className="text-xs text-gray-500">
                            {formatDate(scope.createdAt)} · {scope.items.length} items
                          </p>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          ) : selectedVersion && (
            <div className="flex flex-col justify-center items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Button
                variant="outline"
                onClick={() => setShowDiff(true)}
                disabled={sortedScopes.length < 2}
              >
                <ArrowsRightLeftIcon className="h-4 w-4 mr-1" />
                Compare Versions
              </Button>
              {onRestore && selectedVersion.id !== currentScopeId && (
                <Button
                  variant="primary"
                  onClick={() => onRestore(selectedVersion)}
                >
                  Restore This Version
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Version Content or Diff */}
      {showDiff && selectedVersion && compareVersion && diff ? (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">
                Changes: v{compareVersion.version} → v{selectedVersion.version}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {diff.filter(d => d.type === 'added').length} added,{' '}
                {diff.filter(d => d.type === 'removed').length} removed,{' '}
                {diff.filter(d => d.type === 'modified').length} modified
              </p>
            </div>
            <div className="flex gap-2">
              <Badge className="bg-green-100 text-green-700">
                <PlusIcon className="h-3 w-3 mr-1" />
                Added
              </Badge>
              <Badge className="bg-red-100 text-red-700">
                <MinusIcon className="h-3 w-3 mr-1" />
                Removed
              </Badge>
              <Badge className="bg-yellow-100 text-yellow-700">
                <PencilIcon className="h-3 w-3 mr-1" />
                Modified
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            {diff.map((d, i) => {
              if (d.type === 'unchanged') return null;

              const isExpanded = expandedItems.has(d.item.id);

              return (
                <div
                  key={d.item.id}
                  className={cn(
                    'border rounded-lg overflow-hidden',
                    d.type === 'added' && 'border-green-200 bg-green-50',
                    d.type === 'removed' && 'border-red-200 bg-red-50',
                    d.type === 'modified' && 'border-yellow-200 bg-yellow-50'
                  )}
                >
                  <button
                    onClick={() => toggleItemExpand(d.item.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                  >
                    {d.type === 'added' && <PlusIcon className="h-5 w-5 text-green-600" />}
                    {d.type === 'removed' && <MinusIcon className="h-5 w-5 text-red-600" />}
                    {d.type === 'modified' && <PencilIcon className="h-5 w-5 text-yellow-600" />}

                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm font-medium',
                        d.type === 'removed' && 'line-through text-red-700',
                        d.type === 'added' && 'text-green-700',
                        d.type === 'modified' && 'text-yellow-700'
                      )}>
                        {d.item.title}
                      </p>
                      {d.type === 'modified' && d.changes && (
                        <p className="text-xs text-yellow-600">
                          {d.changes.length} field{d.changes.length !== 1 ? 's' : ''} changed
                        </p>
                      )}
                    </div>

                    {isExpanded ? (
                      <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-3 pt-1 border-t border-gray-100">
                      {d.type === 'modified' && d.changes && (
                        <div className="space-y-2">
                          {d.changes.map((change, ci) => (
                            <div key={ci} className="text-sm">
                              <span className="font-medium text-gray-700">{change.field}:</span>
                              <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2 bg-red-100 rounded">
                                  <span className="text-red-600 font-medium">Old: </span>
                                  <span className="text-red-700">
                                    {change.field.includes('Cost')
                                      ? formatCurrency(change.oldValue as number)
                                      : (change.oldValue ?? '—')}
                                  </span>
                                </div>
                                <div className="p-2 bg-green-100 rounded">
                                  <span className="text-green-600 font-medium">New: </span>
                                  <span className="text-green-700">
                                    {change.field.includes('Cost')
                                      ? formatCurrency(change.newValue as number)
                                      : (change.newValue ?? '—')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {(d.type === 'added' || d.type === 'removed') && (
                        <div className="text-sm text-gray-600">
                          {d.item.description && <p className="mb-2">{d.item.description}</p>}
                          <div className="flex gap-4 text-xs text-gray-500">
                            {d.item.estimatedHours && <span>Est. Hours: {d.item.estimatedHours}</span>}
                            {d.item.estimatedCost && <span>Est. Cost: {formatCurrency(d.item.estimatedCost)}</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {diff.filter(d => d.type !== 'unchanged').length === 0 && (
              <p className="text-center text-gray-500 py-4">No changes between these versions</p>
            )}
          </div>
        </Card>
      ) : selectedVersion && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Version {selectedVersion.version}</h3>
              <p className="text-xs text-gray-500 mt-1">
                {formatDate(selectedVersion.createdAt)} · {selectedVersion.items.length} items
              </p>
            </div>
            <Badge className={cn(
              STATUS_CONFIG[selectedVersion.status]?.bg,
              STATUS_CONFIG[selectedVersion.status]?.color
            )}>
              {STATUS_CONFIG[selectedVersion.status]?.label || selectedVersion.status}
            </Badge>
          </div>

          <div className="space-y-2">
            {selectedVersion.items.map((item, i) => (
              <div key={item.id} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {i + 1}. {item.title}
                    </p>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    {item.estimatedHours && <p>{item.estimatedHours}h</p>}
                    {item.estimatedCost && <p>{formatCurrency(item.estimatedCost)}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-6 text-sm">
            <div>
              <span className="text-gray-500">Total Hours:</span>
              <span className="font-semibold text-gray-900 ml-2">
                {selectedVersion.items.reduce((sum, item) => sum + (item.estimatedHours || 0), 0)}h
              </span>
            </div>
            <div>
              <span className="text-gray-500">Total Cost:</span>
              <span className="font-semibold text-gray-900 ml-2">
                {formatCurrency(selectedVersion.items.reduce((sum, item) => sum + (item.estimatedCost || 0), 0))}
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
