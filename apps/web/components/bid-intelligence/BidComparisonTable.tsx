/**
 * BidComparisonTable Component
 *
 * Displays a table comparing multiple bids with intelligence scores
 * and recommendations for each.
 */

'use client';

import React, { useState } from 'react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { Bid, Subcontractor, BidAnalysis, BID_COMPARISON_RATINGS } from '@/types';

interface BidComparisonTableProps {
  bids: Array<{ bid: Bid; analysis: BidAnalysis; sub: Subcontractor }>;
  onSelectBid?: (bidId: string) => void;
  selectedBidId?: string;
  className?: string;
}

type SortField = 'amount' | 'score' | 'rating' | 'experience';
type SortDirection = 'asc' | 'desc';

export function BidComparisonTable({
  bids,
  onSelectBid,
  selectedBidId,
  className = '',
}: BidComparisonTableProps) {
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Sort bids
  const sortedBids = [...bids].sort((a, b) => {
    let aVal: number, bVal: number;
    switch (sortField) {
      case 'amount':
        aVal = a.bid.amount;
        bVal = b.bid.amount;
        break;
      case 'score':
        aVal = a.analysis.overallScore;
        bVal = b.analysis.overallScore;
        break;
      case 'rating':
        aVal = a.sub.metrics.avgRating;
        bVal = b.sub.metrics.avgRating;
        break;
      case 'experience':
        aVal = a.sub.metrics.projectsCompleted;
        bVal = b.sub.metrics.projectsCompleted;
        break;
      default:
        return 0;
    }
    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'amount' ? 'asc' : 'desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUpIcon className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDownIcon className="w-4 h-4 inline ml-1" />
    );
  };

  const getRecommendationBadge = (recommendation: BidAnalysis['recommendation']) => {
    const styles = {
      strongly_recommend: 'bg-green-100 text-green-800',
      recommend: 'bg-emerald-100 text-emerald-800',
      neutral: 'bg-gray-100 text-gray-800',
      caution: 'bg-yellow-100 text-yellow-800',
      avoid: 'bg-red-100 text-red-800',
    };
    const labels = {
      strongly_recommend: 'Best',
      recommend: 'Good',
      neutral: 'OK',
      caution: 'Caution',
      avoid: 'Avoid',
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[recommendation]}`}>
        {labels[recommendation]}
      </span>
    );
  };

  if (bids.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-8 text-center ${className}`}>
        <p className="text-gray-500">No bids to compare</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subcontractor
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('amount')}
              >
                Amount <SortIcon field="amount" />
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('score')}
              >
                Score <SortIcon field="score" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Market
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('rating')}
              >
                Rating <SortIcon field="rating" />
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('experience')}
              >
                Experience <SortIcon field="experience" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Flags
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Recommendation
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedBids.map(({ bid, analysis, sub }, index) => {
              const isSelected = selectedBidId === bid.id;
              const isBest = index === 0 && sortField === 'score' && sortDirection === 'desc';
              const marketRating = BID_COMPARISON_RATINGS[analysis.marketComparison.rating];
              const positiveFlags = analysis.flags.filter(f => f.type === 'positive').length;
              const warningFlags = analysis.flags.filter(f => f.type === 'warning').length;

              return (
                <tr
                  key={bid.id}
                  className={`${
                    isSelected
                      ? 'bg-blue-50'
                      : isBest
                      ? 'bg-green-50'
                      : 'hover:bg-gray-50'
                  } ${onSelectBid ? 'cursor-pointer' : ''}`}
                  onClick={() => onSelectBid?.(bid.id)}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{sub.companyName}</p>
                      <p className="text-xs text-gray-500">{sub.contactName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-sm font-semibold text-gray-900">
                      ${bid.amount.toLocaleString()}
                    </p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div
                      className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${
                        analysis.overallScore >= 70
                          ? 'bg-green-100 text-green-700'
                          : analysis.overallScore >= 50
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {analysis.overallScore}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-sm font-medium text-${marketRating.color}-600`}>
                      {marketRating.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <StarIcon className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="ml-1 text-sm text-gray-900">
                        {sub.metrics.avgRating.toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {sub.metrics.projectsCompleted} projects
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {positiveFlags > 0 && (
                        <span className="flex items-center text-green-600">
                          <CheckCircleIcon className="w-4 h-4" />
                          <span className="ml-0.5 text-xs">{positiveFlags}</span>
                        </span>
                      )}
                      {warningFlags > 0 && (
                        <span className="flex items-center text-yellow-600">
                          <ExclamationTriangleIcon className="w-4 h-4" />
                          <span className="ml-0.5 text-xs">{warningFlags}</span>
                        </span>
                      )}
                      {positiveFlags === 0 && warningFlags === 0 && (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getRecommendationBadge(analysis.recommendation)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BidComparisonTable;
