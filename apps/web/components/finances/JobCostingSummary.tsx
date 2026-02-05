'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import { Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  useOrgJobCosting,
  getCategoryColor,
  OrgJobCostingSummary,
} from '@/lib/hooks/useJobCosting';
import { COST_CATEGORY_LABELS, CostCategory } from '@/types';

export interface JobCostingSummaryProps {
  /** Optional: Show data for a specific project. If omitted, shows all projects */
  projectId?: string;
  /** Optional: Additional CSS classes */
  className?: string;
  /** Optional: Callback when clicking on a project */
  onProjectClick?: (projectId: string) => void;
}

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
 * Formats percentage with sign
 */
function formatPercent(value: number, showSign = true): string {
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Get budget status color and label
 */
function getBudgetStatus(variancePercent: number): {
  color: string;
  bgColor: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
} {
  if (variancePercent >= 10) {
    return {
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      label: 'Under Budget',
      icon: CheckCircleIcon,
    };
  } else if (variancePercent >= 0) {
    return {
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      label: 'Near Budget',
      icon: ChartBarIcon,
    };
  } else if (variancePercent >= -10) {
    return {
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      label: 'Slightly Over',
      icon: ArrowTrendingDownIcon,
    };
  } else {
    return {
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      label: 'Over Budget',
      icon: ExclamationTriangleIcon,
    };
  }
}

/**
 * Cost category breakdown bar
 */
function CostBreakdownBar({ costsByCategory }: { costsByCategory: Record<CostCategory, number> }) {
  const total = Object.values(costsByCategory).reduce((sum, val) => sum + val, 0);
  if (total === 0) return null;

  const categories = Object.entries(costsByCategory)
    .filter(([_, amount]) => amount > 0)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="space-y-2">
      {/* Stacked bar */}
      <div className="h-3 rounded-full overflow-hidden flex bg-gray-100">
        {categories.map(([category, amount]) => {
          const percentage = (amount / total) * 100;
          if (percentage < 1) return null;

          return (
            <div
              key={category}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${percentage}%`,
                backgroundColor: getCategoryColor(category as CostCategory),
              }}
              title={`${COST_CATEGORY_LABELS[category as CostCategory]?.label}: ${formatCurrency(amount)} (${percentage.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {categories.slice(0, 4).map(([category, amount]) => {
          const catInfo = COST_CATEGORY_LABELS[category as CostCategory];
          return (
            <div key={category} className="flex items-center gap-1.5 text-xs">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: getCategoryColor(category as CostCategory) }}
              />
              <span className="text-gray-600">{catInfo?.label}</span>
              <span className="font-medium text-gray-900">
                {((amount / total) * 100).toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Budget progress bar showing actual vs budget
 */
function BudgetProgressBar({
  budget,
  actual,
  className,
}: {
  budget: number;
  actual: number;
  className?: string;
}) {
  const percentage = budget > 0 ? Math.min((actual / budget) * 100, 120) : 0;
  const isOverBudget = actual > budget;

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">Progress</span>
        <span className={cn('font-medium', isOverBudget ? 'text-red-600' : 'text-gray-900')}>
          {percentage.toFixed(0)}% of budget
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            isOverBudget
              ? 'bg-red-500'
              : percentage > 90
                ? 'bg-amber-500'
                : percentage > 75
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
        {isOverBudget && (
          <div
            className="h-full bg-red-300 -mt-2.5"
            style={{ width: `${Math.min(percentage - 100, 20)}%`, marginLeft: '100%' }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Projects at risk list
 */
function ProjectsAtRiskList({
  projects,
  onProjectClick,
}: {
  projects: OrgJobCostingSummary['topOverBudgetProjects'];
  onProjectClick?: (projectId: string) => void;
}) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-gray-500">
        <CheckCircleIcon className="h-8 w-8 mx-auto text-green-400 mb-2" />
        All projects are within budget
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {projects.map((project) => {
        const status = getBudgetStatus(project.variancePercent);
        const StatusIcon = status.icon;

        return (
          <button
            key={project.projectId}
            onClick={() => onProjectClick?.(project.projectId)}
            className={cn(
              'w-full flex items-center justify-between p-3 rounded-lg transition-colors',
              'bg-gray-50 hover:bg-gray-100',
              onProjectClick && 'cursor-pointer'
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn('p-1.5 rounded-full', status.bgColor)}>
                <StatusIcon className={cn('h-4 w-4', status.color)} />
              </div>
              <div className="text-left min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {project.projectName || `Project ${project.projectId.slice(0, 8)}...`}
                </p>
                <p className="text-xs text-gray-500">
                  Budget: {formatCurrency(project.budget)}
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <p className={cn('font-semibold tabular-nums', status.color)}>
                {formatPercent(project.variancePercent)}
              </p>
              <p className="text-xs text-gray-500 tabular-nums">
                {formatCurrency(Math.abs(project.variance))} {project.variance < 0 ? 'over' : 'under'}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/**
 * JobCostingSummary - Displays job costing overview for the finance dashboard
 */
export default function JobCostingSummary({
  projectId,
  className,
  onProjectClick,
}: JobCostingSummaryProps) {
  const { summary, profitabilityData, loading, error } = useOrgJobCosting();

  // Filter to single project if projectId is provided
  const displayData = useMemo(() => {
    if (!projectId || !profitabilityData.length) return summary;

    const project = profitabilityData.find((p) => p.projectId === projectId);
    if (!project) return null;

    // Create summary from single project
    return {
      totalBudget: project.originalBudget || 0,
      totalActualCosts: project.totalCosts || 0,
      totalVariance: project.budgetVariance || 0,
      variancePercent: project.budgetVariancePercent || 0,
      projectsAtRisk: project.isAtRisk ? 1 : 0,
      projectsOverBudget: project.isOverBudget ? 1 : 0,
      projectsUnderBudget: project.budgetVariance > 0 ? 1 : 0,
      costsByCategory: project.costsByCategory || {},
      topOverBudgetProjects: project.isOverBudget
        ? [
            {
              projectId: project.projectId,
              projectName: project.projectId,
              budget: project.originalBudget || 0,
              actual: project.totalCosts || 0,
              variance: project.budgetVariance || 0,
              variancePercent: project.budgetVariancePercent || 0,
            },
          ]
        : [],
    } as OrgJobCostingSummary;
  }, [projectId, profitabilityData, summary]);

  if (loading) {
    return (
      <Card className={cn('p-5', className)}>
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-4 w-full mb-4" />
        <Skeleton className="h-32" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('p-5', className)}>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-red-100 rounded-lg">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Job Costing</h3>
        </div>
        <p className="text-sm text-red-600">Unable to load job costing data: {error}</p>
      </Card>
    );
  }

  if (!displayData) {
    return (
      <Card className={cn('p-5', className)}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gray-100 rounded-lg">
            <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900">Job Costing</h3>
        </div>
        <div className="text-center py-6 text-gray-500">
          <ChartBarIcon className="h-10 w-10 mx-auto text-gray-300 mb-2" />
          <p className="text-sm">No job costing data available</p>
          <p className="text-xs text-gray-400 mt-1">
            Start tracking costs on your projects to see insights here
          </p>
        </div>
      </Card>
    );
  }

  const overallStatus = getBudgetStatus(displayData.variancePercent);
  const OverallIcon = overallStatus.icon;

  return (
    <Card className={cn('p-5', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', overallStatus.bgColor)}>
            <OverallIcon className={cn('h-5 w-5', overallStatus.color)} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Job Costing Summary</h3>
            <p className="text-xs text-gray-500">{overallStatus.label}</p>
          </div>
        </div>
        {!projectId && (
          <Link
            href="/dashboard/reports/job-costing"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View Details
          </Link>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Total Budget</p>
          <p className="text-lg font-bold text-blue-700 tabular-nums">
            {formatCurrency(displayData.totalBudget)}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Actual Costs</p>
          <p className="text-lg font-bold text-gray-900 tabular-nums">
            {formatCurrency(displayData.totalActualCosts)}
          </p>
        </div>
        <div
          className={cn(
            'p-3 rounded-lg',
            displayData.totalVariance >= 0 ? 'bg-green-50' : 'bg-red-50'
          )}
        >
          <p className="text-xs text-gray-500 mb-1">Variance</p>
          <p
            className={cn(
              'text-lg font-bold tabular-nums',
              displayData.totalVariance >= 0 ? 'text-green-700' : 'text-red-700'
            )}
          >
            {formatPercent(displayData.variancePercent)}
          </p>
        </div>
      </div>

      {/* Budget Progress Bar */}
      <BudgetProgressBar
        budget={displayData.totalBudget}
        actual={displayData.totalActualCosts}
        className="mb-4"
      />

      {/* Cost Breakdown by Category */}
      {displayData.costsByCategory &&
        Object.values(displayData.costsByCategory).some((v) => v > 0) && (
          <div className="mb-4 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Cost Breakdown</h4>
            <CostBreakdownBar costsByCategory={displayData.costsByCategory} />
          </div>
        )}

      {/* Projects At Risk Section (only for org-wide view) */}
      {!projectId && (
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Projects At Risk</h4>
            {displayData.projectsOverBudget > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                {displayData.projectsOverBudget} over budget
              </span>
            )}
          </div>
          <ProjectsAtRiskList
            projects={displayData.topOverBudgetProjects}
            onProjectClick={onProjectClick}
          />
        </div>
      )}

      {/* Project Status Summary (only for org-wide view) */}
      {!projectId && profitabilityData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {profitabilityData.length} project{profitabilityData.length !== 1 ? 's' : ''} tracked
            </span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-gray-600">{displayData.projectsUnderBudget} under</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-gray-600">{displayData.projectsOverBudget} over</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

// Export types for consumers
export type { OrgJobCostingSummary };
