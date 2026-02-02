'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { OfflineState, QueuedOperation, OperationType, SyncEvent } from '@/lib/offline/types';
import { useNetworkStatus } from '@/lib/offline/network-status';
import { SyncManager, SyncResult } from '@/lib/offline/sync-manager';

// ============================================
// Types
// ============================================

interface OfflineContextValue {
  state: OfflineState;
  syncNow: () => Promise<SyncResult>;
  queueOperation: (
    type: OperationType,
    collection: string,
    documentId: string,
    data: Record<string, unknown>
  ) => Promise<string>;
  getPendingOperations: () => Promise<QueuedOperation[]>;
  retryOperation: (operationId: string) => Promise<void>;
  removeOperation: (operationId: string) => Promise<void>;
}

// ============================================
// Context
// ============================================

const OfflineContext = createContext<OfflineContextValue | null>(null);

// ============================================
// Provider
// ============================================

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const { isOnline, wasOffline } = useNetworkStatus();
  const initRef = useRef(false);

  const [state, setState] = useState<OfflineState>({
    isOnline: true,
    wasOffline: false,
    pendingCount: 0,
    syncingCount: 0,
    failedCount: 0,
    lastSyncAttempt: null,
    lastSuccessfulSync: null,
  });

  // Initialize SyncManager
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    SyncManager.initialize().catch(console.error);

    return () => {
      SyncManager.cleanup();
    };
  }, []);

  // Subscribe to SyncManager state changes
  useEffect(() => {
    const unsubscribe = SyncManager.onStatusChange((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Subscribe to sync events for logging/debugging
  useEffect(() => {
    const unsubscribe = SyncManager.onSyncEvent((event: SyncEvent) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[OfflineProvider] Sync event:', event);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Listen for service worker messages
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_REQUESTED') {
        SyncManager.forceSync().catch(console.error);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  // Sync function
  const syncNow = useCallback(async (): Promise<SyncResult> => {
    return SyncManager.forceSync();
  }, []);

  // Queue an operation
  const queueOperation = useCallback(
    async (
      type: OperationType,
      collection: string,
      documentId: string,
      data: Record<string, unknown>
    ): Promise<string> => {
      return SyncManager.queueOperation(type, collection, documentId, data);
    },
    []
  );

  // Get pending operations
  const getPendingOperations = useCallback(async (): Promise<QueuedOperation[]> => {
    return SyncManager.getPendingOperations();
  }, []);

  // Retry a failed operation
  const retryOperation = useCallback(async (operationId: string): Promise<void> => {
    return SyncManager.retryOperation(operationId);
  }, []);

  // Remove an operation from queue
  const removeOperation = useCallback(async (operationId: string): Promise<void> => {
    return SyncManager.removeOperation(operationId);
  }, []);

  const value: OfflineContextValue = {
    state,
    syncNow,
    queueOperation,
    getPendingOperations,
    retryOperation,
    removeOperation,
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
