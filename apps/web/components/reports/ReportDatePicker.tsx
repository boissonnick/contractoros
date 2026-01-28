"use client";

import React from 'react';

interface ReportDatePickerProps {
  startDate: Date;
  endDate: Date;
  onChangeStart: (d: Date) => void;
  onChangeEnd: (d: Date) => void;
  onPreset: (preset: string) => void;
}

export default function ReportDatePicker({ startDate, endDate, onChangeStart, onChangeEnd, onPreset }: ReportDatePickerProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <input type="date" value={startDate.toISOString().split('T')[0]} onChange={e => onChangeStart(new Date(e.target.value + 'T00:00:00'))} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
        <span className="text-gray-400 text-sm">to</span>
        <input type="date" value={endDate.toISOString().split('T')[0]} onChange={e => onChangeEnd(new Date(e.target.value + 'T23:59:59'))} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
      </div>
      <div className="flex gap-1">
        {['This Week', 'This Month', 'Last Month', 'This Year'].map(p => (
          <button key={p} onClick={() => onPreset(p)} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">{p}</button>
        ))}
      </div>
    </div>
  );
}
