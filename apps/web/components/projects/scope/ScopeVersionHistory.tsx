"use client";

import React from 'react';
import { Scope } from '@/types';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import { DocumentTextIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface ScopeVersionHistoryProps {
  scopes: Scope[];
  currentScopeId?: string;
  onSelect: (scope: Scope) => void;
}

const STATUS_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  draft: { icon: DocumentTextIcon, color: 'text-gray-500', label: 'Draft' },
  pending_approval: { icon: ClockIcon, color: 'text-yellow-600', label: 'Pending Approval' },
  approved: { icon: CheckCircleIcon, color: 'text-green-600', label: 'Approved' },
  superseded: { icon: XCircleIcon, color: 'text-gray-400', label: 'Superseded' },
};

export default function ScopeVersionHistory({ scopes, currentScopeId, onSelect }: ScopeVersionHistoryProps) {
  if (scopes.length === 0) {
    return <p className="text-sm text-gray-400">No scope versions yet.</p>;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-900">Version History</h4>
      <div className="space-y-1">
        {scopes.map((scope) => {
          const config = STATUS_CONFIG[scope.status] || STATUS_CONFIG.draft;
          const Icon = config.icon;
          const isCurrent = scope.id === currentScopeId;

          return (
            <button
              key={scope.id}
              onClick={() => onSelect(scope)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                isCurrent ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'
              )}
            >
              <Icon className={cn('h-5 w-5 flex-shrink-0', config.color)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">v{scope.version}</span>
                  <span className={cn('text-xs', config.color)}>{config.label}</span>
                  {isCurrent && <span className="text-xs text-blue-600 font-medium">Current</span>}
                </div>
                <p className="text-xs text-gray-500">
                  {formatDate(scope.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}
                  {' · '}{scope.items.length} items
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
