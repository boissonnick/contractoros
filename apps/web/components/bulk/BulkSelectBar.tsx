'use client';

import React from 'react';
import {
  XMarkIcon,
  ArrowPathIcon,
  UserPlusIcon,
  ArchiveBoxIcon,
  TrashIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { BulkAction, BulkEntityType, getAvailableActions } from '@/lib/bulk-operations/types';

interface BulkSelectBarProps {
  selectedCount: number;
  entityType: BulkEntityType;
  entityLabel?: string;
  onAction: (action: BulkAction) => void;
  onClearSelection: () => void;
  isProcessing?: boolean;
  className?: string;
}

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  update_status: ArrowPathIcon,
  assign: UserPlusIcon,
  archive: ArchiveBoxIcon,
  unarchive: ArchiveBoxIcon,
  tag: TagIcon,
  delete: TrashIcon,
};

export function BulkSelectBar({
  selectedCount,
  entityType,
  entityLabel,
  onAction,
  onClearSelection,
  isProcessing = false,
  className,
}: BulkSelectBarProps) {
  const availableActions = getAvailableActions(entityType);
  const label = entityLabel || entityType.replace('_', ' ');

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'transform transition-all duration-300 ease-out',
        selectedCount > 0 ? 'translate-y-0' : 'translate-y-full',
        className
      )}
    >
      <div className="bg-gray-900 border-t border-gray-700 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Selection count */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full">
                <span className="text-sm font-medium text-white">
                  {selectedCount}
                </span>
              </div>
              <span className="text-sm text-white">
                {selectedCount === 1
                  ? `1 ${label.slice(0, -1)} selected`
                  : `${selectedCount} ${label} selected`}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {availableActions.map((actionConfig) => {
                const Icon = ACTION_ICONS[actionConfig.action] || ArrowPathIcon;
                const isDestructive = actionConfig.destructive;

                return (
                  <button
                    key={actionConfig.action}
                    onClick={() => onAction(actionConfig.action)}
                    disabled={isProcessing}
                    className={cn(
                      'inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg',
                      'transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                      isDestructive
                        ? 'text-red-300 hover:bg-red-900/50 hover:text-red-200'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    )}
                    title={actionConfig.description}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{actionConfig.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Clear selection */}
            <button
              onClick={onClearSelection}
              disabled={isProcessing}
              className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <XMarkIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simpler inline version for smaller contexts
interface InlineBulkBarProps {
  selectedCount: number;
  onAction: (action: BulkAction) => void;
  onClearSelection: () => void;
  actions: BulkAction[];
  isProcessing?: boolean;
}

export function InlineBulkBar({
  selectedCount,
  onAction,
  onClearSelection,
  actions,
  isProcessing = false,
}: InlineBulkBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <span className="text-sm font-medium text-blue-900">
        {selectedCount} selected
      </span>

      <div className="flex items-center gap-2">
        {actions.map((action) => {
          const Icon = ACTION_ICONS[action] || ArrowPathIcon;
          const isDestructive = action === 'delete';

          return (
            <button
              key={action}
              onClick={() => onAction(action)}
              disabled={isProcessing}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded',
                'transition-colors disabled:opacity-50',
                isDestructive
                  ? 'text-red-700 hover:bg-red-100'
                  : 'text-blue-700 hover:bg-blue-100'
              )}
            >
              <Icon className="h-3 w-3" />
              {action.replace('_', ' ')}
            </button>
          );
        })}
      </div>

      <button
        onClick={onClearSelection}
        disabled={isProcessing}
        className="ml-auto text-xs text-gray-500 hover:text-gray-700"
      >
        Clear
      </button>
    </div>
  );
}

export default BulkSelectBar;
