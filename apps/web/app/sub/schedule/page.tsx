"use client";

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useAvailability } from '@/lib/hooks/useAvailability';
import WeeklyDefaultsEditor from '@/components/schedule/WeeklyDefaultsEditor';
import AvailabilityCalendar from '@/components/schedule/AvailabilityCalendar';
import { Card } from '@/components/ui';
import { useScheduleAssignments } from '@/lib/hooks/useScheduleAssignments';
import ScheduleCalendar from '@/components/schedule/ScheduleCalendar';

export default function SubSchedulePage() {
  const { profile } = useAuth();
  const [month, setMonth] = useState(new Date());
  const { defaults, loading, saveDefaults, toggleDateOverride, getAvailabilityForDate } = useAvailability({ month });
  const { assignments } = useScheduleAssignments({ userId: profile?.uid });

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading tracking-tight text-gray-900">My Schedule</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your availability for upcoming projects.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <WeeklyDefaultsEditor defaults={defaults} onSave={saveDefaults} orgId={profile?.orgId || ''} />
        </Card>
        <Card>
          <h3 className="text-sm font-semibold font-heading tracking-tight text-gray-900 mb-3">Monthly Availability</h3>
          <p className="text-xs text-gray-500 mb-4">Click a date to toggle. Blue ring = date-specific override.</p>
          <AvailabilityCalendar
            getAvailabilityForDate={getAvailabilityForDate}
            onToggleDate={(date, isAvailable) => toggleDateOverride(date, isAvailable)}
            onMonthChange={setMonth}
          />
        </Card>
      </div>

      <Card>
        <h3 className="text-sm font-semibold font-heading tracking-tight text-gray-900 mb-3">My Assignments</h3>
        <ScheduleCalendar assignments={assignments} view="week" />
      </Card>
    </div>
  );
}
