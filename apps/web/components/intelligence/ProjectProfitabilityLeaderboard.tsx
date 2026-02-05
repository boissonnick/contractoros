'use client';

import React, { useState, useMemo } from 'react';
import {
  ChartBarIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import { Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useOrgJobCosting } from '@/lib/hooks/useJobCosting';

interface ProjectProfitabilityLeaderboardProps {
  className?: string;
}

type SortKey =
  | 'projectId'
  | 'totalContractValue'
  | 'totalCosts'
  | 'grossProfit'
  | 'grossMargin';

type SortDirection = 'asc' | 'desc';

/**
 * Formats currency for display
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get RAG (Red/Amber/Green) status based on gross margin percentage
 */
function getRAGStatus(margin: number): {
  color: string;
  label: string;
  dot: string;
} {
  if (margin > 25) {
    return {
      color: 'bg-green-100 text-green-700',
      label: 'Healthy',
      dot: 'bg-green-500',
    };
  }
  if (margin >= 15) {
    return {
      color: 'bg-yellow-100 text-yellow-700',
      label: 'Watch',
      dot: 'bg-yellow-500',
    };
  }
  return {
    color: 'bg-red-100 text-red-700',
    label: 'At Risk',
    dot: 'bg-red-500',
  };
}

/**
 * Truncate a project ID for display
 */
function truncateId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}...${id.slice(-4)}`;
}

/**
 * Sort icon for column headers
 */
function SortIndicator({
  active,
  direction,
}: {
  active: boolean;
  direction: SortDirection;
}) {
  if (!active) {
    return (
      <span className="ml-1 inline-flex flex-col opacity-30">
        <ChevronUpIcon className="h-3 w-3 -mb-1" />
        <ChevronDownIcon className="h-3 w-3" />
      </span>
    );
  }

  return (
    <span className="ml-1 inline-flex">
      {direction === 'asc' ? (
        <ChevronUpIcon className="h-3.5 w-3.5 text-blue-600" />
      ) : (
        <ChevronDownIcon className="h-3.5 w-3.5 text-blue-600" />
      )}
    </span>
  );
}

/**
 * ProjectProfitabilityLeaderboard
 *
 * Sortable table showing project profitability with RAG status indicators.
 * On mobile, renders as a card list instead of a table.
 */
export default function ProjectProfitabilityLeaderboard({
  className,
}: ProjectProfitabilityLeaderboardProps) {
  const { profitabilityData, loading, error } = useOrgJobCosting();

  const [sortKey, setSortKey] = useState<SortKey>('grossMargin');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Compute summary stats
  const summaryStats = useMemo(() => {
    if (!profitabilityData.length) return null;

    const totalProjects = profitabilityData.length;
    const avgMargin =
      profitabilityData.reduce((sum, p) => sum + p.grossMargin, 0) /
      totalProjects;
    const atRiskCount = profitabilityData.filter(
      (p) => p.grossMargin < 15
    ).length;

    return { totalProjects, avgMargin, atRiskCount };
  }, [profitabilityData]);

  // Sort the data
  const sortedData = useMemo(() => {
    const sorted = [...profitabilityData].sort((a, b) => {
      let aVal: string | number = a[sortKey];
      let bVal: string | number = b[sortKey];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      const aNum = aVal as number;
      const bNum = bVal as number;
      return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
    });

    return sorted;
  }, [profitabilityData, sortKey, sortDirection]);

  // Handle column header click
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection(key === 'grossMargin' ? 'asc' : 'desc');
    }
  };

  // Loading state
  if (loading) {
    return (
      <Card className={cn('p-5', className)}>
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        {/* Desktop table skeleton */}
        <div className="hidden md:block">
          <Skeleton className="h-10 w-full mb-2" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full mb-1" />
          ))}
        </div>
        {/* Mobile card skeleton */}
        <div className="md:hidden space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('p-5', className)}>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-red-100 rounded-lg">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="font-semibold text-gray-900">
            Project Profitability
          </h3>
        </div>
        <p className="text-sm text-red-600">
          Unable to load profitability data: {error}
        </p>
      </Card>
    );
  }

  // Empty state
  if (!profitabilityData.length) {
    return (
      <Card className={cn('p-5', className)}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gray-100 rounded-lg">
            <ChartBarIcon className="h-5 w-5 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900">
            Project Profitability
          </h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <ChartBarIcon className="h-10 w-10 mx-auto text-gray-300 mb-2" />
          <p className="text-sm">No profitability data available</p>
          <p className="text-xs text-gray-400 mt-1">
            Start tracking job costs on your projects to see insights here
          </p>
        </div>
      </Card>
    );
  }

  const columns: { key: SortKey; label: string; align: 'left' | 'right' }[] = [
    { key: 'projectId', label: 'Project', align: 'left' },
    { key: 'totalContractValue', label: 'Contract Value', align: 'right' },
    { key: 'totalCosts', label: 'Total Costs', align: 'right' },
    { key: 'grossProfit', label: 'Gross Profit', align: 'right' },
    { key: 'grossMargin', label: 'Margin %', align: 'right' },
  ];

  return (
    <Card padding="none" className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div className="p-5 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChartBarIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">
                Project Profitability
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                {profitabilityData.length}
              </span>
            </div>
          </div>
        </div>

        {/* Summary bar */}
        {summaryStats && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-0.5">Total Projects</p>
              <p className="text-lg font-bold text-blue-700 tabular-nums">
                {summaryStats.totalProjects}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-0.5">Avg Margin</p>
              <p
                className={cn(
                  'text-lg font-bold tabular-nums',
                  summaryStats.avgMargin > 25
                    ? 'text-green-700'
                    : summaryStats.avgMargin >= 15
                      ? 'text-yellow-700'
                      : 'text-red-700'
                )}
              >
                {summaryStats.avgMargin.toFixed(1)}%
              </p>
            </div>
            <div
              className={cn(
                'p-3 rounded-lg',
                summaryStats.atRiskCount > 0 ? 'bg-red-50' : 'bg-green-50'
              )}
            >
              <p className="text-xs text-gray-500 mb-0.5">At Risk</p>
              <p
                className={cn(
                  'text-lg font-bold tabular-nums',
                  summaryStats.atRiskCount > 0
                    ? 'text-red-700'
                    : 'text-green-700'
                )}
              >
                {summaryStats.atRiskCount}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Desktop: Sortable Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-t border-b border-gray-200 bg-gray-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700 transition-colors',
                    col.align === 'right' ? 'text-right' : 'text-left'
                  )}
                  onClick={() => handleSort(col.key)}
                >
                  <span className="inline-flex items-center">
                    {col.label}
                    <SortIndicator
                      active={sortKey === col.key}
                      direction={sortDirection}
                    />
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 text-right font-medium text-gray-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedData.map((project) => {
              const rag = getRAGStatus(project.grossMargin);

              return (
                <tr
                  key={project.projectId}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <span title={project.projectId}>
                      {truncateId(project.projectId)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700 tabular-nums">
                    {formatCurrency(project.totalContractValue)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700 tabular-nums">
                    {formatCurrency(project.totalCosts)}
                  </td>
                  <td
                    className={cn(
                      'px-4 py-3 text-right font-medium tabular-nums',
                      project.grossProfit >= 0
                        ? 'text-green-700'
                        : 'text-red-700'
                    )}
                  >
                    {formatCurrency(project.grossProfit)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tabular-nums',
                        rag.color
                      )}
                    >
                      <span
                        className={cn('w-1.5 h-1.5 rounded-full', rag.dot)}
                      />
                      {project.grossMargin.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                        rag.color
                      )}
                    >
                      {rag.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: Card List */}
      <div className="md:hidden px-5 pb-5 space-y-3">
        {sortedData.map((project) => {
          const rag = getRAGStatus(project.grossMargin);

          return (
            <div
              key={project.projectId}
              className="border border-gray-200 rounded-lg p-4"
            >
              {/* Card header: Project ID + RAG badge */}
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <p
                    className="font-medium text-gray-900 truncate"
                    title={project.projectId}
                  >
                    {truncateId(project.projectId)}
                  </p>
                </div>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ml-2 flex-shrink-0',
                    rag.color
                  )}
                >
                  <span className={cn('w-1.5 h-1.5 rounded-full', rag.dot)} />
                  {rag.label}
                </span>
              </div>

              {/* Card body: Key metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Contract</p>
                  <p className="text-sm font-medium text-gray-900 tabular-nums">
                    {formatCurrency(project.totalContractValue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Costs</p>
                  <p className="text-sm font-medium text-gray-900 tabular-nums">
                    {formatCurrency(project.totalCosts)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Gross Profit</p>
                  <p
                    className={cn(
                      'text-sm font-medium tabular-nums',
                      project.grossProfit >= 0
                        ? 'text-green-700'
                        : 'text-red-700'
                    )}
                  >
                    {formatCurrency(project.grossProfit)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Margin</p>
                  <p
                    className={cn(
                      'text-sm font-semibold tabular-nums',
                      project.grossMargin > 25
                        ? 'text-green-700'
                        : project.grossMargin >= 15
                          ? 'text-yellow-700'
                          : 'text-red-700'
                    )}
                  >
                    {project.grossMargin.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
