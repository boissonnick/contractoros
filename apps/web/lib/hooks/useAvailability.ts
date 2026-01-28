"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDocs, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Availability, AvailabilityDefault } from '@/types';
import { useAuth } from '@/lib/auth';

function fromFirestore(id: string, data: Record<string, unknown>): Availability {
  return {
    id,
    userId: data.userId as string,
    date: data.date ? (data.date as Timestamp).toDate() : new Date(),
    isAvailable: data.isAvailable as boolean,
    startTime: data.startTime as string | undefined,
    endTime: data.endTime as string | undefined,
    notes: data.notes as string | undefined,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
  };
}

interface UseAvailabilityOptions {
  userId?: string;
  month?: Date;
}

export function useAvailability({ userId, month }: UseAvailabilityOptions) {
  const { user, profile } = useAuth();
  const targetUserId = userId || user?.uid;
  const [overrides, setOverrides] = useState<Availability[]>([]);
  const [defaults, setDefaults] = useState<AvailabilityDefault[]>([]);
  const [loading, setLoading] = useState(true);

  // Load weekly defaults
  useEffect(() => {
    if (!targetUserId) return;
    const q = query(collection(db, 'availabilityDefaults'), where('userId', '==', targetUserId));
    const unsub = onSnapshot(q, (snap) => {
      setDefaults(snap.docs.map(d => ({ id: d.id, ...d.data() } as AvailabilityDefault)));
    });
    return unsub;
  }, [targetUserId]);

  // Load date-specific overrides for current month
  useEffect(() => {
    if (!targetUserId) return;
    const target = month || new Date();
    const startOfMonth = new Date(target.getFullYear(), target.getMonth(), 1);
    const endOfMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0, 23, 59, 59);

    const q = query(
      collection(db, 'availability'),
      where('userId', '==', targetUserId),
      where('date', '>=', Timestamp.fromDate(startOfMonth)),
      where('date', '<=', Timestamp.fromDate(endOfMonth))
    );
    const unsub = onSnapshot(q, (snap) => {
      setOverrides(snap.docs.map(d => fromFirestore(d.id, d.data())));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [targetUserId, month?.getMonth(), month?.getFullYear()]);

  const saveDefaults = useCallback(async (newDefaults: Omit<AvailabilityDefault, 'id'>[]) => {
    if (!targetUserId || !profile?.orgId) return;
    const existing = await getDocs(query(collection(db, 'availabilityDefaults'), where('userId', '==', targetUserId)));
    const batch: Promise<void>[] = existing.docs.map(d => deleteDoc(doc(db, 'availabilityDefaults', d.id)));
    await Promise.all(batch);
    for (const def of newDefaults) {
      await addDoc(collection(db, 'availabilityDefaults'), { ...def, userId: targetUserId, orgId: profile.orgId });
    }
  }, [targetUserId, profile?.orgId]);

  const toggleDateOverride = useCallback(async (date: Date, isAvailable: boolean, startTime?: string, endTime?: string) => {
    if (!targetUserId) return;
    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const existing = overrides.find(o => {
      const oDate = new Date(o.date.getFullYear(), o.date.getMonth(), o.date.getDate());
      return oDate.getTime() === dateStart.getTime();
    });
    if (existing) {
      if (existing.isAvailable === isAvailable) {
        await deleteDoc(doc(db, 'availability', existing.id));
      } else {
        await updateDoc(doc(db, 'availability', existing.id), { isAvailable, startTime, endTime });
      }
    } else {
      await addDoc(collection(db, 'availability'), {
        userId: targetUserId,
        date: Timestamp.fromDate(dateStart),
        isAvailable,
        startTime: startTime || '08:00',
        endTime: endTime || '17:00',
        createdAt: Timestamp.now(),
      });
    }
  }, [targetUserId, overrides]);

  const getAvailabilityForDate = useCallback((date: Date): { isAvailable: boolean; startTime: string; endTime: string; isOverride: boolean } => {
    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const override = overrides.find(o => {
      const oDate = new Date(o.date.getFullYear(), o.date.getMonth(), o.date.getDate());
      return oDate.getTime() === dateStart.getTime();
    });
    if (override) {
      return { isAvailable: override.isAvailable, startTime: override.startTime || '08:00', endTime: override.endTime || '17:00', isOverride: true };
    }
    const dayDefault = defaults.find(d => d.dayOfWeek === date.getDay());
    if (dayDefault) {
      return { isAvailable: dayDefault.isAvailable, startTime: dayDefault.startTime, endTime: dayDefault.endTime, isOverride: false };
    }
    const isWeekday = date.getDay() >= 1 && date.getDay() <= 5;
    return { isAvailable: isWeekday, startTime: '08:00', endTime: '17:00', isOverride: false };
  }, [overrides, defaults]);

  return { overrides, defaults, loading, saveDefaults, toggleDateOverride, getAvailabilityForDate };
}
