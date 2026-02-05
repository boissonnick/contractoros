'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowLeftIcon,
  DocumentMagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import { BarChartCard } from '@/components/charts/BarChartCard';
import { useOCRLogs } from '@/lib/hooks/useOCRLogs';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

function getConfidenceColor(value: number): string {
  if (value >= 90) return 'text-green-600';
  if (value >= 75) return 'text-yellow-600';
  return 'text-red-600';
}

function getConfidenceBgColor(value: number): string {
  if (value >= 90) return 'bg-green-50';
  if (value >= 75) return 'bg-yellow-50';
  return 'bg-red-50';
}

function getSuccessRateVariant(rate: number): 'success' | 'warning' | 'danger' {
  if (rate > 90) return 'success';
  if (rate > 75) return 'warning';
  return 'danger';
}

export default function OCRAnalyticsPage() {
  const { profile } = useAuth();
  const { logs, loading, error, stats } = useOCRLogs();

  const isManager = profile?.role === 'OWNER' || profile?.role === 'PM';

  // Confidence distribution buckets
  const confidenceDistribution = useMemo(() => {
    if (logs.length === 0) return [];

    const buckets = [
      { name: '0-50%', min: 0, max: 50, count: 0 },
      { name: '50-70%', min: 50, max: 70, count: 0 },
      { name: '70-90%', min: 70, max: 90, count: 0 },
      { name: '90-100%', min: 90, max: 101, count: 0 },
    ];

    for (const log of logs) {
      const pct = log.confidence * 100;
      for (const bucket of buckets) {
        if (pct >= bucket.min && pct < bucket.max) {
          bucket.count += 1;
          break;
        }
      }
    }

    return buckets.map((b) => ({ name: b.name, count: b.count }));
  }, [logs]);

  // Model usage data
  const modelUsageData = useMemo(() => {
    if (!stats?.byModel) return [];

    return Object.entries(stats.byModel)
      .map(([model, data]) => ({
        name: model,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [stats]);

  // Recent 20 scans
  const recentScans = useMemo(() => {
    return logs.slice(0, 20);
  }, [logs]);

  // Access gate: only OWNER/PM
  if (!isManager) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <DocumentMagnifyingGlassIcon className="h-12 w-12 text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900">Access Restricted</h2>
        <p className="text-sm text-gray-500 mt-1">
          OCR Analytics is only available to project managers and owners.
        </p>
        <Link
          href="/dashboard/expenses"
          className="mt-4 text-sm text-blue-600 hover:text-blue-700"
        >
          Back to Expenses
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-48" />
        </div>
        {/* KPI cards skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <Skeleton className="h-5 w-40 mb-4" />
            <Skeleton className="h-[300px] w-full" />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <Skeleton className="h-5 w-40 mb-4" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        </div>
        {/* Table skeleton */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <Skeleton className="h-5 w-32 mb-4" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full mb-2" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <Link
            href="/dashboard/expenses"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Expenses
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">OCR Analytics</h1>
        </div>
        <Card className="p-6 text-center">
          <XCircleIcon className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-red-600">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/expenses"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Expenses
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">OCR Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">
          Receipt scanning performance and model accuracy metrics
        </p>
      </div>

      {/* KPI Cards */}
      {stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Scans */}
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <DocumentMagnifyingGlassIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Scans</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalScans}</p>
              </div>
            </div>
          </Card>

          {/* Success Rate */}
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-2 rounded-lg',
                  stats.successRate > 90
                    ? 'bg-green-50'
                    : stats.successRate > 75
                      ? 'bg-yellow-50'
                      : 'bg-red-50'
                )}
              >
                <CheckCircleIcon
                  className={cn(
                    'h-5 w-5',
                    stats.successRate > 90
                      ? 'text-green-600'
                      : stats.successRate > 75
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  )}
                />
              </div>
              <div>
                <p className="text-sm text-gray-500">Success Rate</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.successRate.toFixed(1)}%
                  </p>
                  <Badge
                    variant={getSuccessRateVariant(stats.successRate)}
                    size="sm"
                  >
                    {stats.successRate > 90 ? 'Good' : stats.successRate > 75 ? 'Fair' : 'Low'}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Avg Confidence */}
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', getConfidenceBgColor(stats.avgConfidence * 100))}>
                <DocumentMagnifyingGlassIcon
                  className={cn('h-5 w-5', getConfidenceColor(stats.avgConfidence * 100))}
                />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Confidence</p>
                <p className={cn('text-2xl font-bold', getConfidenceColor(stats.avgConfidence * 100))}>
                  {(stats.avgConfidence * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </Card>

          {/* Avg Processing Time */}
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50">
                <ClockIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Processing Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(stats.avgProcessingTime / 1000).toFixed(1)}s
                </p>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="p-6 text-center">
          <DocumentMagnifyingGlassIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No OCR scans recorded yet.</p>
        </Card>
      )}

      {/* Charts */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BarChartCard
            title="Confidence Distribution"
            subtitle="Number of scans per confidence bucket"
            data={confidenceDistribution}
            dataKeys={['count']}
            xAxisKey="name"
            colorByValue
          />
          <BarChartCard
            title="Model Usage"
            subtitle="Scan count by OCR model"
            data={modelUsageData}
            dataKeys={['count']}
            xAxisKey="name"
            colorByValue
          />
        </div>
      )}

      {/* Recent Scans Table */}
      {recentScans.length > 0 && (
        <Card padding="none">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Recent Scans</h3>
            <p className="text-xs text-gray-500 mt-0.5">Last 20 OCR operations</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confidence
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Error
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {recentScans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {format(scan.createdAt, 'MMM d, yyyy h:mm a')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge
                        variant={scan.success ? 'success' : 'danger'}
                        size="sm"
                        dot
                      >
                        {scan.success ? 'Success' : 'Failed'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {scan.model}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          getConfidenceColor(scan.confidence * 100)
                        )}
                      >
                        {(scan.confidence * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {(scan.processingTimeMs / 1000).toFixed(1)}s
                    </td>
                    <td className="px-4 py-3 text-sm text-red-600 max-w-[200px] truncate">
                      {scan.error || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
