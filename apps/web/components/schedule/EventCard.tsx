"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui';
import {
  ScheduleEvent,
  SCHEDULE_EVENT_TYPES,
  SCHEDULE_EVENT_STATUSES,
} from '@/types';
import {
  MapPinIcon,
  UserGroupIcon,
  ClockIcon,
  CalendarIcon,
  CloudIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export interface EventCardProps {
  event: ScheduleEvent;
  onClick?: () => void;
  compact?: boolean;
  showProject?: boolean;
  showCrew?: boolean;
  showWeather?: boolean;
  className?: string;
}

export default function EventCard({
  event,
  onClick,
  compact = false,
  showProject = true,
  showCrew = true,
  showWeather = true,
  className,
}: EventCardProps) {
  const typeConfig = SCHEDULE_EVENT_TYPES.find((t) => t.value === event.type);
  const statusConfig = SCHEDULE_EVENT_STATUSES.find((s) => s.value === event.status);
  const color = event.color || typeConfig?.color || '#6b7280';

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getDuration = () => {
    const hours = (event.endDate.getTime() - event.startDate.getTime()) / (1000 * 60 * 60);
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    return `${hours.toFixed(1)}h`;
  };

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'w-full text-left rounded px-2 py-1 text-xs hover:opacity-80 transition-opacity',
          className
        )}
        style={{
          backgroundColor: `${color}15`,
          borderLeft: `3px solid ${color}`,
        }}
      >
        <div className="flex items-center gap-1">
          {event.hasConflicts && (
            <ExclamationTriangleIcon className="h-3 w-3 text-amber-500 flex-shrink-0" />
          )}
          <span className="font-medium truncate" style={{ color }}>
            {event.title}
          </span>
        </div>
        {!event.allDay && (
          <div className="text-[10px] text-gray-500">
            {formatTime(event.startDate)}
          </div>
        )}
      </button>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-lg border p-3 cursor-pointer hover:shadow-md transition-shadow bg-white',
        className
      )}
      style={{ borderLeftWidth: '4px', borderLeftColor: color }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {event.hasConflicts && (
              <ExclamationTriangleIcon className="h-4 w-4 text-amber-500 flex-shrink-0" />
            )}
            <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
          </div>
          {event.description && (
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{event.description}</p>
          )}
        </div>
        <Badge
          variant={event.status === 'completed' ? 'success' : event.status === 'cancelled' ? 'danger' : 'default'}
          className="ml-2 flex-shrink-0"
        >
          {statusConfig?.label || event.status}
        </Badge>
      </div>

      {/* Meta info */}
      <div className="space-y-1.5 text-sm">
        {/* Time */}
        <div className="flex items-center gap-2 text-gray-600">
          <ClockIcon className="h-4 w-4 flex-shrink-0" />
          {event.allDay ? (
            <span>All Day</span>
          ) : (
            <span>
              {formatTime(event.startDate)} - {formatTime(event.endDate)}
              <span className="text-gray-400 ml-1">({getDuration()})</span>
            </span>
          )}
        </div>

        {/* Date if multi-day */}
        {event.startDate.toDateString() !== event.endDate.toDateString() && (
          <div className="flex items-center gap-2 text-gray-600">
            <CalendarIcon className="h-4 w-4 flex-shrink-0" />
            <span>
              {formatDate(event.startDate)} - {formatDate(event.endDate)}
            </span>
          </div>
        )}

        {/* Location */}
        {event.location && (
          <div className="flex items-center gap-2 text-gray-600">
            <MapPinIcon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        )}

        {/* Project */}
        {showProject && event.projectName && (
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-700">
              {event.projectName}
            </span>
            {event.phaseName && (
              <span className="px-2 py-0.5 bg-blue-50 rounded text-xs text-blue-600">
                {event.phaseName}
              </span>
            )}
          </div>
        )}

        {/* Crew */}
        {showCrew && event.assignedUsers && event.assignedUsers.length > 0 && (
          <div className="flex items-center gap-2 text-gray-600">
            <UserGroupIcon className="h-4 w-4 flex-shrink-0" />
            <div className="flex flex-wrap gap-1">
              {event.assignedUsers.slice(0, 3).map((user) => (
                <span
                  key={user.id}
                  className="px-1.5 py-0.5 bg-gray-100 rounded text-xs"
                >
                  {user.name}
                </span>
              ))}
              {event.assignedUsers.length > 3 && (
                <span className="px-1.5 py-0.5 text-xs text-gray-500">
                  +{event.assignedUsers.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Weather */}
        {showWeather && event.weatherSensitive && event.weatherImpact && event.weatherImpact !== 'none' && (
          <div className={cn(
            'flex items-center gap-2 text-sm px-2 py-1 rounded',
            event.weatherImpact === 'severe' && 'bg-red-50 text-red-700',
            event.weatherImpact === 'high' && 'bg-orange-50 text-orange-700',
            event.weatherImpact === 'moderate' && 'bg-yellow-50 text-yellow-700',
            event.weatherImpact === 'low' && 'bg-blue-50 text-blue-700'
          )}>
            <CloudIcon className="h-4 w-4" />
            <span>Weather impact: {event.weatherImpact}</span>
          </div>
        )}
      </div>

      {/* Type badge */}
      <div className="mt-3 flex items-center justify-between">
        <span
          className="px-2 py-0.5 rounded text-xs font-medium"
          style={{
            backgroundColor: `${color}20`,
            color,
          }}
        >
          {typeConfig?.label || event.type}
        </span>
        {event.clientVisibleNotes && (
          <span className="text-xs text-gray-400">Has client notes</span>
        )}
      </div>
    </div>
  );
}
