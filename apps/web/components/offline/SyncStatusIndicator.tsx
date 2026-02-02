'use client';

import React from 'react';
import { ArrowPathIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useOffline } from './OfflineProvider';

/**
 * SyncStatusIndicator
 * Shows sync status with pending/failed operation counts
 */
export function SyncStatusIndicator() {
  const { state, syncNow } = useOffline();

  // Nothing to show if no pending items and online
  if (state.isOnline && state.pendingCount === 0 && state.failedCount === 0) {
    return null;
  }

  // Currently syncing
  if (state.syncingCount > 0) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
        <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
        <span>Syncing...</span>
      </div>
    );
  }

  // Has failed items
  if (state.failedCount > 0) {
    return (
      <button
        onClick={syncNow}
        className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-200 transition-colors"
      >
        <ExclamationTriangleIcon className="h-3.5 w-3.5" />
        <span>{state.failedCount} failed</span>
      </button>
    );
  }

  // Has pending items
  if (state.pendingCount > 0) {
    return (
      <button
        onClick={syncNow}
        className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-200 transition-colors"
      >
        <ArrowPathIcon className="h-3.5 w-3.5" />
        <span>{state.pendingCount} pending</span>
      </button>
    );
  }

  // Just came back online, show success briefly
  if (state.wasOffline && state.lastSuccessfulSync) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
        <CheckCircleIcon className="h-3.5 w-3.5" />
        <span>Synced</span>
      </div>
    );
  }

  return null;
}

/**
 * Detailed sync status for settings/debug view
 */
export function SyncStatusDetails() {
  const { state, syncNow } = useOffline();

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Sync Status</h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Connection</span>
          <span className={state.isOnline ? 'text-green-600' : 'text-red-600'}>
            {state.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Pending changes</span>
          <span className="text-gray-900">{state.pendingCount}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Currently syncing</span>
          <span className="text-gray-900">{state.syncingCount}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Failed</span>
          <span className={state.failedCount > 0 ? 'text-red-600' : 'text-gray-900'}>
            {state.failedCount}
          </span>
        </div>

        {state.lastSuccessfulSync && (
          <div className="flex justify-between">
            <span className="text-gray-500">Last sync</span>
            <span className="text-gray-900">
              {new Date(state.lastSuccessfulSync).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      {state.pendingCount > 0 && state.isOnline && (
        <button
          onClick={syncNow}
          className="mt-4 w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Sync Now
        </button>
      )}
    </div>
  );
}
