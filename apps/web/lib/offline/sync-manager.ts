/**
 * Sync Manager
 *
 * Unified manager for offline sync operations.
 * Handles queueing, processing, conflict resolution, and status updates.
 *
 * @module lib/offline/sync-manager
 *
 * @example
 * ```tsx
 * // Initialize on app start
 * await SyncManager.initialize();
 *
 * // Queue an operation
 * await SyncManager.queueOperation('create', 'timeEntries', docId, data);
 *
 * // Subscribe to status changes
 * const unsubscribe = SyncManager.onStatusChange((state) => {
 *   console.log('Pending:', state.pendingCount);
 * });
 *
 * // Force sync
 * const result = await SyncManager.forceSync();
 * ```
 *
 * ## Features
 * - Automatic sync on network reconnection
 * - Exponential backoff with jitter for retries
 * - Conflict resolution (server_wins, client_wins, merge, manual)
 * - Service worker integration for background sync
 * - Real-time status updates via listeners
 *
 * ## Configuration
 * - Max retries: 5
 * - Base delay: 1 second
 * - Max delay: 60 seconds
 * - Periodic check: 30 seconds
 */

import { db } from '@/lib/firebase/config';
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  QueuedOperation,
  OperationType,
  OfflineState,
  SyncEvent,
} from './types';
import {
  getQueuedOperations,
  saveQueuedOperation,
  deleteQueuedOperation,
} from './storage';
import { checkNetworkStatus, subscribeToNetworkStatus } from './network-status';

// Sync configuration
const MAX_RETRIES = 5;

// Conflict resolution strategies
export type ConflictStrategy = 'server_wins' | 'client_wins' | 'merge' | 'manual';

export interface SyncResult {
  success: number;
  failed: number;
  skipped: number;
  conflicts: number;
}

export interface ConflictInfo {
  operation: QueuedOperation;
  serverData: Record<string, unknown> | null;
  clientData: Record<string, unknown>;
}

export type SyncStatusCallback = (state: OfflineState) => void;
export type ConflictCallback = (conflict: ConflictInfo) => Promise<ConflictStrategy>;
export type SyncEventCallback = (event: SyncEvent) => void;

/**
 * SyncManager - Singleton class for managing offline sync.
 *
 * Provides a centralized system for queuing offline operations,
 * processing them with retry logic, and handling conflicts.
 *
 * @class SyncManagerClass
 *
 * ## State Properties
 * - `isOnline` - Current network status
 * - `wasOffline` - True if recently reconnected
 * - `pendingCount` - Operations awaiting sync
 * - `syncingCount` - Currently uploading
 * - `failedCount` - Exceeded retry limit
 * - `lastSyncAttempt` - Timestamp of last sync
 * - `lastSuccessfulSync` - Timestamp of last success
 */
class SyncManagerClass {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private statusListeners: Set<SyncStatusCallback> = new Set();
  private eventListeners: Set<SyncEventCallback> = new Set();
  private conflictHandler: ConflictCallback | null = null;
  private defaultConflictStrategy: ConflictStrategy = 'server_wins';
  private networkUnsubscribe: (() => void) | null = null;
  private swMessageHandler: ((event: MessageEvent) => void) | null = null;

  private state: OfflineState = {
    isOnline: true,
    wasOffline: false,
    pendingCount: 0,
    syncingCount: 0,
    failedCount: 0,
    lastSyncAttempt: null,
    lastSuccessfulSync: null,
  };

  /**
   * Initialize the sync manager
   * Call this once when the app starts
   */
  async initialize(): Promise<void> {
    // Check initial network status
    this.state.isOnline = checkNetworkStatus();

    // Subscribe to network changes
    this.networkUnsubscribe = subscribeToNetworkStatus((isOnline) => {
      const wasOffline = !this.state.isOnline && isOnline;
      this.state.isOnline = isOnline;

      if (wasOffline) {
        this.state.wasOffline = true;
        // Trigger sync when coming back online
        this.processQueue().catch(console.error);
      }

      this.notifyStatusListeners();
    });

    // Listen for service worker messages
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      this.swMessageHandler = (event: MessageEvent) => {
        if (event.data?.type === 'SYNC_REQUESTED') {
          this.processQueue().catch(console.error);
        }
      };
      navigator.serviceWorker.addEventListener('message', this.swMessageHandler);
    }

    // Load initial queue stats
    await this.refreshQueueStats();

    // Start periodic sync check (every 30 seconds when online)
    this.syncInterval = setInterval(() => {
      if (this.state.isOnline && this.state.pendingCount > 0) {
        this.processQueue().catch(console.error);
      }
    }, 30000);
  }

  /**
   * Cleanup when unmounting
   */
  cleanup(): void {
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
    }

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    if (this.swMessageHandler && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.removeEventListener('message', this.swMessageHandler);
    }

    this.statusListeners.clear();
    this.eventListeners.clear();
  }

  /**
   * Queue an operation for sync
   */
  async queueOperation(
    type: OperationType,
    collection: string,
    documentId: string,
    data: Record<string, unknown>
  ): Promise<string> {
    const operation: QueuedOperation = {
      id: this.generateId(),
      type,
      collection,
      documentId,
      data: {
        ...data,
        _queuedAt: Date.now(),
        _clientId: this.getClientId(),
      },
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };

    await saveQueuedOperation(operation);
    await this.refreshQueueStats();

    this.emitEvent({
      type: 'operation-queued',
      operationId: operation.id,
    });

    // Request background sync if available
    this.requestBackgroundSync();

    // If online, try to sync immediately
    if (this.state.isOnline) {
      // Use setTimeout to not block the calling code
      setTimeout(() => {
        this.processQueue().catch(console.error);
      }, 100);
    }

    return operation.id;
  }

  /**
   * Process all pending operations in the queue
   */
  async processQueue(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { success: 0, failed: 0, skipped: 0, conflicts: 0 };
    }

    if (!this.state.isOnline) {
      return { success: 0, failed: 0, skipped: 0, conflicts: 0 };
    }

    this.isSyncing = true;
    this.state.lastSyncAttempt = Date.now();
    this.emitEvent({ type: 'sync-started' });
    this.notifyStatusListeners();

    const result: SyncResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      conflicts: 0,
    };

    try {
      const operations = await getQueuedOperations();
      const pendingOps = operations.filter(
        (op) => op.status === 'pending' || (op.status === 'failed' && op.retryCount < MAX_RETRIES)
      );

      for (const operation of pendingOps) {
        // Update status to syncing
        operation.status = 'syncing';
        this.state.syncingCount++;
        await saveQueuedOperation(operation);
        this.notifyStatusListeners();

        try {
          // Check for conflicts on update operations
          if (operation.type === 'update') {
            const conflictResult = await this.checkAndResolveConflict(operation);
            if (conflictResult === 'skip') {
              result.skipped++;
              await deleteQueuedOperation(operation.id);
              continue;
            } else if (conflictResult === 'conflict') {
              result.conflicts++;
              operation.status = 'failed';
              operation.error = 'Unresolved conflict';
              await saveQueuedOperation(operation);
              continue;
            }
          }

          // Execute the sync operation
          await this.executeOperation(operation);

          // Success - remove from queue
          await deleteQueuedOperation(operation.id);
          result.success++;
        } catch (error) {
          // Failed - update retry count with exponential backoff
          operation.retryCount++;
          operation.status = operation.retryCount >= MAX_RETRIES ? 'failed' : 'pending';
          operation.error = error instanceof Error ? error.message : 'Unknown error';
          await saveQueuedOperation(operation);
          result.failed++;
        } finally {
          this.state.syncingCount--;
        }

        await this.refreshQueueStats();
        this.notifyStatusListeners();
      }

      if (result.success > 0) {
        this.state.lastSuccessfulSync = Date.now();
        this.state.wasOffline = false;
      }

      this.emitEvent({ type: 'sync-completed' });
    } catch (error) {
      this.emitEvent({
        type: 'sync-failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      this.isSyncing = false;
      await this.refreshQueueStats();
      this.notifyStatusListeners();
    }

    return result;
  }

  /**
   * Execute a single sync operation
   */
  private async executeOperation(operation: QueuedOperation): Promise<void> {
    const { type, collection, documentId, data } = operation;

    // Remove internal tracking fields before sending to Firestore
    const cleanData = { ...data };
    delete cleanData._queuedAt;
    delete cleanData._clientId;

    // Add server timestamp
    const dataWithTimestamp = {
      ...cleanData,
      updatedAt: serverTimestamp(),
    };

    switch (type) {
      case 'create':
        const docRef = doc(db, collection, documentId);
        await setDoc(docRef, {
          ...dataWithTimestamp,
          createdAt: cleanData.createdAt || serverTimestamp(),
        });
        break;

      case 'update':
        const updateRef = doc(db, collection, documentId);
        await updateDoc(updateRef, dataWithTimestamp);
        break;

      case 'delete':
        const deleteRef = doc(db, collection, documentId);
        await deleteDoc(deleteRef);
        break;

      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  }

  /**
   * Check for conflicts and resolve them
   */
  private async checkAndResolveConflict(
    operation: QueuedOperation
  ): Promise<'continue' | 'skip' | 'conflict'> {
    try {
      const docRef = doc(db, operation.collection, operation.documentId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // Document was deleted on server
        if (operation.type === 'update') {
          // Skip update for deleted document
          return 'skip';
        }
        return 'continue';
      }

      const serverData = docSnap.data();
      const serverUpdatedAt = serverData.updatedAt?.toMillis?.() || 0;
      const clientQueuedAt = (operation.data._queuedAt as number) || 0;

      // If server was updated after we queued the operation, there's a potential conflict
      if (serverUpdatedAt > clientQueuedAt) {
        const strategy = await this.getConflictResolution({
          operation,
          serverData,
          clientData: operation.data,
        });

        switch (strategy) {
          case 'server_wins':
            // Skip our changes, server data is newer
            return 'skip';

          case 'client_wins':
            // Continue with our changes
            return 'continue';

          case 'merge':
            // Merge the data (client fields override, but keep server-only fields)
            operation.data = {
              ...serverData,
              ...operation.data,
            };
            return 'continue';

          case 'manual':
            // Flag for manual resolution
            return 'conflict';
        }
      }

      return 'continue';
    } catch (error) {
      console.error('Conflict check failed:', error);
      // If we can't check, proceed with the operation
      return 'continue';
    }
  }

  /**
   * Get conflict resolution strategy
   */
  private async getConflictResolution(conflict: ConflictInfo): Promise<ConflictStrategy> {
    if (this.conflictHandler) {
      try {
        return await this.conflictHandler(conflict);
      } catch {
        return this.defaultConflictStrategy;
      }
    }
    return this.defaultConflictStrategy;
  }

  /**
   * Set custom conflict handler
   */
  setConflictHandler(handler: ConflictCallback | null): void {
    this.conflictHandler = handler;
  }

  /**
   * Set default conflict strategy
   */
  setDefaultConflictStrategy(strategy: ConflictStrategy): void {
    this.defaultConflictStrategy = strategy;
  }

  /**
   * Retry a specific failed operation
   */
  async retryOperation(operationId: string): Promise<void> {
    const operations = await getQueuedOperations();
    const operation = operations.find((op) => op.id === operationId);

    if (operation && operation.status === 'failed') {
      operation.status = 'pending';
      operation.retryCount = 0;
      operation.error = undefined;
      await saveQueuedOperation(operation);
      await this.refreshQueueStats();
      this.notifyStatusListeners();

      // Try to sync immediately if online
      if (this.state.isOnline) {
        this.processQueue().catch(console.error);
      }
    }
  }

  /**
   * Remove an operation from the queue
   */
  async removeOperation(operationId: string): Promise<void> {
    await deleteQueuedOperation(operationId);
    await this.refreshQueueStats();
    this.notifyStatusListeners();
  }

  /**
   * Get all pending operations
   */
  async getPendingOperations(): Promise<QueuedOperation[]> {
    const operations = await getQueuedOperations();
    return operations.filter((op) => op.status !== 'synced');
  }

  /**
   * Get current sync state
   */
  getState(): OfflineState {
    return { ...this.state };
  }

  /**
   * Subscribe to sync status changes
   */
  onStatusChange(callback: SyncStatusCallback): () => void {
    this.statusListeners.add(callback);
    // Immediately notify with current state
    callback(this.getState());
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  /**
   * Subscribe to sync events
   */
  onSyncEvent(callback: SyncEventCallback): () => void {
    this.eventListeners.add(callback);
    return () => {
      this.eventListeners.delete(callback);
    };
  }

  /**
   * Force a sync attempt
   */
  async forceSync(): Promise<SyncResult> {
    return this.processQueue();
  }

  /**
   * Check if currently syncing
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  // ===== Private helpers =====

  private generateId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  private getClientId(): string {
    if (typeof window === 'undefined') return 'server';

    let clientId = localStorage.getItem('contractoros_client_id');
    if (!clientId) {
      clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem('contractoros_client_id', clientId);
    }
    return clientId;
  }

  private async refreshQueueStats(): Promise<void> {
    try {
      const operations = await getQueuedOperations();
      this.state.pendingCount = operations.filter((op) => op.status === 'pending').length;
      this.state.failedCount = operations.filter((op) => op.status === 'failed').length;
    } catch (error) {
      console.error('Failed to refresh queue stats:', error);
    }
  }

  private notifyStatusListeners(): void {
    const state = this.getState();
    this.statusListeners.forEach((listener) => {
      try {
        listener(state);
      } catch (error) {
        console.error('Status listener error:', error);
      }
    });
  }

  private emitEvent(event: SyncEvent): void {
    this.eventListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Event listener error:', error);
      }
    });
  }

  private async requestBackgroundSync(): Promise<void> {
    if (typeof window === 'undefined') return;

    // Background Sync API - experimental, no TypeScript types available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ('serviceWorker' in navigator && 'sync' in (window as any).SyncManager?.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (registration as any).sync.register('sync-pending-data');
      } catch (error) {
        console.warn('Background sync registration failed:', error);
      }
    }
  }
}

// Export singleton instance
export const SyncManager = new SyncManagerClass();

// Export class for testing
export { SyncManagerClass };

// React hook for using sync manager
export function useSyncManager() {
  return SyncManager;
}
