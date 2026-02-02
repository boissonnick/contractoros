/**
 * Offline Support Types
 * Core interfaces for offline-first functionality
 */

// Sync status for individual operations
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

// Operation types that can be queued
export type OperationType = 'create' | 'update' | 'delete';

// Queued operation stored in IndexedDB
export interface QueuedOperation {
  id: string;
  type: OperationType;
  collection: string;
  documentId: string;
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  status: SyncStatus;
  error?: string;
}

// Overall offline state
export interface OfflineState {
  isOnline: boolean;
  wasOffline: boolean;
  pendingCount: number;
  syncingCount: number;
  failedCount: number;
  lastSyncAttempt: number | null;
  lastSuccessfulSync: number | null;
}

// IndexedDB store names
export const DB_NAME = 'contractoros-offline';
export const DB_VERSION = 1;
export const STORES = {
  QUEUE: 'sync-queue',
  CACHE: 'offline-cache',
} as const;

// Events for sync communication
export interface SyncEvent {
  type: 'sync-started' | 'sync-completed' | 'sync-failed' | 'operation-queued';
  operationId?: string;
  error?: string;
}

// Offline cache entry
export interface CacheEntry {
  key: string;
  data: unknown;
  timestamp: number;
  expiresAt: number | null;
}
