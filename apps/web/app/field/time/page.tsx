"use client";

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { useTimeEntries } from '@/lib/hooks/useTimeEntries';
import { useWeeklyTimesheets } from '@/lib/hooks/useWeeklyTimesheets';
import TimeEntryList from '@/components/timesheets/TimeEntryList';
import WeeklyTimesheetView from '@/components/timesheets/WeeklyTimesheetView';
import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday as start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

type Tab = 'entries' | 'weekly';

export default function TimeTrackingPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('entries');
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));

  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }, [weekStart]);

  const { entries, loading } = useTimeEntries({ startDate: weekStart, endDate: weekEnd });
  const { submitTimesheet } = useWeeklyTimesheets({ userId: user?.uid });

  const changeWeek = (delta: number) => {
    setWeekStart(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + delta * 7);
      return next;
    });
  };

  if (loading) {
    return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Time Tracking</h1>
        <p className="text-sm text-gray-500 mt-1">View your time entries and submit weekly timesheets.</p>
      </div>

      <div className="flex border-b border-gray-200">
        <button onClick={() => setTab('entries')} className={cn('px-4 py-2.5 text-sm font-medium border-b-2 -mb-px', tab === 'entries' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500')}>Entries</button>
        <button onClick={() => setTab('weekly')} className={cn('px-4 py-2.5 text-sm font-medium border-b-2 -mb-px', tab === 'weekly' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500')}>Weekly View</button>
      </div>

      <Card>
        {tab === 'entries' && <TimeEntryList entries={entries} />}
        {tab === 'weekly' && (
          <WeeklyTimesheetView
            entries={entries}
            weekStart={weekStart}
            onSubmit={submitTimesheet}
            onChangeWeek={changeWeek}
          />
        )}
      </Card>
    </div>
  );
}
