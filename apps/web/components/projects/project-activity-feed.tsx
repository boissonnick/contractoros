'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { formatDateTime } from '@/lib/date-utils';

interface Activity {
  id: string;
  description: string;
  userName?: string;
  timestamp: any;
  type?: string;
}

interface ProjectActivityFeedProps {
  projectId: string;
}

export function ProjectActivityFeed({ projectId }: ProjectActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const q = query(
          collection(db, 'projects', projectId, 'activity'),
          orderBy('timestamp', 'desc')
        );
        const snapshot = await getDocs(q);
        setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity)));
      } catch (error) {
        console.error('Error fetching project activity:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [projectId]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-4 shadow h-16" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
        <p className="text-gray-600">Project activity will appear here</p>
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
          <p className="text-xs text-gray-500 mt-1">{formatDateTime(activity.timestamp)}</p>
        </div>
      ))}
    </div>
  );
}
