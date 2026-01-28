"use client";

import React, { useState, useMemo } from 'react';
import { TimeEntry } from '@/types';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';

interface WeeklyTimesheetViewProps {
  entries: TimeEntry[];
  weekStart: Date;
  onSubmit: (weekStart: Date, totalHours: number, overtimeHours: number) => Promise<void>;
  onChangeWeek: (delta: number) => void;
  overtimeThreshold?: number;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function WeeklyTimesheetView({ entries, weekStart, onSubmit, onChangeWeek, overtimeThreshold = 40 }: WeeklyTimesheetViewProps) {
  const [submitting, setSubmitting] = useState(false);
  const weekDates = getWeekDates(weekStart);

  const dailyMinutes = useMemo(() => {
    return weekDates.map(date => {
      const dateStr = date.toDateString();
      return entries
        .filter(e => e.clockIn.toDateString() === dateStr && e.totalMinutes)
        .reduce((sum, e) => sum + (e.totalMinutes || 0), 0);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, weekStart.getTime()]);

  const totalMinutes = dailyMinutes.reduce((s, m) => s + m, 0);
  const totalHours = totalMinutes / 60;
  const overtimeHours = Math.max(0, totalHours - overtimeThreshold);

  const handleSubmit = async () => {
    setSubmitting(true);
    try { await onSubmit(weekStart, totalHours, overtimeHours); } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => onChangeWeek(-1)} className="text-sm text-blue-600 hover:text-blue-700">&larr; Prev</button>
        <h3 className="text-sm font-semibold text-gray-900">
          Week of {formatDate(weekStart, { month: 'short', day: 'numeric', year: 'numeric' })}
        </h3>
        <button onClick={() => onChangeWeek(1)} className="text-sm text-blue-600 hover:text-blue-700">Next &rarr;</button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDates.map((date, idx) => {
          const mins = dailyMinutes[idx];
          const isToday = date.toDateString() === new Date().toDateString();
          return (
            <div key={idx} className={cn('text-center p-3 rounded-lg border', isToday ? 'border-blue-400 bg-blue-50' : 'border-gray-200')}>
              <div className="text-xs text-gray-500 font-medium">{DAY_LABELS[idx]}</div>
              <div className="text-xs text-gray-400">{date.getDate()}</div>
              <div className={cn('text-lg font-bold mt-1', mins > 0 ? 'text-gray-900' : 'text-gray-300')}>
                {mins > 0 ? formatHours(mins) : '-'}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">Total: {totalHours.toFixed(1)}h</p>
          {overtimeHours > 0 && <p className="text-xs text-orange-600">Overtime: {overtimeHours.toFixed(1)}h</p>}
        </div>
        <Button variant="primary" size="sm" onClick={handleSubmit} loading={submitting} disabled={totalMinutes === 0}>
          Submit Timesheet
        </Button>
      </div>
    </div>
  );
}
