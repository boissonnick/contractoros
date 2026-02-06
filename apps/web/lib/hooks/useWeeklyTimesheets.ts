"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection, query, where, onSnapshot, addDoc, updateDoc, doc, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { WeeklyTimesheet, TimesheetReviewEntry } from '@/types';
import { useAuth } from '@/lib/auth';
import { logger } from '@/lib/utils/logger';

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
    approvedByName: data.approvedByName as string | undefined,
    approvedAt: data.approvedAt ? (data.approvedAt as Timestamp).toDate() : undefined,
    rejectionReason: data.rejectionReason as string | undefined,
    reviewedBy: data.reviewedBy as string | undefined,
    reviewHistory: Array.isArray(data.reviewHistory)
      ? (data.reviewHistory as Array<Record<string, unknown>>).map(r => ({
          action: r.action as 'approved' | 'rejected',
          reviewedBy: r.reviewedBy as string,
          reviewedByName: r.reviewedByName as string | undefined,
          reviewedAt: r.reviewedAt ? (r.reviewedAt as Timestamp).toDate() : new Date(),
          reason: r.reason as string | undefined,
        }))
      : undefined,
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

    const q = query(collection(db, `organizations/${targetOrgId}/weeklyTimesheets`), ...constraints);
    const unsub = onSnapshot(q, (snap) => {
      setTimesheets(snap.docs.map(d => fromFirestore(d.id, d.data() as Record<string, unknown>)).sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime()));
      setLoading(false);
    }, (err) => {
      logger.error('Error loading timesheets', { error: err, hook: 'useWeeklyTimesheets' });
      setLoading(false);
    });
    return unsub;
  }, [targetOrgId, userId, status]);

  const submitTimesheet = useCallback(async (weekStart: Date, totalHours: number, overtimeHours: number) => {
    if (!user || !profile) return;
    await addDoc(collection(db, `organizations/${profile.orgId}/weeklyTimesheets`), {
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
    if (!user || !profile?.orgId) return;
    const now = Timestamp.now();
    const reviewEntry: Record<string, unknown> = {
      action: 'approved',
      reviewedBy: user.uid,
      reviewedByName: profile.displayName,
      reviewedAt: now,
    };

    const existing = timesheets.find(t => t.id === timesheetId);
    const existingHistory = existing?.reviewHistory?.map(r => ({
      ...r,
      reviewedAt: Timestamp.fromDate(r.reviewedAt),
    })) || [];

    await updateDoc(doc(db, `organizations/${profile.orgId}/weeklyTimesheets`, timesheetId), {
      status: 'approved',
      approvedBy: user.uid,
      approvedByName: profile.displayName,
      approvedAt: now,
      reviewedBy: user.uid,
      reviewHistory: [...existingHistory, reviewEntry],
    });
  }, [user, profile, timesheets]);

  const rejectTimesheet = useCallback(async (timesheetId: string, reason?: string) => {
    if (!user || !profile?.orgId) return;
    const now = Timestamp.now();
    const reviewEntry: Record<string, unknown> = {
      action: 'rejected',
      reviewedBy: user.uid,
      reviewedByName: profile.displayName,
      reviewedAt: now,
      reason,
    };

    const existing = timesheets.find(t => t.id === timesheetId);
    const existingHistory = existing?.reviewHistory?.map(r => ({
      ...r,
      reviewedAt: Timestamp.fromDate(r.reviewedAt),
    })) || [];

    await updateDoc(doc(db, `organizations/${profile.orgId}/weeklyTimesheets`, timesheetId), {
      status: 'rejected',
      rejectionReason: reason || '',
      reviewedBy: user.uid,
      reviewHistory: [...existingHistory, reviewEntry],
    });
  }, [user, profile, timesheets]);

  return { timesheets, loading, submitTimesheet, approveTimesheet, rejectTimesheet };
}
