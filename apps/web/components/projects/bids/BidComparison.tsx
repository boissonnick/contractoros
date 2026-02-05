"use client";

import React from 'react';
import { Bid, Subcontractor } from '@/types';
import { cn } from '@/lib/utils';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface BidComparisonProps {
  bids: Bid[];
  subs: Subcontractor[];
  onAccept?: (bidId: string) => void;
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function BidComparison({ bids, subs, onAccept }: BidComparisonProps) {
  const activeBids = bids.filter(b => b.status !== 'withdrawn' && b.status !== 'rejected');
  const sortedByAmount = [...activeBids].sort((a, b) => a.amount - b.amount);
  const lowestAmount = sortedByAmount[0]?.amount;

  if (activeBids.length < 2) {
    return <p className="text-sm text-gray-400">Need at least 2 active bids to compare.</p>;
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-900">Bid Comparison</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedByAmount.map((bid) => {
          const sub = subs.find(s => s.id === bid.subId);
          const isLowest = bid.amount === lowestAmount;
          const isAccepted = bid.status === 'accepted';

          return (
            <div
              key={bid.id}
              className={cn(
                'border rounded-xl p-4',
                isAccepted ? 'border-green-300 bg-green-50' : isLowest ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{sub?.companyName || bid.subId}</p>
                  <p className="text-xs text-gray-500">{sub?.trade}</p>
                </div>
                {isAccepted && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
                {isLowest && !isAccepted && (
                  <span className="text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">Lowest</span>
                )}
              </div>

              <p className="text-2xl font-bold text-gray-900 mb-2">{fmt(bid.amount)}</p>

              <div className="space-y-1 text-xs text-gray-600">
                {bid.laborCost != null && <p>Labor: {fmt(bid.laborCost)}</p>}
                {bid.materialCost != null && <p>Materials: {fmt(bid.materialCost)}</p>}
                {bid.timeline && <p>Timeline: {bid.timeline}</p>}
                {sub?.metrics && (
                  <p className="text-gray-400">
                    Rating: {sub.metrics.avgRating > 0 ? `${sub.metrics.avgRating.toFixed(1)}/5` : 'N/A'}
                    {' · '}{sub.metrics.onTimeRate}% on-time
                  </p>
                )}
              </div>

              {onAccept && !isAccepted && bid.status !== 'rejected' && (
                <button
                  onClick={() => onAccept(bid.id)}
                  className="mt-3 w-full text-center text-xs font-medium py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Accept Bid
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
