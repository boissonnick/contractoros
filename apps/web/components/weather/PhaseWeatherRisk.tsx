'use client';

import React from 'react';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { WeatherRiskAssessment } from '@/types';
import { WeatherRiskBadge } from './WeatherRiskBadge';
import { cn } from '@/lib/utils';

interface PhaseWeatherRiskProps {
  assessment: WeatherRiskAssessment;
  showDetails?: boolean;
  className?: string;
}

/**
 * Display weather risk assessment for a specific phase
 */
export function PhaseWeatherRisk({
  assessment,
  showDetails = true,
  className,
}: PhaseWeatherRiskProps) {
  const hasRisk = assessment.overallRisk !== 'none';
  const hasHighRisk = assessment.overallRisk === 'high' || assessment.overallRisk === 'severe';

  return (
    <div
      className={cn(
        'rounded-lg border p-3',
        hasHighRisk ? 'bg-red-50 border-red-200' :
        hasRisk ? 'bg-amber-50 border-amber-200' :
        'bg-green-50 border-green-200',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {hasHighRisk ? (
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
          ) : hasRisk ? (
            <ClockIcon className="h-5 w-5 text-amber-600" />
          ) : (
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
          )}
          <div>
            <span className="text-sm font-medium text-gray-900">
              {assessment.phaseName || 'Weather Risk'}
            </span>
            {assessment.forecastDate && (
              <span className="text-xs text-gray-500 ml-2">
                {assessment.forecastDate.toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <WeatherRiskBadge level={assessment.overallRisk} size="sm" />
      </div>

      {showDetails && (
        <>
          {/* Weather conditions */}
          <div className="mt-2 flex gap-4 text-xs text-gray-600">
            <span>{Math.round(assessment.temperature)}°F</span>
            <span>{assessment.precipitation}% precip</span>
            <span>{Math.round(assessment.windSpeed)} mph wind</span>
          </div>

          {/* Affected trades */}
          {assessment.affectedTrades.length > 0 && (
            <div className="mt-2">
              <span className="text-xs font-medium text-gray-600">Affected trades:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {assessment.affectedTrades.map((trade, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-white border border-gray-200"
                  >
                    {trade}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Risk factors */}
          {assessment.riskFactors.length > 0 && (
            <div className="mt-2 space-y-1">
              {assessment.riskFactors.map((factor, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs">
                  <ExclamationTriangleIcon
                    className={cn(
                      'h-3.5 w-3.5 mt-0.5 flex-shrink-0',
                      factor.severity === 'severe' ? 'text-orange-700' :
                      factor.severity === 'high' ? 'text-red-500' :
                      factor.severity === 'moderate' ? 'text-amber-500' :
                      'text-gray-400'
                    )}
                  />
                  <span className="text-gray-700">{factor.description}</span>
                </div>
              ))}
            </div>
          )}

          {/* Recommended actions */}
          {assessment.recommendedActions.length > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-200">
              <span className="text-xs font-medium text-gray-600">Recommendations:</span>
              <ul className="mt-1 space-y-1">
                {assessment.recommendedActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                    <span className="text-gray-400">•</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Delay estimate */}
          {assessment.estimatedDelayHours !== undefined && assessment.estimatedDelayHours > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs">
              <ClockIcon className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-gray-600">
                Estimated delay: {assessment.estimatedDelayHours}h
              </span>
            </div>
          )}

          {/* Work pause warning */}
          {assessment.shouldPauseWork && (
            <div className="mt-3 p-2 bg-red-100 rounded text-xs text-red-800 font-medium">
              Consider pausing outdoor work due to weather conditions
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Inline badge showing phase weather risk
 */
export function PhaseWeatherRiskBadge({
  assessment,
  className,
}: {
  assessment: WeatherRiskAssessment;
  className?: string;
}) {
  const hasHighRisk = assessment.overallRisk === 'high' || assessment.overallRisk === 'severe';

  if (assessment.overallRisk === 'none') return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs',
        hasHighRisk ? 'text-red-600' : 'text-amber-600',
        className
      )}
      title={assessment.riskFactors.map(f => f.description).join(', ')}
    >
      <ExclamationTriangleIcon className="h-3.5 w-3.5" />
      <span className="font-medium">
        {hasHighRisk ? 'Weather Risk' : 'Weather Alert'}
      </span>
    </span>
  );
}
