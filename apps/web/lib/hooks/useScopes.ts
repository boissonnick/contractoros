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
import { Scope, ScopeStatus, ScopeItem, ScopeApproval } from '@/types';
import { useAuth } from '@/lib/auth';

function fromFirestore(id: string, data: Record<string, unknown>): Scope {
  const approvals = ((data.approvals as unknown[]) || []).map((a: unknown) => {
    const ap = a as Record<string, unknown>;
    return {
      ...ap,
      decidedAt: ap.decidedAt ? (ap.decidedAt as Timestamp).toDate() : undefined,
    } as ScopeApproval;
  });

  return {
    id,
    projectId: data.projectId as string,
    orgId: data.orgId as string,
    version: (data.version as number) ?? 1,
    status: data.status as ScopeStatus,
    items: (data.items as ScopeItem[]) || [],
    approvals,
    previousVersionId: data.previousVersionId as string | undefined,
    notes: data.notes as string | undefined,
    createdBy: data.createdBy as string,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
  };
}

function toFirestore(scope: Partial<Scope>): Record<string, unknown> {
  const data: Record<string, unknown> = { ...scope };
  delete data.id;
  if (data.createdAt instanceof Date) data.createdAt = Timestamp.fromDate(data.createdAt);
  if (data.updatedAt instanceof Date) data.updatedAt = Timestamp.fromDate(data.updatedAt);
  if (Array.isArray(data.approvals)) {
    data.approvals = (data.approvals as ScopeApproval[]).map((a) => ({
      ...a,
      decidedAt: a.decidedAt instanceof Date ? Timestamp.fromDate(a.decidedAt) : a.decidedAt,
    }));
  }
  return data;
}

interface UseScopesOptions {
  projectId: string;
}

export function useScopes({ projectId }: UseScopesOptions) {
  const { user, profile } = useAuth();
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const q = query(
      collection(db, 'scopes'),
      where('projectId', '==', projectId),
      orderBy('version', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setScopes(snap.docs.map((d) => fromFirestore(d.id, d.data())));
        setLoading(false);
      },
      (err) => {
        console.error('useScopes error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsub;
  }, [projectId]);

  const currentScope = scopes.find(s => s.status !== 'superseded') || scopes[0] || null;

  const createScope = useCallback(
    async (items: ScopeItem[], notes?: string) => {
      if (!user || !profile) return;
      const now = new Date();
      const latestVersion = scopes.length > 0 ? Math.max(...scopes.map(s => s.version)) : 0;

      // Supersede the current scope if one exists
      if (currentScope && currentScope.status !== 'superseded') {
        await updateDoc(doc(db, 'scopes', currentScope.id), {
          status: 'superseded',
          updatedAt: Timestamp.now(),
        });
      }

      const scopeData: Partial<Scope> = {
        projectId,
        orgId: profile.orgId,
        version: latestVersion + 1,
        status: 'draft',
        items,
        approvals: [],
        previousVersionId: currentScope?.id,
        notes,
        createdBy: user.uid,
        createdAt: now,
        updatedAt: now,
      };

      await addDoc(collection(db, 'scopes'), toFirestore(scopeData));
    },
    [projectId, user, profile, scopes, currentScope]
  );

  const updateScope = useCallback(
    async (scopeId: string, data: Partial<Scope>) => {
      await updateDoc(doc(db, 'scopes', scopeId), toFirestore({ ...data, updatedAt: new Date() }));
    },
    []
  );

  const submitForApproval = useCallback(
    async (scopeId: string) => {
      await updateDoc(doc(db, 'scopes', scopeId), {
        status: 'pending_approval',
        updatedAt: Timestamp.now(),
      });
    },
    []
  );

  const approveScope = useCallback(
    async (scopeId: string, clientId: string, clientName: string, comments?: string) => {
      const scope = scopes.find(s => s.id === scopeId);
      if (!scope) return;

      const updatedApprovals = scope.approvals.map(a =>
        a.clientId === clientId
          ? { ...a, status: 'approved' as const, comments, decidedAt: new Date() }
          : a
      );

      // If client not in approvals, add them
      if (!updatedApprovals.find(a => a.clientId === clientId)) {
        updatedApprovals.push({
          clientId,
          clientName,
          status: 'approved',
          comments,
          decidedAt: new Date(),
        });
      }

      const allApproved = updatedApprovals.every(a => a.status === 'approved');

      await updateDoc(doc(db, 'scopes', scopeId), toFirestore({
        approvals: updatedApprovals,
        status: allApproved ? 'approved' : 'pending_approval',
        updatedAt: new Date(),
      }));
    },
    [scopes]
  );

  const rejectScope = useCallback(
    async (scopeId: string, clientId: string, clientName: string, comments?: string) => {
      const scope = scopes.find(s => s.id === scopeId);
      if (!scope) return;

      const updatedApprovals = scope.approvals.map(a =>
        a.clientId === clientId
          ? { ...a, status: 'rejected' as const, comments, decidedAt: new Date() }
          : a
      );

      if (!updatedApprovals.find(a => a.clientId === clientId)) {
        updatedApprovals.push({
          clientId,
          clientName,
          status: 'rejected',
          comments,
          decidedAt: new Date(),
        });
      }

      await updateDoc(doc(db, 'scopes', scopeId), toFirestore({
        approvals: updatedApprovals,
        status: 'draft', // Back to draft on rejection
        updatedAt: new Date(),
      }));
    },
    [scopes]
  );

  return {
    scopes,
    currentScope,
    loading,
    error,
    createScope,
    updateScope,
    submitForApproval,
    approveScope,
    rejectScope,
  };
}
