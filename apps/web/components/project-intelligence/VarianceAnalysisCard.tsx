/**
 * VarianceAnalysisCard Component
 *
 * Displays post-project variance analysis comparing estimated vs actual costs.
 */

'use client';

import React, { useState } from 'react';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  LightBulbIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { ProjectVarianceAnalysis } from '@/types';

interface VarianceAnalysisCardProps {
  analysis: ProjectVarianceAnalysis;
  className?: string;
}

type ViewMode = 'category' | 'phase';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatVariance(variance: number, percent: number): { text: string; color: string; icon: React.ElementType } {
  if (Math.abs(percent) < 2) {
    return { text: 'On target', color: 'text-gray-600', icon: MinusIcon };
  }
  if (percent > 0) {
    return { text: `+${formatCurrency(variance)} (${percent.toFixed(1)}% over)`, color: 'text-red-600', icon: ArrowTrendingUpIcon };
  }
  return { text: `${formatCurrency(variance)} (${Math.abs(percent).toFixed(1)}% under)`, color: 'text-green-600', icon: ArrowTrendingDownIcon };
}

export function VarianceAnalysisCard({
  analysis,
  className = '',
}: VarianceAnalysisCardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('category');
  const { overall, byCategory, byPhase, insights, lessonsLearned } = analysis;

  const overallVariance = formatVariance(overall.variance, overall.variancePercent);
  const OverallIcon = overallVariance.icon;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Variance Analysis</h3>
        <p className="text-sm text-gray-500">Estimated vs Actual Comparison</p>
      </div>

      {/* Overall summary */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Estimated</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(overall.estimatedTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Actual</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(overall.actualTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Variance</p>
            <p className={`text-lg font-semibold ${overallVariance.color}`}>
              {overall.variancePercent >= 0 ? '+' : ''}{overall.variancePercent.toFixed(1)}%
            </p>
          </div>
        </div>
        <div className={`flex items-center justify-center gap-2 ${overallVariance.color}`}>
          <OverallIcon className="w-5 h-5" />
          <span className="font-medium">{overallVariance.text}</span>
        </div>
      </div>

      {/* View toggle */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('category')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'category'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            By Category
          </button>
          <button
            onClick={() => setViewMode('phase')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'phase'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            By Phase
          </button>
        </div>
      </div>

      {/* Breakdown table */}
      <div className="p-4">
        {viewMode === 'category' && (
          <div className="space-y-2">
            {byCategory.map(item => {
              const variance = formatVariance(item.variance, item.variancePercent);
              const VarianceIcon = variance.icon;
              return (
                <div
                  key={item.category}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 capitalize">{item.category}</p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(item.estimated)} → {formatCurrency(item.actual)}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 ${variance.color}`}>
                    <VarianceIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {item.variancePercent >= 0 ? '+' : ''}{item.variancePercent.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'phase' && (
          <div className="space-y-2">
            {byPhase.map(item => {
              const variance = formatVariance(item.variance, item.variancePercent);
              const VarianceIcon = variance.icon;
              return (
                <div
                  key={item.phaseId}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.phaseName}</p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(item.estimated)} → {formatCurrency(item.actual)}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 ${variance.color}`}>
                    <VarianceIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {item.variancePercent >= 0 ? '+' : ''}{item.variancePercent.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <LightBulbIcon className="w-4 h-4 text-yellow-500" />
            <h4 className="text-sm font-medium text-gray-700">Insights</h4>
          </div>
          <ul className="space-y-1 text-sm text-gray-600">
            {insights.map((insight, i) => (
              <li key={i}>• {insight}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Lessons Learned */}
      {lessonsLearned.length > 0 && (
        <div className="p-4 border-t border-gray-100 bg-blue-50">
          <div className="flex items-center gap-2 mb-2">
            <AcademicCapIcon className="w-4 h-4 text-blue-500" />
            <h4 className="text-sm font-medium text-blue-900">Lessons Learned</h4>
          </div>
          <ul className="space-y-1 text-sm text-blue-800">
            {lessonsLearned.map((lesson, i) => (
              <li key={i}>• {lesson}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default VarianceAnalysisCard;
