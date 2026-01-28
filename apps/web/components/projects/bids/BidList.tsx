"use client";

import React from 'react';
import { Bid, Subcontractor } from '@/types';
import { cn } from '@/lib/utils';

interface BidListProps {
  bids: Bid[];
  subs: Subcontractor[];
  onBidClick?: (bid: Bid) => void;
  onStatusChange?: (bidId: string, status: Bid['status']) => void;
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-600' },
  submitted: { bg: 'bg-blue-100', text: 'text-blue-700' },
  under_review: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  accepted: { bg: 'bg-green-100', text: 'text-green-700' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700' },
  withdrawn: { bg: 'bg-gray-100', text: 'text-gray-400' },
};

export default function BidList({ bids, subs, onBidClick, onStatusChange }: BidListProps) {
  if (bids.length === 0) {
    return (
      <div className="border border-gray-200 rounded-xl p-8 text-center bg-gray-50">
        <p className="text-sm text-gray-400">No bids received yet.</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Subcontractor</th>
            <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Amount</th>
            <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Timeline</th>
            <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Status</th>
            {onStatusChange && <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Action</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {bids.map((bid) => {
            const sub = subs.find(s => s.id === bid.subId);
            const style = STATUS_STYLES[bid.status] || STATUS_STYLES.draft;

            return (
              <tr
                key={bid.id}
                onClick={() => onBidClick?.(bid)}
                className={cn('hover:bg-gray-50', onBidClick && 'cursor-pointer')}
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{sub?.companyName || bid.subId}</p>
                  <p className="text-xs text-gray-500">{sub?.trade}</p>
                </td>
                <td className="px-4 py-3 text-right">
                  <p className="font-medium text-gray-900">{fmt(bid.amount)}</p>
                  {bid.laborCost != null && bid.materialCost != null && (
                    <p className="text-xs text-gray-500">L: {fmt(bid.laborCost)} · M: {fmt(bid.materialCost)}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{bid.timeline || '—'}</td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full capitalize', style.bg, style.text)}>
                    {bid.status.replace('_', ' ')}
                  </span>
                </td>
                {onStatusChange && (
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={bid.status}
                      onChange={(e) => onStatusChange(bid.id, e.target.value as Bid['status'])}
                      className="text-xs border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="submitted">Submitted</option>
                      <option value="under_review">Under Review</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
