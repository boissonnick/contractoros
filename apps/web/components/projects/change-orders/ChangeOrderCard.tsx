"use client";

import React from 'react';
import { ChangeOrder } from '@/types';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

interface ChangeOrderCardProps {
  co: ChangeOrder;
  onClick?: (co: ChangeOrder) => void;
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0, signDisplay: 'always' }).format(n);
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Draft' },
  pending_pm: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending PM' },
  pending_owner: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Pending Owner' },
  pending_client: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Pending Client' },
  approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
};

export default function ChangeOrderCard({ co, onClick }: ChangeOrderCardProps) {
  const style = STATUS_STYLES[co.status] || STATUS_STYLES.draft;
  const costUp = co.impact.costChange > 0;

  return (
    <div
      onClick={() => onClick?.(co)}
      className={cn(
        'border border-gray-200 rounded-2xl p-4 bg-white hover:shadow-md transition-shadow',
        onClick && 'cursor-pointer'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-500">{co.number}</span>
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', style.bg, style.text)}>{style.label}</span>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mt-1 truncate">{co.title}</h3>
        </div>
      </div>

      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{co.description}</p>

      <div className="flex items-center gap-4 text-xs">
        <span className={cn('inline-flex items-center gap-1 font-medium', costUp ? 'text-red-600' : 'text-green-600')}>
          {costUp ? <ArrowTrendingUpIcon className="h-3.5 w-3.5" /> : <ArrowTrendingDownIcon className="h-3.5 w-3.5" />}
          {fmt(co.impact.costChange)}
        </span>
        {co.impact.scheduleChange !== 0 && (
          <span className="inline-flex items-center gap-1 text-gray-500">
            <CalendarDaysIcon className="h-3.5 w-3.5" />
            {co.impact.scheduleChange > 0 ? '+' : ''}{co.impact.scheduleChange}d
          </span>
        )}
        <span className="text-gray-400">
          {co.scopeChanges.length} change{co.scopeChanges.length !== 1 ? 's' : ''}
        </span>
        <span className="text-gray-400 ml-auto">
          {formatDate(co.createdAt, { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </div>
  );
}
