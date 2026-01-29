'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useActivityLog } from '@/lib/hooks/useActivityLog';
import { Card, EmptyState } from '@/components/ui';
import { ClockIcon, FolderIcon } from '@heroicons/react/24/outline';

export function ActivityFeed() {
  const { profile } = useAuth();
  const { activities, loading } = useActivityLog(profile?.orgId, 50);

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-4 border border-gray-100 h-16" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="p-0">
        <EmptyState
          icon={<ClockIcon className="h-full w-full" />}
          title="No activity yet"
          description="Activity will appear as you and your team work on projects. Try creating a project or updating task status."
          className="py-12"
          action={{ label: 'Go to Projects', href: '/dashboard/projects' }}
        />
      </Card>
    );
  }

  return (
    <Card className="p-0 divide-y divide-gray-100">
      {activities.map(activity => (
        <div
          key={activity.id}
          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
            {activity.userName?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">{activity.message}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500">{activity.userName}</span>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-400">{activity.timeAgo}</span>
              {activity.projectName && (
                <>
                  <span className="text-gray-300">·</span>
                  <Link
                    href={`/dashboard/projects/${activity.projectId}`}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FolderIcon className="h-3 w-3" />
                    {activity.projectName}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </Card>
  );
}
