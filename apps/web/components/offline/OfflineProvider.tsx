'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { OfflineState, QueuedOperation, OperationType } from '@/lib/offline/types';
import { useNetworkStatus } from '@/lib/offline/network-status';
import { subscribeToQueue, processQueue, getQueueStats, addToQueue } from '@/lib/offline/sync-queue';

// ============================================
// Types
// ============================================

interface OfflineContextValue {
  state: OfflineState;
  syncNow: () => Promise<void>;
  queueOperation: (
    type: OperationType,
    collection: string,
    documentId: string,
    data: Record<string, unknown>
  ) => Promise<string>;
}

// ============================================
// Context
// ============================================

const OfflineContext = createContext<OfflineContextValue | null>(null);

// ============================================
// Default sync handler (placeholder)
// ============================================

async function defaultSyncHandler(operation: QueuedOperation): Promise<void> {
  // This should be replaced with actual Firestore sync logic
  // For now, just log the operation
  console.log('[OfflineSync] Processing operation:', operation);

  // Simulate network request
  await new Promise((resolve) => setTimeout(resolve, 500));

  // In production, this would:
  // 1. Call Firestore API based on operation.type
  // 2. Handle conflicts if document was modified
  // 3. Throw error if request fails
}

// ============================================
// Provider
// ============================================

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const { isOnline, wasOffline } = useNetworkStatus();

  const [state, setState] = useState<OfflineState>({
    isOnline: true,
    wasOffline: false,
    pendingCount: 0,
    syncingCount: 0,
    failedCount: 0,
    lastSyncAttempt: null,
    lastSuccessfulSync: null,
  });

  const syncInProgressRef = useRef(false);

  // Update online status
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      isOnline,
      wasOffline,
    }));
  }, [isOnline, wasOffline]);

  // Subscribe to queue changes
  useEffect(() => {
    const updateQueueStats = async () => {
      try {
        const stats = await getQueueStats();
        setState((prev) => ({
          ...prev,
          pendingCount: stats.pending,
          syncingCount: stats.syncing,
          failedCount: stats.failed,
        }));
      } catch (error) {
        console.error('Failed to get queue stats:', error);
      }
    };

    const unsubscribe = subscribeToQueue(() => {
      updateQueueStats();
    });

    // Initial load
    updateQueueStats();

    return unsubscribe;
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && wasOffline && state.pendingCount > 0) {
      syncNow();
    }
  }, [isOnline, wasOffline, state.pendingCount]);

  // Sync function
  const syncNow = useCallback(async () => {
    if (!isOnline || syncInProgressRef.current) {
      return;
    }

    syncInProgressRef.current = true;
    setState((prev) => ({ ...prev, lastSyncAttempt: Date.now() }));

    try {
      const result = await processQueue(defaultSyncHandler);

      if (result.success > 0) {
        setState((prev) => ({
          ...prev,
          lastSuccessfulSync: Date.now(),
        }));
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      syncInProgressRef.current = false;

      // Refresh stats
      const stats = await getQueueStats();
      setState((prev) => ({
        ...prev,
        pendingCount: stats.pending,
        syncingCount: stats.syncing,
        failedCount: stats.failed,
      }));
    }
  }, [isOnline]);

  // Queue an operation
  const queueOperation = useCallback(
    async (
      type: OperationType,
      collection: string,
      documentId: string,
      data: Record<string, unknown>
    ): Promise<string> => {
      const operationId = await addToQueue(type, collection, documentId, data);

      // If online, try to sync immediately
      if (isOnline) {
        syncNow();
      }

      return operationId;
    },
    [isOnline, syncNow]
  );

  const value: OfflineContextValue = {
    state,
    syncNow,
    queueOperation,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useOffline(): OfflineContextValue {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within OfflineProvider');
  }
  return context;
}

// ============================================
// HOC for offline-aware components
// ============================================

export function withOfflineSupport<P extends object>(
  Component: React.ComponentType<P & { offline: OfflineContextValue }>
): React.FC<P> {
  return function OfflineAwareComponent(props: P) {
    const offline = useOffline();
    return <Component {...props} offline={offline} />;
  };
}
