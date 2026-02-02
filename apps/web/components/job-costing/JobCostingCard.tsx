'use client';

import React from 'react';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Card, Badge } from '@/components/ui';
import { ProjectProfitability, CostCategory, COST_CATEGORY_LABELS } from '@/types';
import { formatCurrency, formatPercent } from '@/lib/hooks/useJobCosting';

interface JobCostingCardProps {
  profitability: ProjectProfitability | null;
  loading?: boolean;
  compact?: boolean;
  showDetails?: boolean;
  onViewDetails?: () => void;
}

/**
 * JobCostingCard - Displays real-time cost vs budget summary
 */
export function JobCostingCard({
  profitability,
  loading = false,
  compact = false,
  showDetails = true,
  onViewDetails,
}: JobCostingCardProps) {
  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded" />
            <div className="h-8 bg-gray-200 rounded" />
            <div className="h-8 bg-gray-200 rounded" />
          </div>
        </div>
      </Card>
    );
  }

  if (!profitability) {
    return (
      <Card className="p-4">
        <div className="text-center py-6">
          <CurrencyDollarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No cost data available</p>
          <p className="text-xs text-gray-400 mt-1">Add job costs to track profitability</p>
        </div>
      </Card>
    );
  }

  const {
    totalContractValue,
    totalCosts,
    grossProfit,
    grossMargin,
    projectedProfit,
    projectedMargin,
    budgetVariance,
    budgetVariancePercent,
    isOverBudget,
    isAtRisk,
    costsByCategory,
  } = profitability;

  // Determine status - using Badge variants
  const getStatus = () => {
    if (isOverBudget) {
      return { label: 'Over Budget', variant: 'danger' as const, icon: ExclamationTriangleIcon };
    }
    if (isAtRisk) {
      return { label: 'At Risk', variant: 'warning' as const, icon: ExclamationTriangleIcon };
    }
    if (grossMargin >= 20) {
      return { label: 'Healthy', variant: 'success' as const, icon: CheckCircleIcon };
    }
    return { label: 'On Track', variant: 'primary' as const, icon: CheckCircleIcon };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  // Progress percentage (costs vs budget)
  const progressPercent = totalContractValue > 0
    ? Math.min((totalCosts / totalContractValue) * 100, 100)
    : 0;

  if (compact) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Job Costing</h3>
          <Badge variant={status.variant} size="sm">
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Costs / Budget</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(totalCosts)}
              <span className="text-sm text-gray-400 font-normal"> / {formatCurrency(totalContractValue)}</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Gross Margin</p>
            <p className={`text-lg font-semibold ${grossMargin >= 15 ? 'text-green-600' : grossMargin >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
              {grossMargin.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{progressPercent.toFixed(0)}% spent</span>
            <span>{formatCurrency(totalContractValue - totalCosts)} remaining</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isOverBudget ? 'bg-red-500' : isAtRisk ? 'bg-amber-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            View Details →
          </button>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Job Costing Summary</h3>
        <Badge variant={status.variant}>
          <StatusIcon className="h-3.5 w-3.5 mr-1" />
          {status.label}
        </Badge>
      </div>

      {/* Main metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricBox
          label="Contract Value"
          value={formatCurrency(totalContractValue)}
          icon={CurrencyDollarIcon}
        />
        <MetricBox
          label="Total Costs"
          value={formatCurrency(totalCosts)}
          trend={budgetVariance < 0 ? 'down' : 'up'}
          trendValue={formatPercent(budgetVariancePercent)}
          trendPositive={budgetVariance >= 0}
        />
        <MetricBox
          label="Gross Profit"
          value={formatCurrency(grossProfit)}
          trend={grossProfit >= 0 ? 'up' : 'down'}
          trendPositive={grossProfit >= 0}
        />
        <MetricBox
          label="Gross Margin"
          value={`${grossMargin.toFixed(1)}%`}
          trend={grossMargin >= 15 ? 'up' : 'down'}
          trendPositive={grossMargin >= 15}
        />
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Budget Used: {progressPercent.toFixed(1)}%</span>
          <span>{formatCurrency(Math.max(0, totalContractValue - totalCosts))} remaining</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isOverBudget ? 'bg-red-500' : progressPercent > 80 ? 'bg-amber-500' : 'bg-green-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Projected values */}
      {showDetails && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Projected at Completion
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Projected Profit</p>
              <p className={`text-lg font-semibold ${projectedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(projectedProfit)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Projected Margin</p>
              <p className={`text-lg font-semibold ${projectedMargin >= 15 ? 'text-green-600' : projectedMargin >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
                {projectedMargin.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cost breakdown preview */}
      {showDetails && costsByCategory && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Cost Breakdown
          </h4>
          <div className="space-y-2">
            {(Object.entries(costsByCategory) as [CostCategory, number][])
              .filter(([, amount]) => amount > 0)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 4)
              .map(([category, amount]) => {
                const categoryInfo = COST_CATEGORY_LABELS[category];
                const percent = totalCosts > 0 ? (amount / totalCosts) * 100 : 0;
                return (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className={`w-2 h-2 rounded-full mr-2 bg-${categoryInfo.color}-500`}
                        style={{ backgroundColor: getCategoryColorHex(categoryInfo.color) }}
                      />
                      <span className="text-sm text-gray-600">{categoryInfo.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(amount)}</span>
                      <span className="text-xs text-gray-500 ml-2">({percent.toFixed(0)}%)</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {onViewDetails && (
        <button
          onClick={onViewDetails}
          className="mt-4 w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-2 border-t border-gray-200"
        >
          View Full Cost Report →
        </button>
      )}
    </Card>
  );
}

interface MetricBoxProps {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down';
  trendValue?: string;
  trendPositive?: boolean;
}

function MetricBox({ label, value, icon: Icon, trend, trendValue, trendPositive }: MetricBoxProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-gray-500">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-gray-400" />}
      </div>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
      {trend && trendValue && (
        <div className={`flex items-center mt-1 text-xs ${trendPositive ? 'text-green-600' : 'text-red-600'}`}>
          {trend === 'up' ? (
            <ArrowTrendingUpIcon className="h-3 w-3 mr-0.5" />
          ) : (
            <ArrowTrendingDownIcon className="h-3 w-3 mr-0.5" />
          )}
          {trendValue}
        </div>
      )}
    </div>
  );
}

function getCategoryColorHex(color: string): string {
  const colors: Record<string, string> = {
    blue: '#3B82F6',
    purple: '#8B5CF6',
    amber: '#F59E0B',
    orange: '#F97316',
    green: '#10B981',
    gray: '#6B7280',
    slate: '#64748B',
  };
  return colors[color] || colors.gray;
}

export default JobCostingCard;
