"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Badge,
  Button,
  PageHeader,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  TableEmpty,
  Skeleton,
} from '@/components/ui';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowTopRightOnSquareIcon,
  ChevronRightIcon,
  LinkIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';
import {
  QuickBooksLogo,
  StripeLogo,
  GustoLogo,
} from '@/components/integrations';
import {
  useIntegrationStatus,
  useIntegrationSyncLogs,
  useTriggerSync,
  IntegrationType,
  IntegrationStatus,
  SyncLogEntry,
  INTEGRATION_LABELS,
  INTEGRATION_DESCRIPTIONS,
  SYNC_STATUS_LABELS,
  getSyncStatusColor,
  formatLastSync,
} from '@/lib/hooks/useIntegrationStatus';

// ============================================
// Integration Card Component
// ============================================

interface IntegrationCardProps {
  integration: IntegrationStatus;
  onSync: () => void;
  syncing: boolean;
}

function IntegrationCard({ integration, onSync, syncing }: IntegrationCardProps) {
  const _statusColors = getSyncStatusColor(integration.syncStatus);

  const getLogo = () => {
    switch (integration.type) {
      case 'quickbooks':
        return <QuickBooksLogo width={100} height={28} />;
      case 'stripe':
        return <StripeLogo width={50} height={22} />;
      case 'gusto':
        return <GustoLogo width={70} height={24} />;
      default:
        return null;
    }
  };

  const getStatusIcon = () => {
    switch (integration.syncStatus) {
      case 'healthy':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'never_synced':
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <Card className="relative overflow-hidden">
      {/* Status indicator bar at top */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${
          integration.connected
            ? integration.syncStatus === 'healthy'
              ? 'bg-green-500'
              : integration.syncStatus === 'warning'
              ? 'bg-yellow-500'
              : integration.syncStatus === 'error'
              ? 'bg-red-500'
              : 'bg-gray-300'
            : 'bg-gray-200'
        }`}
      />

      <CardHeader className="pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
              {getLogo()}
            </div>
            <div>
              <CardTitle className="text-base">
                {INTEGRATION_LABELS[integration.type]}
              </CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                {INTEGRATION_DESCRIPTIONS[integration.type]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Badge
              variant={
                integration.syncStatus === 'healthy'
                  ? 'success'
                  : integration.syncStatus === 'warning'
                  ? 'warning'
                  : integration.syncStatus === 'error'
                  ? 'danger'
                  : 'default'
              }
              size="sm"
            >
              {integration.connected ? SYNC_STATUS_LABELS[integration.syncStatus] : 'Not Connected'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {integration.connected ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Last Sync</p>
              <p className="text-sm font-medium text-gray-900">
                {formatLastSync(integration.lastSyncAt)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Next Scheduled</p>
              <p className="text-sm font-medium text-gray-900">
                {integration.nextSyncAt
                  ? integration.nextSyncAt.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Not scheduled'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Items Synced (24h)</p>
              <p className="text-sm font-medium text-gray-900">
                {integration.itemsSyncedLast24h.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Errors</p>
              <p
                className={`text-sm font-medium ${
                  integration.errorCount > 0 ? 'text-red-600' : 'text-gray-900'
                }`}
              >
                {integration.errorCount}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <LinkIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              Connect {INTEGRATION_LABELS[integration.type]} to sync data
            </p>
          </div>
        )}

        {integration.lastError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg">
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{integration.lastError}</p>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between bg-gray-50 -mx-4 -mb-4 px-4 py-3">
        {integration.connected ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onSync}
              loading={syncing}
              disabled={syncing}
              icon={<ArrowPathIcon className="w-4 h-4" />}
            >
              Sync Now
            </Button>
            <Link
              href={`/dashboard/settings/integrations/${integration.type}`}
              className="text-sm text-brand-primary hover:underline flex items-center gap-1"
            >
              Settings
              <ChevronRightIcon className="w-3 h-3" />
            </Link>
          </>
        ) : (
          <Link
            href={`/dashboard/settings/integrations/${integration.type}`}
            className="w-full"
          >
            <Button variant="primary" size="sm" className="w-full">
              Connect
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}

// ============================================
// Sync Log Row Component
// ============================================

interface SyncLogRowProps {
  log: SyncLogEntry;
}

function SyncLogRow({ log }: SyncLogRowProps) {
  const duration = Math.round(
    (log.completedAt.getTime() - log.startedAt.getTime()) / 1000
  );

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              log.status === 'success'
                ? 'success'
                : log.status === 'partial'
                ? 'warning'
                : 'danger'
            }
            size="sm"
          >
            {log.status === 'success'
              ? 'Success'
              : log.status === 'partial'
              ? 'Partial'
              : 'Failed'}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm font-medium">
          {INTEGRATION_LABELS[log.integrationType]}
        </span>
      </TableCell>
      <TableCell priority="medium">
        <Badge variant="default" size="sm">
          {log.syncType === 'manual'
            ? 'Manual'
            : log.syncType === 'scheduled'
            ? 'Scheduled'
            : 'Webhook'}
        </Badge>
      </TableCell>
      <TableCell priority="medium">
        <span className="text-sm text-gray-600">
          {log.direction === 'push'
            ? 'Push'
            : log.direction === 'pull'
            ? 'Pull'
            : 'Both'}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-sm text-gray-900">{log.itemsSynced}</span>
        {log.itemsFailed > 0 && (
          <span className="text-sm text-red-600 ml-1">
            ({log.itemsFailed} failed)
          </span>
        )}
      </TableCell>
      <TableCell priority="low">
        <span className="text-sm text-gray-600">{duration}s</span>
      </TableCell>
      <TableCell>
        <span className="text-sm text-gray-500">
          {log.startedAt.toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </TableCell>
    </TableRow>
  );
}

// ============================================
// Summary Stats Component
// ============================================

interface SummaryStatsProps {
  integrations: IntegrationStatus[];
  syncSummary: {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    lastWeekSyncs: number;
  };
}

function SummaryStats({ integrations, syncSummary }: SummaryStatsProps) {
  const connectedCount = integrations.filter((i) => i.connected).length;
  const healthyCount = integrations.filter((i) => i.syncStatus === 'healthy').length;
  const errorCount = integrations.filter(
    (i) => i.syncStatus === 'error' || i.syncStatus === 'warning'
  ).length;

  const stats = [
    {
      label: 'Connected',
      value: `${connectedCount}/3`,
      icon: LinkIcon,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Healthy',
      value: healthyCount,
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Needs Attention',
      value: errorCount,
      icon: ExclamationTriangleIcon,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    {
      label: 'Syncs This Week',
      value: syncSummary.lastWeekSyncs,
      icon: ArrowPathIcon,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <Card key={stat.label} padding="sm">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${stat.bg}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ============================================
// Loading Skeleton
// ============================================

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} padding="sm">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div>
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-6 w-12" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Integration cards skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j}>
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Table skeleton */}
      <Card>
        <div className="p-4">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function IntegrationStatusPage() {
  const { integrations, loading: integrationsLoading, refresh: refreshIntegrations } = useIntegrationStatus();
  const { logs, summary, loading: logsLoading, refresh: refreshLogs } = useIntegrationSyncLogs({ limit: 20 });
  const { triggerSync, syncing } = useTriggerSync();

  const [activeFilter, setActiveFilter] = useState<IntegrationType | 'all'>('all');

  const handleSync = async (type: IntegrationType) => {
    await triggerSync(type);
    // Refresh data after sync completes
    setTimeout(() => {
      refreshIntegrations();
      refreshLogs();
    }, 2500);
  };

  const handleRefreshAll = () => {
    refreshIntegrations();
    refreshLogs();
  };

  const filteredLogs =
    activeFilter === 'all'
      ? logs
      : logs.filter((log) => log.integrationType === activeFilter);

  const loading = integrationsLoading || logsLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Integration Status"
          description="Monitor your connected integrations and sync history"
          breadcrumbs={[
            { label: 'Settings', href: '/dashboard/settings' },
            { label: 'Integrations', href: '/dashboard/settings/integrations' },
            { label: 'Status' },
          ]}
        />
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integration Status"
        description="Monitor your connected integrations and sync history"
        breadcrumbs={[
          { label: 'Settings', href: '/dashboard/settings' },
          { label: 'Integrations', href: '/dashboard/settings/integrations' },
          { label: 'Status' },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            icon={<ArrowPathIcon className="w-4 h-4" />}
          >
            Refresh
          </Button>
        }
      />

      {/* Summary Stats */}
      <SummaryStats integrations={integrations} syncSummary={summary} />

      {/* Integration Cards */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Connected Integrations
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {integrations.map((integration) => (
            <IntegrationCard
              key={integration.type}
              integration={integration}
              onSync={() => handleSync(integration.type)}
              syncing={syncing === integration.type}
            />
          ))}
        </div>
      </div>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle>Sync History</CardTitle>
            <div className="flex items-center gap-2">
              <select
                value={activeFilter}
                onChange={(e) =>
                  setActiveFilter(e.target.value as IntegrationType | 'all')
                }
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
              >
                <option value="all">All Integrations</option>
                <option value="quickbooks">QuickBooks</option>
                <option value="gusto">Gusto</option>
                <option value="stripe">Stripe</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow hover={false}>
                <TableHeader>Status</TableHeader>
                <TableHeader>Integration</TableHeader>
                <TableHeader priority="medium">Type</TableHeader>
                <TableHeader priority="medium">Direction</TableHeader>
                <TableHeader>Items</TableHeader>
                <TableHeader priority="low">Duration</TableHeader>
                <TableHeader>Time</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableEmpty
                  colSpan={7}
                  message="No sync history yet. Sync data will appear here after your first sync."
                  icon={<SignalIcon className="w-8 h-8 text-gray-300" />}
                />
              ) : (
                filteredLogs.map((log) => <SyncLogRow key={log.id} log={log} />)
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Summary Footer */}
        {filteredLogs.length > 0 && (
          <CardFooter className="bg-gray-50 -mx-4 -mb-4 px-4 py-3">
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span>
                <strong className="text-gray-900">{summary.totalSyncs}</strong> total syncs
              </span>
              <span className="text-gray-300">|</span>
              <span>
                <strong className="text-green-600">{summary.successfulSyncs}</strong> successful
              </span>
              <span className="text-gray-300">|</span>
              <span>
                <strong className="text-red-600">{summary.failedSyncs}</strong> failed
              </span>
              <span className="text-gray-300">|</span>
              <span>
                Avg duration: <strong className="text-gray-900">{summary.averageDuration}s</strong>
              </span>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Help Card */}
      <Card className="bg-blue-50 border-blue-100">
        <div className="flex items-start gap-3 p-4">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <SignalIcon className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900">
              About Integration Syncing
            </h4>
            <p className="text-sm text-blue-700 mt-1">
              ContractorOS automatically syncs with your connected integrations every
              hour. You can also trigger a manual sync at any time. If you see errors,
              check the integration settings or contact support.
            </p>
            <Link
              href="/dashboard/settings/integrations"
              className="inline-flex items-center gap-1 text-sm text-blue-700 hover:text-blue-800 font-medium mt-2"
            >
              Manage Integrations
              <ArrowTopRightOnSquareIcon className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
