/**
 * Voice Log Offline Queue Manager
 *
 * Uses IndexedDB to persist voice logs locally before upload.
 * Provides reliable offline storage with automatic deduplication via content hash.
 */

import { VoiceLogQueueItem, VoiceLogCreate } from '@/types';
import { logger } from '@/lib/utils/logger';

const DB_NAME = 'contractoros-voice-logs';
const DB_VERSION = 1;
const STORE_NAME = 'queue';

/**
 * Generate SHA256 hash of content for idempotency
 */
async function generateContentHash(
  audioBlob: Blob,
  userId: string,
  timestamp: number
): Promise<string> {
  const arrayBuffer = await audioBlob.arrayBuffer();
  const combined = new Uint8Array(arrayBuffer.byteLength + userId.length + 8);

  // Combine audio bytes + userId + timestamp
  combined.set(new Uint8Array(arrayBuffer), 0);
  const encoder = new TextEncoder();
  combined.set(encoder.encode(userId), arrayBuffer.byteLength);

  // Add timestamp as 8 bytes
  const timestampView = new DataView(new ArrayBuffer(8));
  timestampView.setBigInt64(0, BigInt(timestamp));
  combined.set(new Uint8Array(timestampView.buffer), arrayBuffer.byteLength + userId.length);

  // Generate SHA256
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Open the IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB: ' + request.error?.message));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store for queue items
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('queuedAt', 'queuedAt', { unique: false });
        store.createIndex('contentHash', 'metadata.contentHash', { unique: true });
      }
    };
  });
}

/**
 * Voice Log Queue Manager
 *
 * Manages offline storage of voice logs before upload.
 */
export class VoiceLogQueue {
  private dbPromise: Promise<IDBDatabase> | null = null;

  /**
   * Get or initialize the database connection
   */
  private async getDb(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = openDatabase();
    }
    return this.dbPromise;
  }

  /**
   * Add a new voice log to the queue
   *
   * @returns The queue item ID, or null if duplicate
   */
  async enqueue(
    audioBlob: Blob,
    metadata: Omit<VoiceLogCreate, 'contentHash'>
  ): Promise<string | null> {
    const db = await this.getDb();
    const timestamp = metadata.recordedAt.getTime();
    const contentHash = await generateContentHash(audioBlob, metadata.userId, timestamp);

    // Check for duplicate by content hash
    const existing = await this.findByContentHash(contentHash);
    if (existing) {
      logger.info('Voice log already queued (duplicate detected)', { hashPrefix: contentHash.slice(0, 8), component: 'voice-logs-offline-queue' });
      return null;
    }

    const id = crypto.randomUUID();
    const item: VoiceLogQueueItem = {
      id,
      audioBlob,
      metadata: {
        ...metadata,
        contentHash,
      },
      queuedAt: new Date(),
      retryCount: 0,
      status: 'pending',
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.add(item);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(new Error('Failed to enqueue: ' + request.error?.message));
    });
  }

  /**
   * Find a queue item by content hash
   */
  private async findByContentHash(contentHash: string): Promise<VoiceLogQueueItem | null> {
    const db = await this.getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('contentHash');
      const request = index.get(contentHash);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error('Failed to find: ' + request.error?.message));
    });
  }

  /**
   * Get all pending items (not currently uploading)
   */
  async getPending(): Promise<VoiceLogQueueItem[]> {
    const db = await this.getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('status');
      const request = index.getAll(IDBKeyRange.only('pending'));

      request.onsuccess = () => {
        // Sort by queuedAt (oldest first)
        const items = request.result as VoiceLogQueueItem[];
        items.sort((a, b) => new Date(a.queuedAt).getTime() - new Date(b.queuedAt).getTime());
        resolve(items);
      };
      request.onerror = () => reject(new Error('Failed to get pending: ' + request.error?.message));
    });
  }

  /**
   * Get a specific item by ID
   */
  async getById(id: string): Promise<VoiceLogQueueItem | null> {
    const db = await this.getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error('Failed to get item: ' + request.error?.message));
    });
  }

  /**
   * Update status of a queue item
   */
  async updateStatus(
    id: string,
    status: VoiceLogQueueItem['status'],
    error?: string
  ): Promise<void> {
    const db = await this.getDb();
    const item = await this.getById(id);

    if (!item) {
      throw new Error('Queue item not found: ' + id);
    }

    const updated: VoiceLogQueueItem = {
      ...item,
      status,
      lastError: error,
      retryCount: status === 'failed' ? item.retryCount + 1 : item.retryCount,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(updated);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to update: ' + request.error?.message));
    });
  }

  /**
   * Remove an item from the queue (after successful upload)
   */
  async remove(id: string): Promise<void> {
    const db = await this.getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to remove: ' + request.error?.message));
    });
  }

  /**
   * Get count of items by status
   */
  async getStatusCounts(): Promise<Record<VoiceLogQueueItem['status'], number>> {
    const db = await this.getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result as VoiceLogQueueItem[];
        const counts: Record<VoiceLogQueueItem['status'], number> = {
          pending: 0,
          uploading: 0,
          failed: 0,
        };
        items.forEach(item => {
          counts[item.status]++;
        });
        resolve(counts);
      };
      request.onerror = () => reject(new Error('Failed to count: ' + request.error?.message));
    });
  }

  /**
   * Get all failed items for retry
   */
  async getFailed(maxRetries = 3): Promise<VoiceLogQueueItem[]> {
    const db = await this.getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('status');
      const request = index.getAll(IDBKeyRange.only('failed'));

      request.onsuccess = () => {
        const items = (request.result as VoiceLogQueueItem[])
          .filter(item => item.retryCount < maxRetries);
        resolve(items);
      };
      request.onerror = () => reject(new Error('Failed to get failed: ' + request.error?.message));
    });
  }

  /**
   * Reset failed items to pending (for manual retry)
   */
  async resetFailed(): Promise<number> {
    const failed = await this.getFailed();
    let count = 0;

    for (const item of failed) {
      await this.updateStatus(item.id, 'pending');
      count++;
    }

    return count;
  }

  /**
   * Clear all items from the queue
   * WARNING: This is destructive and should only be used for testing/debugging
   */
  async clear(): Promise<void> {
    const db = await this.getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear: ' + request.error?.message));
    });
  }
}

// Singleton instance
let queueInstance: VoiceLogQueue | null = null;

/**
 * Get the singleton VoiceLogQueue instance
 */
export function getVoiceLogQueue(): VoiceLogQueue {
  if (!queueInstance) {
    queueInstance = new VoiceLogQueue();
  }
  return queueInstance;
}
