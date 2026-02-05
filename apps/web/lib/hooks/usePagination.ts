/**
 * Generic Pagination Hook for Firestore Queries
 *
 * Provides cursor-based pagination for any org-scoped Firestore collection.
 * Uses Firestore best practices with startAfter/endBefore for efficient pagination.
 *
 * Features:
 * - Cursor-based pagination (Firestore best practice)
 * - Configurable page size
 * - Tracks hasMore and hasPrevious states
 * - Caches pages for efficient back navigation
 * - Works with any org-scoped collection
 * - Supports custom filters and ordering
 *
 * @example
 * // Basic usage
 * const {
 *   items,
 *   loading,
 *   hasMore,
 *   loadMore,
 *   refresh
 * } = usePagination<Client>(orgId, 'clients', {
 *   pageSize: 25,
 *   orderByField: 'createdAt',
 *   orderDirection: 'desc',
 * });
 *
 * @example
 * // With filters
 * const { items } = usePagination<Task>(orgId, 'tasks', {
 *   filters: [where('status', '==', 'active')],
 *   orderByField: 'dueDate',
 *   orderDirection: 'asc',
 * });
 *
 * @example
 * // With custom converter
 * const { items } = usePagination<Expense>(orgId, 'expenses', {
 *   converter: (id, data) => ({
 *     id,
 *     ...convertTimestamps(data, DATE_FIELDS.expense),
 *   } as Expense),
 * });
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  endBefore,
  limitToLast,
  getDocs,
  QueryConstraint,
  DocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { convertTimestamps } from '@/lib/firebase/timestamp-converter';

/**
 * Options for configuring the pagination hook
 */
export interface UsePaginationOptions<T> {
  /**
   * Number of items per page (default: 25)
   */
  pageSize?: number;

  /**
   * Field to order by (default: 'createdAt')
   */
  orderByField?: string;

  /**
   * Sort direction (default: 'desc')
   */
  orderDirection?: 'asc' | 'desc';

  /**
   * Additional query constraints (where clauses, etc.)
   * Wrap in useMemo if constraints depend on state to prevent infinite loops.
   */
  filters?: QueryConstraint[];

  /**
   * Whether to enable the query (default: true)
   * Set to false to skip query (e.g., while waiting for orgId)
   */
  enabled?: boolean;

  /**
   * Custom converter function to transform Firestore data to your type.
   * Should handle timestamp conversion.
   * If not provided, uses basic conversion with generic date fields.
   */
  converter?: (id: string, data: DocumentData) => T;

  /**
   * Date fields to convert from Firestore Timestamps to Dates.
   * Used by the default converter if no custom converter is provided.
   * Default: ['createdAt', 'updatedAt']
   */
  dateFields?: readonly string[];
}

/**
 * Result returned by the pagination hook
 */
export interface UsePaginationResult<T> {
  /**
   * Current page of items
   */
  items: T[];

  /**
   * Loading state (true during fetch operations)
   */
  loading: boolean;

  /**
   * Error if query failed
   */
  error: Error | null;

  /**
   * Whether there are more items to load
   */
  hasMore: boolean;

  /**
   * Whether there are previous items (current page > 1)
   */
  hasPrevious: boolean;

  /**
   * Load the next page of items
   */
  loadMore: () => Promise<void>;

  /**
   * Load the previous page of items
   */
  loadPrevious: () => Promise<void>;

  /**
   * Refresh data (resets to page 1 and clears cache)
   */
  refresh: () => Promise<void>;

  /**
   * Current page number (1-indexed)
   */
  currentPage: number;

  /**
   * Total number of items loaded in the current page
   */
  totalLoaded: number;

  /**
   * Current page size
   */
  pageSize: number;

  /**
   * Update the page size (resets to page 1)
   */
  setPageSize: (size: number) => void;

  /**
   * Whether the hook has been initialized (first fetch completed)
   */
  initialized: boolean;
}

/**
 * Cache entry for storing page data and cursors
 */
interface PageCache<T> {
  items: T[];
  firstDoc: DocumentSnapshot | null;
  lastDoc: DocumentSnapshot | null;
}

/**
 * Default date fields for timestamp conversion
 */
const DEFAULT_DATE_FIELDS = ['createdAt', 'updatedAt'] as const;

/**
 * Generic pagination hook for org-scoped Firestore collections.
 *
 * @param orgId - Organization ID for org-scoped queries
 * @param collectionPath - Collection path relative to organization (e.g., 'clients', 'tasks')
 * @param options - Pagination options
 * @returns Pagination result with items, state, and control functions
 */
export function usePagination<T extends { id: string }>(
  orgId: string | undefined,
  collectionPath: string,
  options: UsePaginationOptions<T> = {}
): UsePaginationResult<T> {
  const {
    pageSize: initialPageSize = 25,
    orderByField = 'createdAt',
    orderDirection = 'desc',
    filters = [],
    enabled = true,
    converter,
    dateFields = DEFAULT_DATE_FIELDS,
  } = options;

  // State
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [initialized, setInitialized] = useState(false);

  // Refs for cursor caching (survives re-renders without triggering effects)
  const pageCacheRef = useRef<Map<number, PageCache<T>>>(new Map());
  const fetchInProgressRef = useRef(false);

  // Memoize filters key for dependency tracking
  const filtersKey = useMemo(
    () => JSON.stringify(filters.map((f) => f.toString())),
    [filters]
  );

  // Default converter function
  const defaultConverter = useCallback(
    (id: string, data: DocumentData): T => {
      return {
        id,
        ...convertTimestamps(data as Record<string, unknown>, dateFields),
      } as T;
    },
    [dateFields]
  );

  // Use provided converter or default
  const docConverter = converter || defaultConverter;

  // Build the full collection path
  const getCollectionPath = useCallback(() => {
    if (!orgId) return null;
    return `organizations/${orgId}/${collectionPath}`;
  }, [orgId, collectionPath]);

  /**
   * Fetch a specific page of data
   */
  const fetchPage = useCallback(
    async (page: number, direction: 'forward' | 'backward' | 'initial' = 'initial') => {
      const path = getCollectionPath();
      if (!path || !enabled || fetchInProgressRef.current) {
        return;
      }

      // Check cache first
      const cached = pageCacheRef.current.get(page);
      if (cached && direction === 'initial') {
        setItems(cached.items);
        setCurrentPage(page);
        setHasMore(cached.items.length >= pageSize);
        return;
      }

      fetchInProgressRef.current = true;
      setLoading(true);
      setError(null);

      try {
        // Build base constraints
        const baseConstraints: QueryConstraint[] = [
          ...filters,
          orderBy(orderByField, orderDirection),
        ];

        let queryConstraints: QueryConstraint[];

        if (direction === 'forward' && page > 1) {
          // Moving forward - use startAfter with last document of previous page
          const prevCache = pageCacheRef.current.get(page - 1);
          if (prevCache?.lastDoc) {
            queryConstraints = [
              ...baseConstraints,
              startAfter(prevCache.lastDoc),
              limit(pageSize + 1), // Fetch one extra to check if there's more
            ];
          } else {
            // Fallback to initial fetch if no cursor
            queryConstraints = [...baseConstraints, limit(pageSize + 1)];
          }
        } else if (direction === 'backward' && page >= 1) {
          // Moving backward - use endBefore with first document of current page
          const nextCache = pageCacheRef.current.get(page + 1);
          if (nextCache?.firstDoc) {
            queryConstraints = [
              ...baseConstraints,
              endBefore(nextCache.firstDoc),
              limitToLast(pageSize + 1),
            ];
          } else {
            // Fallback to initial fetch if no cursor
            queryConstraints = [...baseConstraints, limit(pageSize + 1)];
          }
        } else {
          // Initial fetch or page 1
          queryConstraints = [...baseConstraints, limit(pageSize + 1)];
        }

        const q = query(collection(db, path), ...queryConstraints);
        const snapshot = await getDocs(q);
        const docs = snapshot.docs;

        // Determine if there are more pages
        const hasMoreItems = docs.length > pageSize;
        const pageData = hasMoreItems ? docs.slice(0, pageSize) : docs;

        // Convert documents to typed items
        const convertedItems = pageData.map((doc) =>
          docConverter(doc.id, doc.data())
        );

        // Cache this page's data and cursors
        const pageCache: PageCache<T> = {
          items: convertedItems,
          firstDoc: pageData[0] || null,
          lastDoc: pageData[pageData.length - 1] || null,
        };
        pageCacheRef.current.set(page, pageCache);

        setItems(convertedItems);
        setCurrentPage(page);
        setHasMore(hasMoreItems);
        setInitialized(true);
      } catch (err) {
        console.error(`Error fetching page ${page} from ${path}:`, err);
        setError(err instanceof Error ? err : new Error('Failed to fetch data'));
      } finally {
        setLoading(false);
        fetchInProgressRef.current = false;
      }
    },
    [
      getCollectionPath,
      enabled,
      filters,
      orderByField,
      orderDirection,
      pageSize,
      docConverter,
    ]
  );

  // Initial fetch when dependencies change
  useEffect(() => {
    if (!orgId || !enabled) {
      setItems([]);
      setInitialized(false);
      return;
    }

    // Clear cache when filters or ordering changes
    pageCacheRef.current.clear();
    setCurrentPage(1);
    setHasMore(true);
    fetchPage(1, 'initial');
  }, [orgId, collectionPath, filtersKey, orderByField, orderDirection, pageSize, enabled, fetchPage]);

  /**
   * Load the next page
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchPage(currentPage + 1, 'forward');
  }, [hasMore, loading, currentPage, fetchPage]);

  /**
   * Load the previous page
   */
  const loadPrevious = useCallback(async () => {
    if (currentPage <= 1 || loading) return;
    await fetchPage(currentPage - 1, 'backward');
  }, [currentPage, loading, fetchPage]);

  /**
   * Refresh data (reset to page 1 and clear cache)
   */
  const refresh = useCallback(async () => {
    pageCacheRef.current.clear();
    setCurrentPage(1);
    setHasMore(true);
    await fetchPage(1, 'initial');
  }, [fetchPage]);

  /**
   * Update page size
   */
  const setPageSize = useCallback((size: number) => {
    if (size > 0 && size <= 100) {
      pageCacheRef.current.clear();
      setPageSizeState(size);
      setCurrentPage(1);
      setHasMore(true);
    }
  }, []);

  return {
    items,
    loading,
    error,
    hasMore,
    hasPrevious: currentPage > 1,
    loadMore,
    loadPrevious,
    refresh,
    currentPage,
    totalLoaded: items.length,
    pageSize,
    setPageSize,
    initialized,
  };
}

/**
 * Helper to create a stable converter function.
 * Use this to avoid re-creating converters on every render.
 *
 * @example
 * const clientConverter = createPaginationConverter<Client>(
 *   (id, data) => ({ id, ...convertTimestamps(data, DATE_FIELDS.client) } as Client)
 * );
 *
 * const { items } = usePagination<Client>(orgId, 'clients', {
 *   converter: clientConverter,
 * });
 */
export function createPaginationConverter<T>(
  converter: (id: string, data: DocumentData) => T
): (id: string, data: DocumentData) => T {
  return converter;
}

export default usePagination;
