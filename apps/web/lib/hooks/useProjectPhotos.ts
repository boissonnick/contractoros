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
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import { ProjectPhoto, PhotoFolder } from '@/types';
import { useAuth } from '@/lib/auth';

function photoFromFirestore(id: string, data: Record<string, unknown>): ProjectPhoto {
  return {
    id,
    projectId: data.projectId as string,
    taskId: data.taskId as string | undefined,
    phaseId: data.phaseId as string | undefined,
    scopeItemId: data.scopeItemId as string | undefined,
    folderId: data.folderId as string | undefined,
    userId: data.userId as string,
    userName: data.userName as string | undefined,
    url: data.url as string,
    thumbnailUrl: data.thumbnailUrl as string | undefined,
    type: data.type as ProjectPhoto['type'],
    caption: data.caption as string | undefined,
    tags: data.tags as string[] | undefined,
    approved: data.approved as boolean | undefined,
    location: data.location as ProjectPhoto['location'] | undefined,
    takenAt: data.takenAt ? (data.takenAt as Timestamp).toDate() : new Date(),
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
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

export function useProjectPhotos(projectId: string) {
  const { user, profile } = useAuth();
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
  const [folders, setFolders] = useState<PhotoFolder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    const photoQ = query(collection(db, 'photos'), where('projectId', '==', projectId), orderBy('createdAt', 'desc'));
    const unsub1 = onSnapshot(photoQ, (snap) => {
      setPhotos(snap.docs.map(d => photoFromFirestore(d.id, d.data())));
      setLoading(false);
    }, (err) => { console.error('useProjectPhotos error:', err); setLoading(false); });

    const folderQ = query(collection(db, 'photos'), where('projectId', '==', projectId));
    // Use a separate collection for folders if needed, or keep flat
    // For now, folders are stored inline (folderId on photos)

    return unsub1;
  }, [projectId]);

  const uploadPhoto = useCallback(async (file: File, metadata: {
    phaseId?: string;
    scopeItemId?: string;
    folderId?: string;
    type?: ProjectPhoto['type'];
    caption?: string;
    tags?: string[];
  }) => {
    if (!user || !profile) return;

    // Compress if needed (skip for now, just upload)
    const path = `projects/${projectId}/photos/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    await addDoc(collection(db, 'photos'), {
      projectId,
      userId: user.uid,
      userName: profile.displayName,
      url,
      type: metadata.type || 'progress',
      caption: metadata.caption || null,
      phaseId: metadata.phaseId || null,
      scopeItemId: metadata.scopeItemId || null,
      folderId: metadata.folderId || null,
      tags: metadata.tags || [],
      approved: false,
      takenAt: Timestamp.now(),
      createdAt: Timestamp.now(),
    });
  }, [projectId, user, profile]);

  const updatePhoto = useCallback(async (photoId: string, data: Partial<ProjectPhoto>) => {
    const update: Record<string, unknown> = { ...data };
    delete update.id;
    Object.keys(update).forEach(k => { if (update[k] === undefined) delete update[k]; });
    update.updatedAt = Timestamp.now();
    await updateDoc(doc(db, 'photos', photoId), update);
  }, []);

  const deletePhoto = useCallback(async (photoId: string) => {
    await deleteDoc(doc(db, 'photos', photoId));
  }, []);

  const approvePhoto = useCallback(async (photoId: string, approved: boolean) => {
    await updateDoc(doc(db, 'photos', photoId), { approved, updatedAt: Timestamp.now() });
  }, []);

  return { photos, folders, loading, uploadPhoto, updatePhoto, deletePhoto, approvePhoto };
}
