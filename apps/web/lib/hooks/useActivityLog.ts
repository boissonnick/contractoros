"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ActivityLogEntry } from '@/lib/activity';

function fromFirestore(id: string, data: Record<string, unknown>): ActivityLogEntry {
  return {
    id,
    orgId: data.orgId as string,
    type: data.type as ActivityLogEntry['type'],
    message: data.message as string,
    userId: data.userId as string,
    userName: data.userName as string,
    projectId: data.projectId as string | undefined,
    projectName: data.projectName as string | undefined,
    timestamp: data.timestamp ? (data.timestamp as Timestamp).toDate() : new Date(),
  };
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function useActivityLog(orgId: string | undefined, maxItems = 20) {
  const [activities, setActivities] = useState<(ActivityLogEntry & { timeAgo: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) { setLoading(false); return; }

    const q = query(
      collection(db, 'activityLog'),
      where('orgId', '==', orgId),
      orderBy('timestamp', 'desc'),
      limit(maxItems)
    );

    const unsub = onSnapshot(q, (snap) => {
      setActivities(snap.docs.map(d => {
        const entry = fromFirestore(d.id, d.data());
        return { ...entry, timeAgo: timeAgo(entry.timestamp) };
      }));
      setLoading(false);
    }, (err) => {
      console.error('useActivityLog error:', err);
      setLoading(false);
    });

    return unsub;
  }, [orgId, maxItems]);

  return { activities, loading };
}
