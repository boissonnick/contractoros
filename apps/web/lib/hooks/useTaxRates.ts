"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { TaxRate } from '@/types';
import { useAuth } from '@/lib/auth';

export function useTaxRates() {
  const { profile } = useAuth();
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.orgId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'taxRates'),
      where('orgId', '==', profile.orgId),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rates = snapshot.docs.map((d) => ({
        id: d.id,
        orgId: d.data().orgId as string,
        name: d.data().name as string,
        rate: d.data().rate as number,
        description: d.data().description as string | undefined,
        isDefault: d.data().isDefault as boolean,
        isActive: d.data().isActive as boolean,
        appliesTo: d.data().appliesTo as ('estimates' | 'invoices')[],
        createdAt: d.data().createdAt ? (d.data().createdAt as Timestamp).toDate() : new Date(),
        updatedAt: d.data().updatedAt ? (d.data().updatedAt as Timestamp).toDate() : undefined,
      }));
      setTaxRates(rates.sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile?.orgId]);

  const addTaxRate = useCallback(
    async (input: { name: string; rate: number; description?: string; appliesTo: ('estimates' | 'invoices')[] }) => {
      if (!profile?.orgId) throw new Error('No organization');
      await addDoc(collection(db, 'taxRates'), {
        orgId: profile.orgId,
        name: input.name,
        rate: input.rate,
        description: input.description || '',
        isDefault: taxRates.length === 0,
        isActive: true,
        appliesTo: input.appliesTo,
        createdAt: Timestamp.now(),
      });
    },
    [profile, taxRates.length]
  );

  const updateTaxRate = useCallback(
    async (id: string, updates: Partial<TaxRate>) => {
      const data: Record<string, unknown> = { ...updates, updatedAt: Timestamp.now() };
      delete data.id;
      delete data.orgId;
      delete data.createdAt;
      await updateDoc(doc(db, 'taxRates', id), data);
    },
    []
  );

  const deleteTaxRate = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'taxRates', id));
  }, []);

  const setDefault = useCallback(
    async (id: string) => {
      // Unset current defaults
      for (const rate of taxRates) {
        if (rate.isDefault && rate.id !== id) {
          await updateDoc(doc(db, 'taxRates', rate.id), { isDefault: false, updatedAt: Timestamp.now() });
        }
      }
      await updateDoc(doc(db, 'taxRates', id), { isDefault: true, updatedAt: Timestamp.now() });
    },
    [taxRates]
  );

  return { taxRates, loading, addTaxRate, updateTaxRate, deleteTaxRate, setDefault };
}
