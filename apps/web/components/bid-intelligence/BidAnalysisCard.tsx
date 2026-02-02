/**
 * BidAnalysisCard Component
 *
 * Displays comprehensive bid analysis with market comparison,
 * flags, and recommendations.
 */

'use client';

import React from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { BidAnalysis, BID_COMPARISON_RATINGS } from '@/types';

interface BidAnalysisCardProps {
  analysis: BidAnalysis;
  showDetails?: boolean;
  onToggleDetails?: () => void;
  className?: string;
}

const RECOMMENDATION_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  strongly_recommend: { bg: 'bg-green-100', text: 'text-green-800', label: 'Strongly Recommend' },
  recommend: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Recommend' },
  neutral: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Neutral' },
  caution: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Use Caution' },
  avoid: { bg: 'bg-red-100', text: 'text-red-800', label: 'Not Recommended' },
};

export function BidAnalysisCard({
  analysis,
  showDetails = false,
  onToggleDetails,
  className = '',
}: BidAnalysisCardProps) {
  const { marketComparison, historyComparison, competitorComparison, flags, overallScore, recommendation } = analysis;
  const ratingConfig = BID_COMPARISON_RATINGS[marketComparison.rating];
  const recStyle = RECOMMENDATION_STYLES[recommendation];

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header with score and recommendation */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Score circle */}
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${
                overallScore >= 70
                  ? 'bg-green-100 text-green-700'
                  : overallScore >= 50
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {overallScore}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Bid Analysis</h3>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${recStyle.bg} ${recStyle.text}`}>
                {recStyle.label}
              </span>
            </div>
          </div>
          {onToggleDetails && (
            <button
              onClick={onToggleDetails}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              {showDetails ? (
                <ChevronUpIcon className="w-5 h-5" />
              ) : (
                <ChevronDownIcon className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Market comparison */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Market Position</span>
          <span className={`text-sm font-medium text-${ratingConfig.color}-600`}>
            {ratingConfig.label}
          </span>
        </div>
        <div className="relative h-2 bg-gray-200 rounded-full">
          <div
            className="absolute h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full"
            style={{ width: '100%' }}
          />
          <div
            className="absolute w-3 h-3 bg-white border-2 border-gray-800 rounded-full -top-0.5"
            style={{ left: `calc(${marketComparison.percentileRank}% - 6px)` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>${marketComparison.marketLow.toLocaleString()}</span>
          <span>${marketComparison.marketAverage.toLocaleString()} avg</span>
          <span>${marketComparison.marketHigh.toLocaleString()}</span>
        </div>
      </div>

      {/* Flags */}
      {flags.length > 0 && (
        <div className="p-4 border-b border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Key Insights</h4>
          <div className="space-y-1.5">
            {flags.slice(0, showDetails ? undefined : 3).map((flag, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 text-sm ${
                  flag.type === 'warning'
                    ? 'text-yellow-700'
                    : flag.type === 'positive'
                    ? 'text-green-700'
                    : 'text-gray-600'
                }`}
              >
                {flag.type === 'warning' ? (
                  <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                ) : flag.type === 'positive' ? (
                  <CheckCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                ) : (
                  <InformationCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                )}
                <span>{flag.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expanded details */}
      {showDetails && (
        <>
          {/* History comparison */}
          {historyComparison && (
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Historical Comparison</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Sub&apos;s Avg Bid</span>
                  <p className="font-medium">${historyComparison.subAverageBid.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Change</span>
                  <p className={`font-medium flex items-center gap-1 ${
                    historyComparison.percentChange > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {historyComparison.percentChange > 0 ? (
                      <ArrowTrendingUpIcon className="w-4 h-4" />
                    ) : (
                      <ArrowTrendingDownIcon className="w-4 h-4" />
                    )}
                    {Math.abs(historyComparison.percentChange).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Total Bids from Sub</span>
                  <p className="font-medium">{historyComparison.totalBidsFromSub}</p>
                </div>
                <div>
                  <span className="text-gray-500">Price Trend</span>
                  <p className="font-medium capitalize">{historyComparison.trend}</p>
                </div>
              </div>
            </div>
          )}

          {/* Competitor comparison */}
          {competitorComparison && (
            <div className="p-4 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Compared to Other Bids</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Rank</span>
                  <p className="font-medium">
                    #{competitorComparison.rank} of {competitorComparison.totalBidsReceived}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Average of All Bids</span>
                  <p className="font-medium">${competitorComparison.averageOfAllBids.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Lowest Bid</span>
                  <p className="font-medium">${competitorComparison.lowestBid.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Highest Bid</span>
                  <p className="font-medium">${competitorComparison.highestBid.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Recommendation text */}
      <div className="p-4 bg-blue-50">
        <p className="text-sm text-blue-800">{marketComparison.recommendation}</p>
      </div>
    </div>
  );
}

export default BidAnalysisCard;
