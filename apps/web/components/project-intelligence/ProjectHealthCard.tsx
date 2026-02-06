/**
 * ProjectHealthCard Component
 *
 * Displays overall project health with visual indicators for
 * schedule, budget, and quality status.
 */

'use client';

import React from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { ProjectIntelligence } from '@/types';

interface ProjectHealthCardProps {
  intelligence: ProjectIntelligence;
  className?: string;
}

const STATUS_CONFIGS = {
  schedule: {
    ahead: { icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-100', label: 'Ahead' },
    on_track: { icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-100', label: 'On Track' },
    behind: { icon: ExclamationTriangleIcon, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Behind' },
    at_risk: { icon: XCircleIcon, color: 'text-red-600', bg: 'bg-red-100', label: 'At Risk' },
  },
  budget: {
    under: { icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-100', label: 'Under Budget' },
    on_track: { icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-100', label: 'On Track' },
    over: { icon: XCircleIcon, color: 'text-red-600', bg: 'bg-red-100', label: 'Over Budget' },
    at_risk: { icon: ExclamationTriangleIcon, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'At Risk' },
  },
  quality: {
    excellent: { icon: SparklesIcon, color: 'text-green-600', bg: 'bg-green-100', label: 'Excellent' },
    good: { icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-100', label: 'Good' },
    fair: { icon: ExclamationTriangleIcon, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Fair' },
    poor: { icon: XCircleIcon, color: 'text-red-600', bg: 'bg-red-100', label: 'Poor' },
  },
};

function getHealthColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

function getHealthBgColor(score: number): string {
  if (score >= 80) return 'bg-green-100';
  if (score >= 60) return 'bg-yellow-100';
  if (score >= 40) return 'bg-orange-100';
  return 'bg-red-100';
}

export function ProjectHealthCard({
  intelligence,
  className = '',
}: ProjectHealthCardProps) {
  const { healthScore, overallRiskScore, statusSummary, riskIndicators } = intelligence;
  const criticalRisks = riskIndicators.filter(r => r.level === 'critical' || r.level === 'high');

  const scheduleConfig = STATUS_CONFIGS.schedule[statusSummary.scheduleStatus];
  const budgetConfig = STATUS_CONFIGS.budget[statusSummary.budgetStatus];
  const qualityConfig = STATUS_CONFIGS.quality[statusSummary.qualityStatus];

  const _ScheduleIcon = scheduleConfig.icon;
  const _BudgetIcon = budgetConfig.icon;
  const QualityIcon = qualityConfig.icon;

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm ${className}`}>
      {/* Header with health score */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Project Health</h3>
            <p className="text-sm text-gray-500">Overall status and risk indicators</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Health Score */}
            <div className="text-center">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${getHealthBgColor(healthScore)} ${getHealthColor(healthScore)}`}
              >
                {healthScore}
              </div>
              <span className="text-xs text-gray-500">Health</span>
            </div>
            {/* Risk Score */}
            <div className="text-center">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${
                  overallRiskScore <= 20
                    ? 'bg-green-100 text-green-600'
                    : overallRiskScore <= 50
                    ? 'bg-yellow-100 text-yellow-600'
                    : 'bg-red-100 text-red-600'
                }`}
              >
                {overallRiskScore}
              </div>
              <span className="text-xs text-gray-500">Risk</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status indicators */}
      <div className="p-4 grid grid-cols-3 gap-4">
        {/* Schedule */}
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${scheduleConfig.bg} mb-2`}>
            <ClockIcon className={`w-5 h-5 ${scheduleConfig.color}`} />
          </div>
          <p className="text-sm font-medium text-gray-900">Schedule</p>
          <p className={`text-xs ${scheduleConfig.color}`}>{scheduleConfig.label}</p>
        </div>

        {/* Budget */}
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${budgetConfig.bg} mb-2`}>
            <CurrencyDollarIcon className={`w-5 h-5 ${budgetConfig.color}`} />
          </div>
          <p className="text-sm font-medium text-gray-900">Budget</p>
          <p className={`text-xs ${budgetConfig.color}`}>{budgetConfig.label}</p>
        </div>

        {/* Quality/Margin */}
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${qualityConfig.bg} mb-2`}>
            <QualityIcon className={`w-5 h-5 ${qualityConfig.color}`} />
          </div>
          <p className="text-sm font-medium text-gray-900">Quality</p>
          <p className={`text-xs ${qualityConfig.color}`}>{qualityConfig.label}</p>
        </div>
      </div>

      {/* Critical risks summary */}
      {criticalRisks.length > 0 && (
        <div className="px-4 pb-4">
          <div className="bg-red-50 rounded-lg p-3 border border-red-100">
            <div className="flex items-center gap-2 text-red-800 mb-1">
              <ExclamationTriangleIcon className="w-4 h-4" />
              <span className="text-sm font-medium">
                {criticalRisks.length} Critical Risk{criticalRisks.length > 1 ? 's' : ''}
              </span>
            </div>
            <ul className="text-sm text-red-700 space-y-0.5">
              {criticalRisks.slice(0, 3).map(risk => (
                <li key={risk.id} className="truncate">• {risk.title}</li>
              ))}
              {criticalRisks.length > 3 && (
                <li className="text-red-600">+{criticalRisks.length - 3} more</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectHealthCard;
