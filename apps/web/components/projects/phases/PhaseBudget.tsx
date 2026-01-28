"use client";

import React from 'react';
import { ProjectPhase } from '@/types';
import { cn } from '@/lib/utils';

interface PhaseBudgetProps {
  phase: ProjectPhase;
  onUpdate?: (data: { budgetAmount?: number; actualCost?: number }) => void;
}

function fmt(n?: number): string {
  if (n == null) return '$0';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function PhaseBudget({ phase, onUpdate }: PhaseBudgetProps) {
  const budget = phase.budgetAmount || 0;
  const actual = phase.actualCost || 0;
  const remaining = budget - actual;
  const pct = budget > 0 ? Math.round((actual / budget) * 100) : 0;
  const overBudget = actual > budget && budget > 0;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-900">Budget</h4>

      {budget === 0 ? (
        <p className="text-sm text-gray-400">No budget set for this phase.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Budget</p>
              <p className="text-sm font-semibold text-gray-900">{fmt(budget)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Spent</p>
              <p className={cn('text-sm font-semibold', overBudget ? 'text-red-600' : 'text-gray-900')}>
                {fmt(actual)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Remaining</p>
              <p className={cn('text-sm font-semibold', remaining < 0 ? 'text-red-600' : 'text-green-600')}>
                {fmt(remaining)}
              </p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{pct}% spent</span>
              {overBudget && <span className="text-red-500 font-medium">Over budget!</span>}
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  overBudget ? 'bg-red-500' : pct > 80 ? 'bg-yellow-500' : 'bg-green-500'
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
