"use client";

import React from 'react';
import { useAuth } from '@/lib/auth';
import { useFinancialReports } from '@/lib/hooks/useReports';
import { Card } from '@/components/ui';
import {
  BarChartCard,
  PieChartCard,
} from '@/components/charts';
import {
  CurrencyDollarIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationCircleIcon,
  ReceiptPercentIcon,
  ChartBarIcon,
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-3/4" />
          </Card>
        ))}
      </div>
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

export default function FinancialReportsPage() {
  const { profile } = useAuth();
  const {
    loading,
    error,
    summary,
    expensesByCategory,
    invoiceAging,
    projectProfitability,
  } = useFinancialReports(profile?.orgId);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <ExclamationCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Failed to load financial data</h3>
        <p className="text-gray-500 mt-1">{error.message}</p>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card className="p-8 text-center">
        <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No financial data available</h3>
        <p className="text-gray-500 mt-1">Start tracking expenses and invoices to see financial analytics.</p>
      </Card>
    );
  }

  // Sort projects by variance (worst performing first)
  const sortedProjects = [...projectProfitability].sort((a, b) => a.variance - b.variance);
  const overBudgetProjects = sortedProjects.filter(p => p.variance < 0);
  const underBudgetProjects = sortedProjects.filter(p => p.variance >= 0);

  return (
    <div className="space-y-6">
      {/* Financial Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(summary.totalRevenue)}
          icon={CurrencyDollarIcon}
          color="green"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(summary.totalSpent)}
          icon={BanknotesIcon}
          color="red"
        />
        <StatCard
          title="Gross Profit"
          value={formatCurrency(summary.grossProfit)}
          icon={ArrowTrendingUpIcon}
          color={summary.grossProfit >= 0 ? 'green' : 'red'}
        />
        <StatCard
          title="Profit Margin"
          value={formatPercent(summary.profitMargin)}
          icon={ReceiptPercentIcon}
          color={summary.profitMargin >= 20 ? 'green' : summary.profitMargin >= 10 ? 'amber' : 'red'}
        />
      </div>

      {/* Budget Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="Total Budget"
          value={formatCurrency(summary.totalBudget)}
          icon={ChartBarIcon}
          color="blue"
          subtitle={`${formatCurrency(summary.totalBudget - summary.totalSpent)} remaining`}
        />
        <StatCard
          title="Cash Flow"
          value={formatCurrency(summary.cashFlow)}
          icon={summary.cashFlow >= 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon}
          color={summary.cashFlow >= 0 ? 'green' : 'red'}
          subtitle={summary.cashFlow >= 0 ? 'Positive cash flow' : 'Negative cash flow'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {expensesByCategory.length > 0 && (
          <PieChartCard
            title="Expenses by Category"
            subtitle="Distribution of approved expenses"
            data={expensesByCategory}
            dataKey="value"
            nameKey="name"
            showLabels
            valueFormatter={formatCurrency}
          />
        )}
        {invoiceAging.length > 0 && (
          <BarChartCard
            title="Invoice Aging"
            subtitle="Outstanding invoices by age"
            data={invoiceAging.filter(a => a.amount > 0)}
            dataKeys={['amount']}
            xAxisKey="name"
            valueFormatter={formatCurrency}
            config={{ colors: ['#F59E0B'] }}
          />
        )}
      </div>

      {/* Project Profitability Table */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Project Profitability</h3>
            <p className="text-xs text-gray-500 mt-0.5">Budget vs actual spend by project</p>
          </div>
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {overBudgetProjects.length} over budget
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {underBudgetProjects.length} on/under budget
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Labor Cost
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variance
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedProjects.slice(0, 15).map((project) => {
                const percentUsed = project.budget > 0 ? (project.actualSpend / project.budget) * 100 : 0;
                const isOverBudget = project.variance < 0;

                return (
                  <tr key={project.projectId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {project.projectName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {formatCurrency(project.budget)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {formatCurrency(project.laborCost)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {formatCurrency(project.actualSpend)}
                    </td>
                    <td className={cn(
                      'px-4 py-3 text-sm text-right font-medium',
                      isOverBudget ? 'text-red-600' : 'text-green-600'
                    )}>
                      {isOverBudget ? '-' : '+'}{formatCurrency(Math.abs(project.variance))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              percentUsed > 100 ? 'bg-red-500' : percentUsed > 80 ? 'bg-amber-500' : 'bg-green-500'
                            )}
                            style={{ width: `${Math.min(percentUsed, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-12 text-right">
                          {percentUsed.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {projectProfitability.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No projects with budget data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invoice Aging Detail */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Invoice Aging Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {invoiceAging.map((aging) => (
            <div
              key={aging.name}
              className={cn(
                'p-3 rounded-lg border',
                aging.name === '90+ Days' && aging.amount > 0
                  ? 'border-red-200 bg-red-50'
                  : aging.name.includes('Days') && aging.amount > 0
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-gray-200 bg-gray-50'
              )}
            >
              <p className="text-xs font-medium text-gray-500">{aging.name}</p>
              <p className={cn(
                'text-lg font-semibold mt-1',
                aging.name === '90+ Days' && aging.amount > 0
                  ? 'text-red-700'
                  : aging.name.includes('Days') && aging.amount > 0
                  ? 'text-amber-700'
                  : 'text-gray-900'
              )}>
                {formatCurrency(aging.amount)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{aging.count} invoice{aging.count !== 1 ? 's' : ''}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
