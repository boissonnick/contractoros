"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useScheduleEvents } from '@/lib/hooks/schedule';
import { ScheduleEvent, ScheduleAssignment } from '@/types';
import { useScheduleAssignments } from '@/lib/hooks/useScheduleAssignments';
import { Card, Button, Badge } from '@/components/ui';
import BaseModal from '@/components/ui/BaseModal';
import { cn } from '@/lib/utils';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  SunIcon,
} from '@heroicons/react/24/outline';

// =============================================================================
// CONSTANTS
// =============================================================================

const WORK_HOURS = Array.from({ length: 15 }, (_, i) => i + 6); // 6 AM to 8 PM
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const _FULL_DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Project colors for assignments (cycled based on project ID)
const PROJECT_COLORS = [
  { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-700', dot: 'bg-blue-500' },
  { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-700', dot: 'bg-green-500' },
  { bg: 'bg-purple-100', border: 'border-purple-500', text: 'text-purple-700', dot: 'bg-purple-500' },
  { bg: 'bg-amber-100', border: 'border-amber-500', text: 'text-amber-700', dot: 'bg-amber-500' },
  { bg: 'bg-rose-100', border: 'border-rose-500', text: 'text-rose-700', dot: 'bg-rose-500' },
  { bg: 'bg-teal-100', border: 'border-teal-500', text: 'text-teal-700', dot: 'bg-teal-500' },
  { bg: 'bg-indigo-100', border: 'border-indigo-500', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-700', dot: 'bg-orange-500' },
];

// Event type colors
const EVENT_TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  job: { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-700' },
  inspection: { bg: 'bg-amber-100', border: 'border-amber-500', text: 'text-amber-700' },
  delivery: { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-700' },
  meeting: { bg: 'bg-purple-100', border: 'border-purple-500', text: 'text-purple-700' },
  maintenance: { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-700' },
  default: { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-700' },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - result.getDay());
  result.setHours(0, 0, 0, 0);
  return result;
}

function getWeekDates(refDate: Date): Date[] {
  const start = startOfWeek(refDate);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateFull(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getProjectColor(projectId: string, colorMap: Map<string, number>): typeof PROJECT_COLORS[0] {
  if (!colorMap.has(projectId)) {
    colorMap.set(projectId, colorMap.size % PROJECT_COLORS.length);
  }
  return PROJECT_COLORS[colorMap.get(projectId)!];
}

function parseTime(timeStr: string): { hour: number; minute: number } {
  const [hour, minute] = timeStr.split(':').map(Number);
  return { hour, minute: minute || 0 };
}

function timeToDecimal(timeStr: string): number {
  const { hour, minute } = parseTime(timeStr);
  return hour + minute / 60;
}

// =============================================================================
// UNIFIED SCHEDULE ITEM TYPE
// =============================================================================

interface UnifiedScheduleItem {
  id: string;
  type: 'event' | 'assignment';
  title: string;
  description?: string;
  projectId?: string;
  projectName?: string;
  location?: string;
  date: Date;
  startHour: number;
  endHour: number;
  startDate: Date;
  endDate: Date;
  status?: string;
  assignedUsers?: { id: string; name: string }[];
  eventType?: string;
  original: ScheduleEvent | ScheduleAssignment;
}

// =============================================================================
// COMPONENTS
// =============================================================================

interface DayViewProps {
  date: Date;
  items: UnifiedScheduleItem[];
  projectColorMap: Map<string, number>;
  onItemClick: (item: UnifiedScheduleItem) => void;
}

function DayView({ date, items, projectColorMap, onItemClick }: DayViewProps) {
  const isToday = isSameDay(date, new Date());
  const currentHour = new Date().getHours();
  const currentMinute = new Date().getMinutes();
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (isToday && containerRef.current) {
      const scrollTarget = Math.max(0, currentHour - 7) * 60;
      containerRef.current.scrollTop = scrollTarget;
    }
  }, [isToday, currentHour]);

  // Get items for this day
  const dayItems = useMemo(() => {
    return items.filter((item) => isSameDay(item.date, date));
  }, [items, date]);

  // Group overlapping items
  const getItemPosition = (item: UnifiedScheduleItem, hour: number): { top: number; height: number } | null => {
    if (item.endHour <= hour || item.startHour >= hour + 1) {
      return null;
    }

    const slotHeight = 60;
    const top = Math.max(0, (item.startHour - hour)) * slotHeight;
    const bottom = Math.min(1, (item.endHour - hour)) * slotHeight;
    const height = bottom - top;

    return { top, height: Math.max(height, 24) };
  };

  return (
    <Card className="overflow-hidden" padding="none">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b">
        <h3 className="font-semibold font-heading tracking-tight text-gray-900">{formatDateFull(date)}</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          {dayItems.length} {dayItems.length === 1 ? 'item' : 'items'} scheduled
        </p>
      </div>

      {/* Hourly Grid */}
      <div ref={containerRef} className="relative overflow-y-auto max-h-[calc(100vh-280px)]">
        {WORK_HOURS.map((hour) => {
          const isCurrentHour = isToday && hour === currentHour;
          const hourItems = dayItems.filter((item) => getItemPosition(item, hour) !== null);

          return (
            <div
              key={hour}
              className={cn(
                'flex border-b border-gray-100 group min-h-[60px]',
                isCurrentHour && 'bg-blue-50/30'
              )}
            >
              {/* Time Label */}
              <div className="w-16 py-3 px-2 text-xs text-gray-500 text-right bg-gray-50/50 border-r border-gray-100 flex-shrink-0">
                {formatHour(hour)}
              </div>

              {/* Event Slot */}
              <div className="flex-1 relative min-h-[60px]">
                {/* Current time indicator */}
                {isCurrentHour && (
                  <div
                    className="absolute left-0 right-0 border-t-2 border-red-500 z-20"
                    style={{
                      top: `${(currentMinute / 60) * 60}px`,
                    }}
                  >
                    <div className="absolute -left-1 -top-1.5 w-3 h-3 bg-red-500 rounded-full" />
                  </div>
                )}

                {/* Items */}
                {hourItems.map((item) => {
                  const pos = getItemPosition(item, hour);
                  if (!pos) return null;

                  // Only render at start hour
                  const startHourInt = Math.floor(item.startHour);
                  if (startHourInt !== hour && pos.top === 0) {
                    // Continuation block
                    const colors = item.projectId
                      ? getProjectColor(item.projectId, projectColorMap)
                      : EVENT_TYPE_COLORS[item.eventType || 'default'];
                    return (
                      <div
                        key={`${item.id}-cont-${hour}`}
                        className={cn(
                          'absolute left-1 right-1 border-l-4 opacity-40 rounded-r',
                          colors.bg,
                          colors.border
                        )}
                        style={{
                          top: `${pos.top}px`,
                          height: `${pos.height}px`,
                        }}
                      />
                    );
                  }

                  const colors = item.projectId
                    ? getProjectColor(item.projectId, projectColorMap)
                    : EVENT_TYPE_COLORS[item.eventType || 'default'];

                  return (
                    <button
                      key={item.id}
                      className={cn(
                        'absolute left-1 right-1 border-l-4 rounded-r p-2 cursor-pointer hover:opacity-90 transition-all overflow-hidden shadow-sm text-left',
                        colors.bg,
                        colors.border
                      )}
                      style={{
                        top: `${pos.top}px`,
                        height: `${Math.max(pos.height, 40)}px`,
                        zIndex: 5,
                      }}
                      onClick={() => onItemClick(item)}
                    >
                      <p className={cn('font-medium text-sm truncate', colors.text)}>
                        {item.title}
                      </p>
                      {pos.height >= 50 && (
                        <p className="text-xs text-gray-600 truncate">
                          {formatTime(item.startDate)} - {formatTime(item.endDate)}
                          {item.projectName && ` - ${item.projectName}`}
                        </p>
                      )}
                      {pos.height >= 70 && item.location && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPinIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          <p className="text-xs text-gray-500 truncate">{item.location}</p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {dayItems.length === 0 && (
        <div className="text-center py-12 px-4 bg-gray-50/50">
          <CalendarDaysIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">No scheduled items</p>
          <p className="text-sm text-gray-400 mt-1">You have nothing scheduled for this day</p>
        </div>
      )}
    </Card>
  );
}

interface WeekViewProps {
  startDate: Date;
  items: UnifiedScheduleItem[];
  projectColorMap: Map<string, number>;
  onItemClick: (item: UnifiedScheduleItem) => void;
  onDayClick: (date: Date) => void;
}

function WeekView({ startDate, items, projectColorMap, onItemClick, onDayClick }: WeekViewProps) {
  const weekDates = getWeekDates(startDate);
  const today = new Date();

  // Get items grouped by day
  const itemsByDay = useMemo(() => {
    const map = new Map<string, UnifiedScheduleItem[]>();
    weekDates.forEach((date) => {
      const dateKey = date.toDateString();
      map.set(dateKey, items.filter((item) => isSameDay(item.date, date)));
    });
    return map;
  }, [items, weekDates]);

  return (
    <Card className="overflow-hidden" padding="none">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b">
        <h3 className="font-semibold font-heading tracking-tight text-gray-900">
          {formatDateShort(weekDates[0])} - {formatDateShort(weekDates[6])}
        </h3>
        <p className="text-sm text-gray-500 mt-0.5">
          {items.length} {items.length === 1 ? 'item' : 'items'} this week
        </p>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7">
        {/* Day Headers */}
        {weekDates.map((date, idx) => {
          const isToday = isSameDay(date, today);
          return (
            <div
              key={idx}
              className={cn(
                'text-center py-2 text-xs font-medium border-b',
                isToday ? 'bg-brand-primary/10 text-brand-primary' : 'bg-gray-50 text-gray-500'
              )}
            >
              {DAY_LABELS[date.getDay()]}
            </div>
          );
        })}

        {/* Day Cells */}
        {weekDates.map((date, idx) => {
          const isToday = isSameDay(date, today);
          const dateKey = date.toDateString();
          const dayItems = itemsByDay.get(dateKey) || [];

          return (
            <button
              key={idx}
              onClick={() => onDayClick(date)}
              className={cn(
                'min-h-[120px] sm:min-h-[140px] border-r border-b p-2 text-left transition-colors hover:bg-gray-50',
                idx % 7 === 6 && 'border-r-0',
                isToday && 'bg-brand-primary/5'
              )}
            >
              {/* Date number */}
              <div
                className={cn(
                  'w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-2',
                  isToday ? 'bg-brand-primary text-white' : 'text-gray-700'
                )}
              >
                {date.getDate()}
              </div>

              {/* Items preview */}
              <div className="space-y-1">
                {dayItems.slice(0, 3).map((item) => {
                  const colors = item.projectId
                    ? getProjectColor(item.projectId, projectColorMap)
                    : EVENT_TYPE_COLORS[item.eventType || 'default'];

                  return (
                    <div
                      key={item.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemClick(item);
                      }}
                      className={cn(
                        'px-1.5 py-1 rounded text-[10px] truncate border-l-2',
                        colors.bg,
                        colors.border
                      )}
                    >
                      <span className="font-medium">{item.title}</span>
                    </div>
                  );
                })}
                {dayItems.length > 3 && (
                  <div className="text-[10px] text-gray-500 font-medium px-1">
                    +{dayItems.length - 3} more
                  </div>
                )}
              </div>

              {/* Empty indicator */}
              {dayItems.length === 0 && (
                <div className="flex items-center justify-center h-full min-h-[60px] text-gray-300">
                  <SunIcon className="h-5 w-5" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

interface ItemDetailModalProps {
  item: UnifiedScheduleItem | null;
  onClose: () => void;
  projectColorMap: Map<string, number>;
}

function ItemDetailModal({ item, onClose, projectColorMap }: ItemDetailModalProps) {
  if (!item) return null;

  const colors = item.projectId
    ? getProjectColor(item.projectId, projectColorMap)
    : EVENT_TYPE_COLORS[item.eventType || 'default'];

  // Get dot color - either from the color object or derive from border
  const dotColor = 'dot' in colors && colors.dot ? colors.dot : colors.border.replace('border-', 'bg-');

  return (
    <BaseModal
      open={!!item}
      onClose={onClose}
      title="Schedule Details"
      size="md"
    >
      <div className="space-y-4">
        {/* Title with color indicator */}
        <div className="flex items-start gap-3">
          <div className={cn('w-1 h-12 rounded-full flex-shrink-0', dotColor)} />
          <div>
            <h3 className="font-semibold font-heading tracking-tight text-lg text-gray-900">{item.title}</h3>
            {item.description && (
              <p className="text-sm text-gray-500 mt-1">{item.description}</p>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3">
          {/* Date/Time */}
          <div className="flex items-center gap-3 text-sm">
            <ClockIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">
                {formatDateFull(item.date)}
              </p>
              <p className="text-gray-500">
                {formatTime(item.startDate)} - {formatTime(item.endDate)}
              </p>
            </div>
          </div>

          {/* Project */}
          {item.projectName && (
            <div className="flex items-center gap-3 text-sm">
              <CalendarDaysIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-gray-500">Project</p>
                <p className="font-medium text-gray-900">{item.projectName}</p>
              </div>
            </div>
          )}

          {/* Location */}
          {item.location && (
            <div className="flex items-center gap-3 text-sm">
              <MapPinIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-gray-500">Location</p>
                <p className="font-medium text-gray-900">{item.location}</p>
              </div>
            </div>
          )}

          {/* Assigned Users */}
          {item.assignedUsers && item.assignedUsers.length > 0 && (
            <div className="flex items-start gap-3 text-sm">
              <UserGroupIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-500">Team</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.assignedUsers.map((user) => (
                    <span
                      key={user.id}
                      className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium text-gray-700"
                    >
                      {user.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Status */}
          {item.status && (
            <div className="flex items-center gap-3 text-sm">
              {item.status === 'completed' ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
              ) : (
                <ExclamationCircleIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
              )}
              <div>
                <p className="text-gray-500">Status</p>
                <Badge
                  variant={
                    item.status === 'completed' ? 'success' :
                    item.status === 'in_progress' ? 'info' :
                    item.status === 'cancelled' ? 'danger' : 'default'
                  }
                >
                  {item.status.replace(/_/g, ' ')}
                </Badge>
              </div>
            </div>
          )}

          {/* Type badge */}
          {item.type && (
            <div className="pt-2 border-t">
              <span
                className={cn(
                  'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                  colors.bg,
                  colors.text
                )}
              >
                {item.type === 'event' ? (item.eventType || 'Event') : 'Assignment'}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function FieldSchedulePage() {
  const { profile } = useAuth();
  const [view, setView] = useState<'day' | 'week'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedItem, setSelectedItem] = useState<UnifiedScheduleItem | null>(null);

  // Touch handling for swipe navigation
  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get date range for fetching
  const dateRange = useMemo(() => {
    if (view === 'day') {
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    } else {
      const start = startOfWeek(selectedDate);
      const end = addDays(start, 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
  }, [selectedDate, view]);

  // Fetch schedule events (assigned to this user)
  const { events, loading: eventsLoading } = useScheduleEvents({
    userId: profile?.uid,
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  // Fetch schedule assignments
  const { assignments, loading: assignmentsLoading } = useScheduleAssignments({
    userId: profile?.uid,
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  const loading = eventsLoading || assignmentsLoading;

  // Project color map (stable across renders)
  const projectColorMap = useMemo(() => new Map<string, number>(), []);

  // Convert events and assignments to unified items
  const unifiedItems = useMemo(() => {
    const items: UnifiedScheduleItem[] = [];

    // Convert events
    events.forEach((event) => {
      const startDate = event.startDate instanceof Date ? event.startDate : new Date(event.startDate);
      const endDate = event.endDate instanceof Date ? event.endDate : new Date(event.endDate);

      items.push({
        id: `event-${event.id}`,
        type: 'event',
        title: event.title,
        description: event.description,
        projectId: event.projectId,
        projectName: event.projectName,
        location: event.location,
        date: startDate,
        startHour: startDate.getHours() + startDate.getMinutes() / 60,
        endHour: endDate.getHours() + endDate.getMinutes() / 60,
        startDate,
        endDate,
        status: event.status,
        assignedUsers: event.assignedUsers,
        eventType: event.type,
        original: event,
      });
    });

    // Convert assignments
    assignments.forEach((assignment) => {
      const startTime = parseTime(assignment.startTime);
      const endTime = parseTime(assignment.endTime);

      const startDate = new Date(assignment.date);
      startDate.setHours(startTime.hour, startTime.minute, 0, 0);

      const endDate = new Date(assignment.date);
      endDate.setHours(endTime.hour, endTime.minute, 0, 0);

      items.push({
        id: `assignment-${assignment.id}`,
        type: 'assignment',
        title: assignment.projectName || 'Assignment',
        projectId: assignment.projectId,
        projectName: assignment.projectName,
        date: assignment.date,
        startHour: timeToDecimal(assignment.startTime),
        endHour: timeToDecimal(assignment.endTime),
        startDate,
        endDate,
        status: assignment.status,
        original: assignment,
      });
    });

    // Sort by start time
    items.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    return items;
  }, [events, assignments]);

  // Navigation handlers
  const navigatePrev = useCallback(() => {
    setSelectedDate((d) => addDays(d, view === 'day' ? -1 : -7));
  }, [view]);

  const navigateNext = useCallback(() => {
    setSelectedDate((d) => addDays(d, view === 'day' ? 1 : 7));
  }, [view]);

  const navigateToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  // Touch handlers for swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    // Swipe threshold of 50px
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        navigateNext();
      } else {
        navigatePrev();
      }
    }

    touchStartX.current = null;
  }, [navigateNext, navigatePrev]);

  // Handle day click from week view
  const handleDayClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setView('day');
  }, []);

  // Handle item click
  const handleItemClick = useCallback((item: UnifiedScheduleItem) => {
    setSelectedItem(item);
  }, []);

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="p-4 space-y-4 max-w-4xl mx-auto"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading tracking-tight text-gray-900">My Schedule</h1>
        <p className="text-sm text-gray-500 mt-1">View your assigned tasks and events</p>
      </div>

      {/* Navigation and View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Date Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={navigatePrev}
            aria-label="Previous"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={navigateToday}
            className="min-w-[80px]"
          >
            Today
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={navigateNext}
            aria-label="Next"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </Button>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setView('day')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors',
              view === 'day'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            Day
          </button>
          <button
            onClick={() => setView('week')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors',
              view === 'week'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            Week
          </button>
        </div>
      </div>

      {/* Calendar View */}
      {view === 'day' ? (
        <DayView
          date={selectedDate}
          items={unifiedItems}
          projectColorMap={projectColorMap}
          onItemClick={handleItemClick}
        />
      ) : (
        <WeekView
          startDate={selectedDate}
          items={unifiedItems}
          projectColorMap={projectColorMap}
          onItemClick={handleItemClick}
          onDayClick={handleDayClick}
        />
      )}

      {/* Swipe hint (mobile only) */}
      <div className="sm:hidden text-center text-xs text-gray-400">
        Swipe left or right to navigate
      </div>

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        projectColorMap={projectColorMap}
      />
    </div>
  );
}
