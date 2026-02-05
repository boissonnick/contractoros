"use client";

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  limit as firestoreLimit,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { TaskActivity, TaskActivityAction } from '@/types';

function fromFirestore(id: string, data: Record<string, unknown>): TaskActivity {
  return {
    id,
    taskId: data.taskId as string,
    userId: data.userId as string,
    userName: data.userName as string,
    action: data.action as TaskActivityAction,
    changes: data.changes as Record<string, { from: unknown; to: unknown }> | undefined,
    metadata: data.metadata as Record<string, unknown> | undefined,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
  };
}

export interface UseTaskActivityReturn {
  activities: TaskActivity[];
  loading: boolean;
  error: string | null;
}

export function useTaskActivity(taskId: string | null, limit = 50): UseTaskActivityReturn {
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
      setActivities([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'tasks', taskId, 'activity'),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const result: TaskActivity[] = [];
        snapshot.forEach((docSnap) => {
          result.push(fromFirestore(docSnap.id, docSnap.data()));
        });
        setActivities(result);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Task activity listener error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [taskId, limit]);

  return { activities, loading, error };
}
