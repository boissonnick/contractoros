/**
 * Sync Queue Management
 * Handles queuing and processing of offline operations
 */

import { QueuedOperation, OperationType, SyncStatus } from './types';
import {
  getQueuedOperations,
  saveQueuedOperation,
  deleteQueuedOperation,
} from './storage';

const MAX_RETRIES = 5;
const BASE_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 60000;

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(retryCount: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s... capped at 60s
  const delay = Math.min(
    BASE_RETRY_DELAY_MS * Math.pow(2, retryCount),
    MAX_RETRY_DELAY_MS
  );
  // Add jitter (±25%) to prevent thundering herd
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return Math.floor(delay + jitter);
}

// Track if sync is in progress
let isSyncing = false;

// Listeners for queue changes
type QueueChangeListener = (count: number) => void;
const listeners: Set<QueueChangeListener> = new Set();

/**
 * Generate unique operation ID
 */
function generateId(): string {
  return `op_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Add an operation to the sync queue
 */
export async function addToQueue(
  type: OperationType,
  collection: string,
  documentId: string,
  data: Record<string, unknown>
): Promise<string> {
  const operation: QueuedOperation = {
    id: generateId(),
    type,
    collection,
    documentId,
    data,
    timestamp: Date.now(),
    retryCount: 0,
    status: 'pending',
  };

  await saveQueuedOperation(operation);
  notifyListeners();

  // Request background sync if available
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-pending-data');
    } catch (err) {
      console.warn('Background sync registration failed:', err);
    }
  }

  return operation.id;
}

/**
 * Get the number of pending operations
 */
export async function getQueueLength(): Promise<number> {
  const operations = await getQueuedOperations();
  return operations.filter((op) => op.status !== 'synced').length;
}

/**
 * Get pending operations count by status
 */
export async function getQueueStats(): Promise<{
  pending: number;
  syncing: number;
  failed: number;
  total: number;
}> {
  const operations = await getQueuedOperations();

  return {
    pending: operations.filter((op) => op.status === 'pending').length,
    syncing: operations.filter((op) => op.status === 'syncing').length,
    failed: operations.filter((op) => op.status === 'failed').length,
    total: operations.length,
  };
}

/**
 * Process all pending operations in the queue
 */
export async function processQueue(
  syncHandler: (operation: QueuedOperation) => Promise<void>
): Promise<{ success: number; failed: number }> {
  if (isSyncing) {
    return { success: 0, failed: 0 };
  }

  isSyncing = true;
  let successCount = 0;
  let failedCount = 0;

  try {
    const operations = await getQueuedOperations();
    const pendingOps = operations.filter(
      (op) => op.status === 'pending' || op.status === 'failed'
    );

    for (const operation of pendingOps) {
      try {
        // Update status to syncing
        operation.status = 'syncing';
        await saveQueuedOperation(operation);
        notifyListeners();

        // Execute the sync
        await syncHandler(operation);

        // Success - remove from queue
        await deleteQueuedOperation(operation.id);
        successCount++;
      } catch (error) {
        // Failed - update retry count
        operation.retryCount++;
        operation.status = operation.retryCount >= MAX_RETRIES ? 'failed' : 'pending';
        operation.error = error instanceof Error ? error.message : 'Unknown error';
        await saveQueuedOperation(operation);
        failedCount++;
      }

      notifyListeners();
    }
  } finally {
    isSyncing = false;
  }

  return { success: successCount, failed: failedCount };
}

/**
 * Retry a specific failed operation
 */
export async function retryOperation(operationId: string): Promise<void> {
  const operations = await getQueuedOperations();
  const operation = operations.find((op) => op.id === operationId);

  if (operation && operation.status === 'failed') {
    operation.status = 'pending';
    operation.retryCount = 0;
    operation.error = undefined;
    await saveQueuedOperation(operation);
    notifyListeners();
  }
}

/**
 * Remove an operation from the queue
 */
export async function removeFromQueue(operationId: string): Promise<void> {
  await deleteQueuedOperation(operationId);
  notifyListeners();
}

/**
 * Subscribe to queue changes
 */
export function subscribeToQueue(listener: QueueChangeListener): () => void {
  listeners.add(listener);

  // Immediately notify with current count
  getQueueLength().then(listener).catch(console.error);

  return () => {
    listeners.delete(listener);
  };
}

/**
 * Notify all listeners of queue changes
 */
async function notifyListeners(): Promise<void> {
  const count = await getQueueLength();
  listeners.forEach((listener) => listener(count));
}

/**
 * Check if sync is currently in progress
 */
export function isSyncInProgress(): boolean {
  return isSyncing;
}

/**
 * Get all pending operations (for debugging/display)
 */
export async function getPendingOperations(): Promise<QueuedOperation[]> {
  const operations = await getQueuedOperations();
  return operations.filter((op) => op.status !== 'synced');
}
