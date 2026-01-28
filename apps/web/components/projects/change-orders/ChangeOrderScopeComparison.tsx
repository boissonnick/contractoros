"use client";

import React from 'react';
import { ChangeOrder, ProjectPhase } from '@/types';
import { cn } from '@/lib/utils';

interface ChangeOrderScopeComparisonProps {
  co: ChangeOrder;
  phases: ProjectPhase[];
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function ChangeOrderScopeComparison({ co, phases }: ChangeOrderScopeComparisonProps) {
  if (co.scopeChanges.length === 0) {
    return <p className="text-sm text-gray-400">No scope changes defined.</p>;
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-900">Before / After Comparison</h4>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 w-20">Type</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Phase</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Before</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">After</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {co.scopeChanges.map((sc) => {
              const phase = sc.phaseId ? phases.find(p => p.id === sc.phaseId) : null;
              return (
                <tr key={sc.id}>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full uppercase',
                      sc.type === 'add' ? 'bg-green-100 text-green-700' :
                      sc.type === 'remove' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    )}>
                      {sc.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{phase?.name || '—'}</td>
                  <td className="px-4 py-3">
                    {sc.type === 'add' ? (
                      <span className="text-gray-300 italic">N/A</span>
                    ) : (
                      <span className="text-gray-500 line-through">{sc.originalDescription || '—'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {sc.type === 'remove' ? (
                      <span className="text-red-500 italic">Removed</span>
                    ) : (
                      <span className="text-gray-900">{sc.proposedDescription}</span>
                    )}
                  </td>
                  <td className={cn('px-4 py-3 text-right font-medium', sc.costImpact > 0 ? 'text-red-600' : sc.costImpact < 0 ? 'text-green-600' : 'text-gray-500')}>
                    {sc.costImpact > 0 ? '+' : ''}{fmt(sc.costImpact)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t border-gray-200">
              <td colSpan={4} className="px-4 py-2 text-xs font-medium text-gray-500 text-right">Total Impact</td>
              <td className={cn('px-4 py-2 text-right font-bold', co.impact.costChange > 0 ? 'text-red-600' : 'text-green-600')}>
                {co.impact.costChange > 0 ? '+' : ''}{fmt(co.impact.costChange)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
