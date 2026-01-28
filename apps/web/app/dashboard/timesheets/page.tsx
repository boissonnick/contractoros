"use client";

import React from 'react';
import { useAuth } from '@/lib/auth';
import { useWeeklyTimesheets } from '@/lib/hooks/useWeeklyTimesheets';
import TimesheetApprovalList from '@/components/timesheets/TimesheetApprovalList';
import { Card } from '@/components/ui';

export default function TimesheetsPage() {
  const { profile } = useAuth();
  const { timesheets, loading, approveTimesheet, rejectTimesheet } = useWeeklyTimesheets({ orgId: profile?.orgId });

  const submitted = timesheets.filter(t => t.status === 'submitted');
  const approved = timesheets.filter(t => t.status === 'approved');

  if (loading) {
    return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Timesheets</h1>
        <p className="text-sm text-gray-500 mt-1">Review and approve team timesheets.</p>
      </div>

      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Pending Approval ({submitted.length})</h3>
        <TimesheetApprovalList timesheets={submitted} onApprove={approveTimesheet} onReject={rejectTimesheet} />
      </Card>

      {approved.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Recently Approved</h3>
          <TimesheetApprovalList timesheets={approved.slice(0, 10)} onApprove={approveTimesheet} onReject={rejectTimesheet} />
        </Card>
      )}
    </div>
  );
}
