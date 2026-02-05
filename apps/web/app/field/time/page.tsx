"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useTimeEntries, TimeEntryWithSyncStatus } from '@/lib/hooks/useTimeEntries';
import { useWeeklyTimesheets } from '@/lib/hooks/useWeeklyTimesheets';
import TimeEntryList from '@/components/timesheets/TimeEntryList';
import WeeklyTimesheetView from '@/components/timesheets/WeeklyTimesheetView';
import OfflineTimeEntryForm from '@/components/time/OfflineTimeEntryForm';
import { Card, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { initializeProjectCache } from '@/lib/offline/cache-projects';
import {
  CloudIcon,
  CloudArrowUpIcon,
  PlusIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday as start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

type Tab = 'entries' | 'weekly' | 'add';

export default function TimeTrackingPage() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<Tab>('entries');
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));

  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }, [weekStart]);

  const {
    entries,
    loading,
    isOnline,
    pendingOfflineCount,
    createManualEntry,
    refresh,
  } = useTimeEntries({ startDate: weekStart, endDate: weekEnd });
  const { submitTimesheet } = useWeeklyTimesheets({ userId: user?.uid });

  // Initialize project cache for offline use
  useEffect(() => {
    if (profile?.orgId) {
      initializeProjectCache(profile.orgId).catch(console.error);
    }
  }, [profile?.orgId]);

  const changeWeek = (delta: number) => {
    setWeekStart(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + delta * 7);
      return next;
    });
  };

  // Handle offline form submission
  const handleOfflineSubmit = async (entry: {
    projectId?: string;
    projectName?: string;
    notes?: string;
    clockIn: Date;
    clockOut: Date;
    breakMinutes?: number;
  }) => {
    await createManualEntry({
      projectId: entry.projectId,
      projectName: entry.projectName,
      notes: entry.notes,
      clockIn: entry.clockIn,
      clockOut: entry.clockOut,
      breaks: [],
      totalBreakMinutes: entry.breakMinutes || 0,
    });
    refresh();
    setTab('entries');
  };

  // Count entries by sync status
  const pendingEntries = entries.filter(e => e.syncStatus === 'pending');
  const syncedEntries = entries.filter(e => e.syncStatus !== 'pending');

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-gray-900">Time Tracking</h1>
          <p className="text-sm text-gray-500 mt-1">View your time entries and submit weekly timesheets.</p>
        </div>
        <Button
          onClick={() => setTab('add')}
          className="flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          Add Entry
        </Button>
      </div>

      {/* Offline Status Banner */}
      {!isOnline && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg">
          <CloudIcon className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">You&apos;re offline</p>
            <p className="text-sm text-amber-700">
              Time entries will be saved locally and synced when you reconnect.
            </p>
          </div>
        </div>
      )}

      {/* Pending Sync Banner */}
      {pendingOfflineCount > 0 && isOnline && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
          <CloudArrowUpIcon className="w-5 h-5 flex-shrink-0 animate-pulse" />
          <div className="flex-1">
            <p className="font-medium">{pendingOfflineCount} {pendingOfflineCount === 1 ? 'entry' : 'entries'} pending sync</p>
            <p className="text-sm text-blue-700">
              Entries created while offline are being synced...
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setTab('entries')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px flex items-center gap-2',
            tab === 'entries' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500'
          )}
        >
          <ClockIcon className="w-4 h-4" />
          Entries
          {pendingEntries.length > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {pendingEntries.length} pending
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('weekly')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px',
            tab === 'weekly' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500'
          )}
        >
          Weekly View
        </button>
        <button
          onClick={() => setTab('add')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px flex items-center gap-2',
            tab === 'add' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500'
          )}
        >
          <PlusIcon className="w-4 h-4" />
          Add Entry
        </button>
      </div>

      {/* Content */}
      {tab === 'entries' && (
        <Card className="p-0 overflow-hidden">
          {/* Pending entries section */}
          {pendingEntries.length > 0 && (
            <div className="bg-amber-50 border-b border-amber-200 p-4">
              <h3 className="font-medium font-heading tracking-tight text-amber-800 mb-2 flex items-center gap-2">
                <CloudArrowUpIcon className="w-4 h-4" />
                Pending Sync ({pendingEntries.length})
              </h3>
              <div className="space-y-2">
                {pendingEntries.map((entry) => (
                  <OfflineEntryCard key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          )}

          {/* Synced entries */}
          <TimeEntryList entries={syncedEntries} />
        </Card>
      )}

      {tab === 'weekly' && (
        <Card>
          <WeeklyTimesheetView
            entries={entries}
            weekStart={weekStart}
            onSubmit={submitTimesheet}
            onChangeWeek={changeWeek}
          />
        </Card>
      )}

      {tab === 'add' && (
        <OfflineTimeEntryForm
          onSubmit={handleOfflineSubmit}
          onCancel={() => setTab('entries')}
        />
      )}
    </div>
  );
}

// Compact card for pending offline entries
function OfflineEntryCard({ entry }: { entry: TimeEntryWithSyncStatus }) {
  const clockIn = new Date(entry.clockIn);
  const clockOut = entry.clockOut ? new Date(entry.clockOut) : null;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '--';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="bg-white rounded-md border border-amber-200 p-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
          <CloudArrowUpIcon className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {entry.projectName || 'No project'}
          </p>
          <p className="text-xs text-gray-500">
            {clockIn.toLocaleDateString()} &middot; {formatTime(clockIn)}
            {clockOut && ` - ${formatTime(clockOut)}`}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">
          {formatDuration(entry.totalMinutes)}
        </p>
        <p className="text-xs text-amber-600">Pending sync</p>
      </div>
    </div>
  );
}
