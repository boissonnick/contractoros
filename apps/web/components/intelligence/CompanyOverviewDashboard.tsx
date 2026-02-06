'use client';

import React from 'react';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  BriefcaseIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui';
import { LineChartCard } from '@/components/charts/LineChartCard';
import { cn } from '@/lib/utils';
import { useCompanyStats } from '@/lib/hooks/useCompanyStats';

interface CompanyOverviewDashboardProps {
  className?: string;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const formatCurrencyCompact = (value: number) => {
  if (Math.abs(value) >= 1_000_000)
    return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

export default function CompanyOverviewDashboard({
  className,
}: CompanyOverviewDashboardProps) {
  const { stats, loading, error } = useCompanyStats();

  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5 animate-pulse">
              <div className="h-3 w-20 bg-gray-200 rounded mb-3" />
              <div className="h-8 w-28 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-16 bg-gray-200 rounded" />
            </Card>
          ))}
        </div>
        <Card className="p-4 animate-pulse">
          <div className="h-4 w-40 bg-gray-200 rounded mb-4" />
          <div className="h-[300px] bg-gray-100 rounded" />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={cn('p-5', className)}>
        <p className="text-sm text-red-600">
          Unable to load company overview: {error}
        </p>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className={cn('p-5 text-center py-12', className)}>
        <ChartBarIcon className="h-10 w-10 mx-auto text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">
          No financial data available yet
        </p>
      </Card>
    );
  }

  const kpis = [
    {
      label: 'Revenue MTD',
      value: formatCurrency(stats.revenueMTD),
      subtext: `vs. ${formatCurrency(stats.revenuePrevMonth)} last month`,
      change: stats.revenueChangePercent,
      icon: CurrencyDollarIcon,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Revenue YTD',
      value: formatCurrency(stats.revenueYTD),
      subtext: `${stats.activeProjectCount} active projects`,
      icon: ArrowTrendingUpIcon,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      label: 'Avg Margin',
      value: `${stats.avgMargin.toFixed(1)}%`,
      subtext: stats.avgMargin > 25 ? 'Healthy' : stats.avgMargin >= 15 ? 'Watch' : 'At Risk',
      icon: ChartBarIcon,
      iconBg: stats.avgMargin > 25 ? 'bg-green-50' : stats.avgMargin >= 15 ? 'bg-yellow-50' : 'bg-red-50',
      iconColor: stats.avgMargin > 25 ? 'text-green-600' : stats.avgMargin >= 15 ? 'text-yellow-600' : 'text-red-600',
    },
    {
      label: 'Pipeline',
      value: formatCurrency(stats.pipelineValue),
      subtext: 'Open estimates',
      icon: BriefcaseIcon,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="p-5">
              <div className="flex items-start justify-between mb-2">
                <div className={cn('p-2 rounded-lg', kpi.iconBg)}>
                  <Icon className={cn('h-5 w-5', kpi.iconColor)} />
                </div>
                {kpi.change !== undefined && kpi.change !== 0 && (
                  <div
                    className={cn(
                      'flex items-center gap-0.5 text-xs font-medium',
                      kpi.change > 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {kpi.change > 0 ? (
                      <ArrowTrendingUpIcon className="h-3 w-3" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-3 w-3" />
                    )}
                    {Math.abs(kpi.change).toFixed(1)}%
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{kpi.value}</p>
              <p className="text-xs text-gray-400 mt-1">{kpi.subtext}</p>
            </Card>
          );
        })}
      </div>

      {/* AR Quick Summary */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <BanknotesIcon className="h-5 w-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Accounts Receivable</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-0.5">Total AR</p>
            <p className="text-lg font-bold text-blue-700 tabular-nums">
              {formatCurrency(stats.arTotal)}
            </p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-0.5">Current</p>
            <p className="text-lg font-bold text-green-700 tabular-nums">
              {formatCurrency(stats.arAging.current)}
            </p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-0.5">31-60 Days</p>
            <p className="text-lg font-bold text-yellow-700 tabular-nums">
              {formatCurrency(stats.arAging.days31to60)}
            </p>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-0.5">61-90 Days</p>
            <p className="text-lg font-bold text-orange-700 tabular-nums">
              {formatCurrency(stats.arAging.days61to90)}
            </p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-0.5">90+ Days</p>
            <p className="text-lg font-bold text-red-700 tabular-nums">
              {formatCurrency(stats.arAging.over90)}
            </p>
          </div>
        </div>
      </Card>

      {/* Revenue & Margin Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChartCard
          title="Revenue & Expenses (6 Months)"
          subtitle="Monthly trend comparison"
          data={stats.monthlyTrends}
          dataKeys={['revenue', 'expenses']}
          xAxisKey="month"
          valueFormatter={(v) => formatCurrencyCompact(v)}
          config={{
            colors: ['#3B82F6', '#EF4444'],
            height: 280,
          }}
        />
        <LineChartCard
          title="Profit Margin Trend"
          subtitle="Monthly gross margin %"
          data={stats.monthlyTrends}
          dataKeys={['margin']}
          xAxisKey="month"
          valueFormatter={(v) => `${v.toFixed(1)}%`}
          config={{
            colors: ['#10B981'],
            height: 280,
          }}
        />
      </div>
    </div>
  );
}
