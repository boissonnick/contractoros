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
import { Supplier } from '@/types';
import { convertTimestamp } from './utils';

// ============================================
// Suppliers Hook
// ============================================

export function useSuppliers() {
  const { profile } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const orgId = profile?.orgId;

  useEffect(() => {
    if (!orgId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
      setSuppliers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const suppliersRef = collection(db, 'organizations', orgId, 'suppliers');
    const q = query(suppliersRef, where('isActive', '==', true), orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: convertTimestamp(doc.data().createdAt),
          updatedAt: convertTimestamp(doc.data().updatedAt),
        })) as Supplier[];

        setSuppliers(items);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching suppliers:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId]);

  const createSupplier = useCallback(
    async (data: Omit<Supplier, 'id' | 'orgId' | 'createdAt' | 'createdBy'>) => {
      if (!orgId || !profile?.uid) throw new Error('Not authenticated');

      const suppliersRef = collection(db, 'organizations', orgId, 'suppliers');
      const docRef = await addDoc(suppliersRef, {
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

  const updateSupplier = useCallback(
    async (id: string, data: Partial<Supplier>) => {
      if (!orgId) throw new Error('Not authenticated');

      const supplierRef = doc(db, 'organizations', orgId, 'suppliers', id);
      await updateDoc(supplierRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    },
    [orgId]
  );

  const deleteSupplier = useCallback(
    async (id: string) => {
      if (!orgId) throw new Error('Not authenticated');

      // Soft delete
      const supplierRef = doc(db, 'organizations', orgId, 'suppliers', id);
      await updateDoc(supplierRef, {
        isActive: false,
        updatedAt: serverTimestamp(),
      });
    },
    [orgId]
  );

  return {
    suppliers,
    loading,
    error,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  };
}
