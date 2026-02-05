"use client";

import { useState, useCallback, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getCountFromServer,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
  Query,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface PaginationState {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface UsePaginatedQueryOptions {
  collectionName: string;
  pageSize?: number;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  constraints?: QueryConstraint[];
  enabled?: boolean;
}

export interface UsePaginatedQueryResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  pagination: PaginationState;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  refresh: () => void;
}

export function usePaginatedQuery<T extends { id: string }>({
  collectionName,
  pageSize = 20,
  orderByField = 'createdAt',
  orderDirection = 'desc',
  constraints = [],
  enabled = true,
}: UsePaginatedQueryOptions): UsePaginatedQueryResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [cursors, setCursors] = useState<Map<number, QueryDocumentSnapshot<DocumentData>>>(new Map());
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // Fetch total count
  const fetchTotalCount = useCallback(async () => {
    try {
      const countQuery = query(collection(db, collectionName), ...constraints);
      const snapshot = await getCountFromServer(countQuery);
      const total = snapshot.data().count;
      const totalPages = Math.ceil(total / pageSize);

      setPagination(prev => ({
        ...prev,
        totalItems: total,
        totalPages,
        hasNextPage: prev.page < totalPages,
        hasPreviousPage: prev.page > 1,
      }));
    } catch (err) {
      console.error('Error fetching count:', err);
    }
  }, [collectionName, constraints, pageSize]);

  // Fetch page data
  const fetchPage = useCallback(async (targetPage: number) => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      let q: Query<DocumentData>;
      const baseConstraints = [
        ...constraints,
        orderBy(orderByField, orderDirection),
        limit(pageSize + 1), // Fetch one extra to check if there's a next page
      ];

      if (targetPage === 1) {
        // First page - no cursor needed
        q = query(collection(db, collectionName), ...baseConstraints);
      } else {
        // Get cursor for this page
        const cursor = cursors.get(targetPage - 1);
        if (cursor) {
          q = query(collection(db, collectionName), ...baseConstraints, startAfter(cursor));
        } else {
          // Need to fetch from beginning to get to this page
          // This is a fallback - ideally we navigate sequentially
          q = query(collection(db, collectionName), ...baseConstraints);
        }
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs;

      // Check if there's a next page
      const hasMore = docs.length > pageSize;
      const pageData = hasMore ? docs.slice(0, -1) : docs;

      // Store cursor for next page
      if (pageData.length > 0) {
        const lastDoc = pageData[pageData.length - 1];
        setCursors(prev => new Map(prev).set(targetPage, lastDoc));
      }

      const items = pageData.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];

      setData(items);
      setPagination(prev => ({
        ...prev,
        page: targetPage,
        hasNextPage: hasMore,
        hasPreviousPage: targetPage > 1,
      }));
    } catch (err) {
      console.error('Error fetching page:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch data'));
    } finally {
      setLoading(false);
    }
  }, [collectionName, constraints, orderByField, orderDirection, pageSize, enabled, cursors]);

  // Initial load
  useEffect(() => {
    if (enabled) {
      fetchTotalCount();
      fetchPage(1);
    }
  }, [enabled, fetchTotalCount]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchPage(page);
    }
  }, [pagination.totalPages, fetchPage]);

  const nextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      fetchPage(pagination.page + 1);
    }
  }, [pagination.hasNextPage, pagination.page, fetchPage]);

  const previousPage = useCallback(() => {
    if (pagination.hasPreviousPage) {
      fetchPage(pagination.page - 1);
    }
  }, [pagination.hasPreviousPage, pagination.page, fetchPage]);

  const refresh = useCallback(() => {
    setCursors(new Map());
    fetchTotalCount();
    fetchPage(1);
  }, [fetchTotalCount, fetchPage]);

  return {
    data,
    loading,
    error,
    pagination,
    goToPage,
    nextPage,
    previousPage,
    refresh,
  };
}

// Simple pagination component
export interface PaginationControlsProps {
  pagination: PaginationState;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onGoToPage?: (page: number) => void;
  loading?: boolean;
}
