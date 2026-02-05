"use client";

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui';
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  TruckIcon,
  FlagIcon,
  ClipboardDocumentCheckIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { format, isToday, isTomorrow, isYesterday, differenceInDays } from 'date-fns';

export interface ProjectMilestone {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  date: Date;
  status: 'upcoming' | 'today' | 'overdue' | 'completed';
  type: 'phase' | 'inspection' | 'delivery' | 'deadline';
}

export interface ProjectTimelineWidgetProps {
  milestones: ProjectMilestone[];
  maxItems?: number;
  onMilestoneClick?: (milestone: ProjectMilestone) => void;
  className?: string;
}

// Status color mapping
const statusColors: Record<ProjectMilestone['status'], string> = {
  upcoming: 'bg-gray-400',
  today: 'bg-blue-500',
  overdue: 'bg-red-500',
  completed: 'bg-green-500',
};

const statusTextColors: Record<ProjectMilestone['status'], string> = {
  upcoming: 'text-gray-600',
  today: 'text-blue-600',
  overdue: 'text-red-600',
  completed: 'text-green-600',
};

// Type icons mapping
const typeIcons: Record<ProjectMilestone['type'], React.ComponentType<{ className?: string }>> = {
  phase: FlagIcon,
  inspection: ClipboardDocumentCheckIcon,
  delivery: TruckIcon,
  deadline: CalendarDaysIcon,
};

const typeColors: Record<ProjectMilestone['type'], string> = {
  phase: 'text-purple-500 bg-purple-50',
  inspection: 'text-blue-500 bg-blue-50',
  delivery: 'text-orange-500 bg-orange-50',
  deadline: 'text-red-500 bg-red-50',
};

/**
 * Format the date for display
 * Returns "Today", "Tomorrow", "Yesterday", or formatted date
 */
function formatMilestoneDate(date: Date): string {
  if (isToday(date)) {
    return 'Today';
  }
  if (isTomorrow(date)) {
    return 'Tomorrow';
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }

  const daysFromNow = differenceInDays(date, new Date());

  // For dates within the next 7 days, show day name
  if (daysFromNow > 0 && daysFromNow <= 7) {
    return format(date, 'EEEE'); // "Monday", "Tuesday", etc.
  }

  // For dates in the past (overdue), show how many days ago
  if (daysFromNow < 0 && daysFromNow >= -7) {
    return `${Math.abs(daysFromNow)} days ago`;
  }

  // For other dates, show month and day
  return format(date, 'MMM d'); // "Feb 5", "Mar 12", etc.
}

interface MilestoneItemProps {
  milestone: ProjectMilestone;
  onClick?: (milestone: ProjectMilestone) => void;
}

function MilestoneItem({ milestone, onClick }: MilestoneItemProps) {
  const TypeIcon = typeIcons[milestone.type];
  const formattedDate = formatMilestoneDate(milestone.date);

  const handleClick = () => {
    if (onClick) {
      onClick(milestone);
    }
  };

  const content = (
    <div
      className={cn(
        'flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors',
        onClick && 'cursor-pointer'
      )}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Status indicator dot */}
      <div className="flex-shrink-0 mt-1.5">
        <div className={cn('w-2 h-2 rounded-full', statusColors[milestone.status])} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {/* Date */}
          <span className={cn('text-xs font-medium', statusTextColors[milestone.status])}>
            {formattedDate}
          </span>

          {/* Type icon */}
          <div className={cn('p-1 rounded', typeColors[milestone.type])}>
            <TypeIcon className="h-3 w-3" />
          </div>
        </div>

        {/* Milestone title */}
        <p className="text-sm font-medium text-gray-900 truncate">
          {milestone.title}
        </p>

        {/* Project name */}
        <p className="text-xs text-gray-500 truncate">
          {milestone.projectName}
        </p>
      </div>

      {/* Completed checkmark */}
      {milestone.status === 'completed' && (
        <div className="flex-shrink-0">
          <CheckCircleIcon className="h-5 w-5 text-green-500" />
        </div>
      )}
    </div>
  );

  // If we have a project link, wrap in Link
  if (!onClick) {
    return (
      <Link href={`/dashboard/projects/${milestone.projectId}`} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

export default function ProjectTimelineWidget({
  milestones,
  maxItems = 5,
  onMilestoneClick,
  className,
}: ProjectTimelineWidgetProps) {
  // Sort milestones by date and take the first maxItems
  const sortedMilestones = [...milestones]
    .sort((a, b) => {
      // Put overdue items first, then today, then upcoming by date
      const statusOrder = { overdue: 0, today: 1, upcoming: 2, completed: 3 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      return a.date.getTime() - b.date.getTime();
    })
    .slice(0, maxItems);

  const hasMoreMilestones = milestones.length > maxItems;

  return (
    <Card className={cn('p-0', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="h-5 w-5 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Upcoming Milestones</h2>
        </div>
        {hasMoreMilestones && (
          <Link
            href="/dashboard/schedule"
            className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            View All <ArrowRightIcon className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* Content */}
      {sortedMilestones.length > 0 ? (
        <div className="divide-y divide-gray-50">
          {sortedMilestones.map((milestone) => (
            <MilestoneItem
              key={milestone.id}
              milestone={milestone}
              onClick={onMilestoneClick}
            />
          ))}
        </div>
      ) : (
        <div className="p-6 text-center">
          <CalendarDaysIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-900 mb-1">No upcoming milestones</p>
          <p className="text-xs text-gray-500">
            Milestones from your projects will appear here
          </p>
        </div>
      )}

      {/* Footer with view all link when not shown in header */}
      {sortedMilestones.length > 0 && !hasMoreMilestones && (
        <div className="p-3 border-t border-gray-100 bg-gray-50">
          <Link
            href="/dashboard/schedule"
            className="text-sm text-brand-600 hover:text-brand-700 flex items-center justify-center gap-1"
          >
            View Full Schedule <ArrowRightIcon className="h-3 w-3" />
          </Link>
        </div>
      )}
    </Card>
  );
}
