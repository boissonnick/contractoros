"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ScheduleAssignment } from '@/types';
import { useAuth } from '@/lib/auth';

function fromFirestore(id: string, data: Record<string, unknown>): ScheduleAssignment {
  return {
    id,
    userId: data.userId as string,
    projectId: data.projectId as string,
    taskId: data.taskId as string | undefined,
    date: data.date ? (data.date as Timestamp).toDate() : new Date(),
    startTime: data.startTime as string,
    endTime: data.endTime as string,
    status: (data.status as ScheduleAssignment['status']) || 'scheduled',
    userName: data.userName as string | undefined,
    projectName: data.projectName as string | undefined,
    notes: data.notes as string | undefined,
    orgId: data.orgId as string | undefined,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
  };
}

interface UseScheduleOptions {
  orgId?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}

export function useScheduleAssignments({ orgId, userId, startDate, endDate }: UseScheduleOptions) {
  const { profile } = useAuth();
  const targetOrgId = orgId || profile?.orgId;
  const [assignments, setAssignments] = useState<ScheduleAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetOrgId) return;
    const constraints: ReturnType<typeof where>[] = [where('orgId', '==', targetOrgId)];
    if (userId) constraints.push(where('userId', '==', userId));
    if (startDate) constraints.push(where('date', '>=', Timestamp.fromDate(startDate)));
    if (endDate) constraints.push(where('date', '<=', Timestamp.fromDate(endDate)));

    const q = query(collection(db, 'scheduleAssignments'), ...constraints);
    const unsub = onSnapshot(q, (snap) => {
      setAssignments(snap.docs.map(d => fromFirestore(d.id, d.data())));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [targetOrgId, userId, startDate?.getTime(), endDate?.getTime()]);

  const createAssignment = useCallback(async (data: Omit<ScheduleAssignment, 'id' | 'createdAt'>) => {
    await addDoc(collection(db, 'scheduleAssignments'), {
      ...data,
      date: Timestamp.fromDate(data.date),
      orgId: targetOrgId,
      createdAt: Timestamp.now(),
    });
  }, [targetOrgId]);

  const updateAssignment = useCallback(async (id: string, data: Partial<ScheduleAssignment>) => {
    const update: Record<string, unknown> = { ...data };
    if (data.date) update.date = Timestamp.fromDate(data.date);
    delete update.id;
    delete update.createdAt;
    await updateDoc(doc(db, 'scheduleAssignments', id), update);
  }, []);

  const deleteAssignment = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'scheduleAssignments', id));
  }, []);

  return { assignments, loading, createAssignment, updateAssignment, deleteAssignment };
}
