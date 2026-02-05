"use client";

import React from 'react';
import { ProjectPhase } from '@/types';
import { cn } from '@/lib/utils';
import {
  calculateBudgetPercentage,
  getBudgetStatus,
  getBudgetBarColor,
  formatBudgetCurrency,
  BUDGET_HELP_TEXT,
} from '@/lib/budget-utils';

interface PhaseBudgetProps {
  phase: ProjectPhase;
  onUpdate?: (data: { budgetAmount?: number; actualCost?: number }) => void;
}

export default function PhaseBudget({ phase, onUpdate: _onUpdate }: PhaseBudgetProps) {
  const budget = phase.budgetAmount || 0;
  const actual = phase.actualCost || 0;
  const remaining = budget - actual;
  const pct = Math.round(calculateBudgetPercentage(actual, budget));
  const status = getBudgetStatus(pct);
  const overBudget = actual > budget && budget > 0;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-900">Budget</h4>

      {budget === 0 ? (
        <p className="text-sm text-gray-400">No budget set for this phase.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-50 rounded-lg p-3" title={BUDGET_HELP_TEXT.totalBudget}>
              <p className="text-xs text-gray-500">Budget</p>
              <p className="text-sm font-semibold text-gray-900">{formatBudgetCurrency(budget)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3" title={BUDGET_HELP_TEXT.totalSpent}>
              <p className="text-xs text-gray-500">Spent</p>
              <p className={cn('text-sm font-semibold', overBudget ? 'text-red-600' : 'text-gray-900')}>
                {formatBudgetCurrency(actual)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3" title={BUDGET_HELP_TEXT.remaining}>
              <p className="text-xs text-gray-500">Remaining</p>
              <p className={cn('text-sm font-semibold', remaining < 0 ? 'text-red-600' : 'text-green-600')}>
                {formatBudgetCurrency(remaining)}
              </p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span title={BUDGET_HELP_TEXT.percentUsed}>{pct}% spent</span>
              {overBudget && <span className="text-red-500 font-medium">Over budget!</span>}
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  getBudgetBarColor(status)
                )}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
