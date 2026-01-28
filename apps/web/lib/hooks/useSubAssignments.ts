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
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { SubAssignment, SubAssignmentStatus, SubPaymentScheduleItem } from '@/types';

function fromFirestore(id: string, data: Record<string, unknown>): SubAssignment {
  const schedule = ((data.paymentSchedule as unknown[]) || []).map((p: unknown) => {
    const item = p as Record<string, unknown>;
    return {
      ...item,
      dueDate: item.dueDate ? (item.dueDate as Timestamp).toDate() : undefined,
      paidAt: item.paidAt ? (item.paidAt as Timestamp).toDate() : undefined,
    } as SubPaymentScheduleItem;
  });

  return {
    id,
    subId: data.subId as string,
    projectId: data.projectId as string,
    type: data.type as 'phase' | 'task',
    phaseId: data.phaseId as string | undefined,
    taskId: data.taskId as string | undefined,
    bidId: data.bidId as string | undefined,
    status: data.status as SubAssignmentStatus,
    agreedAmount: (data.agreedAmount as number) || 0,
    paidAmount: (data.paidAmount as number) || 0,
    paymentSchedule: schedule,
    rating: data.rating as number | undefined,
    ratingComment: data.ratingComment as string | undefined,
    startDate: data.startDate ? (data.startDate as Timestamp).toDate() : undefined,
    endDate: data.endDate ? (data.endDate as Timestamp).toDate() : undefined,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
  };
}

function toFirestore(a: Partial<SubAssignment>): Record<string, unknown> {
  const data: Record<string, unknown> = { ...a };
  delete data.id;
  if (data.startDate instanceof Date) data.startDate = Timestamp.fromDate(data.startDate);
  if (data.endDate instanceof Date) data.endDate = Timestamp.fromDate(data.endDate);
  if (data.createdAt instanceof Date) data.createdAt = Timestamp.fromDate(data.createdAt);
  if (data.updatedAt instanceof Date) data.updatedAt = Timestamp.fromDate(data.updatedAt);
  if (Array.isArray(data.paymentSchedule)) {
    data.paymentSchedule = (data.paymentSchedule as SubPaymentScheduleItem[]).map((p) => ({
      ...p,
      dueDate: p.dueDate instanceof Date ? Timestamp.fromDate(p.dueDate) : p.dueDate,
      paidAt: p.paidAt instanceof Date ? Timestamp.fromDate(p.paidAt) : p.paidAt,
    }));
  }
  // Firestore rejects undefined values — strip them
  Object.keys(data).forEach((k) => {
    if (data[k] === undefined) delete data[k];
  });
  return data;
}

interface UseSubAssignmentsOptions {
  projectId?: string;
  subId?: string;
}

export function useSubAssignments({ projectId, subId }: UseSubAssignmentsOptions) {
  const [assignments, setAssignments] = useState<SubAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId && !subId) return;

    const constraints = [];
    if (projectId) constraints.push(where('projectId', '==', projectId));
    if (subId) constraints.push(where('subId', '==', subId));

    const q = query(collection(db, 'sub_assignments'), ...constraints, orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(
      q,
      (snap) => {
        setAssignments(snap.docs.map((d) => fromFirestore(d.id, d.data())));
        setLoading(false);
      },
      (err) => {
        console.error('useSubAssignments error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsub;
  }, [projectId, subId]);

  const createAssignment = useCallback(
    async (data: Omit<SubAssignment, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date();
      await addDoc(collection(db, 'sub_assignments'), toFirestore({ ...data, createdAt: now, updatedAt: now }));
    },
    []
  );

  const updateAssignment = useCallback(
    async (assignmentId: string, data: Partial<SubAssignment>) => {
      await updateDoc(doc(db, 'sub_assignments', assignmentId), toFirestore({ ...data, updatedAt: new Date() }));
    },
    []
  );

  return { assignments, loading, error, createAssignment, updateAssignment };
}
