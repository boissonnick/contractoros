'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ScheduleEvent } from '@/types';
import { Card, Button } from '@/components/ui';
import EventCard from './EventCard';
import {
  PlusIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import {
  getWeatherEmoji,
  WeatherData,
} from '@/lib/services/weather';

export interface DayViewProps {
  date: Date;
  events: ScheduleEvent[];
  onEventClick?: (event: ScheduleEvent) => void;
  /** Click on an empty time slot - receives the date and hour clicked */
  onSlotClick?: (date: Date, hour: number) => void;
  /** Alias for onSlotClick - click on a time slot to create new event */
  onTimeSlotClick?: (time: Date) => void;
  /** Drag and drop event to new time - TODO: Implement drag-and-drop functionality */
  onEventDrop?: (event: ScheduleEvent, newTime: Date) => void;
  /** Weather data to display in header */
  weather?: WeatherData;
  /** Whether to show weather summary at top (requires weather data) */
  showWeather?: boolean;
  className?: string;
  /** Show navigation controls (Previous/Today/Next buttons) */
  showNavigation?: boolean;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  onNavigateToday?: () => void;
}

// Work hours: 6 AM to 8 PM (20:00)
const WORK_HOURS = Array.from({ length: 15 }, (_, i) => i + 6);

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

function getEventPosition(event: ScheduleEvent, hour: number): { top: number; height: number } | null {
  const startDate = event.startDate instanceof Date ? event.startDate : new Date(event.startDate);
  const endDate = event.endDate instanceof Date ? event.endDate : new Date(event.endDate);

  const eventStartHour = startDate.getHours() + startDate.getMinutes() / 60;
  const eventEndHour = endDate.getHours() + endDate.getMinutes() / 60;

  // Check if event overlaps with this hour slot
  if (eventEndHour <= hour || eventStartHour >= hour + 1) {
    return null;
  }

  // Calculate position within the hour slot (60px height)
  const slotHeight = 60;
  const top = Math.max(0, (eventStartHour - hour)) * slotHeight;
  const bottom = Math.min(1, (eventEndHour - hour)) * slotHeight;
  const height = bottom - top;

  return { top, height: Math.max(height, 20) }; // Minimum 20px height
}

// Get color based on event type (matching mobile view)
function getEventTypeColor(type: string): { bg: string; border: string; text: string } {
  switch (type) {
    case 'job':
      return { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-700' };
    case 'inspection':
      return { bg: 'bg-amber-100', border: 'border-amber-500', text: 'text-amber-700' };
    case 'delivery':
      return { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-700' };
    case 'meeting':
      return { bg: 'bg-purple-100', border: 'border-purple-500', text: 'text-purple-700' };
    case 'maintenance':
      return { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-700' };
    default:
      return { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-700' };
  }
}

export function DayView({
  date,
  events,
  onEventClick,
  onSlotClick,
  onTimeSlotClick,
  onEventDrop,
  weather,
  showWeather = true,
  className,
  showNavigation = false,
  onNavigatePrev,
  onNavigateNext,
  onNavigateToday,
}: DayViewProps) {
  // Handle time slot click - supports both callback styles
  const handleSlotClick = (clickDate: Date, hour: number) => {
    // Call legacy callback
    onSlotClick?.(clickDate, hour);
    // Call new style callback with full Date object
    if (onTimeSlotClick) {
      const time = new Date(clickDate);
      time.setHours(hour, 0, 0, 0);
      onTimeSlotClick(time);
    }
  };

  // TODO: Implement drag-and-drop for events
  // When implemented, should:
  // 1. Make event cards draggable
  // 2. Calculate new time based on drop position
  // 3. Call onEventDrop(event, newTime) callback
  // Consider using @dnd-kit/core or react-beautiful-dnd
  const dayEvents = useMemo(() => {
    return events.filter((e) => {
      const eventDate = e.startDate instanceof Date ? e.startDate : new Date(e.startDate);
      return isSameDay(eventDate, date);
    });
  }, [events, date]);

  const isToday = isSameDay(date, new Date());
  const currentHour = new Date().getHours();

  // Get event duration text
  const getEventTime = (event: ScheduleEvent) => {
    const start = event.startDate instanceof Date ? event.startDate : new Date(event.startDate);
    const end = event.endDate instanceof Date ? event.endDate : new Date(event.endDate);
    return `${formatHour(start.getHours())} - ${formatHour(end.getHours())}`;
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Navigation controls (optional) */}
          {showNavigation && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onNavigatePrev}
                title="Previous Day"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={onNavigateToday}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onNavigateNext}
                title="Next Day"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">
              {date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </h3>
            <p className="text-sm text-gray-500">
              {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''} scheduled
            </p>
          </div>
        </div>
        {showWeather && weather && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-xl">{getWeatherEmoji(weather.conditions)}</span>
            <div className="text-right">
              <div className="font-medium">{weather.high}° / {weather.low}°</div>
              {weather.precipitation > 20 && (
                <div className="text-xs text-blue-600">{weather.precipitation}% rain</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hourly Grid */}
      <div className="relative">
        {WORK_HOURS.map((hour) => {
          const isCurrentHour = isToday && hour === currentHour;
          const hourEvents = dayEvents.filter((e) => {
            const pos = getEventPosition(e, hour);
            return pos !== null;
          });

          return (
            <div
              key={hour}
              className={cn(
                'flex border-b border-gray-100 group',
                isCurrentHour && 'bg-blue-50/30'
              )}
            >
              {/* Time Label */}
              <div className="w-20 py-3 px-3 text-xs text-gray-500 text-right bg-gray-50 border-r border-gray-100 flex-shrink-0">
                {formatHour(hour)}
              </div>

              {/* Event Slot */}
              <div
                className="flex-1 min-h-[60px] relative cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => handleSlotClick(date, hour)}
              >
                {/* Current time indicator */}
                {isCurrentHour && (
                  <div
                    className="absolute left-0 right-0 border-t-2 border-red-500 z-10"
                    style={{
                      top: `${(new Date().getMinutes() / 60) * 60}px`,
                    }}
                  >
                    <div className="absolute -left-1 -top-1.5 w-3 h-3 bg-red-500 rounded-full" />
                  </div>
                )}

                {/* Events */}
                {hourEvents.map((event) => {
                  const pos = getEventPosition(event, hour);
                  if (!pos) return null;

                  // Only render the event once (at its start hour)
                  const startHour = (event.startDate instanceof Date
                    ? event.startDate
                    : new Date(event.startDate)
                  ).getHours();
                  if (startHour !== hour && pos.top === 0) {
                    // This is a continuation, show a connector with type-based colors
                    const contTypeColors = getEventTypeColor(event.type || 'job');
                    return (
                      <div
                        key={`${event.id}-cont`}
                        className={cn(
                          'absolute left-1 right-1 border-l-4 opacity-50',
                          contTypeColors.bg,
                          contTypeColors.border
                        )}
                        style={{
                          top: `${pos.top}px`,
                          height: `${pos.height}px`,
                        }}
                      />
                    );
                  }

                  const typeColors = getEventTypeColor(event.type || 'job');

                  return (
                    <div
                      key={event.id}
                      className={cn(
                        'absolute left-1 right-1 border-l-4 rounded-r p-2 cursor-pointer hover:opacity-90 transition-all overflow-hidden shadow-sm',
                        typeColors.bg,
                        typeColors.border
                      )}
                      style={{
                        top: `${pos.top}px`,
                        height: `${Math.max(pos.height, 40)}px`,
                        zIndex: 5,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                    >
                      <div className="flex items-start justify-between gap-2 h-full">
                        <div className="min-w-0 flex-1">
                          <p className={cn('font-medium text-sm truncate', typeColors.text)}>
                            {event.title}
                          </p>
                          {pos.height >= 50 && (
                            <p className="text-xs text-gray-600 truncate">
                              {getEventTime(event)}
                              {event.projectName && ` • ${event.projectName}`}
                            </p>
                          )}
                          {/* Location - show if height allows */}
                          {pos.height >= 70 && event.location && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPinIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
                              <p className="text-xs text-gray-500 truncate">{event.location}</p>
                            </div>
                          )}
                          {/* Crew - show if height allows */}
                          {pos.height >= 90 && event.assignedUsers && event.assignedUsers.length > 0 && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <UserGroupIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
                              <p className="text-xs text-gray-500 truncate">
                                {event.assignedUsers.slice(0, 2).map(u => u.name).join(', ')}
                                {event.assignedUsers.length > 2 && ` +${event.assignedUsers.length - 2}`}
                              </p>
                            </div>
                          )}
                        </div>
                        {event.assignedUserIds && event.assignedUserIds.length > 0 && (
                          <div className="flex -space-x-1 flex-shrink-0">
                            {event.assignedUserIds.slice(0, 3).map((userId: string, idx: number) => (
                              <div
                                key={userId}
                                className="w-5 h-5 rounded-full bg-white/80 border border-gray-200 flex items-center justify-center text-[10px] font-medium text-gray-600"
                              >
                                {idx + 1}
                              </div>
                            ))}
                            {event.assignedUserIds.length > 3 && (
                              <div className="w-5 h-5 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-[10px] text-gray-500">
                                +{event.assignedUserIds.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Add event button (shows on hover when slot is empty) */}
                {hourEvents.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 bg-white border border-gray-200 rounded hover:bg-gray-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSlotClick(date, hour);
                      }}
                    >
                      <PlusIcon className="h-3 w-3" />
                      Add
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {dayEvents.length === 0 && (
        <div className="text-center py-8 px-4 border-t border-gray-100 bg-gray-50/50">
          <CalendarDaysIcon className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-500 mb-3">No events scheduled for this day</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleSlotClick(date, 9)}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Event
          </Button>
        </div>
      )}
    </Card>
  );
}

export default DayView;
