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
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Tool, ToolCheckout, ToolStatus } from '@/types';
import { useAuth } from '@/lib/auth';

export function useTools() {
  const { user, profile } = useAuth();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.orgId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'tools'),
      where('orgId', '==', profile.orgId),
      orderBy('name', 'asc'),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          purchaseDate: data.purchaseDate ? (data.purchaseDate as Timestamp).toDate() : undefined,
          lastMaintenanceDate: data.lastMaintenanceDate ? (data.lastMaintenanceDate as Timestamp).toDate() : undefined,
          nextMaintenanceDate: data.nextMaintenanceDate ? (data.nextMaintenanceDate as Timestamp).toDate() : undefined,
          createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
          updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
        } as Tool;
      });
      setTools(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile?.orgId]);

  const addTool = useCallback(
    async (input: Omit<Tool, 'id' | 'orgId' | 'createdAt'>) => {
      if (!profile?.orgId) throw new Error('No organization');
      const data: Record<string, unknown> = {
        ...input,
        orgId: profile.orgId,
        createdAt: Timestamp.now(),
      };
      if (input.purchaseDate) data.purchaseDate = Timestamp.fromDate(input.purchaseDate);
      if (input.lastMaintenanceDate) data.lastMaintenanceDate = Timestamp.fromDate(input.lastMaintenanceDate);
      if (input.nextMaintenanceDate) data.nextMaintenanceDate = Timestamp.fromDate(input.nextMaintenanceDate);
      await addDoc(collection(db, 'tools'), data);
    },
    [profile]
  );

  const updateTool = useCallback(async (id: string, updates: Partial<Tool>) => {
    const data: Record<string, unknown> = { ...updates, updatedAt: Timestamp.now() };
    delete data.id;
    delete data.createdAt;
    if (updates.purchaseDate) data.purchaseDate = Timestamp.fromDate(new Date(updates.purchaseDate));
    if (updates.lastMaintenanceDate) data.lastMaintenanceDate = Timestamp.fromDate(new Date(updates.lastMaintenanceDate));
    if (updates.nextMaintenanceDate) data.nextMaintenanceDate = Timestamp.fromDate(new Date(updates.nextMaintenanceDate));
    await updateDoc(doc(db, 'tools', id), data);
  }, []);

  const deleteTool = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'tools', id));
  }, []);

  const checkoutTool = useCallback(
    async (toolId: string, projectId?: string, expectedReturnDate?: Date) => {
      if (!user || !profile) throw new Error('Not authenticated');
      const tool = tools.find((t) => t.id === toolId);
      if (!tool) throw new Error('Tool not found');

      await addDoc(collection(db, 'toolCheckouts'), {
        toolId,
        orgId: profile.orgId,
        userId: user.uid,
        userName: profile.displayName || user.email || '',
        projectId: projectId || null,
        checkedOutAt: Timestamp.now(),
        expectedReturnDate: expectedReturnDate ? Timestamp.fromDate(expectedReturnDate) : null,
      });

      await updateDoc(doc(db, 'tools', toolId), {
        status: 'checked_out' as ToolStatus,
        assignedTo: user.uid,
        assignedToName: profile.displayName || user.email || '',
        assignedProjectId: projectId || null,
        updatedAt: Timestamp.now(),
      });
    },
    [user, profile, tools]
  );

  const returnTool = useCallback(
    async (toolId: string, condition?: string, notes?: string) => {
      await updateDoc(doc(db, 'tools', toolId), {
        status: 'available' as ToolStatus,
        assignedTo: null,
        assignedToName: null,
        assignedProjectId: null,
        updatedAt: Timestamp.now(),
      });
    },
    []
  );

  return { tools, loading, addTool, updateTool, deleteTool, checkoutTool, returnTool };
}
