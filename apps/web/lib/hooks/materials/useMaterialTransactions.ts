'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import { MaterialTransaction } from '@/types';
import { convertTimestamp } from './utils';

// ============================================
// Material Transactions Hook
// ============================================

export function useMaterialTransactions(materialId?: string, projectId?: string) {
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState<MaterialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const orgId = profile?.orgId;

  useEffect(() => {
    if (!orgId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const transactionsRef = collection(db, 'organizations', orgId, 'materialTransactions');
    let q = query(transactionsRef, orderBy('transactionDate', 'desc'), limit(100));

    if (materialId) {
      q = query(
        transactionsRef,
        where('materialId', '==', materialId),
        orderBy('transactionDate', 'desc'),
        limit(100)
      );
    } else if (projectId) {
      q = query(
        transactionsRef,
        where('projectId', '==', projectId),
        orderBy('transactionDate', 'desc'),
        limit(100)
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          transactionDate: convertTimestamp(doc.data().transactionDate),
        })) as MaterialTransaction[];

        setTransactions(items);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching transactions:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId, materialId, projectId]);

  return {
    transactions,
    loading,
    error,
  };
}
