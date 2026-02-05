/**
 * Notification Service
 * Server-side functions for creating and managing notifications
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { CreateNotificationData } from './types';

/**
 * Create a new notification for a user
 */
export async function createNotification(
  orgId: string,
  data: CreateNotificationData
): Promise<string> {
  const notificationsRef = collection(db, `organizations/${orgId}/notifications`);

  const notification = {
    orgId,
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    read: false,
    createdAt: serverTimestamp(),
    actionUrl: data.actionUrl || null,
    metadata: data.metadata || null,
  };

  const docRef = await addDoc(notificationsRef, notification);
  return docRef.id;
}

/**
 * Create notifications for multiple users
 */
export async function createNotificationBatch(
  orgId: string,
  userIds: string[],
  data: Omit<CreateNotificationData, 'userId'>
): Promise<void> {
  const batch = writeBatch(db);
  const notificationsRef = collection(db, `organizations/${orgId}/notifications`);

  for (const userId of userIds) {
    const docRef = doc(notificationsRef);
    batch.set(docRef, {
      orgId,
      userId,
      type: data.type,
      title: data.title,
      message: data.message,
      read: false,
      createdAt: serverTimestamp(),
      actionUrl: data.actionUrl || null,
      metadata: data.metadata || null,
    });
  }

  await batch.commit();
}

/**
 * Mark a notification as read
 */
export async function markAsRead(
  orgId: string,
  notificationId: string
): Promise<void> {
  const notificationRef = doc(db, `organizations/${orgId}/notifications/${notificationId}`);
  await updateDoc(notificationRef, {
    read: true,
    readAt: serverTimestamp(),
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(
  orgId: string,
  userId: string
): Promise<void> {
  const notificationsRef = collection(db, `organizations/${orgId}/notifications`);
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    where('read', '==', false)
  );

  const snapshot = await getDocs(q);
  const batch = writeBatch(db);

  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, {
      read: true,
      readAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  orgId: string,
  notificationId: string
): Promise<void> {
  const notificationRef = doc(db, `organizations/${orgId}/notifications/${notificationId}`);
  await deleteDoc(notificationRef);
}

/**
 * Delete all read notifications older than specified days
 */
export async function cleanupOldNotifications(
  orgId: string,
  userId: string,
  daysOld: number = 30
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const notificationsRef = collection(db, `organizations/${orgId}/notifications`);
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    where('read', '==', true),
    where('createdAt', '<', Timestamp.fromDate(cutoffDate))
  );

  const snapshot = await getDocs(q);
  const batch = writeBatch(db);

  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  return snapshot.size;
}
