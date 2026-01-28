"use client";

import React from 'react';
import { BidSolicitation, Subcontractor } from '@/types';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';

interface BidSolicitationListProps {
  solicitations: BidSolicitation[];
  subs: Subcontractor[];
  onClose: (solId: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
};

export default function BidSolicitationList({ solicitations, subs, onClose }: BidSolicitationListProps) {
  if (solicitations.length === 0) {
    return (
      <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
        <p className="text-sm text-gray-400">No bid solicitations yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {solicitations.map(sol => {
        const isOpen = sol.status === 'open';
        const isPastDeadline = new Date() > sol.deadline;
        const invitedNames = sol.invitedSubIds
          .map(id => subs.find(s => s.id === id)?.companyName || 'Unknown')
          .join(', ');

        return (
          <div key={sol.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-gray-900">{sol.title}</h4>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[sol.status] || STATUS_COLORS.closed)}>
                    {sol.status}
                  </span>
                </div>
                {sol.description && <p className="text-xs text-gray-500 mt-1">{sol.description}</p>}
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                  {sol.trade && <span>Trade: {sol.trade}</span>}
                  <span>Deadline: {formatDate(sol.deadline)}{isPastDeadline && isOpen && ' (past due)'}</span>
                  <span>Invited: {invitedNames}</span>
                  <span>{sol.scopeItemIds.length} scope items</span>
                </div>
              </div>
              {isOpen && (
                <Button variant="secondary" size="sm" onClick={() => onClose(sol.id)}>
                  Close
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
