'use client';

import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import {
  ChevronDownIcon,
  ArrowPathIcon,
  UserPlusIcon,
  UserMinusIcon,
  ArchiveBoxIcon,
  ArchiveBoxArrowDownIcon,
  TagIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import {
  BulkAction,
  BulkEntityType,
  BulkActionConfig,
  getAvailableActions,
} from '@/lib/bulk-operations/types';

interface BulkActionMenuProps {
  entityType: BulkEntityType;
  onAction: (action: BulkAction) => void;
  disabled?: boolean;
  selectedCount?: number;
  className?: string;
}

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  update_status: ArrowPathIcon,
  assign: UserPlusIcon,
  unassign: UserMinusIcon,
  archive: ArchiveBoxIcon,
  unarchive: ArchiveBoxArrowDownIcon,
  tag: TagIcon,
  untag: TagIcon,
  delete: TrashIcon,
};

export function BulkActionMenu({
  entityType,
  onAction,
  disabled = false,
  selectedCount = 0,
  className,
}: BulkActionMenuProps) {
  const availableActions = getAvailableActions(entityType);

  // Group actions by type
  const primaryActions = availableActions.filter(
    (a) => !a.destructive && a.action !== 'unarchive' && a.action !== 'untag'
  );
  const secondaryActions = availableActions.filter(
    (a) => a.action === 'unarchive' || a.action === 'untag'
  );
  const destructiveActions = availableActions.filter((a) => a.destructive);

  return (
    <Menu as="div" className={cn('relative inline-block text-left', className)}>
      <Menu.Button
        disabled={disabled || selectedCount === 0}
        className={cn(
          'inline-flex items-center justify-center gap-2 px-4 py-2',
          'text-sm font-medium rounded-lg border',
          'transition-colors',
          disabled || selectedCount === 0
            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        )}
      >
        Actions
        {selectedCount > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
            {selectedCount}
          </span>
        )}
        <ChevronDownIcon className="h-4 w-4" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {/* Primary actions */}
            {primaryActions.map((action) => (
              <ActionMenuItem
                key={action.action}
                config={action}
                onClick={() => onAction(action.action)}
              />
            ))}

            {/* Secondary actions */}
            {secondaryActions.length > 0 && (
              <>
                <div className="border-t border-gray-100 my-1" />
                {secondaryActions.map((action) => (
                  <ActionMenuItem
                    key={action.action}
                    config={action}
                    onClick={() => onAction(action.action)}
                  />
                ))}
              </>
            )}

            {/* Destructive actions */}
            {destructiveActions.length > 0 && (
              <>
                <div className="border-t border-gray-100 my-1" />
                {destructiveActions.map((action) => (
                  <ActionMenuItem
                    key={action.action}
                    config={action}
                    onClick={() => onAction(action.action)}
                    destructive
                  />
                ))}
              </>
            )}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

interface ActionMenuItemProps {
  config: BulkActionConfig;
  onClick: () => void;
  destructive?: boolean;
}

function ActionMenuItem({
  config,
  onClick,
  destructive = false,
}: ActionMenuItemProps) {
  const Icon = ACTION_ICONS[config.action] || ArrowPathIcon;

  return (
    <Menu.Item>
      {({ active }) => (
        <button
          onClick={onClick}
          className={cn(
            'flex items-center gap-3 w-full px-4 py-2 text-sm text-left',
            'transition-colors',
            active && !destructive && 'bg-gray-100',
            active && destructive && 'bg-red-50',
            destructive ? 'text-red-700' : 'text-gray-700'
          )}
        >
          <Icon
            className={cn(
              'h-4 w-4 flex-shrink-0',
              destructive ? 'text-red-500' : 'text-gray-400'
            )}
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{config.label}</p>
            {config.description && (
              <p
                className={cn(
                  'text-xs truncate',
                  destructive ? 'text-red-500' : 'text-gray-500'
                )}
              >
                {config.description}
              </p>
            )}
          </div>
        </button>
      )}
    </Menu.Item>
  );
}

// Simplified inline action buttons
interface BulkActionButtonsProps {
  entityType: BulkEntityType;
  onAction: (action: BulkAction) => void;
  disabled?: boolean;
  className?: string;
}

export function BulkActionButtons({
  entityType,
  onAction,
  disabled = false,
  className,
}: BulkActionButtonsProps) {
  const availableActions = getAvailableActions(entityType);

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {availableActions.map((action) => {
        const Icon = ACTION_ICONS[action.action] || ArrowPathIcon;
        const isDestructive = action.destructive;

        return (
          <button
            key={action.action}
            onClick={() => onAction(action.action)}
            disabled={disabled}
            title={action.description || action.label}
            className={cn(
              'inline-flex items-center justify-center p-2 rounded-lg',
              'transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              isDestructive
                ? 'text-red-600 hover:bg-red-50'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}

export default BulkActionMenu;
