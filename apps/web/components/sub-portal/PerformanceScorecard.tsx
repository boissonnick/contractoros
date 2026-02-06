"use client";

import React from 'react';
import {
  FolderIcon,
  ClockIcon,
  StarIcon,
  ChartBarIcon,
  BoltIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { StatsGrid } from '@/components/ui';
import type { StatItem } from '@/components/ui/StatsGrid';
import { useSubPerformance } from '@/lib/hooks/useSubPerformance';
import Card from '@/components/ui/Card';

interface PerformanceScorecardProps {
  subcontractorId: string;
}

/**
 * Dashboard widget showing subcontractor performance metrics.
 * Uses StatsGrid pattern for KPI cards with trend indicators.
 */
export default function PerformanceScorecard({ subcontractorId }: PerformanceScorecardProps) {
  const { metrics, loading, error, refresh } = useSubPerformance(subcontractorId);

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Performance Scorecard</h3>
          <button
            onClick={refresh}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-red-600">{error.message}</p>
          <button
            onClick={refresh}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Try again
          </button>
        </div>
      </Card>
    );
  }

  // Build stat items for StatsGrid
  const stats: StatItem[] = metrics ? [
    {
      label: 'Projects Completed',
      value: `${metrics.completedProjects}/${metrics.totalProjects}`,
      icon: FolderIcon,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      description: metrics.totalProjects > 0
        ? `${Math.round((metrics.completedProjects / metrics.totalProjects) * 100)}% completion rate`
        : 'No projects yet',
    },
    {
      label: 'On-Time Delivery',
      value: `${metrics.onTimePercentage}%`,
      icon: ClockIcon,
      iconBg: metrics.onTimePercentage >= 90 ? 'bg-green-50' : metrics.onTimePercentage >= 70 ? 'bg-yellow-50' : 'bg-red-50',
      iconColor: metrics.onTimePercentage >= 90 ? 'text-green-600' : metrics.onTimePercentage >= 70 ? 'text-yellow-600' : 'text-red-600',
      description: metrics.onTimePercentage >= 90
        ? 'Excellent track record'
        : metrics.onTimePercentage >= 70
          ? 'Room for improvement'
          : 'Needs attention',
    },
    {
      label: 'Quality Rating',
      value: metrics.averageQualityRating > 0
        ? `${metrics.averageQualityRating}/5`
        : 'N/A',
      icon: StarIcon,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      description: metrics.averageQualityRating > 0
        ? `Based on project reviews`
        : 'No reviews yet',
    },
    {
      label: 'Bid Win Rate',
      value: `${metrics.winRate}%`,
      icon: ChartBarIcon,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      description: metrics.totalBidsSubmitted > 0
        ? `${metrics.bidsWon} won of ${metrics.totalBidsSubmitted} submitted`
        : 'No bids submitted',
    },
    {
      label: 'Avg Response Time',
      value: metrics.averageResponseTime > 0
        ? `${metrics.averageResponseTime}h`
        : 'N/A',
      icon: BoltIcon,
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      description: metrics.averageResponseTime > 0
        ? metrics.averageResponseTime <= 24
          ? 'Fast responder'
          : metrics.averageResponseTime <= 72
            ? 'Average response time'
            : 'Slow to respond'
        : 'No bid responses yet',
    },
  ] : [
    { label: 'Projects Completed', value: '0/0', icon: FolderIcon },
    { label: 'On-Time Delivery', value: '0%', icon: ClockIcon },
    { label: 'Quality Rating', value: 'N/A', icon: StarIcon },
    { label: 'Bid Win Rate', value: '0%', icon: ChartBarIcon },
    { label: 'Avg Response Time', value: 'N/A', icon: BoltIcon },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Performance Scorecard</h3>
        <button
          onClick={refresh}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          title="Refresh metrics"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <StatsGrid
        stats={stats}
        columns={5}
        loading={loading}
      />

      {/* Quality rating stars visualization */}
      {metrics && metrics.averageQualityRating > 0 && (
        <div className="mt-4 flex items-center gap-2 px-1">
          <span className="text-xs font-medium text-gray-500">Quality:</span>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              star <= Math.round(metrics.averageQualityRating) ? (
                <StarSolidIcon key={star} className="h-4 w-4 text-amber-400" />
              ) : (
                <StarIcon key={star} className="h-4 w-4 text-gray-300" />
              )
            ))}
          </div>
          <span className="text-xs text-gray-500">
            ({metrics.averageQualityRating.toFixed(1)})
          </span>
        </div>
      )}

      {/* Last updated timestamp */}
      {metrics && (
        <p className="mt-3 text-xs text-gray-400 text-right">
          Last updated: {metrics.lastUpdated.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}

export { PerformanceScorecard };
