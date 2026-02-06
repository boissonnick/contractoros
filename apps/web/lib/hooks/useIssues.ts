"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Issue } from '@/types';
import { useAuth } from '@/lib/auth';
import { logger } from '@/lib/utils/logger';

export function useIssues(projectId?: string) {
  const { profile } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.orgId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
      setLoading(false);
      return;
    }

    let q = query(
      collection(db, `organizations/${profile.orgId}/issues`),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    if (projectId) {
      q = query(
        collection(db, `organizations/${profile.orgId}/issues`),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            createdAt: data.createdAt
              ? (data.createdAt as Timestamp).toDate()
              : new Date(),
            updatedAt: data.updatedAt
              ? (data.updatedAt as Timestamp).toDate()
              : undefined,
            resolvedAt: data.resolvedAt
              ? (data.resolvedAt as Timestamp).toDate()
              : undefined,
          } as Issue;
        });
        setIssues(items);
        setLoading(false);
      },
      (err) => {
        logger.error('Issues listener error', { error: err, hook: 'useIssues' });
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [profile?.orgId, projectId]);

  const addIssue = useCallback(
    async (input: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!profile?.orgId) throw new Error('No organization');
      await addDoc(
        collection(db, `organizations/${profile.orgId}/issues`),
        {
          ...input,
          createdAt: Timestamp.now(),
        }
      );
    },
    [profile?.orgId]
  );

  const updateIssue = useCallback(
    async (id: string, updates: Partial<Issue>) => {
      if (!profile?.orgId) throw new Error('No organization');
      const data: Record<string, unknown> = {
        ...updates,
        updatedAt: Timestamp.now(),
      };
      if (updates.resolvedAt) {
        data.resolvedAt = Timestamp.fromDate(new Date(updates.resolvedAt));
      }
      delete data.id;
      delete data.createdAt;
      await updateDoc(
        doc(db, `organizations/${profile.orgId}/issues`, id),
        data
      );
    },
    [profile?.orgId]
  );

  return { issues, loading, error, addIssue, updateIssue };
}
