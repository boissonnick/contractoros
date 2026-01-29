"use client";

import { useState, useEffect, useCallback } from 'react';
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

export function useProjectPhotos(projectId: string) {
  const { user, profile } = useAuth();
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
  const [albums, setAlbums] = useState<PhotoAlbum[]>([]);
  const [folders, setFolders] = useState<PhotoFolder[]>([]);
  const [beforeAfterPairs, setBeforeAfterPairs] = useState<BeforeAfterPair[]>([]);
  const [loading, setLoading] = useState(true);

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
    albums,
    folders,
    beforeAfterPairs,
    loading,

    // Photo operations
    uploadPhoto,
    uploadPhotos,
    updatePhoto,
    deletePhoto,
    approvePhoto,
    addAnnotation,
    removeAnnotation,

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
