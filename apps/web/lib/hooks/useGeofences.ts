"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Geofence } from '@/types';
import { useAuth } from '@/lib/auth';

function fromFirestore(id: string, data: Record<string, unknown>): Geofence {
  return {
    id,
    projectId: data.projectId as string,
    orgId: data.orgId as string,
    name: data.name as string,
    center: data.center as { lat: number; lng: number },
    radiusMeters: (data.radiusMeters as number) || 100,
    isActive: data.isActive !== false,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
  };
}

export function useGeofences(orgId?: string) {
  const { profile } = useAuth();
  const targetOrgId = orgId || profile?.orgId;
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetOrgId) return;
    const q = query(collection(db, 'geofences'), where('orgId', '==', targetOrgId));
    const unsub = onSnapshot(q, (snap) => {
      setGeofences(snap.docs.map(d => fromFirestore(d.id, d.data() as Record<string, unknown>)));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [targetOrgId]);

  const createGeofence = useCallback(async (data: Omit<Geofence, 'id' | 'orgId' | 'createdAt'>) => {
    if (!targetOrgId) throw new Error('No organization');
    await addDoc(collection(db, 'geofences'), {
      ...data,
      orgId: targetOrgId,
      createdAt: Timestamp.now()
    });
  }, [targetOrgId]);

  const updateGeofence = useCallback(async (id: string, data: Partial<Geofence>) => {
    const update = { ...data } as Record<string, unknown>;
    delete update.id;
    delete update.createdAt;
    await updateDoc(doc(db, 'geofences', id), update);
  }, []);

  const deleteGeofence = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'geofences', id));
  }, []);

  return { geofences, loading, createGeofence, updateGeofence, deleteGeofence };
}
