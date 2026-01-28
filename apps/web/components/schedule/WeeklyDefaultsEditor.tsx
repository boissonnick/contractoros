"use client";

import React, { useState, useEffect } from 'react';
import { AvailabilityDefault } from '@/types';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface WeeklyDefaultsEditorProps {
  defaults: AvailabilityDefault[];
  onSave: (defaults: Omit<AvailabilityDefault, 'id'>[]) => Promise<void>;
  orgId: string;
}

interface DayConfig {
  isAvailable: boolean;
  startTime: string;
  endTime: string;
}

export default function WeeklyDefaultsEditor({ defaults, onSave, orgId }: WeeklyDefaultsEditorProps) {
  const [days, setDays] = useState<DayConfig[]>(
    Array.from({ length: 7 }, (_, i) => {
      const existing = defaults.find(d => d.dayOfWeek === i);
      if (existing) return { isAvailable: existing.isAvailable, startTime: existing.startTime, endTime: existing.endTime };
      const isWeekday = i >= 1 && i <= 5;
      return { isAvailable: isWeekday, startTime: '08:00', endTime: '17:00' };
    })
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (defaults.length > 0) {
      setDays(Array.from({ length: 7 }, (_, i) => {
        const existing = defaults.find(d => d.dayOfWeek === i);
        if (existing) return { isAvailable: existing.isAvailable, startTime: existing.startTime, endTime: existing.endTime };
        const isWeekday = i >= 1 && i <= 5;
        return { isAvailable: isWeekday, startTime: '08:00', endTime: '17:00' };
      }));
    }
  }, [defaults]);

  const toggleDay = (idx: number) => {
    setDays(prev => prev.map((d, i) => i === idx ? { ...d, isAvailable: !d.isAvailable } : d));
  };

  const updateTime = (idx: number, field: 'startTime' | 'endTime', value: string) => {
    setDays(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(days.map((d, i) => ({ userId: '', orgId, dayOfWeek: i, ...d })));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">Weekly Defaults</h3>
      <p className="text-xs text-gray-500">Set your regular weekly availability. Override specific dates on the calendar below.</p>
      <div className="space-y-2">
        {DAYS.map((day, idx) => (
          <div key={day} className="flex items-center gap-3">
            <button
              onClick={() => toggleDay(idx)}
              className={cn(
                'w-20 text-sm font-medium py-1.5 px-3 rounded-lg border transition-all',
                days[idx].isAvailable ? 'bg-green-50 border-green-300 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-400'
              )}
            >
              {SHORT_DAYS[idx]}
            </button>
            {days[idx].isAvailable ? (
              <div className="flex items-center gap-2 text-sm">
                <input type="time" value={days[idx].startTime} onChange={e => updateTime(idx, 'startTime', e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm" />
                <span className="text-gray-400">to</span>
                <input type="time" value={days[idx].endTime} onChange={e => updateTime(idx, 'endTime', e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm" />
              </div>
            ) : (
              <span className="text-xs text-gray-400">Not available</span>
            )}
          </div>
        ))}
      </div>
      <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>Save Defaults</Button>
    </div>
  );
}
