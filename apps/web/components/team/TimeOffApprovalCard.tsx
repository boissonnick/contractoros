"use client";

import React, { useState } from 'react';
import { Card, Badge, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import {
  CheckIcon,
  XMarkIcon,
  CalendarDaysIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import type { TimeOffRequest } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TimeOffApprovalCardProps {
  request: TimeOffRequest;
  onApprove: (id: string) => Promise<void>;
  onDeny: (id: string, reason: string) => Promise<void>;
  /** If true, hide the action buttons (used for non-pending views) */
  readOnly?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<TimeOffRequest['type'], string> = {
  vacation: 'Vacation',
  sick: 'Sick',
  personal: 'Personal',
  bereavement: 'Bereavement',
  jury_duty: 'Jury Duty',
  other: 'Other',
};

const TYPE_BADGE_VARIANT: Record<TimeOffRequest['type'], 'primary' | 'warning' | 'info' | 'default' | 'danger' | 'success'> = {
  vacation: 'primary',
  sick: 'warning',
  personal: 'info',
  bereavement: 'default',
  jury_duty: 'default',
  other: 'default',
};

const STATUS_BADGE_VARIANT: Record<TimeOffRequest['status'], 'warning' | 'success' | 'danger' | 'default'> = {
  pending: 'warning',
  approved: 'success',
  denied: 'danger',
  cancelled: 'default',
};

const STATUS_LABELS: Record<TimeOffRequest['status'], string> = {
  pending: 'Pending',
  approved: 'Approved',
  denied: 'Denied',
  cancelled: 'Cancelled',
};

function formatDateRange(start: Date, end: Date, halfDay?: 'morning' | 'afternoon'): string {
  const startStr = formatDate(start);
  const endStr = formatDate(end);
  const isSameDay = start.toDateString() === end.toDateString();

  if (isSameDay) {
    return halfDay
      ? `${startStr} (${halfDay === 'morning' ? 'Morning' : 'Afternoon'})`
      : startStr;
  }
  return `${startStr} - ${endStr}`;
}

function dayCount(start: Date, end: Date, halfDay?: 'morning' | 'afternoon'): string {
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1);
  if (halfDay) {
    return days === 1 ? '0.5 day' : `${days - 0.5} days`;
  }
  return days === 1 ? '1 day' : `${days} days`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TimeOffApprovalCard({
  request,
  onApprove,
  onDeny,
  readOnly = false,
}: TimeOffApprovalCardProps) {
  const [showDenyInput, setShowDenyInput] = useState(false);
  const [denyReason, setDenyReason] = useState('');
  const [approving, setApproving] = useState(false);
  const [denying, setDenying] = useState(false);

  const handleApprove = async () => {
    setApproving(true);
    try {
      await onApprove(request.id);
    } finally {
      setApproving(false);
    }
  };

  const handleDeny = async () => {
    if (!denyReason.trim()) return;
    setDenying(true);
    try {
      await onDeny(request.id, denyReason.trim());
      setShowDenyInput(false);
      setDenyReason('');
    } finally {
      setDenying(false);
    }
  };

  const isPending = request.status === 'pending';

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
              <UserIcon className="h-4 w-4 text-gray-500" />
            </div>
            <span className="font-medium text-gray-900">{request.userName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={TYPE_BADGE_VARIANT[request.type]} size="sm">
              {TYPE_LABELS[request.type]}
            </Badge>
            <Badge variant={STATUS_BADGE_VARIANT[request.status]} size="sm" dot>
              {STATUS_LABELS[request.status]}
            </Badge>
          </div>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CalendarDaysIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span>{formatDateRange(request.startDate, request.endDate, request.halfDay)}</span>
          <span className="text-gray-400">|</span>
          <span className="font-medium">{dayCount(request.startDate, request.endDate, request.halfDay)}</span>
        </div>

        {/* Reason */}
        {request.reason && (
          <p className="text-sm text-gray-500 pl-6">
            {request.reason}
          </p>
        )}

        {/* Denial reason */}
        {request.status === 'denied' && request.denialReason && (
          <div className="text-sm bg-red-50 border border-red-100 rounded-lg p-2 text-red-700">
            <span className="font-medium">Denied:</span> {request.denialReason}
          </div>
        )}

        {/* Actions for pending requests */}
        {isPending && !readOnly && (
          <div className="flex flex-col gap-2 pt-1 border-t border-gray-100">
            {!showDenyInput ? (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  icon={<CheckIcon className="h-4 w-4" />}
                  onClick={handleApprove}
                  loading={approving}
                  disabled={denying}
                  className="!bg-gradient-to-b !from-green-600 !to-green-700 !border-green-800/20 !shadow-green-500/20 hover:!from-green-500 hover:!to-green-600"
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  icon={<XMarkIcon className="h-4 w-4" />}
                  onClick={() => setShowDenyInput(true)}
                  disabled={approving}
                >
                  Deny
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <textarea
                  value={denyReason}
                  onChange={(e) => setDenyReason(e.target.value)}
                  placeholder="Reason for denial..."
                  rows={2}
                  className={cn(
                    'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent',
                    'placeholder:text-gray-400 resize-none'
                  )}
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={handleDeny}
                    loading={denying}
                    disabled={!denyReason.trim()}
                  >
                    Confirm Deny
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowDenyInput(false);
                      setDenyReason('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
