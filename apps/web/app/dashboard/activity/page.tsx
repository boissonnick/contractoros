import { ActivityFeed } from '@/components/activity/activity-feed';

export default function ActivityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Activity Feed</h1>
        <p className="text-gray-600 mt-1">View all activity across your organization</p>
      </div>
      <ActivityFeed />
    </div>
  );
}
