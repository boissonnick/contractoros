'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { usePaginatedActivityLog, PaginatedActivityLogOptions } from '@/lib/hooks/useActivityLog';
import { useProjects } from '@/lib/hooks/useQueryHooks';
import { ActivityLogEntry } from '@/lib/activity';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar, useFilterBar } from '@/components/ui/FilterBar';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import {
  InboxIcon,
  FolderIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  PhotoIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CurrencyDollarIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

// Activity type configuration with icons and labels
const ACTIVITY_TYPE_CONFIG: Record<ActivityLogEntry['type'], {
  label: string;
  icon: typeof FolderIcon;
  color: string;
  bgColor: string;
}> = {
  project: {
    label: 'Projects',
    icon: FolderIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  task: {
    label: 'Tasks',
    icon: ClipboardDocumentCheckIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  scope: {
    label: 'Scope',
    icon: DocumentTextIcon,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  change_order: {
    label: 'Change Orders',
    icon: CurrencyDollarIcon,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  bid: {
    label: 'Bids',
    icon: CurrencyDollarIcon,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  photo: {
    label: 'Photos',
    icon: PhotoIcon,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
  },
  time: {
    label: 'Time Tracking',
    icon: ClockIcon,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
  },
  issue: {
    label: 'Issues',
    icon: ExclamationTriangleIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  user: {
    label: 'Team',
    icon: UserIcon,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
};

// Filter options for activity types
const ACTIVITY_TYPE_OPTIONS = [
  { label: 'All Activity', value: '' },
  { label: 'Projects', value: 'project' },
  { label: 'Tasks', value: 'task' },
  { label: 'Scope', value: 'scope' },
  { label: 'Change Orders', value: 'change_order' },
  { label: 'Bids', value: 'bid' },
  { label: 'Photos', value: 'photo' },
  { label: 'Time Tracking', value: 'time' },
  { label: 'Issues', value: 'issue' },
  { label: 'Team', value: 'user' },
];

// Track read status in local storage
function useReadStatus() {
  const getReadItems = (): Set<string> => {
    if (typeof window === 'undefined') return new Set();
    try {
      const stored = localStorage.getItem('inbox_read_items');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  };

  const [readItems, setReadItems] = useState<Set<string>>(getReadItems);

  const markAsRead = (id: string) => {
    setReadItems((prev) => {
      const next = new Set(prev);
      next.add(id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('inbox_read_items', JSON.stringify(Array.from(next)));
      }
      return next;
    });
  };

  const markAllAsRead = (ids: string[]) => {
    setReadItems((prev) => {
      const next = new Set(Array.from(prev).concat(ids));
      if (typeof window !== 'undefined') {
        localStorage.setItem('inbox_read_items', JSON.stringify(Array.from(next)));
      }
      return next;
    });
  };

  const isRead = (id: string) => readItems.has(id);

  return { markAsRead, markAllAsRead, isRead };
}

// Get navigation URL for activity
function getActivityUrl(activity: ActivityLogEntry): string | null {
  const { type, projectId } = activity;

  if (!projectId) {
    // Non-project activities
    if (type === 'user') return '/dashboard/team';
    return null;
  }

  switch (type) {
    case 'project':
      return `/dashboard/projects/${projectId}`;
    case 'task':
      return `/dashboard/projects/${projectId}/tasks`;
    case 'scope':
      return `/dashboard/projects/${projectId}/scope`;
    case 'change_order':
      return `/dashboard/projects/${projectId}/change-orders`;
    case 'bid':
      return `/dashboard/projects/${projectId}/subs`;
    case 'photo':
      return `/dashboard/projects/${projectId}/photos`;
    case 'time':
      return `/dashboard/projects/${projectId}`;
    case 'issue':
      return `/dashboard/projects/${projectId}/punch-list`;
    default:
      return `/dashboard/projects/${projectId}`;
  }
}

// Activity card component
function ActivityCard({
  activity,
  isRead,
  onMarkRead,
  onNavigate,
}: {
  activity: ActivityLogEntry & { timeAgo: string };
  isRead: boolean;
  onMarkRead: () => void;
  onNavigate: () => void;
}) {
  const config = ACTIVITY_TYPE_CONFIG[activity.type];
  const Icon = config?.icon || FolderIcon;
  const url = getActivityUrl(activity);

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3
        transition-all duration-200 cursor-pointer
        ${isRead ? 'bg-white' : 'bg-blue-50/50 border-l-2 border-blue-500'}
        hover:bg-gray-50
      `}
      onClick={() => {
        onMarkRead();
        if (url) onNavigate();
      }}
    >
      {/* Icon */}
      <div
        className={`
          w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
          ${config?.bgColor || 'bg-gray-100'}
        `}
      >
        <Icon className={`h-5 w-5 ${config?.color || 'text-gray-600'}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${isRead ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
          {activity.message}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-xs text-gray-500">{activity.userName}</span>
          <span className="text-gray-300">·</span>
          <span className="text-xs text-gray-400">{activity.timeAgo}</span>
          {activity.projectName && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-blue-600 flex items-center gap-1">
                <FolderIcon className="h-3 w-3" />
                {activity.projectName}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {!isRead && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead();
            }}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            title="Mark as read"
          >
            <CheckCircleIcon className="h-5 w-5" />
          </button>
        )}
        {url && (
          <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-400" />
        )}
      </div>
    </div>
  );
}

// Loading skeleton
function InboxSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <Skeleton className="h-8 w-12 mb-1" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>

      {/* Filter skeleton */}
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1 max-w-md" rounded="lg" />
        <Skeleton className="h-10 w-32" rounded="lg" />
        <Skeleton className="h-10 w-32" rounded="lg" />
      </div>

      {/* Activity list skeleton */}
      <Card padding="none" className="divide-y divide-gray-100">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3">
            <Skeleton className="h-9 w-9 flex-shrink-0" rounded="lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

export default function ProjectsInboxPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { markAsRead, markAllAsRead, isRead } = useReadStatus();

  // Filter state
  const { search, filters, setSearch, setFilter, clearAll } = useFilterBar({
    initialFilters: { type: '', projectId: '' },
  });

  // Fetch projects for filter dropdown
  const { data: projects = [] } = useProjects();

  // Build activity log options
  const activityOptions: PaginatedActivityLogOptions = useMemo(() => ({
    entityType: filters.type as ActivityLogEntry['type'] | undefined || undefined,
    projectId: filters.projectId || undefined,
    pageSize: 50,
  }), [filters.type, filters.projectId]);

  // Fetch activity log
  const {
    activities,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    initialized,
  } = usePaginatedActivityLog(profile?.orgId, activityOptions);

  // Filter activities by search term
  const filteredActivities = useMemo(() => {
    if (!search) return activities;
    const lowerSearch = search.toLowerCase();
    return activities.filter(
      (a) =>
        a.message.toLowerCase().includes(lowerSearch) ||
        a.userName?.toLowerCase().includes(lowerSearch) ||
        a.projectName?.toLowerCase().includes(lowerSearch)
    );
  }, [activities, search]);

  // Calculate stats
  const stats = useMemo(() => {
    const unreadCount = filteredActivities.filter((a) => !isRead(a.id)).length;
    const todayCount = filteredActivities.filter((a) => {
      const today = new Date();
      const activityDate = new Date(a.timestamp);
      return (
        activityDate.getDate() === today.getDate() &&
        activityDate.getMonth() === today.getMonth() &&
        activityDate.getFullYear() === today.getFullYear()
      );
    }).length;

    // Count by type
    const typeCount = filteredActivities.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostActiveType = Object.entries(typeCount).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0] as ActivityLogEntry['type'] | undefined;

    return { unreadCount, todayCount, mostActiveType, total: filteredActivities.length };
  }, [filteredActivities, isRead]);

  // Project filter options
  const projectOptions = useMemo(
    () => [
      { label: 'All Projects', value: '' },
      ...(projects as Array<{ id: string; name?: string }>).map((p) => ({
        label: p.name || 'Unnamed Project',
        value: p.id,
      })),
    ],
    [projects]
  );

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    const ids = filteredActivities.map((a) => a.id);
    markAllAsRead(ids);
  };

  // Initial loading state
  if (!initialized && loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Project Inbox"
          description="Activity and updates across all projects"
        />
        <InboxSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Inbox"
        description="Activity and updates across all projects"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={loading}
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {stats.unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
            )}
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <InboxIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{stats.unreadCount}</p>
              <p className="text-xs text-gray-500">Unread</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <ClockIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{stats.todayCount}</p>
              <p className="text-xs text-gray-500">Today</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <FolderIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{projects.length}</p>
              <p className="text-xs text-gray-500">Projects</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <FunnelIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{stats.total}</p>
              <p className="text-xs text-gray-500">
                {filters.type || filters.projectId ? 'Filtered' : 'Total'} Activity
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <FilterBar
        searchPlaceholder="Search activity..."
        searchValue={search}
        onSearch={setSearch}
        filters={[
          {
            key: 'type',
            label: 'Activity Type',
            options: ACTIVITY_TYPE_OPTIONS,
            width: 'w-36 sm:w-44',
          },
          {
            key: 'projectId',
            label: 'Project',
            options: projectOptions,
            width: 'w-36 sm:w-52',
          },
        ]}
        filterValues={filters}
        onFilterChange={setFilter}
        onClearFilters={clearAll}
      />

      {/* Error state */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <div className="flex items-center gap-3 text-red-700">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      )}

      {/* Activity list */}
      {filteredActivities.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={<InboxIcon className="h-full w-full" />}
            title={search || filters.type || filters.projectId ? 'No matching activity' : 'No activity yet'}
            description={
              search || filters.type || filters.projectId
                ? 'Try adjusting your search or filters to see more results.'
                : 'Activity will appear here as your team works on projects. Try creating a project or updating tasks.'
            }
            className="py-16"
            action={
              search || filters.type || filters.projectId
                ? { label: 'Clear Filters', onClick: clearAll }
                : { label: 'Go to Projects', href: '/dashboard/projects' }
            }
          />
        </Card>
      ) : (
        <>
          <Card padding="none" className="divide-y divide-gray-100 overflow-hidden">
            {filteredActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                isRead={isRead(activity.id)}
                onMarkRead={() => markAsRead(activity.id)}
                onNavigate={() => {
                  const url = getActivityUrl(activity);
                  if (url) router.push(url);
                }}
              />
            ))}
          </Card>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More Activity'
                )}
              </Button>
            </div>
          )}

          {/* Results info */}
          <p className="text-center text-sm text-gray-500">
            Showing {filteredActivities.length} activities
            {hasMore && ' · More available'}
          </p>
        </>
      )}
    </div>
  );
}
