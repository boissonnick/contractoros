'use client';

import React from 'react';
import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import { ProjectProfitability } from '@/types';
import { formatBudgetCurrency } from '@/lib/budget-utils';

interface MarginMeterProps {
  profitability: ProjectProfitability | null;
  loading?: boolean;
}

function getMarginColor(margin: number): { bar: string; text: string; bg: string } {
  if (margin >= 20) return { bar: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50' };
  if (margin >= 10) return { bar: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50' };
  if (margin >= 5) return { bar: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50' };
  return { bar: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' };
}

export function MarginMeter({ profitability, loading }: MarginMeterProps) {
  if (loading) {
    return (
      <Card className="p-5 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-32 mb-3" />
        <div className="h-6 bg-gray-200 rounded w-24 mb-4" />
        <div className="h-3 bg-gray-100 rounded-full mb-3" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-10 bg-gray-100 rounded" />
          <div className="h-10 bg-gray-100 rounded" />
          <div className="h-10 bg-gray-100 rounded" />
        </div>
      </Card>
    );
  }

  if (!profitability) {
    return (
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Contribution Margin</h3>
        <p className="text-sm text-gray-400 italic">
          No profitability data yet. Data populates automatically from time entries and expenses.
        </p>
      </Card>
    );
  }

  const { grossMargin, grossProfit, totalCosts, totalContractValue } = profitability;
  const colors = getMarginColor(grossMargin);
  const barWidth = Math.max(0, Math.min(grossMargin, 100));

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-gray-900">Contribution Margin</h3>
        <span className={cn('text-2xl font-bold', colors.text)}>
          {grossMargin.toFixed(1)}%
        </span>
      </div>

      {/* Bar */}
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div
          className={cn('h-full rounded-full transition-all', colors.bar)}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className={cn('rounded-lg p-2', colors.bg)}>
          <p className={cn('text-lg font-bold', colors.text)}>
            {formatBudgetCurrency(grossProfit)}
          </p>
          <p className="text-xs text-gray-500">Gross Profit</p>
        </div>
        <div className="rounded-lg p-2 bg-gray-50">
          <p className="text-lg font-bold text-gray-900">
            {formatBudgetCurrency(totalCosts)}
          </p>
          <p className="text-xs text-gray-500">Total Costs</p>
        </div>
        <div className="rounded-lg p-2 bg-gray-50">
          <p className="text-lg font-bold text-gray-900">
            {formatBudgetCurrency(totalContractValue)}
          </p>
          <p className="text-xs text-gray-500">Contract Value</p>
        </div>
      </div>

      {/* Warnings */}
      {profitability.isOverBudget && (
        <div className="mt-3 p-2 bg-red-50 rounded-lg text-sm text-red-700">
          Over budget by {formatBudgetCurrency(Math.abs(profitability.budgetVariance))}
        </div>
      )}
      {profitability.isAtRisk && !profitability.isOverBudget && (
        <div className="mt-3 p-2 bg-orange-50 rounded-lg text-sm text-orange-700">
          Margin below {profitability.marginAlertThreshold}% threshold
        </div>
      )}
    </Card>
  );
}
