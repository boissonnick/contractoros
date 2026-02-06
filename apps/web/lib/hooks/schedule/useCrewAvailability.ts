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
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import { CrewAvailability } from '@/types';
import { toast } from '@/components/ui/Toast';
import { logger } from '@/lib/utils/logger';

// =============================================================================
// TYPES
// =============================================================================

export interface UseCrewAvailabilityOptions {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface UseCrewAvailabilityReturn {
  availability: CrewAvailability[];
  loading: boolean;

  setAvailability: (data: SetAvailabilityData) => Promise<string>;
  updateAvailability: (id: string, data: Partial<SetAvailabilityData>) => Promise<void>;
  deleteAvailability: (id: string) => Promise<void>;

  isUserAvailable: (userId: string, date: Date, startTime?: string, endTime?: string) => boolean;
  getAvailableUsers: (date: Date, startTime?: string, endTime?: string) => string[];
}

export interface SetAvailabilityData {
  userId: string;
  userName: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  status: 'available' | 'unavailable' | 'limited';
  reason?: 'time_off' | 'sick' | 'training' | 'other_job' | 'personal' | 'other';
  notes?: string;
  isRecurring?: boolean;
  recurrencePattern?: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
  recurrenceEndDate?: Date;
}

// =============================================================================
// HOOK
// =============================================================================

export function useCrewAvailability(
  options: UseCrewAvailabilityOptions = {}
): UseCrewAvailabilityReturn {
  const { profile } = useAuth();
  const [availability, setAvailabilityState] = useState<CrewAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  const orgId = profile?.orgId;

  useEffect(() => {
    if (!orgId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
      setLoading(false);
      return;
    }

    const constraints: any[] = [
      where('orgId', '==', orgId),
      orderBy('date', 'asc'),
    ];

    if (options.userId) {
      constraints.push(where('userId', '==', options.userId));
    }

    const q = query(collection(db, 'crewAvailability'), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let items = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            date: data.date?.toDate() || new Date(),
            recurrenceEndDate: data.recurrenceEndDate?.toDate(),
            createdAt: data.createdAt?.toDate() || new Date(),
          } as CrewAvailability;
        });

        // Client-side date filtering
        if (options.startDate) {
          items = items.filter((a) => a.date >= options.startDate!);
        }
        if (options.endDate) {
          items = items.filter((a) => a.date <= options.endDate!);
        }

        setAvailabilityState(items);
        setLoading(false);
      },
      (err) => {
        logger.error('Error loading crew availability', { error: err, hook: 'useCrewAvailability' });
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [orgId, options.userId, options.startDate, options.endDate]);

  const setAvailability = useCallback(
    async (data: SetAvailabilityData): Promise<string> => {
      if (!orgId || !profile?.uid) {
        throw new Error('Not authenticated');
      }

      const docRef = await addDoc(collection(db, 'crewAvailability'), {
        orgId,
        ...data,
        allDay: data.allDay ?? true,
        isRecurring: data.isRecurring ?? false,
        recurrencePattern: data.recurrencePattern || 'none',
        date: Timestamp.fromDate(data.date),
        recurrenceEndDate: data.recurrenceEndDate
          ? Timestamp.fromDate(data.recurrenceEndDate)
          : null,
        createdAt: serverTimestamp(),
        createdBy: profile.uid,
      });

      toast.success('Availability updated');
      return docRef.id;
    },
    [orgId, profile?.uid]
  );

  const updateAvailability = useCallback(
    async (id: string, data: Partial<SetAvailabilityData>): Promise<void> => {
      const updateData: Record<string, unknown> = { ...data };

      if (data.date) {
        updateData.date = Timestamp.fromDate(data.date);
      }
      if (data.recurrenceEndDate) {
        updateData.recurrenceEndDate = Timestamp.fromDate(data.recurrenceEndDate);
      }

      await updateDoc(doc(db, 'crewAvailability', id), updateData);
      toast.success('Availability updated');
    },
    []
  );

  const deleteAvailability = useCallback(async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'crewAvailability', id));
    toast.success('Availability removed');
  }, []);

  const isUserAvailable = useCallback(
    (userId: string, date: Date, startTime?: string, endTime?: string): boolean => {
      const dateStr = date.toDateString();

      const userAvailability = availability.filter(
        (a) => a.userId === userId && a.date.toDateString() === dateStr
      );

      // If no availability records, assume available
      if (userAvailability.length === 0) return true;

      // Check each availability record
      for (const record of userAvailability) {
        if (record.status === 'unavailable') {
          if (record.allDay) return false;

          // Check time overlap if times are specified
          if (startTime && endTime && record.startTime && record.endTime) {
            if (startTime < record.endTime && endTime > record.startTime) {
              return false;
            }
          }
        }
      }

      return true;
    },
    [availability]
  );

  const getAvailableUsers = useCallback(
    (date: Date, startTime?: string, endTime?: string): string[] => {
      // This would need a list of all users - for now, return users not marked unavailable
      const dateStr = date.toDateString();
      const unavailableUserIds = new Set<string>();

      availability
        .filter((a) => a.date.toDateString() === dateStr && a.status === 'unavailable')
        .forEach((a) => {
          if (a.allDay) {
            unavailableUserIds.add(a.userId);
          } else if (startTime && endTime && a.startTime && a.endTime) {
            if (startTime < a.endTime && endTime > a.startTime) {
              unavailableUserIds.add(a.userId);
            }
          }
        });

      // Return users who are not unavailable
      const allUserIds = Array.from(new Set(availability.map((a) => a.userId)));
      return allUserIds.filter((id) => !unavailableUserIds.has(id));
    },
    [availability]
  );

  return {
    availability,
    loading,
    setAvailability,
    updateAvailability,
    deleteAvailability,
    isUserAvailable,
    getAvailableUsers,
  };
}
