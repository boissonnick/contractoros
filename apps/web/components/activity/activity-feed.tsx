'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import { formatDateTime } from '@/lib/date-utils';

interface Activity {
  id: string;
  description: string;
  userName?: string;
  timestamp: any;
  type?: string;
  projectId?: string;
  projectName?: string;
}

export function ActivityFeed() {
  const { profile } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.orgId) {
      setLoading(false);
      return;
    }

    const fetchActivity = async () => {
      try {
        const q = query(
          collection(db, 'activity'),
          where('organizationId', '==', profile.orgId),
          orderBy('timestamp', 'desc'),
          limit(50)
        );
        const snapshot = await getDocs(q);
        setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity)));
      } catch (error) {
        console.error('Error fetching activity:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [profile?.orgId]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-4 shadow h-20" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
        <p className="text-gray-600">Activity will appear as you work on projects</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map(activity => (
        <div key={activity.id} className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm">
            {activity.userName && <span className="font-semibold">{activity.userName} </span>}
            {activity.description}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-gray-500">{formatDateTime(activity.timestamp)}</p>
            {activity.projectName && (
              <span className="text-xs text-blue-600">{activity.projectName}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
