/**
 * SubcontractorScoreCard Component
 *
 * Displays comprehensive subcontractor intelligence with
 * score breakdown, metrics, and recommendations.
 */

'use client';

import React, { useState } from 'react';
import {
  StarIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import {
  SubcontractorIntelligence,
  SubcontractorScoreCategory,
  SUBCONTRACTOR_SCORE_CATEGORIES,
} from '@/types';

interface SubcontractorScoreCardProps {
  intelligence: SubcontractorIntelligence;
  subName?: string;
  compact?: boolean;
  className?: string;
}

const CATEGORY_ICONS: Record<SubcontractorScoreCategory, React.ElementType> = {
  quality: StarIcon,
  reliability: ClockIcon,
  communication: ChatBubbleLeftRightIcon,
  price_competitiveness: CurrencyDollarIcon,
  safety: ShieldCheckIcon,
};

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-emerald-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-100';
  if (score >= 60) return 'bg-emerald-100';
  if (score >= 40) return 'bg-yellow-100';
  return 'bg-red-100';
}

export function SubcontractorScoreCard({
  intelligence,
  subName,
  compact = false,
  className = '',
}: SubcontractorScoreCardProps) {
  const [expanded, setExpanded] = useState(false);

  const { overallScore, scoreBreakdown, performanceMetrics, pricingMetrics, reliabilityMetrics, recommendations } = intelligence;

  if (compact) {
    return (
      <div className={`flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 ${className}`}>
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${getScoreBgColor(overallScore)} ${getScoreColor(overallScore)}`}
        >
          {overallScore}
        </div>
        <div className="flex-1 min-w-0">
          {subName && <p className="font-medium text-gray-900 truncate">{subName}</p>}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{performanceMetrics.projectsCompleted} projects</span>
            <span>•</span>
            <span>{Math.round(performanceMetrics.onTimeCompletionRate)}% on-time</span>
          </div>
        </div>
        <div className="flex">
          {[1, 2, 3, 4, 5].map(star => (
            <StarIconSolid
              key={star}
              className={`w-4 h-4 ${
                star <= Math.round(reliabilityMetrics.communicationRating)
                  ? 'text-yellow-400'
                  : 'text-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${getScoreBgColor(overallScore)} ${getScoreColor(overallScore)}`}
            >
              {overallScore}
            </div>
            <div>
              {subName && <h3 className="font-semibold text-gray-900">{subName}</h3>}
              <p className="text-sm text-gray-500">Subcontractor Intelligence Score</p>
              <div className="flex mt-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <StarIconSolid
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(reliabilityMetrics.communicationRating)
                        ? 'text-yellow-400'
                        : 'text-gray-200'
                    }`}
                  />
                ))}
                <span className="ml-1 text-xs text-gray-500">
                  ({reliabilityMetrics.communicationRating.toFixed(1)})
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            {expanded ? (
              <ChevronUpIcon className="w-5 h-5" />
            ) : (
              <ChevronDownIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="p-4 border-b border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Score Breakdown</h4>
        <div className="space-y-3">
          {scoreBreakdown.map(item => {
            const Icon = CATEGORY_ICONS[item.category];
            const config = SUBCONTRACTOR_SCORE_CATEGORIES[item.category];
            return (
              <div key={item.category} className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">{config.label}</span>
                    <span className={`text-sm font-medium ${getScoreColor(item.score)}`}>
                      {item.score}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.score >= 80
                          ? 'bg-green-500'
                          : item.score >= 60
                          ? 'bg-emerald-500'
                          : item.score >= 40
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <>
          {/* Performance metrics */}
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Performance Metrics</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Projects Completed</span>
                <p className="font-medium">{performanceMetrics.projectsCompleted}</p>
              </div>
              <div>
                <span className="text-gray-500">On-Time Rate</span>
                <p className={`font-medium ${
                  performanceMetrics.onTimeCompletionRate >= 80 ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {Math.round(performanceMetrics.onTimeCompletionRate)}%
                </p>
              </div>
              <div>
                <span className="text-gray-500">Budget Adherence</span>
                <p className={`font-medium ${
                  performanceMetrics.budgetAdherenceRate >= 90 ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {Math.round(performanceMetrics.budgetAdherenceRate)}%
                </p>
              </div>
              <div>
                <span className="text-gray-500">Repeat Hire Rate</span>
                <p className="font-medium">{Math.round(performanceMetrics.repeatHireRate)}%</p>
              </div>
            </div>
          </div>

          {/* Pricing metrics */}
          <div className="p-4 border-b border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Pricing Analysis</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Bid Acceptance Rate</span>
                <p className="font-medium">{Math.round(pricingMetrics.bidAcceptanceRate)}%</p>
              </div>
              <div>
                <span className="text-gray-500">Price Consistency</span>
                <p className="font-medium">{Math.round(pricingMetrics.priceConsistency)}%</p>
              </div>
              <div>
                <span className="text-gray-500">Avg vs Market</span>
                <p className={`font-medium ${
                  pricingMetrics.avgBidVsMarket <= 100 ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {Math.round(pricingMetrics.avgBidVsMarket)}%
                </p>
              </div>
              <div>
                <span className="text-gray-500">Typical Discount</span>
                <p className="font-medium">{pricingMetrics.avgNegotiationDiscount}%</p>
              </div>
            </div>
          </div>

          {/* Reliability metrics */}
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Reliability</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Show-Up Rate</span>
                <p className={`font-medium ${
                  reliabilityMetrics.showUpRate >= 95 ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {Math.round(reliabilityMetrics.showUpRate)}%
                </p>
              </div>
              <div>
                <span className="text-gray-500">Avg Delay</span>
                <p className="font-medium">{reliabilityMetrics.avgDelayDays} days</p>
              </div>
              <div>
                <span className="text-gray-500">Communication</span>
                <p className="font-medium">{reliabilityMetrics.communicationRating.toFixed(1)}/5</p>
              </div>
              <div>
                <span className="text-gray-500">Documents Complete</span>
                <p className={`font-medium ${
                  reliabilityMetrics.documentCompleteness === 100 ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {Math.round(reliabilityMetrics.documentCompleteness)}%
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Recommendations */}
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h4>
        <div className="space-y-1.5">
          {recommendations.map((rec, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-sm text-gray-600"
            >
              {rec.toLowerCase().includes('preferred') || rec.toLowerCase().includes('solid') ? (
                <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              )}
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SubcontractorScoreCard;
