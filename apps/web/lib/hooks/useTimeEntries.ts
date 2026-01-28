"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection, query, where, onSnapshot, updateDoc, doc, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { TimeEntry } from '@/types';
import { useAuth } from '@/lib/auth';

function fromFirestore(id: string, data: Record<string, unknown>): TimeEntry {
  return {
    id,
    userId: data.userId as string,
    projectId: data.projectId as string,
    taskId: data.taskId as string | undefined,
    clockIn: data.clockIn ? (data.clockIn as Timestamp).toDate() : new Date(),
    clockOut: data.clockOut ? (data.clockOut as Timestamp).toDate() : undefined,
    breakMinutes: data.breakMinutes as number | undefined,
    totalMinutes: data.totalMinutes as number | undefined,
    location: data.location as TimeEntry['location'],
    notes: data.notes as string | undefined,
    status: (data.status as TimeEntry['status']) || 'completed',
    approvedBy: data.approvedBy as string | undefined,
    approvedAt: data.approvedAt ? (data.approvedAt as Timestamp).toDate() : undefined,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
  };
}

interface UseTimeEntriesOptions {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}

export function useTimeEntries({ userId, startDate, endDate }: UseTimeEntriesOptions) {
  const { user } = useAuth();
  const targetUserId = userId || user?.uid;
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetUserId) return;
    const constraints: ReturnType<typeof where>[] = [where('userId', '==', targetUserId)];
    if (startDate) constraints.push(where('clockIn', '>=', Timestamp.fromDate(startDate)));
    if (endDate) constraints.push(where('clockIn', '<=', Timestamp.fromDate(endDate)));

    const q = query(collection(db, 'timeEntries'), ...constraints);
    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map(d => fromFirestore(d.id, d.data() as Record<string, unknown>)).sort((a, b) => b.clockIn.getTime() - a.clockIn.getTime()));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId, startDate?.getTime(), endDate?.getTime()]);

  const updateEntry = useCallback(async (entryId: string, data: Partial<TimeEntry>) => {
    const update: Record<string, unknown> = { ...data, updatedAt: Timestamp.now() };
    if (data.clockIn) update.clockIn = Timestamp.fromDate(data.clockIn);
    if (data.clockOut) update.clockOut = Timestamp.fromDate(data.clockOut);
    if (data.approvedAt) update.approvedAt = Timestamp.fromDate(data.approvedAt);
    delete update.id;
    delete update.createdAt;
    await updateDoc(doc(db, 'timeEntries', entryId), update);
  }, []);

  return { entries, loading, updateEntry };
}
