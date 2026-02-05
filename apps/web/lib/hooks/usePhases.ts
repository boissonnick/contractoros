"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ProjectPhase, PhaseStatus, PhaseDocument, PhaseMilestone } from '@/types';
import { useAuth } from '@/lib/auth';
import { toast } from '@/components/ui/Toast';

function fromFirestore(id: string, data: Record<string, unknown>): ProjectPhase {
  return {
    id,
    projectId: data.projectId as string,
    name: data.name as string,
    description: data.description as string | undefined,
    order: (data.order as number) ?? 0,
    status: data.status as PhaseStatus,
    startDate: data.startDate ? (data.startDate as Timestamp).toDate() : undefined,
    endDate: data.endDate ? (data.endDate as Timestamp).toDate() : undefined,
    estimatedDuration: data.estimatedDuration as number | undefined,
    budgetAmount: data.budgetAmount as number | undefined,
    actualCost: data.actualCost as number | undefined,
    assignedTeamMembers: (data.assignedTeamMembers as string[]) || [],
    assignedSubcontractors: (data.assignedSubcontractors as string[]) || [],
    progressPercent: (data.progressPercent as number) ?? 0,
    tasksTotal: (data.tasksTotal as number) ?? 0,
    tasksCompleted: (data.tasksCompleted as number) ?? 0,
    dependencies: (data.dependencies as string[]) || [],
    documents: ((data.documents as unknown[]) || []).map((d: unknown) => {
      const doc = d as Record<string, unknown>;
      return {
        ...doc,
        uploadedAt: doc.uploadedAt ? (doc.uploadedAt as Timestamp).toDate() : new Date(),
      } as PhaseDocument;
    }),
    milestones: ((data.milestones as unknown[]) || []).map((m: unknown) => {
      const ms = m as Record<string, unknown>;
      return {
        ...ms,
        date: ms.date ? (ms.date as Timestamp).toDate() : new Date(),
        completedAt: ms.completedAt ? (ms.completedAt as Timestamp).toDate() : undefined,
      } as PhaseMilestone;
    }),
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
  };
}

function toFirestore(phase: Partial<ProjectPhase>): Record<string, unknown> {
  const data: Record<string, unknown> = { ...phase };
  delete data.id;
  if (data.startDate instanceof Date) data.startDate = Timestamp.fromDate(data.startDate);
  if (data.endDate instanceof Date) data.endDate = Timestamp.fromDate(data.endDate);
  if (data.createdAt instanceof Date) data.createdAt = Timestamp.fromDate(data.createdAt);
  if (data.updatedAt instanceof Date) data.updatedAt = Timestamp.fromDate(data.updatedAt);
  if (Array.isArray(data.documents)) {
    data.documents = (data.documents as PhaseDocument[]).map((d) => ({
      ...d,
      uploadedAt: d.uploadedAt instanceof Date ? Timestamp.fromDate(d.uploadedAt) : d.uploadedAt,
    }));
  }
  if (Array.isArray(data.milestones)) {
    data.milestones = (data.milestones as PhaseMilestone[]).map((m) => ({
      ...m,
      date: m.date instanceof Date ? Timestamp.fromDate(m.date) : m.date,
      completedAt: m.completedAt instanceof Date ? Timestamp.fromDate(m.completedAt) : m.completedAt,
    }));
  }
  // Firestore rejects undefined values — strip them
  Object.keys(data).forEach((k) => {
    if (data[k] === undefined) delete data[k];
  });
  return data;
}

interface UsePhasesOptions {
  projectId: string;
}

export function usePhases({ projectId }: UsePhasesOptions) {
  const { profile: _profile } = useAuth();
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const q = query(
      collection(db, 'projects', projectId, 'phases'),
      orderBy('order', 'asc')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => fromFirestore(d.id, d.data()));
        setPhases(items);
        setLoading(false);
      },
      (err) => {
        console.error('usePhases error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsub;
  }, [projectId]);

  const addPhase = useCallback(
    async (data: Omit<ProjectPhase, 'id' | 'createdAt' | 'updatedAt' | 'progressPercent' | 'tasksTotal' | 'tasksCompleted'>) => {
      try {
        const now = new Date();
        const phaseData: Partial<ProjectPhase> = {
          ...data,
          progressPercent: 0,
          tasksTotal: 0,
          tasksCompleted: 0,
          createdAt: now,
          updatedAt: now,
        };
        await addDoc(
          collection(db, 'projects', projectId, 'phases'),
          toFirestore(phaseData)
        );
        toast.success('Phase created');
      } catch (err) {
        console.error('Failed to add phase:', err);
        toast.error('Failed to create phase');
        throw err;
      }
    },
    [projectId]
  );

  const updatePhase = useCallback(
    async (phaseId: string, data: Partial<ProjectPhase>) => {
      try {
        const ref = doc(db, 'projects', projectId, 'phases', phaseId);
        await updateDoc(ref, toFirestore({ ...data, updatedAt: new Date() }));
        // Don't toast for minor updates
      } catch (err) {
        console.error('Failed to update phase:', err);
        toast.error('Failed to update phase');
        throw err;
      }
    },
    [projectId]
  );

  const deletePhase = useCallback(
    async (phaseId: string) => {
      try {
        const ref = doc(db, 'projects', projectId, 'phases', phaseId);
        await deleteDoc(ref);
        toast.success('Phase deleted');
      } catch (err) {
        console.error('Failed to delete phase:', err);
        toast.error('Failed to delete phase');
        throw err;
      }
    },
    [projectId]
  );

  const reorderPhases = useCallback(
    async (orderedIds: string[]) => {
      try {
        const { writeBatch } = await import('firebase/firestore');
        const batch = writeBatch(db);
        orderedIds.forEach((id, index) => {
          const ref = doc(db, 'projects', projectId, 'phases', id);
          batch.update(ref, { order: index, updatedAt: Timestamp.now() });
        });
        await batch.commit();
      } catch (err) {
        console.error('Failed to reorder phases:', err);
        toast.error('Failed to reorder phases');
        throw err;
      }
    },
    [projectId]
  );

  return { phases, loading, error, addPhase, updatePhase, deletePhase, reorderPhases };
}
