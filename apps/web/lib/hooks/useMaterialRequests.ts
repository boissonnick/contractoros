"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, Timestamp, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { MaterialRequest } from '@/types';
import { useAuth } from '@/lib/auth';
import { logger } from '@/lib/utils/logger';

export function useMaterialRequests(projectId?: string) {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.orgId) { setLoading(false); return; }

    let q = query(
      collection(db, `organizations/${profile.orgId}/materialRequests`),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    if (projectId) {
      q = query(
        collection(db, `organizations/${profile.orgId}/materialRequests`),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
          updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
          reviewedAt: data.reviewedAt ? (data.reviewedAt as Timestamp).toDate() : undefined,
        } as MaterialRequest;
      });
      setRequests(items);
      setLoading(false);
    }, (err) => {
      logger.error('MaterialRequests listener error', { error: err, hook: 'useMaterialRequests' });
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile?.orgId, projectId]);

  const addRequest = useCallback(async (input: Omit<MaterialRequest, 'id' | 'orgId' | 'createdAt' | 'updatedAt'>) => {
    if (!profile?.orgId) throw new Error('No organization');
    await addDoc(collection(db, `organizations/${profile.orgId}/materialRequests`), {
      ...input,
      orgId: profile.orgId,
      createdAt: Timestamp.now(),
    });
  }, [profile?.orgId]);

  const updateRequest = useCallback(async (id: string, updates: Partial<MaterialRequest>) => {
    if (!profile?.orgId) throw new Error('No organization');
    const data: Record<string, unknown> = { ...updates, updatedAt: Timestamp.now() };
    if (updates.reviewedAt) data.reviewedAt = Timestamp.fromDate(new Date(updates.reviewedAt));
    delete data.id;
    delete data.createdAt;
    await updateDoc(doc(db, `organizations/${profile.orgId}/materialRequests`, id), data);
  }, [profile?.orgId]);

  return { requests, loading, error, addRequest, updateRequest };
}
