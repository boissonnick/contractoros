"use client";

import React from 'react';
import { ChangeOrder, ProjectPhase } from '@/types';
import { cn } from '@/lib/utils';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, CalendarDaysIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ChangeOrderImpactAnalysisProps {
  co: ChangeOrder;
  phases: ProjectPhase[];
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0, signDisplay: 'always' }).format(n);
}

export default function ChangeOrderImpactAnalysis({ co, phases }: ChangeOrderImpactAnalysisProps) {
  const { impact } = co;
  const costUp = impact.costChange > 0;
  const scheduleUp = impact.scheduleChange > 0;

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-900">Impact Analysis</h4>

      <div className="grid grid-cols-2 gap-4">
        <div className={cn('rounded-xl p-4 border', costUp ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50')}>
          <div className="flex items-center gap-2 mb-1">
            {costUp ? <ArrowTrendingUpIcon className="h-5 w-5 text-red-500" /> : <ArrowTrendingDownIcon className="h-5 w-5 text-green-500" />}
            <span className="text-xs font-medium text-gray-500">Cost Impact</span>
          </div>
          <p className={cn('text-xl font-bold', costUp ? 'text-red-700' : 'text-green-700')}>{fmt(impact.costChange)}</p>
        </div>

        <div className={cn('rounded-xl p-4 border', scheduleUp ? 'border-orange-200 bg-orange-50' : impact.scheduleChange < 0 ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50')}>
          <div className="flex items-center gap-2 mb-1">
            <CalendarDaysIcon className="h-5 w-5 text-gray-500" />
            <span className="text-xs font-medium text-gray-500">Schedule Impact</span>
          </div>
          <p className={cn('text-xl font-bold', scheduleUp ? 'text-orange-700' : impact.scheduleChange < 0 ? 'text-green-700' : 'text-gray-700')}>
            {impact.scheduleChange === 0 ? 'No change' : `${impact.scheduleChange > 0 ? '+' : ''}${impact.scheduleChange} days`}
          </p>
        </div>
      </div>

      {/* Scope changes breakdown */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Scope Changes ({co.scopeChanges.length})</p>
        <div className="space-y-2">
          {co.scopeChanges.map((sc) => {
            const phase = sc.phaseId ? phases.find(p => p.id === sc.phaseId) : null;
            return (
              <div key={sc.id} className="flex items-start gap-3 px-3 py-2 bg-gray-50 rounded-lg">
                <span className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded-full uppercase mt-0.5',
                  sc.type === 'add' ? 'bg-green-100 text-green-700' :
                  sc.type === 'remove' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                )}>
                  {sc.type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{sc.proposedDescription}</p>
                  {sc.originalDescription && (
                    <p className="text-xs text-gray-400 line-through mt-0.5">{sc.originalDescription}</p>
                  )}
                  {phase && <p className="text-xs text-gray-500 mt-0.5">Phase: {phase.name}</p>}
                </div>
                <span className={cn('text-sm font-medium', sc.costImpact > 0 ? 'text-red-600' : sc.costImpact < 0 ? 'text-green-600' : 'text-gray-500')}>
                  {fmt(sc.costImpact)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Affected phases */}
      {impact.affectedPhaseIds.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Affected Phases</p>
          <div className="flex flex-wrap gap-1.5">
            {impact.affectedPhaseIds.map((phaseId) => {
              const phase = phases.find(p => p.id === phaseId);
              return (
                <span key={phaseId} className="text-xs px-2 py-0.5 bg-orange-50 text-orange-700 rounded-full">
                  <ExclamationTriangleIcon className="inline h-3 w-3 mr-0.5" />
                  {phase?.name || phaseId}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
