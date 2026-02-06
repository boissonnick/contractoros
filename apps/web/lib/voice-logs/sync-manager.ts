/**
 * Voice Log Sync Manager
 *
 * Handles automatic upload of queued voice logs when online.
 * Uses exponential backoff for retries and Background Sync API when available.
 */

import { VoiceLogQueueItem } from '@/types';
import { getVoiceLogQueue } from './offline-queue';
import { logger } from '@/lib/utils/logger';

// Sync configuration
const SYNC_TAG = 'voice-log-sync';
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;

type SyncState = 'idle' | 'syncing' | 'offline';
type SyncEventHandler = (state: SyncState, progress?: { current: number; total: number }) => void;

/**
 * Voice Log Sync Manager
 *
 * Manages automatic upload of queued voice logs.
 */
export class VoiceLogSyncManager {
  private state: SyncState = 'idle';
  private listeners: Set<SyncEventHandler> = new Set();
  private syncPromise: Promise<void> | null = null;
  private isOnline: boolean = true;

  constructor() {
    // Set up online/offline detection
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;

      window.addEventListener('online', () => {
        this.isOnline = true;
        this.triggerSync();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.setState('offline');
      });

      // Register for Background Sync if available
      this.registerBackgroundSync();
    }
  }

  /**
   * Get current sync state
   */
  getState(): SyncState {
    return this.state;
  }

  /**
   * Check if currently online
   */
  getIsOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Subscribe to sync state changes
   */
  subscribe(handler: SyncEventHandler): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  /**
   * Update state and notify listeners
   */
  private setState(state: SyncState, progress?: { current: number; total: number }): void {
    this.state = state;
    this.listeners.forEach(handler => handler(state, progress));
  }

  /**
   * Register for Background Sync API (if supported)
   */
  private async registerBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        // @ts-expect-error - SyncManager types may not be complete
        await registration.sync.register(SYNC_TAG);

      } catch {
        // Background sync not available, fall back to manual sync

      }
    }
  }

  /**
   * Trigger a sync attempt
   */
  async triggerSync(): Promise<void> {
    if (!this.isOnline) {

      return;
    }

    if (this.syncPromise) {
      // Already syncing, wait for current sync
      return this.syncPromise;
    }

    this.syncPromise = this.performSync();

    try {
      await this.syncPromise;
    } finally {
      this.syncPromise = null;
    }
  }

  /**
   * Perform the actual sync operation
   */
  private async performSync(): Promise<void> {
    const queue = getVoiceLogQueue();

    // Get pending items
    const pending = await queue.getPending();
    const failed = await queue.getFailed(MAX_RETRIES);
    const toSync = [...pending, ...failed];

    if (toSync.length === 0) {
      this.setState('idle');
      return;
    }

    this.setState('syncing', { current: 0, total: toSync.length });

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < toSync.length; i++) {
      const item = toSync[i];
      this.setState('syncing', { current: i + 1, total: toSync.length });

      try {
        await this.uploadItem(item);
        await queue.remove(item.id);
        successCount++;
      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        await queue.updateStatus(item.id, 'failed', errorMessage);
        logger.error('Failed to upload voice log', { error: error, component: 'voice-logs-sync-manager' });
      }

      // Check if we went offline during sync
      if (!this.isOnline) {

        this.setState('offline');
        return;
      }
    }

    this.setState('idle');
  }

  /**
   * Upload a single queue item with retry logic
   */
  private async uploadItem(item: VoiceLogQueueItem): Promise<string> {
    let lastError: Error | null = null;
    let delay = BASE_DELAY_MS;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await this.uploadToServer(item);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        // Don't retry for certain errors
        if (this.isNonRetryableError(error)) {
          throw error;
        }

        // Wait before retry with exponential backoff
        if (attempt < MAX_RETRIES) {
          await this.sleep(delay);
          delay = Math.min(delay * 2, MAX_DELAY_MS);
        }
      }
    }

    throw lastError || new Error('Upload failed after retries');
  }

  /**
   * Upload to the server API
   */
  private async uploadToServer(item: VoiceLogQueueItem): Promise<string> {
    const formData = new FormData();

    // Add audio file
    const audioFile = new File([item.audioBlob], 'recording.webm', {
      type: item.audioBlob.type || 'audio/webm',
    });
    formData.append('audio', audioFile);

    // Add metadata as JSON
    formData.append('metadata', JSON.stringify({
      ...item.metadata,
      recordedAt: item.metadata.recordedAt instanceof Date
        ? item.metadata.recordedAt.toISOString()
        : item.metadata.recordedAt,
    }));

    const response = await fetch('/api/voice-logs/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Upload failed: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.id;
  }

  /**
   * Check if an error should not be retried
   */
  private isNonRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('duplicate') ||
        message.includes('quota') ||
        message.includes('limit exceeded') ||
        message.includes('unauthorized') ||
        message.includes('forbidden')
      );
    }
    return false;
  }

  /**
   * Sleep for a given duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let syncManagerInstance: VoiceLogSyncManager | null = null;

/**
 * Get the singleton VoiceLogSyncManager instance
 */
export function getVoiceLogSyncManager(): VoiceLogSyncManager {
  if (!syncManagerInstance) {
    syncManagerInstance = new VoiceLogSyncManager();
  }
  return syncManagerInstance;
}

/**
 * Hook-like interface for React components
 */
export function useSyncManager() {
  const manager = getVoiceLogSyncManager();

  return {
    state: manager.getState(),
    isOnline: manager.getIsOnline(),
    triggerSync: () => manager.triggerSync(),
    subscribe: (handler: SyncEventHandler) => manager.subscribe(handler),
  };
}
