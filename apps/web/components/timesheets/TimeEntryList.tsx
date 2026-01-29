"use client";

import React from 'react';
import { TimeEntry } from '@/types';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import { ClockIcon, MapPinIcon } from '@heroicons/react/24/outline';

interface TimeEntryListProps {
  entries: TimeEntry[];
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function TimeEntryList({ entries }: TimeEntryListProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-8">No time entries found.</p>;
  }

  // Group by date
  const grouped = new Map<string, TimeEntry[]>();
  for (const entry of entries) {
    const key = formatDate(entry.clockIn, { weekday: 'short', month: 'short', day: 'numeric' });
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(entry);
  }

  return (
    <div className="space-y-4">
      {Array.from(grouped.entries()).map(([dateLabel, dayEntries]) => {
        const dayTotal = dayEntries.reduce((s, e) => s + (e.totalMinutes || 0), 0);
        return (
          <div key={dateLabel}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase">{dateLabel}</h4>
              <span className="text-xs text-gray-500">{formatDuration(dayTotal)}</span>
            </div>
            <div className="space-y-2">
              {dayEntries.map(entry => (
                <div key={entry.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                  <div className={cn('p-2 rounded-full', entry.status === 'active' ? 'bg-green-100' : 'bg-gray-100')}>
                    <ClockIcon className={cn('h-4 w-4', entry.status === 'active' ? 'text-green-600' : 'text-gray-400')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {formatTime(entry.clockIn)}
                        {entry.clockOut && ` — ${formatTime(entry.clockOut)}`}
                      </span>
                      {entry.status === 'active' && (
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">Active</span>
                      )}
                    </div>
                    {entry.notes && <p className="text-xs text-gray-500 truncate">{entry.notes}</p>}
                  </div>
                  <div className="text-right">
                    {entry.totalMinutes && <span className="text-sm font-semibold text-gray-900">{formatDuration(entry.totalMinutes)}</span>}
                    {entry.clockInLocation && (
                      <div className="flex items-center gap-0.5 text-[10px] text-gray-400 mt-0.5">
                        <MapPinIcon className="h-3 w-3" /> GPS
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
