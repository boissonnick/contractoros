/**
 * IndexedDB Storage Helper
 * Provides database operations for offline data persistence
 */

import { DB_NAME, DB_VERSION, STORES, QueuedOperation, CacheEntry } from './types';
import { logger } from '@/lib/utils/logger';

let dbInstance: IDBDatabase | null = null;

/**
 * Open or create the IndexedDB database
 */
export function openDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open database'));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create sync queue store
      if (!db.objectStoreNames.contains(STORES.QUEUE)) {
        const queueStore = db.createObjectStore(STORES.QUEUE, { keyPath: 'id' });
        queueStore.createIndex('status', 'status', { unique: false });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        queueStore.createIndex('collection', 'collection', { unique: false });
      }

      // Create offline cache store
      if (!db.objectStoreNames.contains(STORES.CACHE)) {
        const cacheStore = db.createObjectStore(STORES.CACHE, { keyPath: 'key' });
        cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false });
      }
    };
  });
}

/**
 * Save data to offline cache
 */
export async function saveOffline<T>(
  key: string,
  data: T,
  ttlMs?: number
): Promise<void> {
  const db = await openDB();
  const timestamp = Date.now();

  const entry: CacheEntry = {
    key,
    data,
    timestamp,
    expiresAt: ttlMs ? timestamp + ttlMs : null,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.CACHE, 'readwrite');
    const store = tx.objectStore(STORES.CACHE);
    const request = store.put(entry);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to save offline data'));
  });
}

/**
 * Get data from offline cache
 */
export async function getOfflineData<T>(key: string): Promise<T | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.CACHE, 'readonly');
    const store = tx.objectStore(STORES.CACHE);
    const request = store.get(key);

    request.onsuccess = () => {
      const entry = request.result as CacheEntry | undefined;

      if (!entry) {
        resolve(null);
        return;
      }

      // Check if expired
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        // Delete expired entry
        deleteOfflineData(key).catch((err) => logger.error('Operation failed', { error: err, component: 'offline-storage' }));
        resolve(null);
        return;
      }

      resolve(entry.data as T);
    };

    request.onerror = () => reject(new Error('Failed to get offline data'));
  });
}

/**
 * Delete data from offline cache
 */
export async function deleteOfflineData(key: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.CACHE, 'readwrite');
    const store = tx.objectStore(STORES.CACHE);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to delete offline data'));
  });
}

/**
 * Clear all offline cache
 */
export async function clearOfflineCache(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.CACHE, 'readwrite');
    const store = tx.objectStore(STORES.CACHE);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to clear offline cache'));
  });
}

/**
 * Get all operations from sync queue
 */
export async function getQueuedOperations(): Promise<QueuedOperation[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.QUEUE, 'readonly');
    const store = tx.objectStore(STORES.QUEUE);
    const request = store.getAll();

    request.onsuccess = () => {
      const operations = request.result as QueuedOperation[];
      // Sort by timestamp, oldest first
      operations.sort((a, b) => a.timestamp - b.timestamp);
      resolve(operations);
    };

    request.onerror = () => reject(new Error('Failed to get queued operations'));
  });
}

/**
 * Save operation to sync queue
 */
export async function saveQueuedOperation(operation: QueuedOperation): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.QUEUE, 'readwrite');
    const store = tx.objectStore(STORES.QUEUE);
    const request = store.put(operation);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to save queued operation'));
  });
}

/**
 * Delete operation from sync queue
 */
export async function deleteQueuedOperation(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.QUEUE, 'readwrite');
    const store = tx.objectStore(STORES.QUEUE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to delete queued operation'));
  });
}

/**
 * Clear all operations from sync queue
 */
export async function clearSyncQueue(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.QUEUE, 'readwrite');
    const store = tx.objectStore(STORES.QUEUE);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to clear sync queue'));
  });
}
