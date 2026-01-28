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
import {
  ChangeOrder,
  ChangeOrderStatus,
  ChangeOrderApproval,
  ChangeOrderHistoryEntry,
  ScopeChange,
  ChangeOrderImpact,
} from '@/types';
import { useAuth } from '@/lib/auth';

function fromFirestore(id: string, data: Record<string, unknown>): ChangeOrder {
  const approvals = ((data.approvals as unknown[]) || []).map((a: unknown) => {
    const ap = a as Record<string, unknown>;
    return {
      ...ap,
      decidedAt: ap.decidedAt ? (ap.decidedAt as Timestamp).toDate() : undefined,
    } as ChangeOrderApproval;
  });

  const history = ((data.history as unknown[]) || []).map((h: unknown) => {
    const he = h as Record<string, unknown>;
    return {
      ...he,
      timestamp: he.timestamp ? (he.timestamp as Timestamp).toDate() : new Date(),
    } as ChangeOrderHistoryEntry;
  });

  return {
    id,
    projectId: data.projectId as string,
    orgId: data.orgId as string,
    number: data.number as string,
    title: data.title as string,
    description: data.description as string,
    reason: data.reason as string,
    scopeChanges: (data.scopeChanges as ScopeChange[]) || [],
    impact: (data.impact as ChangeOrderImpact) || { costChange: 0, scheduleChange: 0, affectedPhaseIds: [], affectedTaskIds: [] },
    photos: (data.photos as string[]) || [],
    documents: (data.documents as string[]) || [],
    status: data.status as ChangeOrderStatus,
    approvals,
    history,
    newScopeVersionId: data.newScopeVersionId as string | undefined,
    createdBy: data.createdBy as string,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
  };
}

function toFirestore(co: Partial<ChangeOrder>): Record<string, unknown> {
  const data: Record<string, unknown> = { ...co };
  delete data.id;
  if (data.createdAt instanceof Date) data.createdAt = Timestamp.fromDate(data.createdAt);
  if (data.updatedAt instanceof Date) data.updatedAt = Timestamp.fromDate(data.updatedAt);
  if (Array.isArray(data.approvals)) {
    data.approvals = (data.approvals as ChangeOrderApproval[]).map((a) => ({
      ...a,
      decidedAt: a.decidedAt instanceof Date ? Timestamp.fromDate(a.decidedAt) : a.decidedAt,
    }));
  }
  if (Array.isArray(data.history)) {
    data.history = (data.history as ChangeOrderHistoryEntry[]).map((h) => ({
      ...h,
      timestamp: h.timestamp instanceof Date ? Timestamp.fromDate(h.timestamp) : h.timestamp,
    }));
  }
  return data;
}

interface UseChangeOrdersOptions {
  projectId: string;
}

export function useChangeOrders({ projectId }: UseChangeOrdersOptions) {
  const { user, profile } = useAuth();
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const q = query(
      collection(db, 'change_orders'),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setChangeOrders(snap.docs.map((d) => fromFirestore(d.id, d.data())));
        setLoading(false);
      },
      (err) => {
        console.error('useChangeOrders error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsub;
  }, [projectId]);

  const createChangeOrder = useCallback(
    async (data: {
      title: string;
      description: string;
      reason: string;
      scopeChanges: ScopeChange[];
      impact: ChangeOrderImpact;
      photos?: string[];
      documents?: string[];
    }) => {
      if (!user || !profile) return;
      const now = new Date();
      const nextNumber = changeOrders.length + 1;

      const co: Partial<ChangeOrder> = {
        projectId,
        orgId: profile.orgId,
        number: `CO-${String(nextNumber).padStart(3, '0')}`,
        title: data.title,
        description: data.description,
        reason: data.reason,
        scopeChanges: data.scopeChanges,
        impact: data.impact,
        photos: data.photos || [],
        documents: data.documents || [],
        status: 'draft',
        approvals: [],
        history: [{
          id: Date.now().toString(),
          action: 'Created',
          userId: user.uid,
          userName: profile.displayName,
          timestamp: now,
        }],
        createdBy: user.uid,
        createdAt: now,
        updatedAt: now,
      };

      await addDoc(collection(db, 'change_orders'), toFirestore(co));
    },
    [projectId, user, profile, changeOrders.length]
  );

  const updateChangeOrder = useCallback(
    async (coId: string, data: Partial<ChangeOrder>) => {
      await updateDoc(doc(db, 'change_orders', coId), toFirestore({ ...data, updatedAt: new Date() }));
    },
    []
  );

  const submitForApproval = useCallback(
    async (coId: string) => {
      if (!user || !profile) return;
      const co = changeOrders.find(c => c.id === coId);
      if (!co) return;

      const approvals: ChangeOrderApproval[] = [
        { role: 'pm', userId: '', userName: '', status: 'pending' },
        { role: 'owner', userId: '', userName: '', status: 'pending' },
        { role: 'client', userId: '', userName: '', status: 'pending' },
      ];

      const historyEntry: ChangeOrderHistoryEntry = {
        id: Date.now().toString(),
        action: 'Submitted for approval',
        userId: user.uid,
        userName: profile.displayName,
        timestamp: new Date(),
      };

      await updateDoc(doc(db, 'change_orders', coId), toFirestore({
        status: 'pending_pm',
        approvals,
        history: [...co.history, historyEntry],
        updatedAt: new Date(),
      }));
    },
    [user, profile, changeOrders]
  );

  const approveChangeOrder = useCallback(
    async (coId: string, role: 'pm' | 'owner' | 'client', comments?: string) => {
      if (!user || !profile) return;
      const co = changeOrders.find(c => c.id === coId);
      if (!co) return;

      const updatedApprovals = co.approvals.map(a =>
        a.role === role
          ? { ...a, userId: user.uid, userName: profile.displayName, status: 'approved' as const, comments, decidedAt: new Date() }
          : a
      );

      // Determine next status
      const nextStatusMap: Record<string, ChangeOrderStatus> = {
        pending_pm: 'pending_owner',
        pending_owner: 'pending_client',
        pending_client: 'approved',
      };
      const newStatus = nextStatusMap[co.status] || co.status;

      const historyEntry: ChangeOrderHistoryEntry = {
        id: Date.now().toString(),
        action: `Approved by ${role.toUpperCase()}`,
        userId: user.uid,
        userName: profile.displayName,
        details: comments,
        timestamp: new Date(),
      };

      await updateDoc(doc(db, 'change_orders', coId), toFirestore({
        status: newStatus,
        approvals: updatedApprovals,
        history: [...co.history, historyEntry],
        updatedAt: new Date(),
      }));
    },
    [user, profile, changeOrders]
  );

  const rejectChangeOrder = useCallback(
    async (coId: string, role: 'pm' | 'owner' | 'client', comments?: string) => {
      if (!user || !profile) return;
      const co = changeOrders.find(c => c.id === coId);
      if (!co) return;

      const updatedApprovals = co.approvals.map(a =>
        a.role === role
          ? { ...a, userId: user.uid, userName: profile.displayName, status: 'rejected' as const, comments, decidedAt: new Date() }
          : a
      );

      const historyEntry: ChangeOrderHistoryEntry = {
        id: Date.now().toString(),
        action: `Rejected by ${role.toUpperCase()}`,
        userId: user.uid,
        userName: profile.displayName,
        details: comments,
        timestamp: new Date(),
      };

      await updateDoc(doc(db, 'change_orders', coId), toFirestore({
        status: 'rejected',
        approvals: updatedApprovals,
        history: [...co.history, historyEntry],
        updatedAt: new Date(),
      }));
    },
    [user, profile, changeOrders]
  );

  return {
    changeOrders,
    loading,
    error,
    createChangeOrder,
    updateChangeOrder,
    submitForApproval,
    approveChangeOrder,
    rejectChangeOrder,
  };
}
