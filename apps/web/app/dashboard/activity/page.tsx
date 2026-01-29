'use client';

import Link from 'next/link';
import { ActivityFeed } from '@/components/activity/activity-feed';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function ActivityPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Back to Dashboard"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Feed</h1>
          <p className="text-sm text-gray-500 mt-0.5">View all activity across your organization</p>
        </div>
      </div>
      <ActivityFeed />
    </div>
  );
}
