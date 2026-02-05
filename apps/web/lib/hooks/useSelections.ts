"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Selection, SelectionOption, SelectionStatus } from '@/types';
import { useAuth } from '@/lib/auth';

function fromFirestore(id: string, data: Record<string, unknown>): Selection {
  return {
    id,
    orgId: data.orgId as string,
    projectId: data.projectId as string,
    categoryId: data.categoryId as string,
    categoryName: data.categoryName as string,
    status: data.status as SelectionStatus,
    selectedOptionId: data.selectedOptionId as string | undefined,
    selectedOptionName: data.selectedOptionName as string | undefined,
    selectedPrice: data.selectedPrice as number | undefined,
    budgetAmount: (data.budgetAmount as number) || 0,
    budgetVariance: (data.budgetVariance as number) || 0,
    options: (data.options as SelectionOption[]) || [],
    room: data.room as string | undefined,
    notes: data.notes as string | undefined,
    clientNote: data.clientNote as string | undefined,
    selectedBy: data.selectedBy as string | undefined,
    selectedByName: data.selectedByName as string | undefined,
    selectedAt: data.selectedAt ? (data.selectedAt as Timestamp).toDate() : undefined,
    approvedBy: data.approvedBy as string | undefined,
    approvedAt: data.approvedAt ? (data.approvedAt as Timestamp).toDate() : undefined,
    orderedAt: data.orderedAt ? (data.orderedAt as Timestamp).toDate() : undefined,
    installedAt: data.installedAt ? (data.installedAt as Timestamp).toDate() : undefined,
    createdBy: data.createdBy as string,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
  };
}

interface UseSelectionsProps {
  projectId: string;
}

export function useSelections({ projectId }: UseSelectionsProps) {
  const { user, profile } = useAuth();
  const [selections, setSelections] = useState<Selection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'selections'),
      where('projectId', '==', projectId),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs
        .map((d) => fromFirestore(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => a.categoryName.localeCompare(b.categoryName));
      setSelections(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [projectId]);

  const addSelection = useCallback(
    async (input: {
      categoryName: string;
      room?: string;
      budgetAmount: number;
      options: Omit<SelectionOption, 'id'>[];
      notes?: string;
    }) => {
      if (!profile?.orgId || !user) throw new Error('No organization');

      const options: SelectionOption[] = input.options.map((opt, i) => ({
        ...opt,
        id: `opt-${Date.now()}-${i}`,
      }));

      await addDoc(collection(db, 'selections'), {
        orgId: profile.orgId,
        projectId,
        categoryId: `cat-${Date.now()}`,
        categoryName: input.categoryName,
        status: 'pending',
        budgetAmount: input.budgetAmount,
        budgetVariance: 0,
        options,
        room: input.room || '',
        notes: input.notes || '',
        createdBy: user.uid,
        createdAt: Timestamp.now(),
      });
    },
    [profile, user, projectId]
  );

  const selectOption = useCallback(
    async (selectionId: string, optionId: string) => {
      const sel = selections.find((s) => s.id === selectionId);
      if (!sel || !user) return;

      const option = sel.options.find((o) => o.id === optionId);
      if (!option) return;

      const variance = sel.budgetAmount - option.price;

      await updateDoc(doc(db, 'selections', selectionId), {
        status: 'selected',
        selectedOptionId: optionId,
        selectedOptionName: option.name,
        selectedPrice: option.price,
        budgetVariance: variance,
        selectedBy: user.uid,
        selectedByName: profile?.displayName || user.email || '',
        selectedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    },
    [selections, user, profile]
  );

  const approveSelection = useCallback(
    async (selectionId: string) => {
      if (!user) return;
      await updateDoc(doc(db, 'selections', selectionId), {
        status: 'approved',
        approvedBy: user.uid,
        approvedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    },
    [user]
  );

  const markOrdered = useCallback(async (selectionId: string) => {
    await updateDoc(doc(db, 'selections', selectionId), {
      status: 'ordered',
      orderedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }, []);

  const markInstalled = useCallback(async (selectionId: string) => {
    await updateDoc(doc(db, 'selections', selectionId), {
      status: 'installed',
      installedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }, []);

  const updateSelection = useCallback(
    async (selectionId: string, updates: Partial<Selection>) => {
      const data: Record<string, unknown> = { ...updates, updatedAt: Timestamp.now() };
      delete data.id;
      delete data.orgId;
      delete data.createdAt;
      delete data.createdBy;

      // Convert dates
      if (updates.selectedAt) data.selectedAt = Timestamp.fromDate(new Date(updates.selectedAt));
      if (updates.approvedAt) data.approvedAt = Timestamp.fromDate(new Date(updates.approvedAt));

      await updateDoc(doc(db, 'selections', selectionId), data);
    },
    []
  );

  const deleteSelection = useCallback(async (selectionId: string) => {
    await deleteDoc(doc(db, 'selections', selectionId));
  }, []);

  const addClientNote = useCallback(
    async (selectionId: string, note: string) => {
      await updateDoc(doc(db, 'selections', selectionId), {
        clientNote: note,
        updatedAt: Timestamp.now(),
      });
    },
    []
  );

  return {
    selections,
    loading,
    addSelection,
    selectOption,
    approveSelection,
    markOrdered,
    markInstalled,
    updateSelection,
    deleteSelection,
    addClientNote,
  };
}
