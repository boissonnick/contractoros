'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import { LowStockAlert } from '@/types';
import { convertTimestamp } from './utils';

// ============================================
// Low Stock Alerts Hook
// ============================================

export function useLowStockAlerts() {
  const { profile } = useAuth();
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const orgId = profile?.orgId;

  useEffect(() => {
    if (!orgId) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const alertsRef = collection(db, 'organizations', orgId, 'lowStockAlerts');
    const q = query(
      alertsRef,
      where('status', 'in', ['active', 'acknowledged']),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: convertTimestamp(doc.data().createdAt),
          acknowledgedAt: convertTimestamp(doc.data().acknowledgedAt),
          resolvedAt: convertTimestamp(doc.data().resolvedAt),
        })) as LowStockAlert[];

        setAlerts(items);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching alerts:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId]);

  const acknowledgeAlert = useCallback(
    async (id: string) => {
      if (!orgId || !profile?.uid) throw new Error('Not authenticated');

      const alertRef = doc(db, 'organizations', orgId, 'lowStockAlerts', id);
      await updateDoc(alertRef, {
        status: 'acknowledged',
        acknowledgedBy: profile.uid,
        acknowledgedAt: serverTimestamp(),
      });
    },
    [orgId, profile?.uid]
  );

  const resolveAlert = useCallback(
    async (id: string, purchaseOrderId?: string) => {
      if (!orgId) throw new Error('Not authenticated');

      const alertRef = doc(db, 'organizations', orgId, 'lowStockAlerts', id);
      await updateDoc(alertRef, {
        status: purchaseOrderId ? 'ordered' : 'resolved',
        purchaseOrderId,
        resolvedAt: serverTimestamp(),
      });
    },
    [orgId]
  );

  return {
    alerts,
    loading,
    error,
    acknowledgeAlert,
    resolveAlert,
  };
}
