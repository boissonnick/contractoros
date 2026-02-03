"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  getDocs,
  writeBatch,
  limit,
  startAfter,
  QueryConstraint,
  DocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import { ProjectPhoto, PhotoFolder, PhotoAlbum, BeforeAfterPair, PhotoAnnotation } from '@/types';
import { useAuth } from '@/lib/auth';
import { toast } from '@/components/ui/Toast';
import {
  processImage,
  getCurrentLocation,
  generatePhotoFilename,
  isValidImageFile,
} from '@/lib/photo-processing';
import { getOfflinePhotoService, PendingPhoto, PhotoCategory } from '@/lib/offline/offline-photos';
import { useNetworkStatus } from '@/lib/offline/network-status';

function photoFromFirestore(id: string, data: Record<string, unknown>): ProjectPhoto {
  return {
    id,
    projectId: data.projectId as string,
    taskId: data.taskId as string | undefined,
    phaseId: data.phaseId as string | undefined,
    scopeItemId: data.scopeItemId as string | undefined,
    folderId: data.folderId as string | undefined,
    albumId: data.albumId as string | undefined,
    userId: data.userId as string,
    userName: data.userName as string | undefined,
    url: data.url as string,
    thumbnailUrl: data.thumbnailUrl as string | undefined,
    type: data.type as ProjectPhoto['type'],
    caption: data.caption as string | undefined,
    tags: data.tags as string[] | undefined,
    approved: data.approved as boolean | undefined,
    location: data.location as ProjectPhoto['location'] | undefined,
    pairedPhotoId: data.pairedPhotoId as string | undefined,
    pairType: data.pairType as 'before' | 'after' | undefined,
    annotations: data.annotations as PhotoAnnotation[] | undefined,
    metadata: data.metadata as ProjectPhoto['metadata'] | undefined,
    isPublic: data.isPublic as boolean | undefined,
    shareToken: data.shareToken as string | undefined,
    syncStatus: data.syncStatus as ProjectPhoto['syncStatus'] | undefined,
    takenAt: data.takenAt ? (data.takenAt as Timestamp).toDate() : new Date(),
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
  };
}

function albumFromFirestore(id: string, data: Record<string, unknown>): PhotoAlbum {
  return {
    id,
    projectId: data.projectId as string,
    orgId: data.orgId as string,
    name: data.name as string,
    description: data.description as string | undefined,
    coverPhotoId: data.coverPhotoId as string | undefined,
    coverPhotoUrl: data.coverPhotoUrl as string | undefined,
    phaseId: data.phaseId as string | undefined,
    photoCount: (data.photoCount as number) || 0,
    isPublic: (data.isPublic as boolean) || false,
    shareToken: data.shareToken as string | undefined,
    shareExpiresAt: data.shareExpiresAt ? (data.shareExpiresAt as Timestamp).toDate() : undefined,
    clientAccessEnabled: (data.clientAccessEnabled as boolean) || false,
    clientAccessEmails: data.clientAccessEmails as string[] | undefined,
    createdBy: data.createdBy as string,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
  };
}

function folderFromFirestore(id: string, data: Record<string, unknown>): PhotoFolder {
  return {
    id,
    projectId: data.projectId as string,
    name: data.name as string,
    parentId: data.parentId as string | undefined,
    order: (data.order as number) || 0,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
  };
}

function pairFromFirestore(id: string, data: Record<string, unknown>): BeforeAfterPair {
  return {
    id,
    projectId: data.projectId as string,
    beforePhotoId: data.beforePhotoId as string,
    afterPhotoId: data.afterPhotoId as string,
    title: data.title as string | undefined,
    description: data.description as string | undefined,
    location: data.location as string | undefined,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
  };
}

export interface UploadPhotoOptions {
  phaseId?: string;
  albumId?: string;
  scopeItemId?: string;
  folderId?: string;
  type?: ProjectPhoto['type'];
  caption?: string;
  tags?: string[];
  captureLocation?: boolean;
}

// Extended photo type to include pending status
export interface MergedPhoto extends Omit<ProjectPhoto, 'id' | 'syncStatus'> {
  id: string;
  isPending?: boolean;
  localId?: string;
  syncStatus?: 'pending' | 'uploading' | 'failed' | 'completed' | 'synced';
}

export function useProjectPhotos(projectId: string) {
  const { user, profile } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [albums, setAlbums] = useState<PhotoAlbum[]>([]);
  const [folders, setFolders] = useState<PhotoFolder[]>([]);
  const [beforeAfterPairs, setBeforeAfterPairs] = useState<BeforeAfterPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const offlineService = getOfflinePhotoService();

  // Subscribe to photos
  useEffect(() => {
    if (!projectId) return;

    const photoQ = query(
      collection(db, 'photos'),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );

    const unsubPhotos = onSnapshot(
      photoQ,
      (snap) => {
        setPhotos(snap.docs.map((d) => photoFromFirestore(d.id, d.data())));
        setLoading(false);
      },
      (err) => {
        console.error('useProjectPhotos photos error:', err);
        setLoading(false);
      }
    );

    return unsubPhotos;
  }, [projectId]);

  // Subscribe to albums
  useEffect(() => {
    if (!projectId) return;

    const albumQ = query(
      collection(db, 'photoAlbums'),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );

    const unsubAlbums = onSnapshot(
      albumQ,
      (snap) => {
        setAlbums(snap.docs.map((d) => albumFromFirestore(d.id, d.data())));
      },
      (err) => {
        console.error('useProjectPhotos albums error:', err);
      }
    );

    return unsubAlbums;
  }, [projectId]);

  // Subscribe to before/after pairs
  useEffect(() => {
    if (!projectId) return;

    const pairQ = query(
      collection(db, 'beforeAfterPairs'),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );

    const unsubPairs = onSnapshot(
      pairQ,
      (snap) => {
        setBeforeAfterPairs(snap.docs.map((d) => pairFromFirestore(d.id, d.data())));
      },
      (err) => {
        console.error('useProjectPhotos pairs error:', err);
      }
    );

    return unsubPairs;
  }, [projectId]);

  // Subscribe to pending photos from IndexedDB
  useEffect(() => {
    if (!projectId) return;

    const loadPendingPhotos = async () => {
      try {
        const pending = await offlineService.getPendingPhotosForProject(projectId);
        setPendingPhotos(pending.filter((p) => p.syncStatus !== 'completed'));
      } catch (error) {
        console.error('Failed to load pending photos:', error);
      }
    };

    loadPendingPhotos();

    const unsubscribe = offlineService.subscribeToQueueChanges(() => {
      loadPendingPhotos();
    });

    return unsubscribe;
  }, [projectId, offlineService]);

  // Merged photos: synced photos + pending photos (pending first, marked)
  const mergedPhotos = useMemo((): MergedPhoto[] => {
    // Convert pending photos to MergedPhoto format
    const pendingAsMerged: MergedPhoto[] = pendingPhotos
      .filter((p) => p.syncStatus !== 'completed')
      .map((p) => ({
        id: p.localId,
        localId: p.localId,
        projectId: p.projectId,
        userId: p.userId,
        userName: p.userName,
        url: p.thumbnail, // Use thumbnail as temporary URL
        thumbnailUrl: p.thumbnail,
        type: p.category as ProjectPhoto['type'],
        caption: p.caption,
        location: p.location,
        takenAt: new Date(p.takenAt),
        createdAt: new Date(p.createdAt),
        isPending: true,
        syncStatus: p.syncStatus,
      }));

    // Convert synced photos
    const syncedAsMerged: MergedPhoto[] = photos.map((p) => ({
      ...p,
      isPending: false,
      syncStatus: 'synced' as const,
    }));

    // Return pending first, then synced (both sorted by createdAt desc)
    return [
      ...pendingAsMerged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      ...syncedAsMerged,
    ];
  }, [photos, pendingPhotos]);

  // Capture photo offline (for field use)
  const capturePhotoOffline = useCallback(
    async (
      blob: Blob,
      options: {
        category?: PhotoCategory;
        caption?: string;
        phaseId?: string;
        albumId?: string;
        taskId?: string;
        location?: { lat: number; lng: number };
      } = {}
    ) => {
      if (!user || !profile?.orgId) {
        toast.error('You must be logged in to capture photos');
        return null;
      }

      try {
        const localId = await offlineService.queuePhoto({
          projectId,
          orgId: profile.orgId,
          userId: user.uid,
          userName: profile.displayName || profile.email || 'Unknown',
          blob,
          thumbnail: '',
          filename: generatePhotoFilename('photo.jpg'),
          category: options.category || 'progress',
          caption: options.caption,
          takenAt: Date.now(),
          location: options.location,
          phaseId: options.phaseId,
          albumId: options.albumId,
          taskId: options.taskId,
        });

        toast.success('Photo saved! Will upload when online.');
        return localId;
      } catch (error) {
        console.error('Failed to capture photo offline:', error);
        toast.error('Failed to save photo');
        return null;
      }
    },
    [projectId, user, profile, offlineService]
  );

  // Sync pending photos
  const syncPendingPhotos = useCallback(async () => {
    if (!isOnline) {
      toast.error('No network connection');
      return { success: 0, failed: 0 };
    }

    setIsSyncing(true);
    try {
      const result = await offlineService.processUploadQueue();
      if (result.successful > 0) {
        toast.success(`${result.successful} photo${result.successful > 1 ? 's' : ''} uploaded`);
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} upload${result.failed > 1 ? 's' : ''} failed`);
      }
      return { success: result.successful, failed: result.failed };
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Sync failed');
      return { success: 0, failed: 0 };
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, offlineService]);

  // Delete pending photo
  const deletePendingPhoto = useCallback(
    async (localId: string) => {
      try {
        await offlineService.deletePendingPhoto(localId);
        toast.success('Pending photo deleted');
      } catch (error) {
        console.error('Failed to delete pending photo:', error);
        toast.error('Failed to delete photo');
      }
    },
    [offlineService]
  );

  // Upload a photo with processing
  const uploadPhoto = useCallback(
    async (file: File, options: UploadPhotoOptions = {}) => {
      if (!user || !profile) {
        toast.error('You must be logged in to upload photos');
        return null;
      }

      if (!isValidImageFile(file)) {
        toast.error('Invalid file type. Please upload an image.');
        return null;
      }

      try {
        // Process image (compress, generate thumbnail, extract metadata)
        const processed = await processImage(file);

        // Get location if requested
        let location: ProjectPhoto['location'] | undefined;
        if (options.captureLocation) {
          const coords = await getCurrentLocation();
          if (coords) {
            location = coords;
          }
        }

        // Generate unique filename
        const filename = generatePhotoFilename(file.name);
        const basePath = `projects/${projectId}/photos`;

        // Upload main image
        const mainRef = ref(storage, `${basePath}/${filename}`);
        await uploadBytes(mainRef, processed.file);
        const url = await getDownloadURL(mainRef);

        // Upload thumbnail
        const thumbFilename = `thumb_${filename}`;
        const thumbRef = ref(storage, `${basePath}/thumbnails/${thumbFilename}`);
        await uploadBytes(thumbRef, processed.thumbnail);
        const thumbnailUrl = await getDownloadURL(thumbRef);

        // Create photo document
        const photoData = {
          projectId,
          userId: user.uid,
          userName: profile.displayName || profile.email,
          url,
          thumbnailUrl,
          type: options.type || 'progress',
          caption: options.caption || null,
          phaseId: options.phaseId || null,
          albumId: options.albumId || null,
          scopeItemId: options.scopeItemId || null,
          folderId: options.folderId || null,
          tags: options.tags || [],
          approved: false,
          location: location || null,
          metadata: processed.metadata,
          takenAt: processed.metadata.takenAt
            ? Timestamp.fromDate(processed.metadata.takenAt)
            : Timestamp.now(),
          createdAt: Timestamp.now(),
        };

        const docRef = await addDoc(collection(db, 'photos'), photoData);

        // Update album photo count if applicable
        if (options.albumId) {
          const album = albums.find((a) => a.id === options.albumId);
          if (album) {
            await updateDoc(doc(db, 'photoAlbums', options.albumId), {
              photoCount: (album.photoCount || 0) + 1,
              updatedAt: Timestamp.now(),
            });
          }
        }

        toast.success('Photo uploaded successfully');
        return docRef.id;
      } catch (err) {
        console.error('Upload photo error:', err);
        toast.error('Failed to upload photo');
        return null;
      }
    },
    [projectId, user, profile, albums]
  );

  // Upload multiple photos
  const uploadPhotos = useCallback(
    async (files: File[], options: UploadPhotoOptions = {}) => {
      const results: (string | null)[] = [];
      for (const file of files) {
        const id = await uploadPhoto(file, options);
        results.push(id);
      }
      return results;
    },
    [uploadPhoto]
  );

  // Update a photo
  const updatePhoto = useCallback(async (photoId: string, data: Partial<ProjectPhoto>) => {
    try {
      const update: Record<string, unknown> = { ...data };
      delete update.id;
      Object.keys(update).forEach((k) => {
        if (update[k] === undefined) delete update[k];
      });
      update.updatedAt = Timestamp.now();
      await updateDoc(doc(db, 'photos', photoId), update);
      toast.success('Photo updated');
    } catch (err) {
      console.error('Update photo error:', err);
      toast.error('Failed to update photo');
    }
  }, []);

  // Delete a photo
  const deletePhoto = useCallback(
    async (photoId: string) => {
      try {
        const photo = photos.find((p) => p.id === photoId);
        if (!photo) return;

        // Delete from storage
        try {
          const mainRef = ref(storage, photo.url);
          await deleteObject(mainRef);
          if (photo.thumbnailUrl) {
            const thumbRef = ref(storage, photo.thumbnailUrl);
            await deleteObject(thumbRef);
          }
        } catch {
          // Storage deletion failed, continue with doc deletion
          console.warn('Failed to delete photo from storage');
        }

        // Delete document
        await deleteDoc(doc(db, 'photos', photoId));

        // Update album photo count
        if (photo.albumId) {
          const album = albums.find((a) => a.id === photo.albumId);
          if (album && album.photoCount > 0) {
            await updateDoc(doc(db, 'photoAlbums', photo.albumId), {
              photoCount: album.photoCount - 1,
              updatedAt: Timestamp.now(),
            });
          }
        }

        toast.success('Photo deleted');
      } catch (err) {
        console.error('Delete photo error:', err);
        toast.error('Failed to delete photo');
      }
    },
    [photos, albums]
  );

  // Approve/reject a photo
  const approvePhoto = useCallback(async (photoId: string, approved: boolean) => {
    try {
      await updateDoc(doc(db, 'photos', photoId), {
        approved,
        updatedAt: Timestamp.now(),
      });
      toast.success(approved ? 'Photo approved' : 'Photo approval revoked');
    } catch (err) {
      console.error('Approve photo error:', err);
      toast.error('Failed to update approval status');
    }
  }, []);

  // Add annotations to a photo
  const addAnnotation = useCallback(
    async (photoId: string, annotation: Omit<PhotoAnnotation, 'id' | 'createdBy' | 'createdAt'>) => {
      if (!user) return;

      try {
        const photo = photos.find((p) => p.id === photoId);
        if (!photo) return;

        const newAnnotation: PhotoAnnotation = {
          ...annotation,
          id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          createdBy: user.uid,
          createdAt: new Date(),
        };

        const annotations = [...(photo.annotations || []), newAnnotation];
        await updateDoc(doc(db, 'photos', photoId), {
          annotations,
          updatedAt: Timestamp.now(),
        });
      } catch (err) {
        console.error('Add annotation error:', err);
        toast.error('Failed to add annotation');
      }
    },
    [photos, user]
  );

  // Remove an annotation
  const removeAnnotation = useCallback(
    async (photoId: string, annotationId: string) => {
      try {
        const photo = photos.find((p) => p.id === photoId);
        if (!photo) return;

        const annotations = (photo.annotations || []).filter((a) => a.id !== annotationId);
        await updateDoc(doc(db, 'photos', photoId), {
          annotations,
          updatedAt: Timestamp.now(),
        });
      } catch (err) {
        console.error('Remove annotation error:', err);
        toast.error('Failed to remove annotation');
      }
    },
    [photos]
  );

  // Create an album
  const createAlbum = useCallback(
    async (name: string, options: { description?: string; phaseId?: string } = {}) => {
      if (!user || !profile?.orgId) {
        toast.error('You must be logged in to create albums');
        return null;
      }

      try {
        const albumData = {
          projectId,
          orgId: profile.orgId,
          name,
          description: options.description || null,
          phaseId: options.phaseId || null,
          photoCount: 0,
          isPublic: false,
          clientAccessEnabled: false,
          createdBy: user.uid,
          createdAt: Timestamp.now(),
        };

        const docRef = await addDoc(collection(db, 'photoAlbums'), albumData);
        toast.success('Album created');
        return docRef.id;
      } catch (err) {
        console.error('Create album error:', err);
        toast.error('Failed to create album');
        return null;
      }
    },
    [projectId, user, profile]
  );

  // Update an album
  const updateAlbum = useCallback(async (albumId: string, data: Partial<PhotoAlbum>) => {
    try {
      const update: Record<string, unknown> = { ...data };
      delete update.id;
      Object.keys(update).forEach((k) => {
        if (update[k] === undefined) delete update[k];
      });
      update.updatedAt = Timestamp.now();
      await updateDoc(doc(db, 'photoAlbums', albumId), update);
      toast.success('Album updated');
    } catch (err) {
      console.error('Update album error:', err);
      toast.error('Failed to update album');
    }
  }, []);

  // Delete an album (photos remain, just unlinked)
  const deleteAlbum = useCallback(
    async (albumId: string, deletePhotos = false) => {
      try {
        if (deletePhotos) {
          // Delete all photos in the album
          const albumPhotos = photos.filter((p) => p.albumId === albumId);
          for (const photo of albumPhotos) {
            await deletePhoto(photo.id);
          }
        } else {
          // Just unlink photos from album
          const batch = writeBatch(db);
          const albumPhotos = photos.filter((p) => p.albumId === albumId);
          albumPhotos.forEach((photo) => {
            batch.update(doc(db, 'photos', photo.id), { albumId: null });
          });
          await batch.commit();
        }

        // Delete album document
        await deleteDoc(doc(db, 'photoAlbums', albumId));
        toast.success('Album deleted');
      } catch (err) {
        console.error('Delete album error:', err);
        toast.error('Failed to delete album');
      }
    },
    [photos, deletePhoto]
  );

  // Generate share link for album
  const generateAlbumShareLink = useCallback(
    async (albumId: string, expiresInDays = 7) => {
      try {
        const shareToken = `share_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        const shareExpiresAt = new Date();
        shareExpiresAt.setDate(shareExpiresAt.getDate() + expiresInDays);

        await updateDoc(doc(db, 'photoAlbums', albumId), {
          isPublic: true,
          shareToken,
          shareExpiresAt: Timestamp.fromDate(shareExpiresAt),
          updatedAt: Timestamp.now(),
        });

        const shareUrl = `${window.location.origin}/gallery/${shareToken}`;
        toast.success('Share link generated');
        return shareUrl;
      } catch (err) {
        console.error('Generate share link error:', err);
        toast.error('Failed to generate share link');
        return null;
      }
    },
    []
  );

  // Create a before/after pair
  const createBeforeAfterPair = useCallback(
    async (
      beforePhotoId: string,
      afterPhotoId: string,
      options: { title?: string; description?: string; location?: string } = {}
    ) => {
      try {
        const pairData = {
          projectId,
          beforePhotoId,
          afterPhotoId,
          title: options.title || null,
          description: options.description || null,
          location: options.location || null,
          createdAt: Timestamp.now(),
        };

        const docRef = await addDoc(collection(db, 'beforeAfterPairs'), pairData);

        // Update photos with pair info
        await updateDoc(doc(db, 'photos', beforePhotoId), {
          pairedPhotoId: afterPhotoId,
          pairType: 'before',
          updatedAt: Timestamp.now(),
        });
        await updateDoc(doc(db, 'photos', afterPhotoId), {
          pairedPhotoId: beforePhotoId,
          pairType: 'after',
          updatedAt: Timestamp.now(),
        });

        toast.success('Before/after pair created');
        return docRef.id;
      } catch (err) {
        console.error('Create before/after pair error:', err);
        toast.error('Failed to create before/after pair');
        return null;
      }
    },
    [projectId]
  );

  // Delete a before/after pair
  const deleteBeforeAfterPair = useCallback(
    async (pairId: string) => {
      try {
        const pair = beforeAfterPairs.find((p) => p.id === pairId);
        if (!pair) return;

        // Remove pair info from photos
        await updateDoc(doc(db, 'photos', pair.beforePhotoId), {
          pairedPhotoId: null,
          pairType: null,
          updatedAt: Timestamp.now(),
        });
        await updateDoc(doc(db, 'photos', pair.afterPhotoId), {
          pairedPhotoId: null,
          pairType: null,
          updatedAt: Timestamp.now(),
        });

        // Delete pair document
        await deleteDoc(doc(db, 'beforeAfterPairs', pairId));
        toast.success('Before/after pair deleted');
      } catch (err) {
        console.error('Delete before/after pair error:', err);
        toast.error('Failed to delete before/after pair');
      }
    },
    [beforeAfterPairs]
  );

  // Get photos by album
  const getPhotosByAlbum = useCallback(
    (albumId: string) => {
      return photos.filter((p) => p.albumId === albumId);
    },
    [photos]
  );

  // Get photos by phase
  const getPhotosByPhase = useCallback(
    (phaseId: string) => {
      return photos.filter((p) => p.phaseId === phaseId);
    },
    [photos]
  );

  return {
    // Data
    photos,
    mergedPhotos,
    pendingPhotos,
    albums,
    folders,
    beforeAfterPairs,
    loading,

    // Offline state
    isOnline,
    isSyncing,
    pendingCount: pendingPhotos.filter((p) => p.syncStatus !== 'completed').length,

    // Photo operations
    uploadPhoto,
    uploadPhotos,
    updatePhoto,
    deletePhoto,
    approvePhoto,
    addAnnotation,
    removeAnnotation,

    // Offline operations
    capturePhotoOffline,
    syncPendingPhotos,
    deletePendingPhoto,

    // Album operations
    createAlbum,
    updateAlbum,
    deleteAlbum,
    generateAlbumShareLink,

    // Before/after operations
    createBeforeAfterPair,
    deleteBeforeAfterPair,

    // Helpers
    getPhotosByAlbum,
    getPhotosByPhase,
  };
}

/**
 * Options for configuring the paginated photos hook
 */
export interface UsePaginatedPhotosOptions {
  /**
   * Filter by project ID
   */
  projectId?: string;

  /**
   * Filter by phase ID
   */
  phaseId?: string;

  /**
   * Filter by task ID
   */
  taskId?: string;

  /**
   * Filter by album ID
   */
  albumId?: string;

  /**
   * Filter by photo type
   */
  type?: ProjectPhoto['type'];

  /**
   * Number of photos per page (default: 30 for gallery loading)
   */
  pageSize?: number;

  /**
   * Whether to enable the query (default: true)
   */
  enabled?: boolean;
}

/**
 * Result returned by the paginated photos hook
 */
export interface UsePaginatedPhotosResult {
  /**
   * All photos loaded so far (cumulative for infinite scroll)
   */
  photos: ProjectPhoto[];

  /**
   * Loading state (true during fetch operations)
   */
  loading: boolean;

  /**
   * Loading more photos (for infinite scroll indicator)
   */
  loadingMore: boolean;

  /**
   * Error if query failed
   */
  error: Error | null;

  /**
   * Whether there are more photos to load
   */
  hasMore: boolean;

  /**
   * Load more photos (for infinite scroll / load more button)
   */
  loadMore: () => Promise<void>;

  /**
   * Refresh data (resets to first page and clears loaded photos)
   */
  refresh: () => Promise<void>;

  /**
   * Total number of photos loaded
   */
  totalLoaded: number;

  /**
   * Current page size
   */
  pageSize: number;

  /**
   * Whether the hook has been initialized (first fetch completed)
   */
  initialized: boolean;
}

/**
 * Paginated photos hook for gallery-style loading.
 *
 * Provides infinite scroll / "load more" pagination for photos.
 * Photos accumulate as user scrolls (ideal for gallery UX).
 *
 * @example
 * // Basic usage - all photos for a project
 * const { photos, loading, hasMore, loadMore } = usePaginatedPhotos({
 *   projectId: 'project-123',
 * });
 *
 * @example
 * // Filtered by phase
 * const { photos, loadMore } = usePaginatedPhotos({
 *   projectId: 'project-123',
 *   phaseId: 'phase-456',
 *   pageSize: 20,
 * });
 *
 * @example
 * // With intersection observer for infinite scroll
 * useEffect(() => {
 *   const observer = new IntersectionObserver((entries) => {
 *     if (entries[0].isIntersecting && hasMore && !loadingMore) {
 *       loadMore();
 *     }
 *   });
 *   if (loadMoreRef.current) observer.observe(loadMoreRef.current);
 *   return () => observer.disconnect();
 * }, [hasMore, loadingMore, loadMore]);
 */
export function usePaginatedPhotos(
  options: UsePaginatedPhotosOptions = {}
): UsePaginatedPhotosResult {
  const {
    projectId,
    phaseId,
    taskId,
    albumId,
    type,
    pageSize = 30,
    enabled = true,
  } = options;

  // State
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Refs for cursor management
  const lastDocRef = useRef<DocumentSnapshot<DocumentData> | null>(null);
  const fetchInProgressRef = useRef(false);

  // Build filters array based on options
  const filtersKey = useMemo(() => {
    return JSON.stringify({ projectId, phaseId, taskId, albumId, type });
  }, [projectId, phaseId, taskId, albumId, type]);

  /**
   * Fetch photos with pagination
   */
  const fetchPhotos = useCallback(
    async (isLoadMore = false) => {
      if (!enabled || fetchInProgressRef.current) {
        return;
      }

      // Need at least a projectId to query
      if (!projectId) {
        setPhotos([]);
        setLoading(false);
        setInitialized(true);
        return;
      }

      fetchInProgressRef.current = true;

      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        // Build query constraints
        const constraints: QueryConstraint[] = [
          where('projectId', '==', projectId),
        ];

        // Add optional filters
        if (phaseId) {
          constraints.push(where('phaseId', '==', phaseId));
        }
        if (taskId) {
          constraints.push(where('taskId', '==', taskId));
        }
        if (albumId) {
          constraints.push(where('albumId', '==', albumId));
        }
        if (type) {
          constraints.push(where('type', '==', type));
        }

        // Add ordering
        constraints.push(orderBy('createdAt', 'desc'));

        // Add pagination
        if (isLoadMore && lastDocRef.current) {
          constraints.push(startAfter(lastDocRef.current));
        }
        constraints.push(limit(pageSize + 1)); // Fetch one extra to check for more

        // Execute query
        const q = query(collection(db, 'photos'), ...constraints);
        const snapshot = await getDocs(q);
        const docs = snapshot.docs;

        // Determine if there are more pages
        const hasMoreItems = docs.length > pageSize;
        const pageData = hasMoreItems ? docs.slice(0, pageSize) : docs;

        // Store cursor for next page
        if (pageData.length > 0) {
          lastDocRef.current = pageData[pageData.length - 1];
        }

        // Convert documents to typed items
        const newPhotos = pageData.map((docSnap) =>
          photoFromFirestore(docSnap.id, docSnap.data())
        );

        if (isLoadMore) {
          // Append to existing photos (infinite scroll)
          setPhotos((prev) => [...prev, ...newPhotos]);
        } else {
          // Replace photos (initial load or refresh)
          setPhotos(newPhotos);
        }

        setHasMore(hasMoreItems);
        setInitialized(true);
      } catch (err) {
        console.error('Error fetching paginated photos:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch photos'));
      } finally {
        setLoading(false);
        setLoadingMore(false);
        fetchInProgressRef.current = false;
      }
    },
    [enabled, projectId, phaseId, taskId, albumId, type, pageSize]
  );

  // Initial fetch when dependencies change
  useEffect(() => {
    // Reset state when filters change
    setPhotos([]);
    lastDocRef.current = null;
    setHasMore(true);
    setInitialized(false);

    if (enabled && projectId) {
      fetchPhotos(false);
    } else {
      setLoading(false);
      setInitialized(true);
    }
  }, [filtersKey, enabled, pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Load more photos (for infinite scroll / load more button)
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || loading || loadingMore) return;
    await fetchPhotos(true);
  }, [hasMore, loading, loadingMore, fetchPhotos]);

  /**
   * Refresh data (reset to first page and clear loaded photos)
   */
  const refresh = useCallback(async () => {
    setPhotos([]);
    lastDocRef.current = null;
    setHasMore(true);
    await fetchPhotos(false);
  }, [fetchPhotos]);

  return {
    photos,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    totalLoaded: photos.length,
    pageSize,
    initialized,
  };
}
