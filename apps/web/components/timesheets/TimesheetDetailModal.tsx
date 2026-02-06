"use client";

import React from 'react';
import BaseModal from '@/components/ui/BaseModal';
import Button from '@/components/ui/Button';
import { WeeklyTimesheet } from '@/types';
import { formatDate } from '@/lib/date-utils';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface TimesheetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  timesheet: WeeklyTimesheet | null;
  onApprove?: (id: string) => Promise<void>;
  onReject?: (id: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  draft: 'bg-gray-100 text-gray-600',
};

export function TimesheetDetailModal({ isOpen, onClose, timesheet, onApprove, onReject }: TimesheetDetailModalProps) {
  if (!timesheet) return null;

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(timesheet.weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  // Group entries by day
  const entriesByDay = weekDays.map(day => {
    const dayStr = day.toISOString().split('T')[0];
    const dayEntries = timesheet.entries.filter(e => {
      const entryDate = new Date(e.clockIn).toISOString().split('T')[0];
      return entryDate === dayStr;
    });
    const totalMinutes = dayEntries.reduce((sum, e) => sum + (e.totalMinutes || 0), 0);
    return { date: day, entries: dayEntries, totalHours: totalMinutes / 60 };
  });

  return (
    <BaseModal open={isOpen} onClose={onClose} title="Timesheet Detail" size="lg">
      <div className="space-y-4">
        {/* Header info */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{timesheet.userName || 'Unknown'}</h3>
            <p className="text-sm text-gray-500">
              Week of {formatDate(timesheet.weekStart, { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <span className={cn('px-3 py-1 rounded-full text-sm font-medium', STATUS_COLORS[timesheet.status])}>
            {timesheet.status}
          </span>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Total Hours</p>
            <p className="text-xl font-bold text-gray-900">{timesheet.totalHours.toFixed(1)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Regular</p>
            <p className="text-xl font-bold text-gray-900">{(timesheet.totalHours - timesheet.overtimeHours).toFixed(1)}</p>
          </div>
          <div className={cn('rounded-lg p-3 text-center', timesheet.overtimeHours > 0 ? 'bg-orange-50' : 'bg-gray-50')}>
            <p className="text-xs text-gray-500">Overtime</p>
            <p className={cn('text-xl font-bold', timesheet.overtimeHours > 0 ? 'text-orange-600' : 'text-gray-900')}>
              {timesheet.overtimeHours.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Daily breakdown */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Daily Breakdown</h4>
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
            {entriesByDay.map(({ date, entries: dayEntries, totalHours }) => (
              <div key={date.toISOString()} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 w-20">
                    {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  {dayEntries.length > 0 && (
                    <span className="text-xs text-gray-400">{dayEntries.length} {dayEntries.length === 1 ? 'entry' : 'entries'}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {totalHours > 8 && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">OT</span>
                  )}
                  <span className={cn(
                    'text-sm font-semibold',
                    totalHours === 0 ? 'text-gray-300' : totalHours > 8 ? 'text-orange-600' : 'text-gray-900'
                  )}>
                    {totalHours > 0 ? `${totalHours.toFixed(1)}h` : '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Review history */}
        {timesheet.reviewHistory && timesheet.reviewHistory.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Review History</h4>
            <div className="space-y-2">
              {timesheet.reviewHistory.map((review, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <span className={cn(
                    'px-2 py-0.5 rounded text-xs font-medium',
                    review.action === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  )}>
                    {review.action}
                  </span>
                  <span className="text-gray-600">by {review.reviewedByName || review.reviewedBy}</span>
                  <span className="text-gray-400">{formatDate(review.reviewedAt, { month: 'short', day: 'numeric' })}</span>
                  {review.reason && <span className="text-gray-500 italic">-- {review.reason}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rejection reason if rejected */}
        {timesheet.status === 'rejected' && timesheet.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm font-medium text-red-800">Rejection Reason</p>
            <p className="text-sm text-red-700 mt-1">{timesheet.rejectionReason}</p>
          </div>
        )}

        {/* Actions */}
        {timesheet.status === 'submitted' && (
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            {onReject && (
              <Button variant="outline" onClick={() => onReject(timesheet.id)} icon={<XMarkIcon className="h-4 w-4" />}>
                Reject
              </Button>
            )}
            {onApprove && (
              <Button variant="primary" onClick={() => onApprove(timesheet.id)} icon={<CheckIcon className="h-4 w-4" />}>
                Approve
              </Button>
            )}
          </div>
        )}
      </div>
    </BaseModal>
  );
}
