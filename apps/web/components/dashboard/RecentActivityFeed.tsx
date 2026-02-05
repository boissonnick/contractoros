'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, Avatar, EmptyState, Button } from '@/components/ui';
import {
  FolderIcon,
  DocumentTextIcon,
  DocumentIcon,
  CheckCircleIcon,
  PhotoIcon,
  PaperClipIcon,
  ChatBubbleLeftIcon,
  CreditCardIcon,
  ClockIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

// Activity Types and Actions
export type ActivityType =
  | 'project'
  | 'invoice'
  | 'estimate'
  | 'task'
  | 'photo'
  | 'document'
  | 'comment'
  | 'payment';

export type ActivityAction =
  | 'created'
  | 'updated'
  | 'completed'
  | 'approved'
  | 'rejected'
  | 'uploaded'
  | 'sent';

export interface Activity {
  id: string;
  type: ActivityType;
  action: ActivityAction;
  title: string;
  description?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  timestamp: Date;
  projectId?: string;
  projectName?: string;
  link?: string;
}

export interface RecentActivityFeedProps {
  activities: Activity[];
  maxItems?: number;
  showFilters?: boolean;
  onLoadMore?: () => void;
  className?: string;
  loading?: boolean;
}

// Filter categories
type FilterCategory = 'all' | 'projects' | 'finances' | 'documents';

const FILTER_CATEGORIES: { key: FilterCategory; label: string; types: ActivityType[] }[] = [
  { key: 'all', label: 'All', types: [] },
  { key: 'projects', label: 'Projects', types: ['project', 'task'] },
  { key: 'finances', label: 'Finances', types: ['invoice', 'estimate', 'payment'] },
  { key: 'documents', label: 'Documents', types: ['document', 'photo', 'comment'] },
];

// Icon mapping by activity type
const TYPE_ICONS: Record<ActivityType, typeof FolderIcon> = {
  project: FolderIcon,
  invoice: DocumentTextIcon,
  estimate: DocumentIcon,
  task: CheckCircleIcon,
  photo: PhotoIcon,
  document: PaperClipIcon,
  comment: ChatBubbleLeftIcon,
  payment: CreditCardIcon,
};

// Icon background colors by activity type
const TYPE_COLORS: Record<ActivityType, string> = {
  project: 'bg-blue-100 text-blue-600',
  invoice: 'bg-green-100 text-green-600',
  estimate: 'bg-purple-100 text-purple-600',
  task: 'bg-yellow-100 text-yellow-600',
  photo: 'bg-pink-100 text-pink-600',
  document: 'bg-gray-100 text-gray-600',
  comment: 'bg-cyan-100 text-cyan-600',
  payment: 'bg-emerald-100 text-emerald-600',
};

// Action verb mapping for description generation
const ACTION_VERBS: Record<ActivityAction, string> = {
  created: 'created',
  updated: 'updated',
  completed: 'completed',
  approved: 'approved',
  rejected: 'rejected',
  uploaded: 'uploaded',
  sent: 'sent',
};

// Format relative timestamp
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;

  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}

// Format full timestamp for tooltip
function formatFullTimestamp(date: Date): string {
  return date.toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Filter pill button component
function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200',
        active
          ? 'bg-brand-primary text-white shadow-sm'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      )}
    >
      {label}
    </button>
  );
}

// Single activity item component
function ActivityItem({
  activity,
  isNew = false,
}: {
  activity: Activity;
  isNew?: boolean;
}) {
  const Icon = TYPE_ICONS[activity.type];
  const iconColor = TYPE_COLORS[activity.type];
  const actionVerb = ACTION_VERBS[activity.action];
  const timeAgo = formatTimeAgo(activity.timestamp);
  const fullTimestamp = formatFullTimestamp(activity.timestamp);

  const activityDescription = activity.description || `${actionVerb} ${activity.title}`;

  const content = (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-all duration-200 group',
        isNew && 'animate-fadeIn bg-blue-50/50'
      )}
    >
      {/* Avatar with type icon overlay */}
      <div className="relative flex-shrink-0">
        <Avatar
          src={activity.userAvatar}
          name={activity.userName}
          size="sm"
        />
        <div
          className={cn(
            'absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white',
            iconColor
          )}
        >
          <Icon className="w-3 h-3" />
        </div>
      </div>

      {/* Activity content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">
          <span className="font-medium">{activity.userName}</span>
          {' '}
          <span className="text-gray-600">{activityDescription}</span>
        </p>

        <div className="flex items-center gap-2 mt-1">
          {/* Relative timestamp with full timestamp on hover */}
          <span
            className="text-xs text-gray-400 group-hover:hidden"
            title={fullTimestamp}
          >
            {timeAgo}
          </span>
          <span className="text-xs text-gray-500 hidden group-hover:inline">
            {fullTimestamp}
          </span>

          {/* Project link if applicable */}
          {activity.projectName && activity.projectId && (
            <>
              <span className="text-gray-300">|</span>
              <Link
                href={`/dashboard/projects/${activity.projectId}`}
                className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <FolderIcon className="h-3 w-3" />
                <span className="truncate max-w-[120px]">{activity.projectName}</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Wrap with link if available
  if (activity.link) {
    return (
      <Link href={activity.link} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

// Loading skeleton
function ActivitySkeleton() {
  return (
    <div className="animate-pulse px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-1/4 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function RecentActivityFeed({
  activities,
  maxItems = 10,
  showFilters = false,
  onLoadMore,
  className,
  loading = false,
}: RecentActivityFeedProps) {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');

  // Filter activities based on selected category
  const filteredActivities = useMemo(() => {
    if (activeFilter === 'all') {
      return activities.slice(0, maxItems);
    }

    const filterConfig = FILTER_CATEGORIES.find(f => f.key === activeFilter);
    if (!filterConfig) return activities.slice(0, maxItems);

    return activities
      .filter(a => filterConfig.types.includes(a.type))
      .slice(0, maxItems);
  }, [activities, activeFilter, maxItems]);

  // Track if there are more items to load
  const hasMore = filteredActivities.length >= maxItems;

  if (loading) {
    return (
      <Card padding="none" className={cn('overflow-hidden', className)}>
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <div className="divide-y divide-gray-100">
          {[...Array(5)].map((_, i) => (
            <ActivitySkeleton key={i} />
          ))}
        </div>
      </Card>
    );
  }

  if (activities.length === 0 && !loading) {
    return (
      <Card padding="none" className={cn('overflow-hidden', className)}>
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <EmptyState
          icon={<ClockIcon className="h-full w-full" />}
          title="No activity yet"
          description="Activity will appear as you and your team work on projects."
          className="py-8"
        />
      </Card>
    );
  }

  return (
    <Card padding="none" className={cn('overflow-hidden', className)}>
      {/* Header */}
      <CardHeader className="px-4 pt-4 pb-2">
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>

      {/* Filter pills */}
      {showFilters && (
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {FILTER_CATEGORIES.map(filter => (
            <FilterPill
              key={filter.key}
              label={filter.label}
              active={activeFilter === filter.key}
              onClick={() => setActiveFilter(filter.key)}
            />
          ))}
        </div>
      )}

      {/* Activity list */}
      <div className="divide-y divide-gray-100">
        {filteredActivities.map((activity, index) => (
          <ActivityItem
            key={activity.id}
            activity={activity}
            isNew={index === 0}
          />
        ))}
      </div>

      {/* Empty state for filtered results */}
      {filteredActivities.length === 0 && activities.length > 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-500">No activity in this category</p>
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className="mt-2 text-sm text-brand-600 hover:text-brand-700"
          >
            View all activity
          </button>
        </div>
      )}

      {/* Load more button */}
      {hasMore && onLoadMore && (
        <div className="px-4 py-3 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLoadMore}
            className="w-full justify-center text-gray-600 hover:text-gray-900"
          >
            <ChevronDownIcon className="w-4 h-4 mr-1" />
            Load More
          </Button>
        </div>
      )}
    </Card>
  );
}

// Re-export types for consumers
export type { FilterCategory };
