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
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Bid, BidStatus, BidSolicitation } from '@/types';
import { useAuth } from '@/lib/auth';

// Helper to convert Firestore data to Bid
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

// Helper to convert Firestore data to BidSolicitation
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
    status: data.status as 'open' | 'closed' | 'cancelled',
    createdBy: data.createdBy as string,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
  };
}

// Helper to convert objects to Firestore format
function toFirestore(obj: Record<string, unknown>): Record<string, unknown> {
  const data = { ...obj };
  delete data.id;
  for (const k of Object.keys(data)) {
    if (data[k] instanceof Date) data[k] = Timestamp.fromDate(data[k] as Date);
    if (data[k] === undefined) delete data[k];
  }
  return data;
}

// Extended bid type with project info for display
export interface BidWithProject extends Bid {
  projectName?: string;
  projectAddress?: string;
  solicitation?: BidSolicitation;
}

// Bid submission form data
export interface BidSubmissionData {
  amount: number;
  laborCost?: number;
  materialCost?: number;
  proposedStartDate?: Date;
  proposedEndDate?: Date;
  timeline?: string;
  description?: string;
}

/**
 * Hook for subcontractors to manage their bids
 * Fetches bids where subId matches current user
 */
export function useSubBids() {
  const { user, profile: _profile } = useAuth();
  const [bids, setBids] = useState<BidWithProject[]>([]);
  const [solicitations, setSolicitations] = useState<BidSolicitation[]>([]);
  const [projectsCache, setProjectsCache] = useState<Map<string, { name: string; address?: string }>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch project details for a list of project IDs
  const fetchProjectDetails = useCallback(async (projectIds: string[]) => {
    const newCache = new Map(projectsCache);
    const idsToFetch = projectIds.filter(id => !newCache.has(id));

    for (const projectId of idsToFetch) {
      try {
        // Projects can be in different orgs, so we search directly
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (projectDoc.exists()) {
          const data = projectDoc.data();
          newCache.set(projectId, {
            name: data.name as string,
            address: data.address ? `${data.address.city}, ${data.address.state}` : undefined,
          });
        }
      } catch (err) {
        console.error('Error fetching project:', projectId, err);
      }
    }

    setProjectsCache(newCache);
    return newCache;
  }, [projectsCache]);

  // Main effect to fetch bids for this subcontractor
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setError(null);

    // Query bids where this user is the subcontractor
    const bidsQuery = query(
      collection(db, 'bids'),
      where('subId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubBids = onSnapshot(
      bidsQuery,
      async (snap) => {
        const bidsData = snap.docs.map(d => bidFromFirestore(d.id, d.data()));

        // Fetch project details for display
        const projectIds = Array.from(new Set(bidsData.map(b => b.projectId)));
        const cache = await fetchProjectDetails(projectIds);

        // Enrich bids with project info
        const enrichedBids: BidWithProject[] = bidsData.map(bid => ({
          ...bid,
          projectName: cache.get(bid.projectId)?.name,
          projectAddress: cache.get(bid.projectId)?.address,
        }));

        setBids(enrichedBids);
        setLoading(false);
      },
      (err) => {
        console.error('useSubBids error:', err);
        if (err.message?.includes('requires an index')) {
          setError('Database index required. Please contact support.');
        } else if (err.message?.includes('permission-denied')) {
          setError('Permission denied. Please check your account.');
        } else {
          setError(err.message || 'Failed to load bids');
        }
        setBids([]);
        setLoading(false);
      }
    );

    // Also fetch bid solicitations where this user was invited
    // This requires the user's subcontractor ID to be in invitedSubIds
    const solicitationsQuery = query(
      collection(db, 'bidSolicitations'),
      where('status', '==', 'open'),
      orderBy('createdAt', 'desc')
    );

    const unsubSolicitations = onSnapshot(
      solicitationsQuery,
      (snap) => {
        // Filter to only those where this user is invited
        const allSolicitations = snap.docs.map(d => solicitationFromFirestore(d.id, d.data()));
        const relevantSolicitations = allSolicitations.filter(
          s => s.invitedSubIds.includes(user.uid)
        );
        setSolicitations(relevantSolicitations);
      },
      (err) => {
        console.error('useBidSolicitations error:', err);
        setSolicitations([]);
      }
    );

    return () => {
      unsubBids();
      unsubSolicitations();
    };
  }, [user?.uid, fetchProjectDetails]);

  // Submit a bid
  const submitBid = useCallback(async (
    solicitationId: string,
    projectId: string,
    data: BidSubmissionData
  ) => {
    if (!user) throw new Error('Not authenticated');

    const now = new Date();
    const bidData: Partial<Bid> = {
      projectId,
      subId: user.uid,
      amount: data.amount,
      laborCost: data.laborCost,
      materialCost: data.materialCost,
      proposedStartDate: data.proposedStartDate,
      proposedEndDate: data.proposedEndDate,
      timeline: data.timeline,
      description: data.description,
      status: 'submitted',
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    await addDoc(collection(db, 'bids'), toFirestore(bidData as Record<string, unknown>));
  }, [user]);

  // Update an existing bid
  const updateBid = useCallback(async (bidId: string, data: Partial<BidSubmissionData>) => {
    if (!user) throw new Error('Not authenticated');

    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: Timestamp.now(),
    };

    // Convert dates
    if (data.proposedStartDate) updateData.proposedStartDate = Timestamp.fromDate(data.proposedStartDate);
    if (data.proposedEndDate) updateData.proposedEndDate = Timestamp.fromDate(data.proposedEndDate);

    await updateDoc(doc(db, 'bids', bidId), updateData);
  }, [user]);

  // Withdraw a bid
  const withdrawBid = useCallback(async (bidId: string) => {
    if (!user) throw new Error('Not authenticated');

    await updateDoc(doc(db, 'bids', bidId), {
      status: 'withdrawn',
      updatedAt: Timestamp.now(),
    });
  }, [user]);

  // Create a draft bid (not yet submitted)
  const createDraftBid = useCallback(async (
    projectId: string,
    data: BidSubmissionData
  ) => {
    if (!user) throw new Error('Not authenticated');

    const now = new Date();
    const bidData: Partial<Bid> = {
      projectId,
      subId: user.uid,
      amount: data.amount,
      laborCost: data.laborCost,
      materialCost: data.materialCost,
      proposedStartDate: data.proposedStartDate,
      proposedEndDate: data.proposedEndDate,
      timeline: data.timeline,
      description: data.description,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, 'bids'), toFirestore(bidData as Record<string, unknown>));
    return docRef.id;
  }, [user]);

  // Submit a draft bid
  const submitDraftBid = useCallback(async (bidId: string) => {
    if (!user) throw new Error('Not authenticated');

    await updateDoc(doc(db, 'bids', bidId), {
      status: 'submitted',
      submittedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }, [user]);

  return {
    bids,
    solicitations,
    loading,
    error,
    submitBid,
    updateBid,
    withdrawBid,
    createDraftBid,
    submitDraftBid,
    refetch: () => {
      setLoading(true);
      // The effect will re-run due to the loading state change
    },
  };
}
