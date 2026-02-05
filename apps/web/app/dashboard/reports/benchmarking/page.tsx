'use client';

import React, { useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useFinancialReports, ProjectPnLData } from '@/lib/hooks/useReports';
import { Card, PageHeader, EmptyState } from '@/components/ui';
import { BarChartCard } from '@/components/charts';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  ExclamationCircleIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';
import { CompactPagination } from '@/components/ui';
import { cn } from '@/lib/utils';

// ============================================
// Helper Functions
// ============================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function formatPercentNoSign(value: number): string {
  return `${value.toFixed(1)}%`;
}

// ============================================
// Loading State
// ============================================

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-3/4" />
          </Card>
        ))}
      </div>
      <Card className="p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-[300px] bg-gray-100 rounded" />
      </Card>
    </div>
  );
}

// ============================================
// Trend Indicator Component
// ============================================

interface TrendIndicatorProps {
  value: number;
  label?: string;
  inverted?: boolean; // For metrics where lower is better
}

function TrendIndicator({ value, label, inverted = false }: TrendIndicatorProps) {
  const isPositive = inverted ? value <= 0 : value >= 0;

  return (
    <div className="flex items-center gap-1">
      {value === 0 ? (
        <MinusIcon className="h-4 w-4 text-gray-400" />
      ) : isPositive ? (
        <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
      ) : (
        <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
      )}
      <span className={cn(
        'text-sm font-medium',
        value === 0 ? 'text-gray-500' : isPositive ? 'text-green-600' : 'text-red-600'
      )}>
        {formatPercent(value)}
      </span>
      {label && <span className="text-xs text-gray-400 ml-1">{label}</span>}
    </div>
  );
}

// ============================================
// Performer Card Component
// ============================================

interface PerformerCardProps {
  title: string;
  icon: React.ReactNode;
  projects: Array<{
    name: string;
    margin: number;
    variance?: number;
    revenue?: number;
  }>;
  type: 'best' | 'worst';
  emptyMessage: string;
}

function PerformerCard({ title, icon, projects, type, emptyMessage }: PerformerCardProps) {
  const bgColor = type === 'best' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  const iconColor = type === 'best' ? 'text-green-600' : 'text-red-600';

  return (
    <Card className={cn('p-4 border-2', bgColor)}>
      <div className="flex items-center gap-2 mb-4">
        <div className={cn('p-2 rounded-lg', type === 'best' ? 'bg-green-100' : 'bg-red-100')}>
          <div className={cn('h-5 w-5', iconColor)}>{icon}</div>
        </div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {projects.map((project, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className={cn(
                  'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                  type === 'best'
                    ? 'bg-green-200 text-green-800'
                    : 'bg-red-200 text-red-800'
                )}>
                  {index + 1}
                </span>
                <span className="text-sm text-gray-700 truncate">{project.name}</span>
              </div>
              <div className="flex items-center gap-3">
                {project.revenue !== undefined && (
                  <span className="text-xs text-gray-500">{formatCurrency(project.revenue)}</span>
                )}
                <span className={cn(
                  'text-sm font-semibold px-2 py-0.5 rounded',
                  type === 'best'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                )}>
                  {formatPercentNoSign(project.margin)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ============================================
// Budget Accuracy Component
// ============================================

interface BudgetAccuracyRowProps {
  project: ProjectPnLData;
  maxVariance: number;
}

function BudgetAccuracyRow({ project, maxVariance }: BudgetAccuracyRowProps) {
  const percentUsed = project.budget > 0 ? (project.actualSpend / project.budget) * 100 : 0;
  const variancePercent = project.budget > 0 ? (project.variance / project.budget) * 100 : 0;
  const isOverBudget = project.variance < 0;
  const barWidth = Math.min(Math.abs(project.variance) / maxVariance * 100, 100);

  // Status determination
  let status: 'excellent' | 'good' | 'warning' | 'critical';
  let StatusIcon: React.ComponentType<{ className?: string }>;

  if (variancePercent >= 20) {
    status = 'excellent';
    StatusIcon = CheckCircleIcon;
  } else if (variancePercent >= 0) {
    status = 'good';
    StatusIcon = CheckCircleIcon;
  } else if (variancePercent >= -10) {
    status = 'warning';
    StatusIcon = ExclamationTriangleIcon;
  } else {
    status = 'critical';
    StatusIcon = XCircleIcon;
  }

  const statusColors = {
    excellent: 'text-green-600 bg-green-100',
    good: 'text-blue-600 bg-blue-100',
    warning: 'text-amber-600 bg-amber-100',
    critical: 'text-red-600 bg-red-100',
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-[200px] truncate">
        {project.projectName}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 text-right">
        {formatCurrency(project.budget)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 text-right">
        {formatCurrency(project.actualSpend)}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden flex">
            {isOverBudget ? (
              <div
                className="h-full bg-red-500 rounded-full ml-auto"
                style={{ width: `${barWidth}%` }}
              />
            ) : (
              <div
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${barWidth}%` }}
              />
            )}
          </div>
          <span className={cn(
            'text-sm font-medium w-16 text-right',
            isOverBudget ? 'text-red-600' : 'text-green-600'
          )}>
            {formatPercent(variancePercent)}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center">
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
            statusColors[status]
          )}>
            <StatusIcon className="h-3.5 w-3.5" />
            {percentUsed.toFixed(0)}%
          </span>
        </div>
      </td>
    </tr>
  );
}

// ============================================
// Main Component
// ============================================

export default function BenchmarkingPage() {
  const { profile } = useAuth();
  const {
    loading,
    error,
    projectProfitability,
    revenueByProject,
  } = useFinancialReports(profile?.orgId);

  const [sortBy, setSortBy] = useState<'margin' | 'revenue' | 'variance'>('margin');
  const [budgetPage, setBudgetPage] = useState(1);
  const [comparisonPage, setComparisonPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  // Calculate benchmarking data
  const benchmarkData = useMemo(() => {
    if (!revenueByProject?.length && !projectProfitability?.length) {
      return null;
    }

    // Combine revenue and profitability data
    const projectsWithMetrics = revenueByProject.map(rp => {
      const profitData = projectProfitability.find(pp => pp.projectId === rp.projectId);
      return {
        projectId: rp.projectId,
        name: rp.projectName,
        revenue: rp.revenue,
        costs: rp.costs,
        profit: rp.profit,
        margin: rp.margin,
        budget: profitData?.budget || 0,
        actualSpend: profitData?.actualSpend || 0,
        variance: profitData?.variance || 0,
        laborCost: profitData?.laborCost || 0,
      };
    }).filter(p => p.revenue > 0 || p.budget > 0);

    // Sort by margin for best/worst performers
    const sortedByMargin = [...projectsWithMetrics].sort((a, b) => b.margin - a.margin);
    const bestPerformers = sortedByMargin.slice(0, 3);
    const worstPerformers = sortedByMargin.filter(p => p.margin < 20).slice(-3).reverse();

    // Calculate averages
    const avgMargin = projectsWithMetrics.length > 0
      ? projectsWithMetrics.reduce((sum, p) => sum + p.margin, 0) / projectsWithMetrics.length
      : 0;
    const avgBudgetAccuracy = projectsWithMetrics.filter(p => p.budget > 0).length > 0
      ? projectsWithMetrics.filter(p => p.budget > 0).reduce((sum, p) => {
          const accuracy = 100 - Math.abs((p.actualSpend / p.budget - 1) * 100);
          return sum + Math.max(0, accuracy);
        }, 0) / projectsWithMetrics.filter(p => p.budget > 0).length
      : 0;

    // Project comparison chart data
    const chartData = [...projectsWithMetrics]
      .sort((a, b) => {
        if (sortBy === 'margin') return b.margin - a.margin;
        if (sortBy === 'revenue') return b.revenue - a.revenue;
        return b.variance - a.variance;
      })
      .slice(0, 10)
      .map(p => ({
        name: p.name.length > 15 ? p.name.substring(0, 12) + '...' : p.name,
        margin: Number(p.margin.toFixed(1)),
        fullName: p.name,
      }));

    return {
      projects: projectsWithMetrics,
      bestPerformers,
      worstPerformers,
      avgMargin,
      avgBudgetAccuracy,
      chartData,
      totalProjects: projectsWithMetrics.length,
    };
  }, [revenueByProject, projectProfitability, sortBy]);

  // Max variance for bar width calculation
  const maxVariance = useMemo(() => {
    if (!projectProfitability?.length) return 1;
    return Math.max(...projectProfitability.map(p => Math.abs(p.variance)), 1);
  }, [projectProfitability]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Benchmarking"
          description="Compare project performance and identify trends"
        />
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Benchmarking"
          description="Compare project performance and identify trends"
        />
        <Card className="p-8 text-center">
          <ExclamationCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Failed to load benchmarking data</h3>
          <p className="text-gray-500 mt-1">{error.message}</p>
        </Card>
      </div>
    );
  }

  if (!benchmarkData || benchmarkData.totalProjects === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Benchmarking"
          description="Compare project performance and identify trends"
        />
        <EmptyState
          icon={<ChartBarIcon className="h-full w-full" />}
          title="No benchmarking data available"
          description="Start tracking project revenue and budgets to see comparative analysis."
          action={{ label: 'Create Project', href: '/dashboard/projects/new' }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Benchmarking"
        description="Compare project performance and identify trends"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Projects Analyzed</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{benchmarkData.totalProjects}</p>
              <p className="mt-1 text-xs text-gray-500">With revenue or budget data</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <ChartBarIcon className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Average Profit Margin</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {formatPercentNoSign(benchmarkData.avgMargin)}
              </p>
              <TrendIndicator
                value={benchmarkData.avgMargin - 20}
                label="vs 20% target"
              />
            </div>
            <div className={cn(
              'p-2 rounded-lg',
              benchmarkData.avgMargin >= 20 ? 'bg-green-50' : 'bg-amber-50'
            )}>
              <ArrowTrendingUpIcon className={cn(
                'h-5 w-5',
                benchmarkData.avgMargin >= 20 ? 'text-green-600' : 'text-amber-600'
              )} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Budget Accuracy</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {formatPercentNoSign(benchmarkData.avgBudgetAccuracy)}
              </p>
              <TrendIndicator
                value={benchmarkData.avgBudgetAccuracy - 85}
                label="vs 85% target"
              />
            </div>
            <div className={cn(
              'p-2 rounded-lg',
              benchmarkData.avgBudgetAccuracy >= 85 ? 'bg-green-50' : 'bg-amber-50'
            )}>
              <CheckCircleIcon className={cn(
                'h-5 w-5',
                benchmarkData.avgBudgetAccuracy >= 85 ? 'text-green-600' : 'text-amber-600'
              )} />
            </div>
          </div>
        </Card>
      </div>

      {/* Best/Worst Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformerCard
          title="Top Performers"
          icon={<TrophyIcon className="h-5 w-5" />}
          projects={benchmarkData.bestPerformers.map(p => ({
            name: p.name,
            margin: p.margin,
            revenue: p.revenue,
          }))}
          type="best"
          emptyMessage="No projects with positive margin"
        />
        <PerformerCard
          title="Needs Attention"
          icon={<ExclamationTriangleIcon className="h-5 w-5" />}
          projects={benchmarkData.worstPerformers.map(p => ({
            name: p.name,
            margin: p.margin,
            revenue: p.revenue,
          }))}
          type="worst"
          emptyMessage="All projects meeting margin targets"
        />
      </div>

      {/* Margin Comparison Chart */}
      {benchmarkData.chartData.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Profit Margin Comparison</h3>
              <p className="text-xs text-gray-500 mt-0.5">Top 10 projects by selected metric</p>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'margin' | 'revenue' | 'variance')}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="margin">Sort by Margin</option>
              <option value="revenue">Sort by Revenue</option>
              <option value="variance">Sort by Budget Variance</option>
            </select>
          </div>
          <div className="h-[350px]">
            <BarChartCard
              title=""
              data={benchmarkData.chartData}
              dataKeys={['margin']}
              xAxisKey="name"
              valueFormatter={(v) => `${v}%`}
              horizontal
              colorByValue
              config={{
                colors: benchmarkData.chartData.map(d =>
                  d.margin >= 20 ? '#10B981' : d.margin >= 10 ? '#F59E0B' : '#EF4444'
                ),
              }}
            />
          </div>
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs text-gray-600">Excellent (20%+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-xs text-gray-600">Good (10-20%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-xs text-gray-600">Needs Attention (&lt;10%)</span>
            </div>
          </div>
        </Card>
      )}

      {/* Budget Accuracy Trending Table */}
      {(() => {
        const budgetProjects = projectProfitability.filter(p => p.budget > 0).sort((a, b) => a.variance - b.variance);
        const totalBudgetPages = Math.ceil(budgetProjects.length / ITEMS_PER_PAGE);
        const budgetStartIdx = (budgetPage - 1) * ITEMS_PER_PAGE;
        const budgetEndIdx = budgetStartIdx + ITEMS_PER_PAGE;
        const paginatedBudgetProjects = budgetProjects.slice(budgetStartIdx, budgetEndIdx);
        const showBudgetPagination = budgetProjects.length > ITEMS_PER_PAGE;

        return (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Budget Accuracy by Project</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Variance shows how much under/over budget each project is running
                </p>
              </div>
              {showBudgetPagination && (
                <span className="text-xs text-gray-500">
                  {budgetStartIdx + 1}-{Math.min(budgetEndIdx, budgetProjects.length)} of {budgetProjects.length}
                </span>
              )}
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
                      Actual Spend
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Variance
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % Used
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedBudgetProjects.map((project) => (
                    <BudgetAccuracyRow
                      key={project.projectId}
                      project={project}
                      maxVariance={maxVariance}
                    />
                  ))}
                  {budgetProjects.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No projects with budget data found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {showBudgetPagination && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <CompactPagination
                  currentPage={budgetPage}
                  totalPages={totalBudgetPages}
                  hasNextPage={budgetPage < totalBudgetPages}
                  hasPreviousPage={budgetPage > 1}
                  onNextPage={() => setBudgetPage(p => Math.min(p + 1, totalBudgetPages))}
                  onPreviousPage={() => setBudgetPage(p => Math.max(p - 1, 1))}
                />
              </div>
            )}
          </Card>
        );
      })()}

      {/* Project Comparison Table */}
      {(() => {
        const sortedComparisonProjects = [...benchmarkData.projects].sort((a, b) => b.margin - a.margin);
        const totalComparisonPages = Math.ceil(sortedComparisonProjects.length / ITEMS_PER_PAGE);
        const comparisonStartIdx = (comparisonPage - 1) * ITEMS_PER_PAGE;
        const comparisonEndIdx = comparisonStartIdx + ITEMS_PER_PAGE;
        const paginatedComparisonProjects = sortedComparisonProjects.slice(comparisonStartIdx, comparisonEndIdx);
        const showComparisonPagination = sortedComparisonProjects.length > ITEMS_PER_PAGE;

        return (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Full Project Comparison</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Side-by-side metrics for all projects with financial data
                </p>
              </div>
              {showComparisonPagination && (
                <span className="text-xs text-gray-500">
                  {comparisonStartIdx + 1}-{Math.min(comparisonEndIdx, sortedComparisonProjects.length)} of {sortedComparisonProjects.length}
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Costs
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profit
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Margin
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedComparisonProjects.map((project, idx) => {
                    const globalIndex = comparisonStartIdx + idx;
                    return (
                      <tr key={project.projectId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-[200px] truncate">
                          {project.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">
                          {formatCurrency(project.revenue)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">
                          {formatCurrency(project.costs)}
                        </td>
                        <td className={cn(
                          'px-4 py-3 text-sm font-medium text-right',
                          project.profit >= 0 ? 'text-green-600' : 'text-red-600'
                        )}>
                          {formatCurrency(project.profit)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                            project.margin >= 20
                              ? 'bg-green-100 text-green-800'
                              : project.margin >= 10
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          )}>
                            {formatPercentNoSign(project.margin)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
                            globalIndex < 3 ? 'bg-green-100 text-green-800' :
                            globalIndex >= sortedComparisonProjects.length - 3 ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-600'
                          )}>
                            {globalIndex + 1}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {showComparisonPagination && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <CompactPagination
                  currentPage={comparisonPage}
                  totalPages={totalComparisonPages}
                  hasNextPage={comparisonPage < totalComparisonPages}
                  hasPreviousPage={comparisonPage > 1}
                  onNextPage={() => setComparisonPage(p => Math.min(p + 1, totalComparisonPages))}
                  onPreviousPage={() => setComparisonPage(p => Math.max(p - 1, 1))}
                />
              </div>
            )}
          </Card>
        );
      })()}
    </div>
  );
}
