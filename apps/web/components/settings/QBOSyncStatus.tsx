"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { StatsGrid, StatItem } from '@/components/ui/StatsGrid';
import EmptyState from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import {
  ArrowPathIcon,
  UserGroupIcon,
  DocumentTextIcon,
  BanknotesIcon,
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

// ============================================================================
// Types
// ============================================================================

interface QBOSyncStatusProps {
  orgId?: string;
}

interface SyncLog {
  id: string;
  orgId: string;
  provider: string;
  action: 'sync_customers' | 'sync_invoices' | 'sync_expenses' | 'sync_payments' | 'full_sync';
  status: 'started' | 'completed' | 'failed';
  itemsSynced: number;
  itemsFailed: number;
  errors: string[];
  startedAt: string;
  completedAt?: string;
  duration?: number;
}

interface SyncStats {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  totalItemsSynced: number;
  totalItemsFailed: number;
}

interface LastSyncEntry {
  status: string;
  startedAt: string;
  completedAt?: string;
  itemsSynced: number;
  itemsFailed: number;
}

interface SyncStatusResponse {
  connected: boolean;
  companyName?: string;
  inProgress?: boolean;
  lastSync?: {
    customers: LastSyncEntry | null;
    invoices: LastSyncEntry | null;
    payments: LastSyncEntry | null;
  };
  stats?: SyncStats;
  message?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.round((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 10) return 'just now';
  if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
  if (diffMinutes === 1) return '1 minute ago';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

type SyncAction = SyncLog['action'];

const ACTION_LABELS: Record<SyncAction, string> = {
  sync_customers: 'Customer Sync',
  sync_invoices: 'Invoice Sync',
  sync_expenses: 'Expense Sync',
  sync_payments: 'Payment Sync',
  full_sync: 'Full Sync',
};

function getActionLabel(action: string): string {
  return ACTION_LABELS[action as SyncAction] || action;
}

const ACTION_ICONS: Record<SyncAction, React.ComponentType<{ className?: string }>> = {
  sync_customers: UserGroupIcon,
  sync_invoices: DocumentTextIcon,
  sync_expenses: BanknotesIcon,
  sync_payments: CreditCardIcon,
  full_sync: ArrowPathIcon,
};

function getActionIcon(action: string): React.ComponentType<{ className?: string }> {
  return ACTION_ICONS[action as SyncAction] || ArrowPathIcon;
}

function getHealthStatus(stats: SyncStats): {
  label: string;
  variant: 'success' | 'warning' | 'danger';
} {
  if (stats.totalSyncs === 0) {
    return { label: 'No Data', variant: 'warning' };
  }
  const failRate = stats.failedSyncs / stats.totalSyncs;
  if (failRate > 0.2) {
    return { label: 'Issues', variant: 'danger' };
  }
  if (failRate > 0.05) {
    return { label: 'Warning', variant: 'warning' };
  }
  return { label: 'Healthy', variant: 'success' };
}

// ============================================================================
// Sub-Components
// ============================================================================

function SyncLogRow({ log }: { log: SyncLog }) {
  const [expanded, setExpanded] = useState(false);
  const ActionIcon = getActionIcon(log.action);
  const hasErrors = log.errors.length > 0;
  const isRunning = log.status === 'started';

  const statusConfig = {
    completed: { variant: 'success' as const, label: 'Completed' },
    failed: { variant: 'danger' as const, label: 'Failed' },
    started: { variant: 'info' as const, label: 'Running' },
  };

  const config = statusConfig[log.status] || statusConfig.started;

  return (
    <div className="group">
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 transition-colors',
          'hover:bg-gray-50/80',
          hasErrors && 'cursor-pointer'
        )}
        onClick={hasErrors ? () => setExpanded(!expanded) : undefined}
      >
        {/* Action Icon */}
        <div
          className={cn(
            'flex-shrink-0 p-2 rounded-lg',
            log.status === 'failed'
              ? 'bg-red-50 text-red-600'
              : log.status === 'started'
              ? 'bg-blue-50 text-blue-600'
              : 'bg-gray-50 text-gray-500'
          )}
        >
          <ActionIcon
            className={cn('h-4 w-4', isRunning && 'animate-spin')}
          />
        </div>

        {/* Action Label & Time */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {getActionLabel(log.action)}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatTimeAgo(log.startedAt)}
          </p>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500">
          <span className="tabular-nums">
            <span className="text-green-600 font-medium">{log.itemsSynced}</span> synced
          </span>
          {log.itemsFailed > 0 && (
            <span className="tabular-nums">
              <span className="text-red-600 font-medium">{log.itemsFailed}</span> failed
            </span>
          )}
          {log.duration != null && (
            <span className="tabular-nums text-gray-400 w-16 text-right">
              {formatDuration(log.duration)}
            </span>
          )}
        </div>

        {/* Status Badge */}
        <Badge variant={config.variant} size="sm" dot>
          {config.label}
        </Badge>

        {/* Expand toggle for errors */}
        {hasErrors && (
          <button
            type="button"
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={expanded ? 'Collapse errors' : 'Expand errors'}
          >
            {expanded ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Mobile stats row */}
      <div className="sm:hidden px-4 pb-2 flex items-center gap-3 text-xs text-gray-500">
        <span className="tabular-nums">
          <span className="text-green-600 font-medium">{log.itemsSynced}</span> synced
        </span>
        {log.itemsFailed > 0 && (
          <span className="tabular-nums">
            <span className="text-red-600 font-medium">{log.itemsFailed}</span> failed
          </span>
        )}
        {log.duration != null && (
          <span className="tabular-nums text-gray-400">
            {formatDuration(log.duration)}
          </span>
        )}
      </div>

      {/* Error Details */}
      {expanded && hasErrors && (
        <div className="px-4 pb-3">
          <div className="ml-10 bg-red-50 border border-red-100 rounded-lg p-3">
            <p className="text-xs font-medium text-red-800 mb-1.5">
              {log.errors.length} error{log.errors.length !== 1 ? 's' : ''}
            </p>
            <ul className="space-y-1">
              {log.errors.slice(0, 5).map((error, i) => (
                <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                  <XCircleIcon className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  <span className="break-all">{error}</span>
                </li>
              ))}
              {log.errors.length > 5 && (
                <li className="text-xs text-red-500 italic pl-5">
                  ...and {log.errors.length - 5} more
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function QBOSyncStatus({ orgId: propOrgId }: QBOSyncStatusProps) {
  const { profile } = useAuth();
  const orgId = propOrgId || profile?.orgId;

  const [data, setData] = useState<SyncStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // ---- Fetch sync status ----
  const fetchSyncStatus = useCallback(async () => {
    if (!orgId) return;

    try {
      const response = await fetch('/api/integrations/quickbooks/sync', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch sync status (${response.status})`);
      }

      const json: SyncStatusResponse = await response.json();
      setData(json);
      setError(null);
      setLastFetchedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sync status');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  // Initial fetch
  useEffect(() => {
    fetchSyncStatus();
  }, [fetchSyncStatus]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSyncStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchSyncStatus]);

  // Force refresh counter for "last updated" display
  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshCounter((c) => c + 1);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    fetchSyncStatus();
  }, [fetchSyncStatus]);

  // ---- Build stats for StatsGrid ----
  const stats: SyncStats = data?.stats || {
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    totalItemsSynced: 0,
    totalItemsFailed: 0,
  };

  const health = useMemo(() => getHealthStatus(stats), [stats]);

  const statItems: StatItem[] = useMemo(
    () => [
      {
        label: 'Total Syncs',
        value: stats.totalSyncs,
        icon: ArrowPathIcon,
        iconColor: 'text-blue-600',
        description: 'Last 30 days',
      },
      {
        label: 'Successful',
        value: stats.successfulSyncs,
        icon: CheckCircleIcon,
        iconColor: 'text-green-600',
      },
      {
        label: 'Failed',
        value: stats.failedSyncs,
        icon: stats.failedSyncs > 0 ? XCircleIcon : ExclamationTriangleIcon,
        iconColor: stats.failedSyncs > 0 ? 'text-red-600' : 'text-amber-500',
      },
      {
        label: 'Items Synced',
        value: stats.totalItemsSynced,
        icon: DocumentTextIcon,
        iconColor: 'text-purple-600',
      },
    ],
    [stats]
  );

  // ---- Build recent logs from lastSync data ----
  const recentLogs: SyncLog[] = useMemo(() => {
    if (!data?.lastSync) return [];

    const logs: SyncLog[] = [];

    const addLog = (
      action: SyncLog['action'],
      entry: LastSyncEntry | null
    ) => {
      if (!entry) return;
      logs.push({
        id: `${action}-${entry.startedAt}`,
        orgId: orgId || '',
        provider: 'quickbooks',
        action,
        status: entry.status as SyncLog['status'],
        itemsSynced: entry.itemsSynced,
        itemsFailed: entry.itemsFailed,
        errors: [],
        startedAt: entry.startedAt,
        completedAt: entry.completedAt,
        duration: entry.completedAt
          ? new Date(entry.completedAt).getTime() - new Date(entry.startedAt).getTime()
          : undefined,
      });
    };

    addLog('sync_customers', data.lastSync.customers);
    addLog('sync_invoices', data.lastSync.invoices);
    addLog('sync_payments', data.lastSync.payments);

    // Sort by startedAt descending
    logs.sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );

    return logs;
  }, [data?.lastSync, orgId]);

  // ---- Last updated text ----
  const lastUpdatedText = useMemo(() => {
    // Reference refreshCounter to trigger re-computation
    void refreshCounter;
    if (!lastFetchedAt) return '';
    return formatTimeAgo(lastFetchedAt.toISOString());
  }, [lastFetchedAt, refreshCounter]);

  // ---- Render ----

  if (!orgId) {
    return null;
  }

  return (
    <Card padding="lg">
      {/* Header */}
      <CardHeader
        action={
          <div className="flex items-center gap-3">
            {/* Health badge */}
            {data?.connected && (
              <Badge variant={health.variant} size="sm" dot>
                {health.label}
              </Badge>
            )}

            {/* Last updated */}
            {lastUpdatedText && (
              <span className="hidden sm:inline text-xs text-gray-400">
                Updated {lastUpdatedText}
              </span>
            )}

            {/* Refresh button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className={cn(
                'p-1.5 rounded-lg text-gray-400 hover:text-gray-600',
                'hover:bg-gray-100 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              aria-label="Refresh sync status"
            >
              <ArrowPathIcon
                className={cn('h-4 w-4', loading && 'animate-spin')}
              />
            </button>
          </div>
        }
      >
        <div className="flex items-center gap-2">
          <ArrowPathIcon className="h-5 w-5 text-gray-400" />
          <CardTitle>Sync History</CardTitle>
        </div>
      </CardHeader>

      {/* Error state */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-2">
          <XCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">
              Failed to load sync data
            </p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Not connected */}
      {data && !data.connected && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex items-start gap-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              QuickBooks is not connected
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Connect your QuickBooks account to see sync history and status.
            </p>
          </div>
        </div>
      )}

      {/* Connected: Stats + Logs */}
      {data?.connected && (
        <div className="space-y-6">
          {/* In-progress banner */}
          {data.inProgress && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center gap-2">
              <ArrowPathIcon className="h-4 w-4 text-blue-600 animate-spin flex-shrink-0" />
              <p className="text-sm text-blue-800 font-medium">
                Sync in progress...
              </p>
            </div>
          )}

          {/* Company name */}
          {data.companyName && (
            <p className="text-xs text-gray-400">
              Connected to{' '}
              <span className="font-medium text-gray-600">
                {data.companyName}
              </span>
            </p>
          )}

          {/* Stats Grid */}
          <StatsGrid stats={statItems} columns={4} loading={loading && !data} />

          {/* Recent Sync Logs */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
              <ClockIcon className="h-4 w-4 text-gray-400" />
              Recent Activity
            </h4>

            {recentLogs.length === 0 ? (
              <EmptyState
                icon={<ArrowPathIcon className="h-full w-full" />}
                title="No sync activity yet"
                description="Run a manual sync to get started."
                size="sm"
              />
            ) : (
              <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
                {recentLogs.slice(0, 10).map((log) => (
                  <SyncLogRow key={log.id} log={log} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !data && (
        <div className="space-y-6">
          <StatsGrid
            stats={[
              { label: 'Total Syncs', value: 0 },
              { label: 'Successful', value: 0 },
              { label: 'Failed', value: 0 },
              { label: 'Items Synced', value: 0 },
            ]}
            columns={4}
            loading
          />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 px-4 py-3">
                <div className="h-8 w-8 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-28 bg-gray-200 rounded" />
                  <div className="h-2.5 w-20 bg-gray-100 rounded" />
                </div>
                <div className="h-5 w-16 bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
