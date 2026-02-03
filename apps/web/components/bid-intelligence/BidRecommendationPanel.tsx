/**
 * BidRecommendationPanel Component
 *
 * Displays bid solicitation recommendations including
 * recommended subs, market timing, and estimated rates.
 */

'use client';

import React from 'react';
import {
  UserGroupIcon,
  ClockIcon,
  CalendarIcon,
  ChartBarIcon,
  LightBulbIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { BidRecommendation, Subcontractor } from '@/types';

interface BidRecommendationPanelProps {
  recommendation: BidRecommendation;
  subcontractors: Subcontractor[];
  onSelectSub?: (subId: string) => void;
  onCreateSolicitation?: () => void;
  className?: string;
}

const TIMING_STYLES = {
  favorable: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircleIcon },
  neutral: { bg: 'bg-gray-100', text: 'text-gray-800', icon: ClockIcon },
  unfavorable: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: ExclamationTriangleIcon },
};

export function BidRecommendationPanel({
  recommendation,
  subcontractors,
  onSelectSub,
  onCreateSolicitation,
  className = '',
}: BidRecommendationPanelProps) {
  const {
    trade,
    recommendedSubIds,
    optimalBidCount,
    marketTiming,
    marketTimingReason,
    estimatedMarketRate,
    suggestedDeadline,
    notes,
  } = recommendation;

  const timingStyle = TIMING_STYLES[marketTiming];
  const TimingIcon = timingStyle.icon;

  // Get recommended sub details
  const recommendedSubs = recommendedSubIds
    .map(id => subcontractors.find(s => s.id === id))
    .filter((s): s is Subcontractor => s !== null);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <LightBulbIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Bid Recommendations</h3>
            <p className="text-sm text-gray-500 capitalize">{trade} Trade</p>
          </div>
        </div>
      </div>

      {/* Market timing */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Market Timing</span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${timingStyle.bg} ${timingStyle.text}`}>
            <TimingIcon className="w-3.5 h-3.5" />
            {marketTiming.charAt(0).toUpperCase() + marketTiming.slice(1)}
          </span>
        </div>
        {marketTimingReason && (
          <p className="text-sm text-gray-600">{marketTimingReason}</p>
        )}
      </div>

      {/* Estimated market rate */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <ChartBarIcon className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Estimated Market Rate</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-center">
            <p className="text-xs text-gray-500">Low</p>
            <p className="text-lg font-semibold text-green-600">
              ${estimatedMarketRate.low.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Average</p>
            <p className="text-lg font-semibold text-gray-900">
              ${estimatedMarketRate.average.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">High</p>
            <p className="text-lg font-semibold text-red-600">
              ${estimatedMarketRate.high.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Suggested deadline */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-700">Suggested Deadline</span>
          </div>
          <span className="text-sm font-medium text-gray-900">
            {suggestedDeadline.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Recommended subcontractors */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <UserGroupIcon className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Recommended Subcontractors</span>
          </div>
          <span className="text-xs text-gray-500">
            Request {optimalBidCount} bids
          </span>
        </div>
        <div className="space-y-2">
          {recommendedSubs.map((sub, index) => (
            <div
              key={sub.id}
              className={`flex items-center justify-between p-2 rounded-lg border ${
                onSelectSub ? 'cursor-pointer hover:bg-gray-50' : ''
              } ${index === 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}
              onClick={() => onSelectSub?.(sub.id)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  index === 0 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{sub.companyName}</p>
                  <p className="text-xs text-gray-500">{sub.contactName}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {sub.metrics.avgRating.toFixed(1)}★
                </p>
                <p className="text-xs text-gray-500">
                  {sub.metrics.projectsCompleted} projects
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      {notes.length > 0 && (
        <div className="p-4 border-b border-gray-100 bg-yellow-50">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Notes</h4>
          <ul className="space-y-1">
            {notes.map((note, i) => (
              <li key={i} className="text-sm text-yellow-700 flex items-start gap-2">
                <span className="text-yellow-500">•</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action button */}
      {onCreateSolicitation && (
        <div className="p-4">
          <button
            onClick={onCreateSolicitation}
            className="w-full px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 transition-colors font-medium"
          >
            Create Bid Solicitation
          </button>
        </div>
      )}
    </div>
  );
}

export default BidRecommendationPanel;
