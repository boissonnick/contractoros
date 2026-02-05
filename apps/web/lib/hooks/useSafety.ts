"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { SafetyInspection, SafetyIncident, ToolboxTalk } from '@/types';
import { useAuth } from '@/lib/auth';

// SAFETY INSPECTIONS
export function useSafetyInspections(projectId?: string) {
  const { profile } = useAuth();
  const [inspections, setInspections] = useState<SafetyInspection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.orgId) {
      setLoading(false);
      return;
    }

    let q = query(
      collection(db, 'safetyInspections'),
      where('orgId', '==', profile.orgId),
      orderBy('scheduledDate', 'desc'),
    );

    if (projectId) {
      q = query(
        collection(db, 'safetyInspections'),
        where('orgId', '==', profile.orgId),
        where('projectId', '==', projectId),
        orderBy('scheduledDate', 'desc'),
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          scheduledDate: data.scheduledDate ? (data.scheduledDate as Timestamp).toDate() : new Date(),
          completedDate: data.completedDate ? (data.completedDate as Timestamp).toDate() : undefined,
          createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
          updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
        } as SafetyInspection;
      });
      setInspections(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile?.orgId, projectId]);

  const addInspection = useCallback(
    async (input: Omit<SafetyInspection, 'id' | 'orgId' | 'createdAt'>) => {
      if (!profile?.orgId) throw new Error('No organization');
      await addDoc(collection(db, 'safetyInspections'), {
        ...input,
        orgId: profile.orgId,
        scheduledDate: Timestamp.fromDate(input.scheduledDate),
        completedDate: input.completedDate ? Timestamp.fromDate(input.completedDate) : null,
        createdAt: Timestamp.now(),
      });
    },
    [profile]
  );

  const updateInspection = useCallback(async (id: string, updates: Partial<SafetyInspection>) => {
    const data: Record<string, unknown> = { ...updates, updatedAt: Timestamp.now() };
    if (updates.scheduledDate) data.scheduledDate = Timestamp.fromDate(new Date(updates.scheduledDate));
    if (updates.completedDate) data.completedDate = Timestamp.fromDate(new Date(updates.completedDate));
    delete data.id;
    delete data.createdAt;
    await updateDoc(doc(db, 'safetyInspections', id), data);
  }, []);

  return { inspections, loading, addInspection, updateInspection };
}

// INCIDENTS
export function useSafetyIncidents(projectId?: string) {
  const { profile } = useAuth();
  const [incidents, setIncidents] = useState<SafetyIncident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.orgId) {
      setLoading(false);
      return;
    }

    let q = query(
      collection(db, 'safetyIncidents'),
      where('orgId', '==', profile.orgId),
      orderBy('date', 'desc'),
    );

    if (projectId) {
      q = query(
        collection(db, 'safetyIncidents'),
        where('orgId', '==', profile.orgId),
        where('projectId', '==', projectId),
        orderBy('date', 'desc'),
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          date: data.date ? (data.date as Timestamp).toDate() : new Date(),
          createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
        } as SafetyIncident;
      });
      setIncidents(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile?.orgId, projectId]);

  const addIncident = useCallback(
    async (input: Omit<SafetyIncident, 'id' | 'orgId' | 'createdAt'>) => {
      if (!profile?.orgId) throw new Error('No organization');
      await addDoc(collection(db, 'safetyIncidents'), {
        ...input,
        orgId: profile.orgId,
        date: Timestamp.fromDate(input.date),
        createdAt: Timestamp.now(),
      });
    },
    [profile]
  );

  return { incidents, loading, addIncident };
}

// TOOLBOX TALKS
export function useToolboxTalks(projectId?: string) {
  const { profile } = useAuth();
  const [talks, setTalks] = useState<ToolboxTalk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.orgId) {
      setLoading(false);
      return;
    }

    let q = query(
      collection(db, 'toolboxTalks'),
      where('orgId', '==', profile.orgId),
      orderBy('date', 'desc'),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          date: data.date ? (data.date as Timestamp).toDate() : new Date(),
          createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
        } as ToolboxTalk;
      });
      setTalks(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile?.orgId, projectId]);

  const addTalk = useCallback(
    async (input: Omit<ToolboxTalk, 'id' | 'orgId' | 'createdAt'>) => {
      if (!profile?.orgId) throw new Error('No organization');
      await addDoc(collection(db, 'toolboxTalks'), {
        ...input,
        orgId: profile.orgId,
        date: Timestamp.fromDate(input.date),
        createdAt: Timestamp.now(),
      });
    },
    [profile]
  );

  return { talks, loading, addTalk };
}
