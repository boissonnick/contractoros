/**
 * Offline Photo Service
 * Handles photo capture, storage, and sync when offline
 */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase/config';
import { compressPhoto, createThumbnail, blobToArrayBuffer, arrayBufferToBlob } from './photo-compression';
import { checkNetworkStatus, subscribeToNetworkStatus } from './network-status';
import { generatePhotoFilename } from '@/lib/photo-processing';

// Photo categories for field documentation
export type PhotoCategory = 'progress' | 'issue' | 'before' | 'after' | 'inspection' | 'safety' | 'material';

// Status of pending photo in offline queue
export type PhotoSyncStatus = 'pending' | 'uploading' | 'failed' | 'completed';

// A photo waiting to be uploaded
export interface PendingPhoto {
  localId: string;
  projectId: string;
  orgId: string;
  userId: string;
  userName: string;
  // Store ArrayBuffer in IndexedDB (Blob doesn't serialize well)
  blobData: ArrayBuffer;
  blobType: string;
  thumbnail: string; // Base64 for quick display
  filename: string;
  caption?: string;
  category: PhotoCategory;
  takenAt: number; // Timestamp
  location?: { lat: number; lng: number };
  syncStatus: PhotoSyncStatus;
  uploadProgress?: number;
  errorMessage?: string;
  retryCount: number;
  createdAt: number;
  phaseId?: string;
  albumId?: string;
  taskId?: string;
}

// Result of upload operation
export interface UploadResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ localId: string; error: string }>;
}

// Progress callback data
export interface UploadProgress {
  current: number;
  total: number;
  currentPhotoId: string;
  status: 'uploading' | 'completed' | 'failed';
}

// IndexedDB config for photos
const PHOTOS_DB_NAME = 'contractoros-photos';
const PHOTOS_DB_VERSION = 1;
const PHOTOS_STORE = 'pending-photos';

// Singleton instance
let dbInstance: IDBDatabase | null = null;

// Queue change listeners
type QueueChangeListener = (count: number) => void;
const listeners: Set<QueueChangeListener> = new Set();

// Track sync state
let isSyncing = false;

/**
 * Open the photos IndexedDB database
 */
async function openPhotosDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = indexedDB.open(PHOTOS_DB_NAME, PHOTOS_DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open photos database'));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(PHOTOS_STORE)) {
        const store = db.createObjectStore(PHOTOS_STORE, { keyPath: 'localId' });
        store.createIndex('projectId', 'projectId', { unique: false });
        store.createIndex('syncStatus', 'syncStatus', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

/**
 * Generate a unique local ID for pending photos
 */
function generateLocalId(): string {
  return `photo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Notify listeners of queue changes
 */
async function notifyListeners(): Promise<void> {
  const photos = await getPendingPhotos();
  const count = photos.filter((p) => p.syncStatus !== 'completed').length;
  listeners.forEach((listener) => listener(count));
}

/**
 * The main OfflinePhotoService class
 */
export class OfflinePhotoService {
  private networkUnsubscribe: (() => void) | null = null;
  private autoSyncEnabled = true;

  constructor() {
    // Set up auto-sync on reconnection
    if (typeof window !== 'undefined') {
      this.networkUnsubscribe = subscribeToNetworkStatus((isOnline) => {
        if (isOnline && this.autoSyncEnabled) {
          this.processUploadQueue().catch(console.error);
        }
      });
    }
  }

  /**
   * Enable or disable automatic sync on reconnection
   */
  setAutoSync(enabled: boolean): void {
    this.autoSyncEnabled = enabled;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
      this.networkUnsubscribe = null;
    }
  }

  /**
   * Queue a photo for upload
   * Compresses, generates thumbnail, and stores in IndexedDB
   */
  async queuePhoto(
    photo: Omit<PendingPhoto, 'localId' | 'syncStatus' | 'retryCount' | 'createdAt' | 'blobData' | 'blobType'> & {
      blob: Blob;
    }
  ): Promise<string> {
    const db = await openPhotosDB();

    // Compress the photo for storage
    const compressedBlob = await compressPhoto(photo.blob, 1920, 0.8);

    // Generate thumbnail for quick display
    const thumbnail = await createThumbnail(photo.blob, 200);

    // Convert blob to ArrayBuffer for IndexedDB
    const blobData = await blobToArrayBuffer(compressedBlob);

    const localId = generateLocalId();
    const pendingPhoto: PendingPhoto = {
      localId,
      projectId: photo.projectId,
      orgId: photo.orgId,
      userId: photo.userId,
      userName: photo.userName,
      blobData,
      blobType: 'image/jpeg',
      thumbnail,
      filename: photo.filename || generatePhotoFilename('photo.jpg'),
      caption: photo.caption,
      category: photo.category,
      takenAt: photo.takenAt,
      location: photo.location,
      syncStatus: 'pending',
      retryCount: 0,
      createdAt: Date.now(),
      phaseId: photo.phaseId,
      albumId: photo.albumId,
      taskId: photo.taskId,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTOS_STORE, 'readwrite');
      const store = tx.objectStore(PHOTOS_STORE);
      const request = store.add(pendingPhoto);

      request.onsuccess = () => {
        notifyListeners();
        resolve(localId);
      };

      request.onerror = () => {
        reject(new Error('Failed to queue photo'));
      };
    });
  }

  /**
   * Get all pending photos
   */
  async getPendingPhotos(): Promise<PendingPhoto[]> {
    const db = await openPhotosDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTOS_STORE, 'readonly');
      const store = tx.objectStore(PHOTOS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const photos = request.result as PendingPhoto[];
        // Sort by createdAt, oldest first
        photos.sort((a, b) => a.createdAt - b.createdAt);
        resolve(photos);
      };

      request.onerror = () => {
        reject(new Error('Failed to get pending photos'));
      };
    });
  }

  /**
   * Get pending photos for a specific project
   */
  async getPendingPhotosForProject(projectId: string): Promise<PendingPhoto[]> {
    const db = await openPhotosDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTOS_STORE, 'readonly');
      const store = tx.objectStore(PHOTOS_STORE);
      const index = store.index('projectId');
      const request = index.getAll(projectId);

      request.onsuccess = () => {
        const photos = request.result as PendingPhoto[];
        photos.sort((a, b) => a.createdAt - b.createdAt);
        resolve(photos);
      };

      request.onerror = () => {
        reject(new Error('Failed to get project photos'));
      };
    });
  }

  /**
   * Get a single pending photo by ID
   */
  async getPendingPhoto(localId: string): Promise<PendingPhoto | null> {
    const db = await openPhotosDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTOS_STORE, 'readonly');
      const store = tx.objectStore(PHOTOS_STORE);
      const request = store.get(localId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error('Failed to get photo'));
      };
    });
  }

  /**
   * Upload a single photo to Firebase
   */
  async uploadPhoto(localId: string): Promise<{ success: boolean; url?: string; error?: string }> {
    const photo = await this.getPendingPhoto(localId);
    if (!photo) {
      return { success: false, error: 'Photo not found' };
    }

    if (!checkNetworkStatus()) {
      return { success: false, error: 'No network connection' };
    }

    try {
      // Update status to uploading
      await this.updatePendingPhoto(localId, { syncStatus: 'uploading', errorMessage: undefined });

      // Convert ArrayBuffer back to Blob
      const blob = arrayBufferToBlob(photo.blobData, photo.blobType);

      // Upload to Firebase Storage
      const storagePath = `projects/${photo.projectId}/photos/${photo.filename}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);

      // Upload thumbnail
      const thumbBlob = await fetch(photo.thumbnail).then((r) => r.blob());
      const thumbPath = `projects/${photo.projectId}/photos/thumbnails/thumb_${photo.filename}`;
      const thumbRef = ref(storage, thumbPath);
      await uploadBytes(thumbRef, thumbBlob);
      const thumbnailUrl = await getDownloadURL(thumbRef);

      // Create Firestore document
      const photoData = {
        projectId: photo.projectId,
        userId: photo.userId,
        userName: photo.userName,
        url,
        thumbnailUrl,
        type: photo.category,
        caption: photo.caption || null,
        phaseId: photo.phaseId || null,
        albumId: photo.albumId || null,
        taskId: photo.taskId || null,
        tags: [],
        approved: false,
        location: photo.location || null,
        takenAt: Timestamp.fromMillis(photo.takenAt),
        syncStatus: 'synced',
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'photos'), photoData);

      // Mark as completed and remove from queue
      await this.deletePendingPhoto(localId);

      return { success: true, url };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';

      // Update with error
      await this.updatePendingPhoto(localId, {
        syncStatus: 'failed',
        errorMessage,
        retryCount: photo.retryCount + 1,
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Process all pending uploads in the queue
   */
  async processUploadQueue(onProgress?: (progress: UploadProgress) => void): Promise<UploadResult> {
    if (isSyncing) {
      return { total: 0, successful: 0, failed: 0, errors: [] };
    }

    if (!checkNetworkStatus()) {
      return { total: 0, successful: 0, failed: 0, errors: [] };
    }

    isSyncing = true;

    const result: UploadResult = {
      total: 0,
      successful: 0,
      failed: 0,
      errors: [],
    };

    try {
      const photos = await this.getPendingPhotos();
      const pendingPhotos = photos.filter((p) => p.syncStatus === 'pending' || p.syncStatus === 'failed');

      result.total = pendingPhotos.length;

      for (let i = 0; i < pendingPhotos.length; i++) {
        const photo = pendingPhotos[i];

        if (onProgress) {
          onProgress({
            current: i + 1,
            total: result.total,
            currentPhotoId: photo.localId,
            status: 'uploading',
          });
        }

        const uploadResult = await this.uploadPhoto(photo.localId);

        if (uploadResult.success) {
          result.successful++;
          if (onProgress) {
            onProgress({
              current: i + 1,
              total: result.total,
              currentPhotoId: photo.localId,
              status: 'completed',
            });
          }
        } else {
          result.failed++;
          result.errors.push({
            localId: photo.localId,
            error: uploadResult.error || 'Unknown error',
          });
          if (onProgress) {
            onProgress({
              current: i + 1,
              total: result.total,
              currentPhotoId: photo.localId,
              status: 'failed',
            });
          }
        }
      }
    } finally {
      isSyncing = false;
    }

    notifyListeners();
    return result;
  }

  /**
   * Delete a pending photo from the queue
   */
  async deletePendingPhoto(localId: string): Promise<void> {
    const db = await openPhotosDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTOS_STORE, 'readwrite');
      const store = tx.objectStore(PHOTOS_STORE);
      const request = store.delete(localId);

      request.onsuccess = () => {
        notifyListeners();
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to delete pending photo'));
      };
    });
  }

  /**
   * Update a pending photo's metadata
   */
  async updatePendingPhoto(localId: string, updates: Partial<PendingPhoto>): Promise<void> {
    const db = await openPhotosDB();
    const photo = await this.getPendingPhoto(localId);

    if (!photo) {
      throw new Error('Photo not found');
    }

    const updatedPhoto: PendingPhoto = {
      ...photo,
      ...updates,
      localId: photo.localId, // Ensure localId doesn't change
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTOS_STORE, 'readwrite');
      const store = tx.objectStore(PHOTOS_STORE);
      const request = store.put(updatedPhoto);

      request.onsuccess = () => {
        notifyListeners();
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to update pending photo'));
      };
    });
  }

  /**
   * Retry failed uploads
   */
  async retryFailedUploads(): Promise<UploadResult> {
    const photos = await this.getPendingPhotos();
    const failedPhotos = photos.filter((p) => p.syncStatus === 'failed');

    // Reset status to pending
    for (const photo of failedPhotos) {
      await this.updatePendingPhoto(photo.localId, {
        syncStatus: 'pending',
        errorMessage: undefined,
      });
    }

    return this.processUploadQueue();
  }

  /**
   * Get count of pending photos
   */
  async getPendingCount(): Promise<number> {
    const photos = await this.getPendingPhotos();
    return photos.filter((p) => p.syncStatus !== 'completed').length;
  }

  /**
   * Subscribe to queue changes
   */
  subscribeToQueueChanges(listener: QueueChangeListener): () => void {
    listeners.add(listener);

    // Immediately notify with current count
    this.getPendingCount().then(listener).catch(console.error);

    return () => {
      listeners.delete(listener);
    };
  }

  /**
   * Check if sync is in progress
   */
  isSyncing(): boolean {
    return isSyncing;
  }

  /**
   * Clear all pending photos (use with caution)
   */
  async clearAll(): Promise<void> {
    const db = await openPhotosDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTOS_STORE, 'readwrite');
      const store = tx.objectStore(PHOTOS_STORE);
      const request = store.clear();

      request.onsuccess = () => {
        notifyListeners();
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to clear pending photos'));
      };
    });
  }
}

// Export singleton getter functions for convenience
let serviceInstance: OfflinePhotoService | null = null;

export function getOfflinePhotoService(): OfflinePhotoService {
  if (!serviceInstance) {
    serviceInstance = new OfflinePhotoService();
  }
  return serviceInstance;
}

// Re-export for easier access
export async function getPendingPhotos(): Promise<PendingPhoto[]> {
  return getOfflinePhotoService().getPendingPhotos();
}

export async function getPendingPhotosForProject(projectId: string): Promise<PendingPhoto[]> {
  return getOfflinePhotoService().getPendingPhotosForProject(projectId);
}
