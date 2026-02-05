'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import { StorageLocation } from '@/types';
import { convertTimestamp } from './utils';

// ============================================
// Storage Locations Hook
// ============================================

export function useStorageLocations() {
  const { profile } = useAuth();
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const orgId = profile?.orgId;

  useEffect(() => {
    if (!orgId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
      setLocations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const locationsRef = collection(db, 'organizations', orgId, 'storageLocations');
    const q = query(locationsRef, where('isActive', '==', true), orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: convertTimestamp(doc.data().createdAt),
        })) as StorageLocation[];

        setLocations(items);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching locations:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId]);

  const createLocation = useCallback(
    async (data: Omit<StorageLocation, 'id' | 'orgId' | 'createdAt' | 'createdBy'>) => {
      if (!orgId || !profile?.uid) throw new Error('Not authenticated');

      const locationsRef = collection(db, 'organizations', orgId, 'storageLocations');
      const docRef = await addDoc(locationsRef, {
        ...data,
        orgId,
        isActive: true,
        createdAt: serverTimestamp(),
        createdBy: profile.uid,
      });

      return docRef.id;
    },
    [orgId, profile?.uid]
  );

  const updateLocation = useCallback(
    async (id: string, data: Partial<StorageLocation>) => {
      if (!orgId) throw new Error('Not authenticated');

      const locationRef = doc(db, 'organizations', orgId, 'storageLocations', id);
      await updateDoc(locationRef, data);
    },
    [orgId]
  );

  return {
    locations,
    loading,
    error,
    createLocation,
    updateLocation,
  };
}
