'use client';

import { useState, useMemo } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  ClockIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { WeeklyTimeSummary, DailyTimeSummary } from '@/types';

interface TimesheetSummaryProps {
  weeklySummary: WeeklyTimeSummary | null;
  onWeekChange?: (weekStart: Date) => void;
  currentWeekStart: Date;
  showUserName?: boolean;
  overtimeThreshold?: number; // Weekly hours threshold
}

export function TimesheetSummary({
  weeklySummary,
  onWeekChange,
  currentWeekStart,
  showUserName = false,
  overtimeThreshold = 40,
}: TimesheetSummaryProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Get day names for the week
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      days.push({
        date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: date.getDate(),
        dateStr: date.toISOString().split('T')[0],
      });
    }
    return days;
  }, [currentWeekStart]);

  // Navigate weeks
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() + (direction === 'prev' ? -7 : 7));
    onWeekChange?.(newWeekStart);
  };

  // Format hours
  const formatHours = (hours: number): string => {
    if (hours === 0) return '0h';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  // Get hours for a specific day
  const getDayHours = (dateStr: string): number => {
    if (!weeklySummary) return 0;
    const daySummary = weeklySummary.dailySummaries.find(d => d.date === dateStr);
    return daySummary?.totalHours || 0;
  };

  // Get day summary
  const getDaySummary = (dateStr: string): DailyTimeSummary | null => {
    if (!weeklySummary) return null;
    return weeklySummary.dailySummaries.find(d => d.date === dateStr) || null;
  };

  // Calculate progress percentage
  const progressPercentage = weeklySummary
    ? Math.min((weeklySummary.totalHours / overtimeThreshold) * 100, 100)
    : 0;

  const selectedDaySummary = selectedDay ? getDaySummary(selectedDay) : null;

  return (
    <div className="space-y-4">
      {/* Header with Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateWeek('prev')}
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-gray-500" />
            <span className="font-medium">
              {currentWeekStart.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
              {' - '}
              {new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateWeek('next')}
          >
            <ChevronRightIcon className="h-5 w-5" />
          </Button>
        </div>

        {showUserName && weeklySummary && (
          <span className="text-sm text-gray-500">{weeklySummary.userName}</span>
        )}
      </div>

      {/* Weekly Summary Card */}
      <Card className="p-4">
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-500">Total Hours</div>
            <div className="text-2xl font-bold text-gray-900 tracking-tight">
              {weeklySummary ? formatHours(weeklySummary.totalHours) : '0h'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Regular</div>
            <div className="text-xl font-semibold text-gray-700">
              {weeklySummary ? formatHours(weeklySummary.regularHours) : '0h'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Overtime</div>
            <div className="text-xl font-semibold text-orange-600">
              {weeklySummary ? formatHours(weeklySummary.overtimeHours) : '0h'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Breaks</div>
            <div className="text-xl font-semibold text-gray-500">
              {weeklySummary ? formatHours(weeklySummary.breakHours) : '0h'}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Weekly Progress</span>
            <span>
              {weeklySummary?.totalHours.toFixed(1) || 0} / {overtimeThreshold}h
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                progressPercentage >= 100 ? 'bg-orange-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Day Grid */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => {
            const hours = getDayHours(day.dateStr);
            const isToday = day.dateStr === new Date().toISOString().split('T')[0];
            const isSelected = selectedDay === day.dateStr;
            const hasHours = hours > 0;

            return (
              <button
                key={day.dateStr}
                onClick={() => setSelectedDay(isSelected ? null : day.dateStr)}
                className={`p-2 rounded-lg text-center transition-all ${
                  isSelected
                    ? 'bg-blue-100 border-2 border-blue-500'
                    : hasHours
                    ? 'bg-green-50 hover:bg-green-100'
                    : 'bg-gray-50 hover:bg-gray-100'
                } ${isToday ? 'ring-2 ring-blue-300' : ''}`}
              >
                <div className="text-xs text-gray-500">{day.dayName}</div>
                <div className={`text-lg font-semibold ${hasHours ? 'text-gray-900' : 'text-gray-400'}`}>
                  {day.dayNum}
                </div>
                <div className={`text-xs ${hasHours ? 'text-green-600' : 'text-gray-400'}`}>
                  {hours > 0 ? formatHours(hours) : '-'}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Selected Day Details */}
      {selectedDaySummary && (
        <Card className="p-4">
          <h3 className="font-medium text-gray-900 mb-3">
            {new Date(selectedDaySummary.date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </h3>

          {/* Day Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">Total</div>
                <div className="font-semibold">{formatHours(selectedDaySummary.totalHours)}</div>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Regular</div>
              <div className="font-semibold">{formatHours(selectedDaySummary.regularHours)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Overtime</div>
              <div className="font-semibold text-orange-600">
                {formatHours(selectedDaySummary.overtimeHours)}
              </div>
            </div>
          </div>

          {/* Project Breakdown */}
          {selectedDaySummary.projectBreakdown.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <BriefcaseIcon className="h-4 w-4" />
                By Project
              </h4>
              <div className="space-y-2">
                {selectedDaySummary.projectBreakdown.map((proj) => (
                  <div
                    key={proj.projectId}
                    className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded"
                  >
                    <span className="text-gray-700">{proj.projectName}</span>
                    <span className="font-medium">{formatHours(proj.hours)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time Entries */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Time Entries</h4>
            <div className="space-y-2">
              {selectedDaySummary.entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded"
                >
                  <div>
                    <span className="text-gray-700">
                      {new Date(entry.clockIn).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                      {' - '}
                      {entry.clockOut
                        ? new Date(entry.clockOut).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })
                        : 'Active'}
                    </span>
                    {entry.projectName && (
                      <span className="text-gray-500 ml-2">• {entry.projectName}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {entry.totalMinutes ? formatHours(entry.totalMinutes / 60) : '--'}
                    </span>
                    <Badge
                      variant={
                        entry.status === 'approved'
                          ? 'success'
                          : entry.status === 'rejected'
                          ? 'danger'
                          : entry.status === 'pending_approval'
                          ? 'warning'
                          : 'default'
                      }
                      className="text-xs"
                    >
                      {entry.status === 'pending_approval' ? 'Pending' : entry.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Project Breakdown (Weekly) */}
      {weeklySummary && weeklySummary.projectBreakdown.length > 0 && !selectedDay && (
        <Card className="p-4">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <BriefcaseIcon className="h-5 w-5 text-gray-400" />
            Hours by Project
          </h3>
          <div className="space-y-3">
            {weeklySummary.projectBreakdown.map((proj) => {
              const percentage = (proj.hours / weeklySummary.totalHours) * 100;
              return (
                <div key={proj.projectId}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{proj.projectName}</span>
                    <span className="font-medium">{formatHours(proj.hours)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
