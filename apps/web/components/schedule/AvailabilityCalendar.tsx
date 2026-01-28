"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface AvailabilityCalendarProps {
  getAvailabilityForDate: (date: Date) => { isAvailable: boolean; startTime: string; endTime: string; isOverride: boolean };
  onToggleDate: (date: Date, isAvailable: boolean) => void;
  onMonthChange?: (date: Date) => void;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AvailabilityCalendar({ getAvailabilityForDate, onToggleDate, onMonthChange }: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const changeMonth = (delta: number) => {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1);
    setCurrentMonth(next);
    onMonthChange?.(next);
  };

  const today = new Date();
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded"><ChevronLeftIcon className="h-5 w-5 text-gray-600" /></button>
        <h3 className="text-sm font-semibold text-gray-900">
          {formatDate(currentMonth, { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded"><ChevronRightIcon className="h-5 w-5 text-gray-600" /></button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">{d}</div>
        ))}
        {cells.map((date, idx) => {
          if (!date) return <div key={`empty-${idx}`} />;
          const avail = getAvailabilityForDate(date);
          const isToday = date.toDateString() === today.toDateString();
          const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());

          return (
            <button
              key={date.getDate()}
              onClick={() => !isPast && onToggleDate(date, !avail.isAvailable)}
              disabled={isPast}
              className={cn(
                'aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-all relative',
                isPast && 'opacity-40 cursor-not-allowed',
                !isPast && 'hover:ring-2 hover:ring-blue-300 cursor-pointer',
                avail.isAvailable ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-gray-50 text-gray-400 border border-gray-100',
                avail.isOverride && 'ring-2 ring-blue-400',
                isToday && 'font-bold'
              )}
            >
              <span>{date.getDate()}</span>
              {avail.isAvailable && !isPast && (
                <span className="text-[9px] text-green-600 leading-none mt-0.5">
                  {avail.startTime.replace(':00', '')}-{avail.endTime.replace(':00', '')}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-50 border border-green-200" /> Available</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-gray-50 border border-gray-100" /> Unavailable</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded ring-2 ring-blue-400" /> Override</div>
      </div>
    </div>
  );
}
