'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CloudIcon,
  CloudArrowUpIcon,
  WifiIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useOffline } from './OfflineProvider';
import { cn } from '@/lib/utils';
import { SyncEvent } from '@/lib/offline/types';
import { SyncManager } from '@/lib/offline/sync-manager';

/**
 * SyncStatusIndicator
 * Shows sync status with pending/failed operation counts
 * Inline version for headers/navbars
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
        onClick={() => syncNow()}
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
        onClick={() => syncNow()}
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
 * Floating Sync Status Indicator
 * Fixed position indicator that shows in corner of screen
 */
interface FloatingSyncIndicatorProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showWhenOnline?: boolean;
  className?: string;
}

type IndicatorStatus = 'online' | 'offline' | 'syncing' | 'pending' | 'error' | 'success';

export function FloatingSyncIndicator({
  position = 'bottom-right',
  showWhenOnline = false,
  className,
}: FloatingSyncIndicatorProps) {
  const { state, syncNow } = useOffline();
  const [status, setStatus] = useState<IndicatorStatus>('online');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [recentSuccess, setRecentSuccess] = useState(false);

  // Subscribe to sync events
  useEffect(() => {
    const unsubscribe = SyncManager.onSyncEvent((event: SyncEvent) => {
      switch (event.type) {
        case 'sync-started':
          setToastMessage('Syncing changes...');
          setShowToast(true);
          break;
        case 'sync-completed':
          setToastMessage('Changes synced successfully');
          setShowToast(true);
          setRecentSuccess(true);
          setTimeout(() => setRecentSuccess(false), 3000);
          setTimeout(() => setShowToast(false), 2000);
          break;
        case 'sync-failed':
          setToastMessage(`Sync failed: ${event.error || 'Unknown error'}`);
          setShowToast(true);
          setTimeout(() => setShowToast(false), 5000);
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Determine current status
  useEffect(() => {
    if (!state.isOnline) {
      setStatus('offline');
    } else if (state.syncingCount > 0) {
      setStatus('syncing');
    } else if (state.failedCount > 0) {
      setStatus('error');
    } else if (state.pendingCount > 0) {
      setStatus('pending');
    } else if (recentSuccess) {
      setStatus('success');
    } else {
      setStatus('online');
    }
  }, [state, recentSuccess]);

  // Handle retry
  const handleRetry = async () => {
    try {
      await syncNow();
    } catch (error) {
      console.error('Force sync failed:', error);
    }
  };

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-20 md:bottom-4 right-4',
    'bottom-left': 'bottom-20 md:bottom-4 left-4',
  };

  // Don't show when online and no pending items (unless explicitly requested)
  const shouldShow =
    showWhenOnline ||
    status !== 'online' ||
    state.pendingCount > 0 ||
    state.failedCount > 0 ||
    recentSuccess;

  if (!shouldShow) {
    return null;
  }

  return (
    <>
      {/* Main indicator */}
      <div
        className={cn(
          'fixed z-40 transition-all duration-300',
          positionClasses[position],
          className
        )}
      >
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-full shadow-lg cursor-pointer transition-all',
            'border backdrop-blur-sm',
            expanded ? 'rounded-xl' : '',
            status === 'offline' && 'bg-gray-800/95 border-gray-700 text-white',
            status === 'syncing' && 'bg-blue-600/95 border-blue-500 text-white',
            status === 'pending' && 'bg-amber-500/95 border-amber-400 text-white',
            status === 'error' && 'bg-red-500/95 border-red-400 text-white',
            status === 'success' && 'bg-green-500/95 border-green-400 text-white',
            status === 'online' && 'bg-white/95 border-gray-200 text-gray-700'
          )}
          onClick={() => setExpanded(!expanded)}
        >
          <StatusIcon status={status} />

          <span className="text-sm font-medium whitespace-nowrap">
            {status === 'offline' && 'Offline'}
            {status === 'syncing' && 'Syncing...'}
            {status === 'pending' && `${state.pendingCount} pending`}
            {status === 'error' && `${state.failedCount} failed`}
            {status === 'success' && 'Synced'}
            {status === 'online' && showWhenOnline && 'Online'}
          </span>

          {(status === 'pending' || status === 'error') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRetry();
              }}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Retry sync"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Expanded details */}
        {expanded && (
          <div
            className={cn(
              'mt-2 p-4 rounded-xl shadow-lg border backdrop-blur-sm min-w-[200px]',
              status === 'offline'
                ? 'bg-gray-800/95 border-gray-700 text-white'
                : 'bg-white/95 border-gray-200'
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Sync Status</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(false);
                }}
                className={cn(
                  'p-1 rounded',
                  status === 'offline' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                )}
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className={status === 'offline' ? 'text-gray-400' : 'text-gray-500'}>
                  Connection
                </span>
                <span
                  className={cn(
                    'flex items-center gap-1',
                    state.isOnline ? 'text-green-500' : 'text-red-500'
                  )}
                >
                  <WifiIcon className="h-4 w-4" />
                  {state.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className={status === 'offline' ? 'text-gray-400' : 'text-gray-500'}>
                  Pending
                </span>
                <span>{state.pendingCount}</span>
              </div>

              {state.failedCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className={status === 'offline' ? 'text-gray-400' : 'text-gray-500'}>
                    Failed
                  </span>
                  <span className="text-red-500">{state.failedCount}</span>
                </div>
              )}

              {state.lastSuccessfulSync && (
                <div className="flex items-center justify-between">
                  <span className={status === 'offline' ? 'text-gray-400' : 'text-gray-500'}>
                    Last sync
                  </span>
                  <span>{formatTimeAgo(state.lastSuccessfulSync)}</span>
                </div>
              )}
            </div>

            {(state.pendingCount > 0 || state.failedCount > 0) && state.isOnline && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRetry();
                }}
                className="mt-3 w-full py-2 px-3 rounded-lg text-sm font-medium bg-brand-primary text-white hover:opacity-90 transition-colors"
              >
                Sync Now
              </button>
            )}
          </div>
        )}
      </div>

      {/* Toast notification */}
      {showToast && (
        <div
          className={cn(
            'fixed z-50 px-4 py-2 rounded-lg shadow-lg transition-all duration-300',
            'text-sm font-medium',
            position.includes('right') ? 'right-4' : 'left-4',
            position.includes('top') ? 'top-20' : 'bottom-32 md:bottom-16',
            status === 'error' ? 'bg-red-600 text-white' : 'bg-gray-800 text-white'
          )}
        >
          {toastMessage}
        </div>
      )}
    </>
  );
}

// Status icon component
function StatusIcon({ status }: { status: IndicatorStatus }) {
  const iconClass = 'h-5 w-5';

  switch (status) {
    case 'offline':
      return <CloudIcon className={cn(iconClass, 'text-gray-300')} />;
    case 'syncing':
      return <ArrowPathIcon className={cn(iconClass, 'animate-spin')} />;
    case 'pending':
      return <CloudArrowUpIcon className={iconClass} />;
    case 'error':
      return <ExclamationTriangleIcon className={iconClass} />;
    case 'success':
      return <CheckCircleIcon className={iconClass} />;
    case 'online':
    default:
      return <WifiIcon className={cn(iconClass, 'text-green-500')} />;
  }
}

// Format time ago helper
function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Detailed sync status for settings/debug view
 */
export function SyncStatusDetails() {
  const { state, syncNow, getPendingOperations } = useOffline();
  const [pendingOps, setPendingOps] = useState<
    { id: string; type: string; collection: string; status: string }[]
  >([]);

  useEffect(() => {
    const loadOps = async () => {
      const ops = await getPendingOperations();
      setPendingOps(
        ops.map((op) => ({
          id: op.id,
          type: op.type,
          collection: op.collection,
          status: op.status,
        }))
      );
    };

    loadOps();
    const interval = setInterval(loadOps, 5000);
    return () => clearInterval(interval);
  }, [getPendingOperations]);

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

      {/* Pending operations list */}
      {pendingOps.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
            Pending Operations
          </h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {pendingOps.map((op) => (
              <div
                key={op.id}
                className="flex items-center justify-between text-xs py-1"
              >
                <span className="text-gray-600">
                  {op.type} {op.collection}
                </span>
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded text-xs',
                    op.status === 'pending' && 'bg-yellow-100 text-yellow-700',
                    op.status === 'syncing' && 'bg-blue-100 text-blue-700',
                    op.status === 'failed' && 'bg-red-100 text-red-700'
                  )}
                >
                  {op.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {state.pendingCount > 0 && state.isOnline && (
        <button
          onClick={() => syncNow()}
          className="mt-4 w-full rounded-md bg-brand-primary px-3 py-2 text-sm font-medium text-white hover:opacity-90 transition-colors"
        >
          Sync Now
        </button>
      )}
    </div>
  );
}

export default SyncStatusIndicator;
