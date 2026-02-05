"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Bid, BidStatus, BidSolicitation, BidSolicitationStatus } from '@/types';
import { useAuth } from '@/lib/auth';

function bidFromFirestore(id: string, data: Record<string, unknown>): Bid {
  return {
    id,
    projectId: data.projectId as string,
    phaseIds: data.phaseIds as string[] | undefined,
    taskId: data.taskId as string | undefined,
    quoteSectionIds: data.quoteSectionIds as string[] | undefined,
    subId: data.subId as string,
    amount: (data.amount as number) || 0,
    laborCost: data.laborCost as number | undefined,
    materialCost: data.materialCost as number | undefined,
    proposedStartDate: data.proposedStartDate ? (data.proposedStartDate as Timestamp).toDate() : undefined,
    proposedEndDate: data.proposedEndDate ? (data.proposedEndDate as Timestamp).toDate() : undefined,
    timeline: data.timeline as string | undefined,
    description: data.description as string | undefined,
    attachments: data.attachments as string[] | undefined,
    status: data.status as BidStatus,
    submittedAt: data.submittedAt ? (data.submittedAt as Timestamp).toDate() : undefined,
    expiresAt: data.expiresAt ? (data.expiresAt as Timestamp).toDate() : undefined,
    respondedAt: data.respondedAt ? (data.respondedAt as Timestamp).toDate() : undefined,
    respondedBy: data.respondedBy as string | undefined,
    responseNotes: data.responseNotes as string | undefined,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
  };
}

function solicitationFromFirestore(id: string, data: Record<string, unknown>): BidSolicitation {
  return {
    id,
    projectId: data.projectId as string,
    orgId: data.orgId as string,
    title: data.title as string,
    description: data.description as string | undefined,
    scopeItemIds: (data.scopeItemIds as string[]) || [],
    phaseIds: (data.phaseIds as string[]) || [],
    trade: data.trade as string | undefined,
    invitedSubIds: (data.invitedSubIds as string[]) || [],
    deadline: data.deadline ? (data.deadline as Timestamp).toDate() : new Date(),
    status: data.status as BidSolicitationStatus,
    createdBy: data.createdBy as string,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
  };
}

function toFirestore(obj: Record<string, unknown>): Record<string, unknown> {
  const data = { ...obj };
  delete data.id;
  for (const k of Object.keys(data)) {
    if (data[k] instanceof Date) data[k] = Timestamp.fromDate(data[k] as Date);
    if (data[k] === undefined) delete data[k];
  }
  return data;
}

export function useBids(projectId: string) {
  const { user, profile } = useAuth();
  const [bids, setBids] = useState<Bid[]>([]);
  const [solicitations, setSolicitations] = useState<BidSolicitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId || !profile?.orgId) {
      setLoading(false);
      return;
    }

    setError(null);

    const bidQ = query(
      collection(db, 'bids'),
      where('orgId', '==', profile.orgId),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const unsub1 = onSnapshot(bidQ, (snap) => {
      setBids(snap.docs.map(d => bidFromFirestore(d.id, d.data())));
      setLoading(false);
    }, (err) => {
      console.error('useBids error:', err);
      if (err.message?.includes('requires an index')) {
        setError('Database index required. Please deploy indexes.');
      } else if (err.message?.includes('permission-denied')) {
        setError('Permission denied. Check Firestore rules.');
      } else {
        setError(err.message || 'Failed to load bids');
      }
      setBids([]);
      setLoading(false);
    });

    const solQ = query(
      collection(db, 'bidSolicitations'),
      where('orgId', '==', profile.orgId),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsub2 = onSnapshot(solQ, (snap) => {
      setSolicitations(snap.docs.map(d => solicitationFromFirestore(d.id, d.data())));
    }, (err) => {
      console.error('useBidSolicitations error:', err);
      setSolicitations([]);
    });

    return () => { unsub1(); unsub2(); };
  }, [projectId, profile?.orgId]);

  const createSolicitation = useCallback(async (data: Omit<BidSolicitation, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'orgId'>) => {
    if (!user || !profile) return;
    const now = new Date();
    await addDoc(collection(db, 'bidSolicitations'), toFirestore({
      ...data,
      orgId: profile.orgId,
      createdBy: user.uid,
      status: 'open',
      createdAt: now,
      updatedAt: now,
    }));
  }, [user, profile]);

  const closeSolicitation = useCallback(async (solId: string) => {
    await updateDoc(doc(db, 'bidSolicitations', solId), { status: 'closed', updatedAt: Timestamp.now() });
  }, []);

  const updateBidStatus = useCallback(async (bidId: string, status: BidStatus, notes?: string) => {
    const update: Record<string, unknown> = { status, respondedAt: Timestamp.now(), updatedAt: Timestamp.now() };
    if (notes) update.responseNotes = notes;
    if (user) update.respondedBy = user.uid;
    await updateDoc(doc(db, 'bids', bidId), update);
  }, [user]);

  return { bids, solicitations, loading, error, createSolicitation, closeSolicitation, updateBidStatus };
}
