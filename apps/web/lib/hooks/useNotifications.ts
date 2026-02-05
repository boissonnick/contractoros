"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  setDoc,
  Timestamp,
  writeBatch,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { AppNotification, NotificationPreferences, QuietHoursConfig, DayOfWeek } from '@/types';
import { useAuth } from '@/lib/auth';

function fromFirestore(id: string, data: Record<string, unknown>): AppNotification {
  return {
    id,
    orgId: data.orgId as string,
    userId: data.userId as string,
    type: data.type as AppNotification['type'],
    title: data.title as string,
    body: data.body as string,
    link: data.link as string | undefined,
    projectId: data.projectId as string | undefined,
    isRead: (data.isRead as boolean) || false,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
  };
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      firestoreLimit(50),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) =>
        fromFirestore(d.id, d.data() as Record<string, unknown>)
      );
      setNotifications(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = useCallback(async (notificationId: string) => {
    await updateDoc(doc(db, 'notifications', notificationId), { isRead: true });
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    unread.forEach((n) => {
      batch.update(doc(db, 'notifications', n.id), { isRead: true });
    });
    await batch.commit();
  }, [notifications]);

  return { notifications, loading, unreadCount, markAsRead, markAllAsRead };
}

const DEFAULT_QUIET_HOURS: QuietHoursConfig = {
  enabled: false,
  startTime: '22:00',
  endTime: '07:00',
  days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
  allowHighPriority: true,
};

/**
 * Check if quiet hours are currently active based on config
 */
export function isQuietHoursActive(config: QuietHoursConfig | undefined): boolean {
  if (!config?.enabled) return false;

  const now = new Date();
  const currentDay = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()] as DayOfWeek;

  // Check if today is in the scheduled days
  if (!config.days.includes(currentDay)) return false;

  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [startHour, startMin] = config.startTime.split(':').map(Number);
  const [endHour, endMin] = config.endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  // Handle overnight quiet hours (e.g., 22:00 - 07:00)
  if (startMinutes > endMinutes) {
    // Quiet hours span midnight
    return currentTime >= startMinutes || currentTime < endMinutes;
  } else {
    // Same-day quiet hours (e.g., 13:00 - 14:00)
    return currentTime >= startMinutes && currentTime < endMinutes;
  }
}

export function useNotificationPreferences() {
  const { user, profile } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid || !profile?.orgId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'notificationPreferences'),
      where('userId', '==', user.uid),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        // Default preferences
        setPreferences({
          id: '',
          userId: user.uid,
          orgId: profile.orgId!,
          email: {
            enabled: true,
            taskAssigned: true,
            taskDueSoon: true,
            invoicePaid: true,
            invoiceOverdue: true,
            rfiCreated: true,
            expenseApproved: true,
            changeOrderPending: true,
            selectionPending: true,
            messages: false,
            mentions: true,
            dailyDigest: false,
          },
          push: {
            enabled: true,
            taskAssigned: true,
            taskDueSoon: true,
            invoicePaid: true,
            changeOrderPending: true,
            messages: true,
            mentions: true,
          },
          quietHours: DEFAULT_QUIET_HOURS,
          projectSettings: [],
        });
      } else {
        const d = snapshot.docs[0];
        const data = d.data() as Omit<NotificationPreferences, 'id'>;
        setPreferences({
          id: d.id,
          ...data,
          quietHours: data.quietHours || DEFAULT_QUIET_HOURS,
          projectSettings: data.projectSettings || [],
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, profile?.orgId]);

  const updatePreference = useCallback(
    async (
      category: 'email' | 'push',
      key: string,
      value: boolean
    ): Promise<boolean> => {
      if (!user?.uid || !profile?.orgId || !preferences) return false;

      try {
        const updatedPreferences = {
          ...preferences,
          [category]: {
            ...preferences[category],
            [key]: value,
          },
        };

        if (preferences.id) {
          // Update existing document
          await updateDoc(doc(db, 'notificationPreferences', preferences.id), {
            [category]: updatedPreferences[category],
          });
        } else {
          // Create new document
          const newDocRef = doc(collection(db, 'notificationPreferences'));
          await setDoc(newDocRef, {
            userId: user.uid,
            orgId: profile.orgId,
            email: updatedPreferences.email,
            push: updatedPreferences.push,
            quietHours: updatedPreferences.quietHours,
          });
        }

        return true;
      } catch (error) {
        console.error('Failed to update notification preference:', error);
        return false;
      }
    },
    [user?.uid, profile?.orgId, preferences]
  );

  const updateQuietHours = useCallback(
    async (quietHours: QuietHoursConfig): Promise<boolean> => {
      if (!user?.uid || !profile?.orgId || !preferences) return false;

      try {
        if (preferences.id) {
          await updateDoc(doc(db, 'notificationPreferences', preferences.id), {
            quietHours,
          });
        } else {
          const newDocRef = doc(collection(db, 'notificationPreferences'));
          await setDoc(newDocRef, {
            userId: user.uid,
            orgId: profile.orgId,
            email: preferences.email,
            push: preferences.push,
            quietHours,
          });
        }
        return true;
      } catch (error) {
        console.error('Failed to update quiet hours:', error);
        return false;
      }
    },
    [user?.uid, profile?.orgId, preferences]
  );

  const quietHoursActive = isQuietHoursActive(preferences?.quietHours);

  // Expose the preferences ID separately for project settings component
  const preferencesId = preferences?.id || null;

  // Force a refresh of preferences (useful after project settings are updated)
  const refetch = useCallback(() => {
    // The onSnapshot listener will automatically update, but this triggers a re-render
    setLoading(true);
    setTimeout(() => setLoading(false), 100);
  }, []);

  return {
    preferences,
    loading,
    updatePreference,
    updateQuietHours,
    quietHoursActive,
    preferencesId,
    refetch,
  };
}
