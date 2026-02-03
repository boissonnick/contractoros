"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, Badge, Button } from '@/components/ui';
import {
  UserGroupIcon,
  ClockIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

/**
 * Interface for team member capacity data
 */
export interface TeamMemberCapacity {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  scheduledHours: number;
  availableHours: number;
  utilizationPercent: number;
  status: 'available' | 'busy' | 'overloaded' | 'off';
}

/**
 * Props for the TeamCapacityWidget
 */
export interface TeamCapacityWidgetProps {
  members: TeamMemberCapacity[];
  weekOf?: Date;
  onMemberClick?: (memberId: string) => void;
  onViewAll?: () => void;
  className?: string;
}

/**
 * Status configuration for styling
 */
const STATUS_CONFIG: Record<
  TeamMemberCapacity['status'],
  { label: string; variant: 'success' | 'warning' | 'danger' | 'default'; color: string; bgColor: string }
> = {
  available: {
    label: 'Available',
    variant: 'success',
    color: 'bg-green-500',
    bgColor: 'bg-green-100',
  },
  busy: {
    label: 'Busy',
    variant: 'warning',
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-100',
  },
  overloaded: {
    label: 'Overloaded',
    variant: 'danger',
    color: 'bg-red-500',
    bgColor: 'bg-red-100',
  },
  off: {
    label: 'Off',
    variant: 'default',
    color: 'bg-gray-400',
    bgColor: 'bg-gray-100',
  },
};

/**
 * Get week range string for display
 */
function getWeekRangeString(weekOf?: Date): string {
  const start = weekOf || new Date();
  // Adjust to Monday of the week
  const monday = new Date(start);
  const dayOfWeek = monday.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setDate(monday.getDate() + diff);

  const friday = new Date(monday);
  friday.setDate(friday.getDate() + 4);

  const monthFormat: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startStr = monday.toLocaleDateString('en-US', monthFormat);
  const endStr = friday.toLocaleDateString('en-US', monthFormat);

  return `${startStr} - ${endStr}`;
}

/**
 * Determine status based on utilization percentage
 */
export function getStatusFromUtilization(
  utilizationPercent: number,
  isOff: boolean = false
): TeamMemberCapacity['status'] {
  if (isOff) return 'off';
  if (utilizationPercent > 80) return 'overloaded';
  if (utilizationPercent >= 60) return 'busy';
  return 'available';
}

/**
 * Get the color for the utilization bar
 */
function getUtilizationBarColor(status: TeamMemberCapacity['status']): string {
  return STATUS_CONFIG[status].color;
}

/**
 * Avatar component for team members
 */
function MemberAvatar({
  name,
  avatar,
  size = 'md',
}: {
  name: string;
  avatar?: string;
  size?: 'sm' | 'md';
}) {
  const sizeClasses = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={cn('rounded-full object-cover', sizeClasses)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-gray-200 flex items-center justify-center font-medium text-gray-600',
        sizeClasses
      )}
    >
      {initials}
    </div>
  );
}

/**
 * Mini utilization bar component
 */
function UtilizationBar({
  percent,
  status,
}: {
  percent: number;
  status: TeamMemberCapacity['status'];
}) {
  const clampedPercent = Math.min(100, Math.max(0, percent));

  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className={cn(
          'h-full rounded-full transition-all duration-300',
          getUtilizationBarColor(status)
        )}
        style={{ width: `${clampedPercent}%` }}
      />
    </div>
  );
}

/**
 * TeamCapacityWidget - Shows team capacity/availability at a glance
 *
 * Displays aggregate stats and a list of team members with their
 * current utilization and availability status.
 */
export default function TeamCapacityWidget({
  members,
  weekOf,
  onMemberClick,
  onViewAll,
  className,
}: TeamCapacityWidgetProps) {
  // Calculate aggregate stats
  const totalCapacity = members.reduce((sum, m) => sum + m.availableHours + m.scheduledHours, 0);
  const totalScheduled = members.reduce((sum, m) => sum + m.scheduledHours, 0);
  const totalAvailable = members.reduce((sum, m) => {
    // Only count available hours for members not on PTO
    return m.status !== 'off' ? sum + m.availableHours : sum;
  }, 0);
  const overallUtilization = totalCapacity > 0 ? Math.round((totalScheduled / totalCapacity) * 100) : 0;

  // Show top 6 members, sorted by utilization (highest first, with 'off' at the end)
  const displayMembers = [...members]
    .sort((a, b) => {
      if (a.status === 'off' && b.status !== 'off') return 1;
      if (b.status === 'off' && a.status !== 'off') return -1;
      return b.utilizationPercent - a.utilizationPercent;
    })
    .slice(0, 6);

  const weekRange = getWeekRangeString(weekOf);

  // Count members by status
  const statusCounts = members.reduce(
    (acc, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1;
      return acc;
    },
    {} as Record<TeamMemberCapacity['status'], number>
  );

  return (
    <Card className={cn('p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <UserGroupIcon className="h-5 w-5 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">Team Capacity</h3>
        </div>
        <span className="text-xs text-gray-500">{weekRange}</span>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{totalCapacity}h</p>
          <p className="text-xs text-gray-500">Total Capacity</p>
        </div>
        <div className="text-center border-x border-gray-200">
          <p className="text-lg font-bold text-blue-600">
            {totalScheduled}h
            <span className="text-xs font-normal text-gray-500 ml-1">
              ({overallUtilization}%)
            </span>
          </p>
          <p className="text-xs text-gray-500">Scheduled</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-green-600">{totalAvailable}h</p>
          <p className="text-xs text-gray-500">Available</p>
        </div>
      </div>

      {/* Status Summary Pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.entries(statusCounts) as [TeamMemberCapacity['status'], number][]).map(
          ([status, count]) => {
            const config = STATUS_CONFIG[status];
            return (
              <div
                key={status}
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs',
                  config.bgColor
                )}
              >
                <span className={cn('w-2 h-2 rounded-full', config.color)} />
                <span className="font-medium">{count} {config.label}</span>
              </div>
            );
          }
        )}
      </div>

      {/* Member List */}
      <div className="space-y-2">
        {displayMembers.map((member) => {
          const config = STATUS_CONFIG[member.status];

          return (
            <div
              key={member.id}
              onClick={() => onMemberClick?.(member.id)}
              className={cn(
                'flex items-center gap-3 p-2 rounded-lg transition-colors',
                onMemberClick && 'cursor-pointer hover:bg-gray-50'
              )}
            >
              {/* Avatar */}
              <MemberAvatar name={member.name} avatar={member.avatar} size="sm" />

              {/* Name and Role */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {member.name}
                  </span>
                  <Badge variant={config.variant} size="sm">
                    {config.label}
                  </Badge>
                </div>
                <span className="text-xs text-gray-500 truncate block">
                  {member.role}
                </span>
              </div>

              {/* Utilization */}
              <div className="w-24 flex-shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">
                    {member.scheduledHours}h / {member.scheduledHours + member.availableHours}h
                  </span>
                </div>
                <UtilizationBar
                  percent={member.utilizationPercent}
                  status={member.status}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {members.length === 0 && (
        <div className="text-center py-6">
          <UserGroupIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No team members to display</p>
        </div>
      )}

      {/* View All Link */}
      {onViewAll && members.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewAll}
            className="w-full justify-center text-gray-600 hover:text-gray-900"
          >
            <span>View All Team Availability</span>
            <ChevronRightIcon className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </Card>
  );
}

/**
 * Compact version for sidebar use
 */
export function TeamCapacityWidgetCompact({
  members,
  weekOf,
  onViewAll,
  className,
}: Omit<TeamCapacityWidgetProps, 'onMemberClick'>) {
  const totalCapacity = members.reduce((sum, m) => sum + m.availableHours + m.scheduledHours, 0);
  const totalScheduled = members.reduce((sum, m) => sum + m.scheduledHours, 0);
  const overallUtilization = totalCapacity > 0 ? Math.round((totalScheduled / totalCapacity) * 100) : 0;

  const weekRange = getWeekRangeString(weekOf);

  // Count available vs unavailable
  const availableCount = members.filter((m) => m.status === 'available').length;
  const totalCount = members.length;

  return (
    <Card className={cn('p-3', className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <UserGroupIcon className="h-4 w-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-700">Team</span>
        </div>
        <span className="text-xs text-gray-400">{weekRange}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Utilization ring */}
        <div className="relative h-12 w-12 flex-shrink-0">
          <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-gray-200"
              strokeWidth="3"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={cn(
                overallUtilization > 80
                  ? 'text-red-500'
                  : overallUtilization >= 60
                  ? 'text-yellow-500'
                  : 'text-green-500'
              )}
              strokeWidth="3"
              strokeDasharray={`${overallUtilization}, 100`}
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-900">{overallUtilization}%</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-sm">
            <span className="font-semibold text-gray-900">{availableCount}</span>
            <span className="text-gray-500">of {totalCount} available</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
            <ClockIcon className="h-3 w-3" />
            <span>{totalScheduled}h scheduled</span>
          </div>
        </div>
      </div>

      {onViewAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewAll}
          className="w-full mt-2 text-xs"
        >
          View Details
        </Button>
      )}
    </Card>
  );
}
