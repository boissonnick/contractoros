/**
 * Hook for managing signature requests
 * Provides real-time updates for signature request status
 */

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { SignatureRequest } from '@/lib/esignature/types';

interface UseSignatureRequestsOptions {
  projectId?: string;
  orgId: string;
  status?: SignatureRequest['status'];
}

interface UseSignatureRequestsReturn {
  requests: SignatureRequest[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useSignatureRequests({
  projectId,
  orgId,
  status,
}: UseSignatureRequestsOptions): UseSignatureRequestsReturn {
  const [requests, setRequests] = useState<SignatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Build query
    const constraints = [
      where('orgId', '==', orgId),
      orderBy('createdAt', 'desc'),
    ];

    if (projectId) {
      constraints.unshift(where('projectId', '==', projectId));
    }

    if (status) {
      constraints.push(where('status', '==', status));
    }

    const q = query(collection(db, 'signatureRequests'), ...constraints);

    // Subscribe to real-time updates
    const unsubscribe: Unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore timestamps to dates
          createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
          updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
          expiresAt: doc.data().expiresAt?.toDate?.() || doc.data().expiresAt,
          completedAt: doc.data().completedAt?.toDate?.() || doc.data().completedAt,
        })) as SignatureRequest[];

        setRequests(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching signature requests:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId, projectId, status, refreshKey]);

  return { requests, loading, error, refresh };
}

/**
 * Hook for getting signature request statistics
 */
export function useSignatureStats(orgId: string) {
  const { requests, loading } = useSignatureRequests({ orgId });

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pending' || r.status === 'viewed').length,
    signed: requests.filter((r) => r.status === 'signed').length,
    declined: requests.filter((r) => r.status === 'declined').length,
    expired: requests.filter((r) => r.status === 'expired').length,
  };

  return { stats, loading };
}
