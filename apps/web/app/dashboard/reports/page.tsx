"use client";

import React from 'react';
import { useAuth } from '@/lib/auth';
import { useDashboardReports } from '@/lib/hooks/useReports';
import { Card } from '@/components/ui';
import {
  AreaChartCard,
  BarChartCard,
  PieChartCard,
} from '@/components/charts';
import {
  BriefcaseIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
}

function StatCard({ title, value, icon: Icon, trend, subtitle, color = 'blue' }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 truncate">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              {trend.isPositive ? (
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
              )}
              <span className={cn('text-xs font-medium', trend.isPositive ? 'text-green-600' : 'text-red-600')}>
                {trend.value > 0 ? '+' : ''}{trend.value.toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500">vs last month</span>
            </div>
          )}
        </div>
        <div className={cn('p-2 rounded-lg', colorClasses[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-3/4" />
          </Card>
        ))}
      </div>
      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-[300px] bg-gray-100 rounded" />
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function ReportsOverviewPage() {
  const { profile } = useAuth();
  const {
    loading,
    error,
    kpis,
    projectStatusDistribution,
    revenueByMonth,
    teamPerformance,
  } = useDashboardReports(profile?.orgId);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <ExclamationCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Failed to load reports</h3>
        <p className="text-gray-500 mt-1">{error.message}</p>
      </Card>
    );
  }

  if (!kpis) {
    return (
      <Card className="p-8 text-center">
        <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No data available</h3>
        <p className="text-gray-500 mt-1">Start adding projects and tracking time to see analytics.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Primary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Projects"
          value={kpis.activeProjects}
          icon={BriefcaseIcon}
          color="blue"
          subtitle={`${kpis.completedProjects} completed`}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(kpis.totalRevenue)}
          icon={CurrencyDollarIcon}
          color="green"
          subtitle={`${formatPercent(kpis.profitMargin)} margin`}
        />
        <StatCard
          title="Outstanding Invoices"
          value={formatCurrency(kpis.outstandingInvoices)}
          icon={BanknotesIcon}
          color={kpis.outstandingInvoices > 0 ? 'amber' : 'green'}
        />
        <StatCard
          title="Hours This Month"
          value={formatNumber(kpis.hoursLoggedThisMonth)}
          icon={ClockIcon}
          color="purple"
          subtitle={`${kpis.activeTeamMembers} team members`}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Project Value"
          value={formatCurrency(kpis.totalProjectValue)}
          icon={BriefcaseIcon}
          color="blue"
          subtitle={`Avg ${formatCurrency(kpis.averageProjectValue)}`}
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(kpis.totalExpenses)}
          icon={CurrencyDollarIcon}
          color="red"
        />
        <StatCard
          title="Open Tasks"
          value={kpis.openTasks}
          icon={ClipboardDocumentListIcon}
          color="amber"
          subtitle={`${kpis.completedTasksThisMonth} completed this month`}
        />
        <StatCard
          title="Task Completion"
          value={formatPercent(kpis.taskCompletionRate)}
          icon={CheckCircleIcon}
          color="green"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AreaChartCard
          title="Revenue vs Expenses"
          subtitle="Last 6 months"
          data={revenueByMonth}
          dataKeys={['revenue', 'expenses']}
          xAxisKey="name"
          valueFormatter={formatCurrency}
          config={{ colors: ['#10B981', '#EF4444'] }}
        />
        <PieChartCard
          title="Projects by Status"
          subtitle="Current distribution"
          data={projectStatusDistribution}
          dataKey="value"
          nameKey="name"
          showLabels
        />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChartCard
          title="Revenue Trend"
          subtitle="Monthly profit/loss"
          data={revenueByMonth}
          dataKeys={['profit']}
          xAxisKey="name"
          valueFormatter={formatCurrency}
          config={{ colors: ['#3B82F6'] }}
        />
        {teamPerformance.length > 0 && (
          <BarChartCard
            title="Team Performance"
            subtitle="Hours logged by team member"
            data={teamPerformance}
            dataKeys={['hoursLogged']}
            xAxisKey="name"
            horizontal
            config={{ colors: ['#8B5CF6'] }}
          />
        )}
      </div>

      {/* Team Performance Detail */}
      {teamPerformance.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Team Productivity</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team Member
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours Logged
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tasks Completed
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Efficiency
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {teamPerformance.map((member, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {member.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {member.hoursLogged} hrs
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {member.tasksCompleted}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                          member.efficiency >= 80
                            ? 'bg-green-100 text-green-800'
                            : member.efficiency >= 50
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-800'
                        )}
                      >
                        {member.efficiency}%
                      </span>
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
