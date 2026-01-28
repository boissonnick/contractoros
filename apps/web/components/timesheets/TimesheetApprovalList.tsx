"use client";

import React from 'react';
import { WeeklyTimesheet } from '@/types';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface TimesheetApprovalListProps {
  timesheets: WeeklyTimesheet[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  draft: 'bg-gray-100 text-gray-600',
};

export default function TimesheetApprovalList({ timesheets, onApprove, onReject }: TimesheetApprovalListProps) {
  if (timesheets.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-8">No timesheets to review.</p>;
  }

  return (
    <div className="space-y-3">
      {timesheets.map(ts => (
        <div key={ts.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">{ts.userName || 'Unknown'}</p>
            <p className="text-xs text-gray-500">
              Week of {ts.weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &middot; {ts.totalHours.toFixed(1)}h
              {ts.overtimeHours > 0 && <span className="text-orange-600"> ({ts.overtimeHours.toFixed(1)}h OT)</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[ts.status])}>
              {ts.status}
            </span>
            {ts.status === 'submitted' && (
              <>
                <Button variant="outline" size="sm" onClick={() => onReject(ts.id)} icon={<XMarkIcon className="h-4 w-4" />}>Reject</Button>
                <Button variant="primary" size="sm" onClick={() => onApprove(ts.id)} icon={<CheckIcon className="h-4 w-4" />}>Approve</Button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
