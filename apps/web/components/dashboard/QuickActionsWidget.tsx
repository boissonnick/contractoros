'use client';

import React, { useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FolderPlusIcon,
  DocumentPlusIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ReceiptPercentIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui';

// ============================================================================
// TYPES
// ============================================================================

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  shortcut?: string; // e.g., "⌘N"
  description?: string;
}

export interface QuickActionsWidgetProps {
  actions?: QuickAction[];
  className?: string;
  onUploadPhoto?: () => void;
}

// ============================================================================
// DEFAULT ACTIONS
// ============================================================================

const getDefaultActions = (onUploadPhoto?: () => void): QuickAction[] => [
  {
    id: 'new-project',
    label: 'New Project',
    icon: FolderPlusIcon,
    href: '/dashboard/projects?new=true',
    shortcut: '\u2318\u21E7P',
    description: 'Create a new project',
  },
  {
    id: 'new-estimate',
    label: 'New Estimate',
    icon: DocumentPlusIcon,
    href: '/dashboard/estimates?new=true',
    shortcut: '\u2318\u21E7E',
    description: 'Create a new estimate',
  },
  {
    id: 'new-invoice',
    label: 'New Invoice',
    icon: CurrencyDollarIcon,
    href: '/dashboard/invoices?new=true',
    shortcut: '\u2318\u21E7I',
    description: 'Create a new invoice',
  },
  {
    id: 'log-time',
    label: 'Log Time',
    icon: ClockIcon,
    href: '/dashboard/schedule?log=true',
    shortcut: '\u2318\u21E7T',
    description: 'Log time entry',
  },
  {
    id: 'add-expense',
    label: 'Add Expense',
    icon: ReceiptPercentIcon,
    href: '/dashboard/expenses?new=true',
    description: 'Record an expense',
  },
  {
    id: 'upload-photo',
    label: 'Upload Photo',
    icon: CameraIcon,
    onClick: onUploadPhoto,
    shortcut: '\u2318\u21E7U',
    description: 'Upload a photo',
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function QuickActionsWidget({
  actions,
  className = '',
  onUploadPhoto,
}: QuickActionsWidgetProps) {
  const router = useRouter();

  const displayActions = actions || getDefaultActions(onUploadPhoto);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Check for Cmd/Ctrl + Shift combinations
      if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        const key = e.key.toUpperCase();

        const shortcutMap: Record<string, QuickAction | undefined> = {
          P: displayActions.find((a) => a.id === 'new-project'),
          E: displayActions.find((a) => a.id === 'new-estimate'),
          I: displayActions.find((a) => a.id === 'new-invoice'),
          T: displayActions.find((a) => a.id === 'log-time'),
          U: displayActions.find((a) => a.id === 'upload-photo'),
        };

        const action = shortcutMap[key];
        if (action) {
          e.preventDefault();
          if (action.onClick) {
            action.onClick();
          } else if (action.href) {
            router.push(action.href);
          }
        }
      }
    },
    [displayActions, router]
  );

  // Register keyboard shortcuts
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleActionClick = (action: QuickAction) => {
    if (action.onClick) {
      action.onClick();
    }
    // If href is provided, Link component handles navigation
  };

  return (
    <Card className={`p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">Quick Actions</h2>
        <span className="text-xs text-gray-400">Use keyboard shortcuts</span>
      </div>

      {/* Actions Grid - 3 columns x 2 rows */}
      <div className="grid grid-cols-3 gap-2">
        {displayActions.map((action) => {
          const Icon = action.icon;

          const buttonContent = (
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-100 hover:border-gray-200 transition-all cursor-pointer group relative">
              {/* Icon */}
              <div className="p-2 rounded-lg bg-white border border-gray-100 group-hover:border-gray-200 group-hover:shadow-sm transition-all">
                <Icon className="h-5 w-5 text-gray-600 group-hover:text-gray-900 transition-colors" />
              </div>

              {/* Label */}
              <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900 text-center leading-tight transition-colors">
                {action.label}
              </span>

              {/* Keyboard Shortcut */}
              {action.shortcut && (
                <span className="absolute bottom-1 right-1 text-[10px] text-gray-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                  {action.shortcut}
                </span>
              )}
            </div>
          );

          // If href is provided, wrap in Link
          if (action.href) {
            return (
              <Link
                key={action.id}
                href={action.href}
                className="block"
                title={action.description}
              >
                {buttonContent}
              </Link>
            );
          }

          // Otherwise, use button with onClick
          return (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              className="block w-full text-left"
              title={action.description}
            >
              {buttonContent}
            </button>
          );
        })}
      </div>

      {/* Footer hint */}
      <p className="mt-3 text-[11px] text-gray-400 text-center">
        Press shortcuts like{' '}
        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">
          {'\u2318\u21E7P'}
        </kbd>{' '}
        to create quickly
      </p>
    </Card>
  );
}

export default QuickActionsWidget;
