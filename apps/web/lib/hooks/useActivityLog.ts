"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  getDocs,
  startAfter,
  DocumentSnapshot,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ActivityLogEntry } from '@/lib/activity';

function fromFirestore(id: string, data: Record<string, unknown>): ActivityLogEntry {
  return {
    id,
    orgId: data.orgId as string,
    type: data.type as ActivityLogEntry['type'],
    message: data.message as string,
    userId: data.userId as string,
    userName: data.userName as string,
    projectId: data.projectId as string | undefined,
    projectName: data.projectName as string | undefined,
    timestamp: data.timestamp ? (data.timestamp as Timestamp).toDate() : new Date(),
  };
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Real-time activity log hook (original, for backward compatibility).
 * Uses Firestore onSnapshot for real-time updates.
 * Best for dashboards showing recent activity.
 */
export function useActivityLog(orgId: string | undefined, maxItems = 20) {
  const [activities, setActivities] = useState<(ActivityLogEntry & { timeAgo: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
    if (!orgId) { setLoading(false); return; }

    const q = query(
      collection(db, 'activityLog'),
      where('orgId', '==', orgId),
      orderBy('timestamp', 'desc'),
      limit(maxItems)
    );

    const unsub = onSnapshot(q, (snap) => {
      setActivities(snap.docs.map(d => {
        const entry = fromFirestore(d.id, d.data());
        return { ...entry, timeAgo: timeAgo(entry.timestamp) };
      }));
      setLoading(false);
    }, (err) => {
      // Fail silently for missing index - activity log is not critical
      // Index can be deployed with: firebase deploy --only firestore:indexes
      if (err.message?.includes('requires an index')) {
        console.warn('useActivityLog: Missing Firestore index for activityLog collection. Deploy indexes with: firebase deploy --only firestore:indexes');
      } else {
        console.error('useActivityLog error:', err);
      }
      setActivities([]);
      setLoading(false);
    });

    return unsub;
  }, [orgId, maxItems]);

  return { activities, loading };
}

/**
 * Options for paginated activity log
 */
export interface PaginatedActivityLogOptions {
  /** Filter by project ID */
  projectId?: string;
  /** Filter by user ID */
  userId?: string;
  /** Filter by activity type */
  entityType?: ActivityLogEntry['type'];
  /** Number of items per page (default: 100) */
  pageSize?: number;
}

/**
 * Result from paginated activity log hook
 */
export interface PaginatedActivityLogResult {
  /** Current page of activities with timeAgo */
  activities: (ActivityLogEntry & { timeAgo: string })[];
  /** Loading state */
  loading: boolean;
  /** Error message if query failed */
  error: string | null;
  /** Whether there are more items to load */
  hasMore: boolean;
  /** Load the next page of activities */
  loadMore: () => Promise<void>;
  /** Refresh data (reset to page 1) */
  refresh: () => Promise<void>;
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of items currently loaded */
  totalLoaded: number;
  /** Whether the hook has been initialized */
  initialized: boolean;
}

/**
 * Paginated activity log hook for browsing historical activity.
 *
 * Unlike useActivityLog which uses real-time snapshots, this hook uses
 * cursor-based pagination for efficient browsing of large activity logs.
 *
 * Activity logs are stored at the top-level 'activityLog' collection with
 * an orgId field for filtering (not org-scoped subcollections).
 *
 * @example
 * // Basic usage
 * const {
 *   activities,
 *   loading,
 *   hasMore,
 *   loadMore,
 *   refresh
 * } = usePaginatedActivityLog(orgId);
 *
 * @example
 * // With filters
 * const { activities } = usePaginatedActivityLog(orgId, {
 *   projectId: 'project123',
 *   entityType: 'task',
 *   pageSize: 50,
 * });
 */
export function usePaginatedActivityLog(
  orgId: string | undefined,
  options: PaginatedActivityLogOptions = {}
): PaginatedActivityLogResult {
  const {
    projectId,
    userId,
    entityType,
    pageSize = 100,
  } = options;

  // State
  const [activities, setActivities] = useState<(ActivityLogEntry & { timeAgo: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [initialized, setInitialized] = useState(false);

  // Refs for cursor tracking
  const lastDocRef = useRef<DocumentSnapshot | null>(null);
  const fetchInProgressRef = useRef(false);
  const allActivitiesRef = useRef<(ActivityLogEntry & { timeAgo: string })[]>([]);

  // Memoize filter key to track when filters change
  const filterKey = useMemo(
    () => JSON.stringify({ projectId, userId, entityType, pageSize }),
    [projectId, userId, entityType, pageSize]
  );

  /**
   * Build query constraints based on options
   */
  const buildConstraints = useCallback((): QueryConstraint[] => {
    const constraints: QueryConstraint[] = [
      where('orgId', '==', orgId),
    ];

    if (projectId) {
      constraints.push(where('projectId', '==', projectId));
    }

    if (userId) {
      constraints.push(where('userId', '==', userId));
    }

    if (entityType) {
      constraints.push(where('type', '==', entityType));
    }

    // Always order by timestamp descending (newest first)
    constraints.push(orderBy('timestamp', 'desc'));

    return constraints;
  }, [orgId, projectId, userId, entityType]);

  /**
   * Fetch a page of activities
   */
  const fetchPage = useCallback(
    async (isInitial: boolean = false) => {
      if (!orgId || fetchInProgressRef.current) {
        return;
      }

      fetchInProgressRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const constraints = buildConstraints();

        // Add pagination cursor if not initial fetch
        if (!isInitial && lastDocRef.current) {
          constraints.push(startAfter(lastDocRef.current));
        }

        // Fetch one extra to check if there are more
        constraints.push(limit(pageSize + 1));

        const q = query(collection(db, 'activityLog'), ...constraints);
        const snapshot = await getDocs(q);
        const docs = snapshot.docs;

        // Determine if there are more pages
        const hasMoreItems = docs.length > pageSize;
        const pageData = hasMoreItems ? docs.slice(0, pageSize) : docs;

        // Convert documents to typed items
        const convertedItems = pageData.map((doc) => {
          const entry = fromFirestore(doc.id, doc.data());
          return { ...entry, timeAgo: timeAgo(entry.timestamp) };
        });

        // Update cursor for next page
        if (pageData.length > 0) {
          lastDocRef.current = pageData[pageData.length - 1];
        }

        if (isInitial) {
          // Reset for initial fetch
          allActivitiesRef.current = convertedItems;
          setCurrentPage(1);
        } else {
          // Append for load more
          allActivitiesRef.current = [...allActivitiesRef.current, ...convertedItems];
          setCurrentPage((prev) => prev + 1);
        }

        setActivities(allActivitiesRef.current);
        setHasMore(hasMoreItems);
        setInitialized(true);
      } catch (err) {
        console.error('usePaginatedActivityLog error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch activity log';

        // Check for missing index error
        if (errorMessage.includes('requires an index')) {
          setError('Missing Firestore index for activity log query. Deploy indexes with: firebase deploy --only firestore:indexes');
          console.warn('usePaginatedActivityLog: Missing Firestore index for activityLog collection.');
        } else {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
        fetchInProgressRef.current = false;
      }
    },
    [orgId, buildConstraints, pageSize]
  );

  // Initial fetch when dependencies change
  useEffect(() => {
    if (!orgId) {
      setActivities([]);
      setInitialized(false);
      return;
    }

    // Reset state when filters change
    lastDocRef.current = null;
    allActivitiesRef.current = [];
    setCurrentPage(1);
    setHasMore(true);
    fetchPage(true);
  }, [orgId, filterKey]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Load the next page of activities
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchPage(false);
  }, [hasMore, loading, fetchPage]);

  /**
   * Refresh data (reset to page 1)
   */
  const refresh = useCallback(async () => {
    lastDocRef.current = null;
    allActivitiesRef.current = [];
    setCurrentPage(1);
    setHasMore(true);
    await fetchPage(true);
  }, [fetchPage]);

  return {
    activities,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    currentPage,
    totalLoaded: activities.length,
    initialized,
  };
}
