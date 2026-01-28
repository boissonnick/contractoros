"use client";

import React, { useState } from 'react';
import { ScheduleAssignment } from '@/types';
import { cn } from '@/lib/utils';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline';

interface ScheduleCalendarProps {
  assignments: ScheduleAssignment[];
  onAddAssignment?: (date: Date) => void;
  onClickAssignment?: (assignment: ScheduleAssignment) => void;
  view?: 'week' | 'month';
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const COLORS = ['bg-blue-100 text-blue-800 border-blue-200', 'bg-green-100 text-green-800 border-green-200', 'bg-purple-100 text-purple-800 border-purple-200', 'bg-amber-100 text-amber-800 border-amber-200', 'bg-rose-100 text-rose-800 border-rose-200'];

function getWeekDates(refDate: Date): Date[] {
  const start = new Date(refDate);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export default function ScheduleCalendar({ assignments, onAddAssignment, onClickAssignment, view = 'week' }: ScheduleCalendarProps) {
  const [refDate, setRefDate] = useState(new Date());
  const today = new Date();

  const navigate = (delta: number) => {
    const next = new Date(refDate);
    if (view === 'week') next.setDate(next.getDate() + delta * 7);
    else next.setMonth(next.getMonth() + delta);
    setRefDate(next);
  };

  const projectColorMap = new Map<string, string>();
  let colorIdx = 0;
  assignments.forEach(a => {
    if (!projectColorMap.has(a.projectId)) {
      projectColorMap.set(a.projectId, COLORS[colorIdx % COLORS.length]);
      colorIdx++;
    }
  });

  if (view === 'week') {
    const weekDates = getWeekDates(refDate);
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded"><ChevronLeftIcon className="h-5 w-5" /></button>
          <h3 className="text-sm font-semibold text-gray-900">
            {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </h3>
          <button onClick={() => navigate(1)} className="p-1 hover:bg-gray-100 rounded"><ChevronRightIcon className="h-5 w-5" /></button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weekDates.map((date, idx) => {
            const dateStr = date.toDateString();
            const dayAssignments = assignments.filter(a => a.date.toDateString() === dateStr);
            const isToday = dateStr === today.toDateString();
            return (
              <div key={idx} className={cn('min-h-[120px] border rounded-lg p-2', isToday ? 'border-blue-400 bg-blue-50/30' : 'border-gray-200')}>
                <div className="flex items-center justify-between mb-1">
                  <span className={cn('text-xs font-medium', isToday ? 'text-blue-600' : 'text-gray-500')}>
                    {DAY_LABELS[date.getDay()]} {date.getDate()}
                  </span>
                  {onAddAssignment && (
                    <button onClick={() => onAddAssignment(date)} className="text-gray-400 hover:text-blue-600">
                      <PlusIcon className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  {dayAssignments.map(a => (
                    <button
                      key={a.id}
                      onClick={() => onClickAssignment?.(a)}
                      className={cn('w-full text-left text-[10px] px-1.5 py-1 rounded border truncate', projectColorMap.get(a.projectId))}
                    >
                      <span className="font-medium">{a.userName || 'Unassigned'}</span>
                      <br />
                      {a.startTime}-{a.endTime} · {a.projectName || 'Project'}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Month view
  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded"><ChevronLeftIcon className="h-5 w-5" /></button>
        <h3 className="text-sm font-semibold text-gray-900">{refDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
        <button onClick={() => navigate(1)} className="p-1 hover:bg-gray-100 rounded"><ChevronRightIcon className="h-5 w-5" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map(d => <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">{d}</div>)}
        {cells.map((date, idx) => {
          if (!date) return <div key={`e-${idx}`} />;
          const dateStr = date.toDateString();
          const dayAssignments = assignments.filter(a => a.date.toDateString() === dateStr);
          const isToday = dateStr === today.toDateString();
          return (
            <div key={date.getDate()} className={cn('min-h-[60px] border rounded p-1', isToday ? 'border-blue-400' : 'border-gray-100')}>
              <span className="text-[10px] text-gray-500">{date.getDate()}</span>
              {dayAssignments.slice(0, 2).map(a => (
                <div key={a.id} className={cn('text-[9px] px-1 rounded truncate mt-0.5', projectColorMap.get(a.projectId))}>{a.userName}</div>
              ))}
              {dayAssignments.length > 2 && <div className="text-[9px] text-gray-400">+{dayAssignments.length - 2}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
