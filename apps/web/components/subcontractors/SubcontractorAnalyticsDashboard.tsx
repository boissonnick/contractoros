'use client';

import React, { useMemo } from 'react';
import { Subcontractor } from '@/types';
import { Card } from '@/components/ui';
import Badge from '@/components/ui/Badge';
import { PieChartCard } from '@/components/charts/PieChartCard';
import { BarChartCard } from '@/components/charts/BarChartCard';
import { StatsGrid } from '@/components/ui/StatsGrid';
import {
  ExclamationTriangleIcon,
  StarIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

interface SubcontractorAnalyticsDashboardProps {
  subs: Subcontractor[];
}

const TRADE_COLORS: Record<string, string> = {
  'Electrical': '#3B82F6',
  'Plumbing': '#10B981',
  'HVAC': '#F59E0B',
  'Framing': '#8B5CF6',
  'Roofing': '#EF4444',
  'Painting': '#EC4899',
  'Concrete': '#6B7280',
  'Drywall': '#14B8A6',
  'Landscaping': '#22C55E',
  'Flooring': '#F97316',
};

const DEFAULT_TRADE_COLOR = '#9CA3AF';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);

function getTradeColor(trade: string): string {
  return TRADE_COLORS[trade] || DEFAULT_TRADE_COLOR;
}

export default function SubcontractorAnalyticsDashboard({
  subs,
}: SubcontractorAnalyticsDashboardProps) {
  // --- Computed data ---

  const tradeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    subs.forEach((s) => {
      const trade = s.trade || 'Other';
      counts[trade] = (counts[trade] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        color: getTradeColor(name),
      }))
      .sort((a, b) => b.value - a.value);
  }, [subs]);

  const spendByTrade = useMemo(() => {
    const totals: Record<string, number> = {};
    subs.forEach((s) => {
      const trade = s.trade || 'Other';
      totals[trade] = (totals[trade] || 0) + (s.metrics.totalPaid || 0);
    });
    return Object.entries(totals)
      .map(([name, totalPaid]) => ({
        name,
        totalPaid,
        color: getTradeColor(name),
      }))
      .sort((a, b) => b.totalPaid - a.totalPaid);
  }, [subs]);

  const leaderboard = useMemo(() => {
    return [...subs]
      .filter((s) => s.metrics.projectsCompleted > 0)
      .sort((a, b) => {
        // Sort by on-time rate descending, then by rating descending
        const rateA = a.metrics.onTimeRate || 0;
        const rateB = b.metrics.onTimeRate || 0;
        if (rateB !== rateA) return rateB - rateA;
        return (b.metrics.avgRating || 0) - (a.metrics.avgRating || 0);
      })
      .slice(0, 10);
  }, [subs]);

  const riskAlerts = useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const alerts: Array<{
      sub: Subcontractor;
      type: 'insurance' | 'rating' | 'ontime';
      message: string;
    }> = [];

    subs.forEach((s) => {
      if (s.insuranceExpiry) {
        const expiry = s.insuranceExpiry instanceof Date
          ? s.insuranceExpiry
          : new Date(s.insuranceExpiry as unknown as string);
        if (expiry <= thirtyDaysFromNow) {
          const isExpired = expiry <= now;
          alerts.push({
            sub: s,
            type: 'insurance',
            message: isExpired
              ? `Insurance expired ${expiry.toLocaleDateString()}`
              : `Insurance expires ${expiry.toLocaleDateString()}`,
          });
        }
      }
      if (s.metrics.avgRating > 0 && s.metrics.avgRating < 3.0) {
        alerts.push({
          sub: s,
          type: 'rating',
          message: `Low rating: ${s.metrics.avgRating.toFixed(1)}/5.0`,
        });
      }
      if (s.metrics.projectsCompleted > 0 && s.metrics.onTimeRate < 70) {
        alerts.push({
          sub: s,
          type: 'ontime',
          message: `Low on-time rate: ${s.metrics.onTimeRate}%`,
        });
      }
    });

    return alerts;
  }, [subs]);

  const fleetStats = useMemo(() => {
    const totalSpend = subs.reduce((sum, s) => sum + (s.metrics.totalPaid || 0), 0);
    const activeSubs = subs.filter((s) => s.isActive);
    const withProjects = subs.filter((s) => s.metrics.projectsCompleted > 0);
    const avgOnTime =
      withProjects.length > 0
        ? withProjects.reduce((sum, s) => sum + (s.metrics.onTimeRate || 0), 0) / withProjects.length
        : 0;
    const withRatings = subs.filter((s) => s.metrics.avgRating > 0);
    const avgRating =
      withRatings.length > 0
        ? withRatings.reduce((sum, s) => sum + s.metrics.avgRating, 0) / withRatings.length
        : 0;
    const totalProjects = subs.reduce((sum, s) => sum + (s.metrics.projectsCompleted || 0), 0);

    return { totalSpend, avgOnTime, avgRating, totalProjects, activeCount: activeSubs.length };
  }, [subs]);

  // --- Empty state ---

  if (subs.length === 0) {
    return (
      <Card className="p-8 text-center">
        <UserGroupIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-gray-900 mb-1">No subcontractor data</h3>
        <p className="text-sm text-gray-500">
          Add subcontractors to see analytics and performance insights.
        </p>
      </Card>
    );
  }

  // --- Render ---

  return (
    <div className="space-y-6">
      {/* Fleet Summary Stats */}
      <StatsGrid
        columns={5}
        stats={[
          {
            label: 'Total Spend',
            value: fmt(fleetStats.totalSpend),
            icon: CurrencyDollarIcon,
            iconColor: 'text-green-600',
          },
          {
            label: 'Avg On-Time Rate',
            value: `${Math.round(fleetStats.avgOnTime)}%`,
            icon: ClockIcon,
            iconColor: 'text-blue-600',
          },
          {
            label: 'Avg Rating',
            value: fleetStats.avgRating > 0 ? fleetStats.avgRating.toFixed(1) : 'N/A',
            icon: StarIcon,
            iconColor: 'text-yellow-600',
          },
          {
            label: 'Projects Completed',
            value: fleetStats.totalProjects,
            icon: WrenchScrewdriverIcon,
            iconColor: 'text-purple-600',
          },
          {
            label: 'Active Subs',
            value: fleetStats.activeCount,
            icon: UserGroupIcon,
            iconColor: 'text-brand-primary',
          },
        ]}
      />

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trade Distribution */}
        <PieChartCard
          title="Trade Distribution"
          subtitle={`${subs.length} subcontractors across ${tradeDistribution.length} trades`}
          data={tradeDistribution}
          donut
        />

        {/* Spend by Trade */}
        <BarChartCard
          title="Spend by Trade"
          subtitle="Total payments by trade category"
          data={spendByTrade}
          dataKeys={['totalPaid']}
          xAxisKey="name"
          valueFormatter={fmt}
          colorByValue
        />
      </div>

      {/* Performance Leaderboard */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <ChartBarIcon className="h-5 w-5 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">Performance Leaderboard</h3>
          <span className="text-xs text-gray-500">Top 10 by on-time rate</span>
        </div>

        {leaderboard.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            No subcontractors with completed projects yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    #
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Company
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Trade
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    On-Time
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Rating
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Projects
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Total Paid
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((sub, idx) => (
                  <tr
                    key={sub.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-gray-500 font-medium">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-medium text-gray-900">{sub.companyName}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant="default" size="sm">
                        {sub.trade}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={
                          sub.metrics.onTimeRate >= 90
                            ? 'text-green-600 font-semibold'
                            : sub.metrics.onTimeRate >= 70
                              ? 'text-yellow-600 font-medium'
                              : 'text-red-600 font-medium'
                        }
                      >
                        {sub.metrics.onTimeRate}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="inline-flex items-center gap-1">
                        <StarIcon className="h-3.5 w-3.5 text-yellow-400" />
                        {sub.metrics.avgRating.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-700">
                      {sub.metrics.projectsCompleted}
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-700 font-medium">
                      {fmt(sub.metrics.totalPaid)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Risk Alerts */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
          <h3 className="text-sm font-semibold text-gray-900">Risk Alerts</h3>
          {riskAlerts.length > 0 && (
            <Badge variant="danger" size="sm">
              {riskAlerts.length}
            </Badge>
          )}
        </div>

        {riskAlerts.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            No risk alerts. All subcontractors are performing well.
          </p>
        ) : (
          <div className="space-y-2">
            {riskAlerts.map((alert, idx) => (
              <div
                key={`${alert.sub.id}-${alert.type}-${idx}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
              >
                <div
                  className={`p-1.5 rounded-lg ${
                    alert.type === 'insurance'
                      ? 'bg-red-100 text-red-600'
                      : alert.type === 'rating'
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-orange-100 text-orange-600'
                  }`}
                >
                  {alert.type === 'rating' ? (
                    <StarIcon className="h-4 w-4" />
                  ) : (
                    <ExclamationTriangleIcon className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {alert.sub.companyName}
                  </p>
                  <p className="text-xs text-gray-500">{alert.sub.trade}</p>
                </div>
                <div className="text-right">
                  <Badge
                    variant={
                      alert.type === 'insurance'
                        ? 'danger'
                        : alert.type === 'rating'
                          ? 'warning'
                          : 'warning'
                    }
                    size="sm"
                  >
                    {alert.message}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export type { SubcontractorAnalyticsDashboardProps };
