'use client';

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { BulkProgress, BulkResult } from '@/lib/bulk-operations/types';

interface BulkProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  progress?: BulkProgress;
  result?: BulkResult;
  isComplete: boolean;
  entityLabel?: string;
}

export function BulkProgressModal({
  isOpen,
  onClose,
  title = 'Processing',
  progress,
  result,
  isComplete,
  entityLabel = 'items',
}: BulkProgressModalProps) {
  const percentComplete = progress
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  const hasErrors = result && result.failed.length > 0;
  const allFailed = result && result.failed.length === result.total;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={() => {
          if (isComplete) onClose();
        }}
      >
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
                {/* Title */}
                <Dialog.Title
                  as="h3"
                  className="text-lg font-semibold text-gray-900 tracking-tight"
                >
                  {isComplete
                    ? allFailed
                      ? 'Operation Failed'
                      : hasErrors
                      ? 'Completed with Errors'
                      : 'Operation Complete'
                    : title}
                </Dialog.Title>

                {/* Progress section */}
                {!isComplete && progress && (
                  <div className="mt-4">
                    {/* Progress bar */}
                    <div className="relative pt-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Processing {entityLabel}...
                        </span>
                        <span className="text-sm font-medium text-gray-700">
                          {percentComplete}%
                        </span>
                      </div>
                      <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-200">
                        <div
                          className="transition-all duration-300 ease-out bg-brand-primary rounded-full"
                          style={{ width: `${percentComplete}%` }}
                        />
                      </div>
                    </div>

                    {/* Current item */}
                    {progress.currentItem && (
                      <p className="mt-2 text-sm text-gray-500 truncate">
                        Processing: {progress.currentItem}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="mt-4 flex gap-4 text-sm">
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircleIcon className="h-4 w-4" />
                        <span>{progress.successCount} succeeded</span>
                      </div>
                      {progress.failedCount > 0 && (
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircleIcon className="h-4 w-4" />
                          <span>{progress.failedCount} failed</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Result section */}
                {isComplete && result && (
                  <div className="mt-4">
                    {/* Summary icon */}
                    <div className="flex justify-center mb-4">
                      {allFailed ? (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                          <XCircleIcon className="h-6 w-6 text-red-600" />
                        </div>
                      ) : hasErrors ? (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                          <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                          <CheckCircleIcon className="h-6 w-6 text-green-600" />
                        </div>
                      )}
                    </div>

                    {/* Summary stats */}
                    <div className="grid grid-cols-3 gap-4 text-center mb-4">
                      <div>
                        <p className="text-2xl font-semibold text-gray-900">
                          {result.total}
                        </p>
                        <p className="text-sm text-gray-500">Total</p>
                      </div>
                      <div>
                        <p className="text-2xl font-semibold text-green-600">
                          {result.success.length}
                        </p>
                        <p className="text-sm text-gray-500">Succeeded</p>
                      </div>
                      <div>
                        <p
                          className={cn(
                            'text-2xl font-semibold',
                            result.failed.length > 0
                              ? 'text-red-600'
                              : 'text-gray-900'
                          )}
                        >
                          {result.failed.length}
                        </p>
                        <p className="text-sm text-gray-500">Failed</p>
                      </div>
                    </div>

                    {/* Duration */}
                    <p className="text-sm text-center text-gray-500 mb-4">
                      Completed in {(result.duration / 1000).toFixed(1)}s
                    </p>

                    {/* Failed items list */}
                    {hasErrors && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Failed items:
                        </p>
                        <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200">
                          {result.failed.map((item, index) => (
                            <div
                              key={item.id}
                              className={cn(
                                'px-3 py-2 text-sm',
                                index !== result.failed.length - 1 &&
                                  'border-b border-gray-100'
                              )}
                            >
                              <p className="font-medium text-gray-900 truncate">
                                {item.id}
                              </p>
                              <p className="text-red-600 text-xs truncate">
                                {item.error}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                {isComplete && (
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={onClose}
                      className={cn(
                        'w-full px-4 py-2 text-sm font-medium rounded-lg',
                        'transition-colors',
                        'bg-brand-primary text-white hover:opacity-90'
                      )}
                    >
                      Done
                    </button>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default BulkProgressModal;
