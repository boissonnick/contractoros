/**
 * Generic Firestore Collection Hook
 *
 * Provides a reusable pattern for real-time Firestore subscriptions.
 * Eliminates duplicate query/subscription logic across hooks.
 *
 * @example
 * // Basic usage
 * const { items, loading, error } = useFirestoreCollection<Client>({
 *   path: `organizations/${orgId}/clients`,
 *   constraints: [where('status', '==', 'active'), orderBy('createdAt', 'desc')],
 *   converter: (id, data) => ({ id, ...convertTimestamps(data, DATE_FIELDS.client) } as Client),
 *   enabled: !!orgId,
 * });
 *
 * @example
 * // With filtering
 * const { items: activeClients } = useFirestoreCollection<Client>({
 *   path: `organizations/${orgId}/clients`,
 *   constraints: useMemo(() => [
 *     where('status', '==', filter),
 *     orderBy('name', 'asc'),
 *   ], [filter]),
 *   converter: clientConverter,
 *   enabled: !!orgId,
 * });
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  query,
  onSnapshot,
  QueryConstraint,
  DocumentData,
  Query,
  QuerySnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { logger } from '@/lib/utils/logger';

export interface UseFirestoreCollectionOptions<T> {
  /**
   * Firestore collection path (e.g., 'organizations/abc/clients')
   */
  path: string;

  /**
   * Query constraints (where, orderBy, limit, etc.)
   * Wrap in useMemo if constraints depend on state to prevent infinite loops.
   */
  constraints?: QueryConstraint[];

  /**
   * Converter function to transform Firestore data to your type.
   * Should handle timestamp conversion.
   */
  converter: (id: string, data: DocumentData) => T;

  /**
   * Whether to enable the subscription. Set to false to skip query.
   * Useful for conditional fetching (e.g., wait for orgId).
   */
  enabled?: boolean;

  /**
   * Optional callback when data changes
   */
  onData?: (items: T[]) => void;

  /**
   * Optional callback when error occurs
   */
  onError?: (error: Error) => void;
}

export interface UseFirestoreCollectionResult<T> {
  /**
   * The fetched items
   */
  items: T[];

  /**
   * Loading state (true during initial fetch)
   */
  loading: boolean;

  /**
   * Error if subscription failed
   */
  error: Error | null;

  /**
   * Whether data has been fetched at least once
   */
  initialized: boolean;

  /**
   * Force re-subscribe (useful after write operations)
   */
  refetch: () => void;

  /**
   * Total count of items (same as items.length, for convenience)
   */
  count: number;
}

export function useFirestoreCollection<T>({
  path,
  constraints = [],
  converter,
  enabled = true,
  onData,
  onError,
}: UseFirestoreCollectionOptions<T>): UseFirestoreCollectionResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Memoize constraints string for dependency comparison
  const constraintsKey = useMemo(
    () => JSON.stringify(constraints.map(c => c.toString())),
    [constraints]
  );

  const refetch = useCallback(() => {
    setRefetchTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    // Skip if disabled
    if (!enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
      setLoading(false);
      setItems([]);
      return;
    }

    // Validate path
    if (!path || path.includes('undefined') || path.includes('null')) {
      setLoading(false);
      setError(new Error(`Invalid collection path: ${path}`));
      return;
    }

    setLoading(true);
    setError(null);

    let q: Query;
    try {
      q = constraints.length > 0
        ? query(collection(db, path), ...constraints)
        : query(collection(db, path));
    } catch (err) {
      logger.error(`Error building query for ${path}`, { error: err, hook: 'useFirestoreCollection' });
      setError(err as Error);
      setLoading(false);
      return;
    }

    const handleSnapshot = (snapshot: QuerySnapshot) => {
      try {
        const data = snapshot.docs.map(doc => converter(doc.id, doc.data()));
        setItems(data);
        setInitialized(true);
        setLoading(false);
        setError(null);
        onData?.(data);
      } catch (err) {
        logger.error(`Error converting data for ${path}`, { error: err, hook: 'useFirestoreCollection' });
        setError(err as Error);
        setLoading(false);
        onError?.(err as Error);
      }
    };

    const handleError = (err: Error) => {
      logger.error(`Error fetching ${path}`, { error: err, hook: 'useFirestoreCollection' });
      setError(err);
      setLoading(false);
      onError?.(err);
    };

    const unsubscribe = onSnapshot(q, handleSnapshot, handleError);

    return () => unsubscribe();
  }, [path, constraintsKey, constraints, enabled, refetchTrigger, converter, onData, onError]);

  return {
    items,
    loading,
    error,
    initialized,
    refetch,
    count: items.length,
  };
}

/**
 * Helper to create a stable converter function.
 * Use this to avoid re-creating converters on every render.
 *
 * @example
 * const clientConverter = createConverter<Client>(
 *   (id, data) => ({ id, ...convertTimestamps(data, DATE_FIELDS.client) } as Client)
 * );
 */
export function createConverter<T>(
  converter: (id: string, data: DocumentData) => T
): (id: string, data: DocumentData) => T {
  return converter;
}

export default useFirestoreCollection;
