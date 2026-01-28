"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection, query, where, onSnapshot, addDoc, updateDoc, doc, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { WeeklyTimesheet } from '@/types';
import { useAuth } from '@/lib/auth';

function fromFirestore(id: string, data: Record<string, unknown>): WeeklyTimesheet {
  return {
    id,
    orgId: data.orgId as string,
    userId: data.userId as string,
    userName: data.userName as string | undefined,
    weekStart: data.weekStart ? (data.weekStart as Timestamp).toDate() : new Date(),
    entries: (data.entries as WeeklyTimesheet['entries']) || [],
    totalHours: (data.totalHours as number) || 0,
    overtimeHours: (data.overtimeHours as number) || 0,
    status: (data.status as WeeklyTimesheet['status']) || 'draft',
    submittedAt: data.submittedAt ? (data.submittedAt as Timestamp).toDate() : undefined,
    approvedBy: data.approvedBy as string | undefined,
    approvedAt: data.approvedAt ? (data.approvedAt as Timestamp).toDate() : undefined,
  };
}

interface UseWeeklyTimesheetsOptions {
  orgId?: string;
  userId?: string;
  status?: WeeklyTimesheet['status'];
}

export function useWeeklyTimesheets({ orgId, userId, status }: UseWeeklyTimesheetsOptions) {
  const { user, profile } = useAuth();
  const targetOrgId = orgId || profile?.orgId;
  const [timesheets, setTimesheets] = useState<WeeklyTimesheet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetOrgId) return;
    const constraints: ReturnType<typeof where>[] = [where('orgId', '==', targetOrgId)];
    if (userId) constraints.push(where('userId', '==', userId));
    if (status) constraints.push(where('status', '==', status));

    const q = query(collection(db, 'weeklyTimesheets'), ...constraints);
    const unsub = onSnapshot(q, (snap) => {
      setTimesheets(snap.docs.map(d => fromFirestore(d.id, d.data() as Record<string, unknown>)).sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime()));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [targetOrgId, userId, status]);

  const submitTimesheet = useCallback(async (weekStart: Date, totalHours: number, overtimeHours: number) => {
    if (!user || !profile) return;
    await addDoc(collection(db, 'weeklyTimesheets'), {
      orgId: profile.orgId,
      userId: user.uid,
      userName: profile.displayName,
      weekStart: Timestamp.fromDate(weekStart),
      entries: [],
      totalHours,
      overtimeHours,
      status: 'submitted',
      submittedAt: Timestamp.now(),
    });
  }, [user, profile]);

  const approveTimesheet = useCallback(async (timesheetId: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'weeklyTimesheets', timesheetId), {
      status: 'approved',
      approvedBy: user.uid,
      approvedAt: Timestamp.now(),
    });
  }, [user]);

  const rejectTimesheet = useCallback(async (timesheetId: string) => {
    await updateDoc(doc(db, 'weeklyTimesheets', timesheetId), {
      status: 'rejected',
    });
  }, []);

  return { timesheets, loading, submitTimesheet, approveTimesheet, rejectTimesheet };
}
