'use client';

import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  ExclamationTriangleIcon,
  ArchiveBoxIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { BulkAction } from '@/lib/bulk-operations/types';

interface BulkConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  action: BulkAction;
  itemCount: number;
  entityLabel?: string;
  confirmationType?: 'simple' | 'type_to_confirm';
  customMessage?: string;
  isLoading?: boolean;
}

const ACTION_CONFIG: Record<
  BulkAction,
  {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
  }
> = {
  delete: {
    title: 'Delete Items',
    icon: TrashIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  archive: {
    title: 'Archive Items',
    icon: ArchiveBoxIcon,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  unarchive: {
    title: 'Unarchive Items',
    icon: ArchiveBoxIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  update_status: {
    title: 'Update Status',
    icon: ExclamationTriangleIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  assign: {
    title: 'Assign Items',
    icon: ExclamationTriangleIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  unassign: {
    title: 'Unassign Items',
    icon: ExclamationTriangleIcon,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  tag: {
    title: 'Add Tags',
    icon: ExclamationTriangleIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  untag: {
    title: 'Remove Tags',
    icon: ExclamationTriangleIcon,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
};

export function BulkConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  action,
  itemCount,
  entityLabel = 'items',
  confirmationType = 'simple',
  customMessage,
  isLoading = false,
}: BulkConfirmDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const config = ACTION_CONFIG[action];
  const Icon = config.icon;

  const isDestructive = action === 'delete';
  const confirmWord = 'DELETE';
  const isConfirmValid =
    confirmationType === 'simple' ||
    confirmText.toUpperCase() === confirmWord;

  // Reset confirm text when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmText('');
    }
  }, [isOpen]);

  const defaultMessage =
    action === 'delete'
      ? `This will permanently delete ${itemCount} ${entityLabel}. This action cannot be undone.`
      : action === 'archive'
      ? `This will archive ${itemCount} ${entityLabel}. They can be unarchived later.`
      : `This will affect ${itemCount} ${entityLabel}.`;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Icon */}
                <div
                  className={cn(
                    'mx-auto flex h-12 w-12 items-center justify-center rounded-full',
                    config.bgColor
                  )}
                >
                  <Icon className={cn('h-6 w-6', config.color)} />
                </div>

                {/* Title */}
                <Dialog.Title
                  as="h3"
                  className="mt-4 text-lg font-semibold text-center text-gray-900"
                >
                  {config.title}
                </Dialog.Title>

                {/* Message */}
                <div className="mt-3">
                  <p className="text-sm text-center text-gray-500">
                    {customMessage || defaultMessage}
                  </p>

                  {/* Item count badge */}
                  <div className="mt-4 flex justify-center">
                    <span
                      className={cn(
                        'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                        isDestructive
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      )}
                    >
                      {itemCount} {entityLabel}
                    </span>
                  </div>
                </div>

                {/* Type to confirm input */}
                {confirmationType === 'type_to_confirm' && (
                  <div className="mt-4">
                    <label
                      htmlFor="confirm-input"
                      className="block text-sm font-medium text-gray-700 text-center mb-2"
                    >
                      Type <span className="font-bold text-red-600">{confirmWord}</span> to confirm
                    </label>
                    <input
                      id="confirm-input"
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder={confirmWord}
                      className={cn(
                        'w-full px-3 py-2 text-center border rounded-lg',
                        'focus:outline-none focus:ring-2',
                        isConfirmValid
                          ? 'border-green-300 focus:ring-green-500'
                          : 'border-gray-300 focus:ring-gray-500'
                      )}
                      autoComplete="off"
                      autoFocus
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className={cn(
                      'flex-1 px-4 py-2 text-sm font-medium rounded-lg',
                      'border border-gray-300 text-gray-700',
                      'hover:bg-gray-50 transition-colors',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onConfirm}
                    disabled={!isConfirmValid || isLoading}
                    className={cn(
                      'flex-1 px-4 py-2 text-sm font-medium rounded-lg',
                      'transition-colors',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      isDestructive
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    )}
                  >
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <svg
                          className="animate-spin h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      'Confirm'
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default BulkConfirmDialog;
