"use client";

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { useWeeklyTimesheets } from '@/lib/hooks/useWeeklyTimesheets';
import { TimesheetDetailModal } from '@/components/timesheets/TimesheetDetailModal';
import { TimesheetRejectionModal } from '@/components/timesheets/TimesheetRejectionModal';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import { WeeklyTimesheet } from '@/types';
import {
  ClockIcon,
  DocumentCheckIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { logger } from '@/lib/utils/logger';

type TabKey = 'pending' | 'approved' | 'rejected';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

export default function TimesheetsPage() {
  const { profile } = useAuth();
  const { timesheets, loading, approveTimesheet, rejectTimesheet } = useWeeklyTimesheets({
    orgId: profile?.orgId,
  });

  const [activeTab, setActiveTab] = useState<TabKey>('pending');
  const [selectedTimesheet, setSelectedTimesheet] = useState<WeeklyTimesheet | null>(null);
  const [rejectionTarget, setRejectionTarget] = useState<WeeklyTimesheet | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkApproving, setBulkApproving] = useState(false);

  const submitted = useMemo(() => timesheets.filter(t => t.status === 'submitted'), [timesheets]);
  const approved = useMemo(() => timesheets.filter(t => t.status === 'approved'), [timesheets]);
  const rejected = useMemo(() => timesheets.filter(t => t.status === 'rejected'), [timesheets]);

  const tabCounts: Record<TabKey, number> = {
    pending: submitted.length,
    approved: approved.length,
    rejected: rejected.length,
  };

  const currentList = activeTab === 'pending' ? submitted : activeTab === 'approved' ? approved : rejected;

  // Stats
  const totalHours = useMemo(() => timesheets.reduce((sum, t) => sum + t.totalHours, 0), [timesheets]);
  const avgHours = timesheets.length > 0 ? totalHours / timesheets.length : 0;

  // Bulk selection
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === submitted.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(submitted.map(t => t.id)));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    setBulkApproving(true);
    try {
      const promises = Array.from(selectedIds).map(id => approveTimesheet(id));
      await Promise.all(promises);
      setSelectedIds(new Set());
    } catch (err) {
      logger.error('Bulk approve failed', { error: err, page: 'timesheets' });
    } finally {
      setBulkApproving(false);
    }
  };

  const handleApproveFromModal = async (id: string) => {
    await approveTimesheet(id);
    setSelectedTimesheet(null);
  };

  const handleRejectFromModal = (id: string) => {
    const ts = timesheets.find(t => t.id === id);
    if (ts) {
      setSelectedTimesheet(null);
      setRejectionTarget(ts);
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectionTarget) return;
    await rejectTimesheet(rejectionTarget.id, reason);
    setRejectionTarget(null);
  };

  // Handle reject from the list (opens rejection modal)
  const handleRejectFromList = async (id: string) => {
    const ts = timesheets.find(t => t.id === id);
    if (ts) {
      setRejectionTarget(ts);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Timesheets</h1>
        <p className="text-gray-500 mt-1">Review and approve team timesheets</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100">
              <DocumentCheckIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-bold text-gray-900">{timesheets.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100">
              <ExclamationCircleIcon className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-xl font-bold text-yellow-700">{submitted.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <ClockIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Hours</p>
              <p className="text-xl font-bold text-gray-900">{totalHours.toFixed(0)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg Hours</p>
              <p className="text-xl font-bold text-gray-900">{avgHours.toFixed(1)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSelectedIds(new Set()); }}
              className={cn(
                'pb-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {tab.label}
              {tabCounts[tab.key] > 0 && (
                <span className={cn(
                  'ml-2 px-2 py-0.5 text-xs rounded-full',
                  activeTab === tab.key
                    ? 'bg-brand-primary/10 text-brand-primary'
                    : 'bg-gray-100 text-gray-600'
                )}>
                  {tabCounts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk actions (pending tab only) */}
      {activeTab === 'pending' && submitted.length > 0 && (
        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedIds.size === submitted.length && submitted.length > 0}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary/20"
            />
            <span className="text-sm text-gray-600">
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
            </span>
          </div>
          {selectedIds.size > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleBulkApprove}
              disabled={bulkApproving}
              loading={bulkApproving}
              icon={<CheckIcon className="h-4 w-4" />}
            >
              Approve {selectedIds.size} Timesheet{selectedIds.size !== 1 ? 's' : ''}
            </Button>
          )}
        </div>
      )}

      {/* Timesheet list */}
      {currentList.length === 0 ? (
        <EmptyState
          icon={<DocumentCheckIcon className="h-12 w-12" />}
          title={
            activeTab === 'pending'
              ? 'No pending timesheets'
              : activeTab === 'approved'
              ? 'No approved timesheets'
              : 'No rejected timesheets'
          }
          description={
            activeTab === 'pending'
              ? 'All timesheets have been reviewed.'
              : activeTab === 'approved'
              ? 'No timesheets have been approved yet.'
              : 'No timesheets have been rejected.'
          }
        />
      ) : (
        <div className="space-y-3">
          {currentList.map(ts => (
            <div key={ts.id} className="relative">
              {activeTab === 'pending' && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(ts.id)}
                    onChange={() => toggleSelect(ts.id)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary/20"
                  />
                </div>
              )}
              <div
                className={cn(
                  'cursor-pointer transition-colors',
                  activeTab === 'pending' ? 'pl-10' : ''
                )}
                onClick={() => setSelectedTimesheet(ts)}
              >
                <TimesheetRow
                  timesheet={ts}
                  onApprove={ts.status === 'submitted' ? approveTimesheet : undefined}
                  onReject={ts.status === 'submitted' ? handleRejectFromList : undefined}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      <TimesheetDetailModal
        isOpen={!!selectedTimesheet}
        onClose={() => setSelectedTimesheet(null)}
        timesheet={selectedTimesheet}
        onApprove={selectedTimesheet?.status === 'submitted' ? handleApproveFromModal : undefined}
        onReject={selectedTimesheet?.status === 'submitted' ? handleRejectFromModal : undefined}
      />

      {/* Rejection modal */}
      <TimesheetRejectionModal
        isOpen={!!rejectionTarget}
        onClose={() => setRejectionTarget(null)}
        onReject={handleRejectConfirm}
        employeeName={rejectionTarget?.userName}
      />
    </div>
  );
}

// Inline row component for the list
function TimesheetRow({
  timesheet,
  onApprove,
  onReject,
}: {
  timesheet: WeeklyTimesheet;
  onApprove?: (id: string) => Promise<void>;
  onReject?: (id: string) => Promise<void>;
}) {
  const STATUS_COLORS: Record<string, string> = {
    submitted: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    draft: 'bg-gray-100 text-gray-600',
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow" hover>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">{timesheet.userName || 'Unknown'}</p>
          <p className="text-xs text-gray-500">
            Week of{' '}
            {timesheet.weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {' '}&middot;{' '}
            {timesheet.totalHours.toFixed(1)}h
            {timesheet.overtimeHours > 0 && (
              <span className="text-orange-600"> ({timesheet.overtimeHours.toFixed(1)}h OT)</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[timesheet.status])}>
            {timesheet.status}
          </span>
          {timesheet.status === 'submitted' && onReject && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onReject(timesheet.id); }}
              icon={<ExclamationCircleIcon className="h-4 w-4" />}
            >
              Reject
            </Button>
          )}
          {timesheet.status === 'submitted' && onApprove && (
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onApprove(timesheet.id); }}
              icon={<CheckIcon className="h-4 w-4" />}
            >
              Approve
            </Button>
          )}
        </div>
      </div>
      {timesheet.status === 'rejected' && timesheet.rejectionReason && (
        <p className="mt-2 text-xs text-red-600 bg-red-50 rounded px-2 py-1">
          Rejected: {timesheet.rejectionReason}
        </p>
      )}
      {timesheet.status === 'approved' && timesheet.approvedByName && (
        <p className="mt-2 text-xs text-green-600">
          Approved by {timesheet.approvedByName}
        </p>
      )}
    </Card>
  );
}
