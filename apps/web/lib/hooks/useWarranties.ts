"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { WarrantyItem, WarrantyStatus, WarrantyClaim } from '@/types';
import { useAuth } from '@/lib/auth';
import { toast } from '@/components/ui/Toast';
import { logger } from '@/lib/utils/logger';

interface UseWarrantiesOptions {
  projectId?: string;
  status?: WarrantyStatus;
}

export function useWarranties(options: UseWarrantiesOptions = {}) {
  const { profile } = useAuth();
  const [warranties, setWarranties] = useState<WarrantyItem[]>([]);
  const [loading, setLoading] = useState(true);

  const orgId = profile?.orgId;

  useEffect(() => {
    if (!orgId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
      setLoading(false);
      return;
    }

    const constraints: any[] = [
      where('orgId', '==', orgId),
      orderBy('endDate', 'asc'),
    ];

    if (options.projectId) {
      constraints.push(where('projectId', '==', options.projectId));
    }

    if (options.status) {
      constraints.push(where('status', '==', options.status));
    }

    const q = query(collection(db, 'warranties'), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            startDate: data.startDate?.toDate() || new Date(),
            endDate: data.endDate?.toDate() || new Date(),
            claimHistory: (data.claimHistory || []).map((c: any) => ({
              ...c,
              date: c.date?.toDate() || new Date(),
              resolvedAt: c.resolvedAt?.toDate(),
            })),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate(),
          } as WarrantyItem;
        });

        // Update status based on dates
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        items.forEach((item) => {
          if (item.endDate < now && item.status !== 'expired' && item.status !== 'claimed') {
            // Auto-update expired warranties
            updateDoc(doc(db, 'warranties', item.id), { status: 'expired' });
          } else if (item.endDate <= thirtyDaysFromNow && item.endDate > now && item.status === 'active') {
            // Mark as expiring soon
            updateDoc(doc(db, 'warranties', item.id), { status: 'expiring_soon' });
          }
        });

        setWarranties(items);
        setLoading(false);
      },
      (err) => {
        logger.error('Error loading warranties', { error: err, hook: 'useWarranties' });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId, options.projectId, options.status]);

  // Stats
  const stats = useMemo(() => {
    const active = warranties.filter((w) => w.status === 'active').length;
    const expiringSoon = warranties.filter((w) => w.status === 'expiring_soon').length;
    const expired = warranties.filter((w) => w.status === 'expired').length;
    const claimed = warranties.filter((w) => w.status === 'claimed').length;
    return { active, expiringSoon, expired, claimed, total: warranties.length };
  }, [warranties]);

  // Add warranty
  const addWarranty = useCallback(
    async (input: Omit<WarrantyItem, 'id' | 'orgId' | 'createdAt' | 'createdBy' | 'claimHistory' | 'status'>) => {
      if (!orgId || !profile?.uid) throw new Error('Not authenticated');

      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      let status: WarrantyStatus = 'active';
      if (input.endDate < now) {
        status = 'expired';
      } else if (input.endDate <= thirtyDaysFromNow) {
        status = 'expiring_soon';
      }

      const docRef = await addDoc(collection(db, 'warranties'), {
        ...input,
        orgId,
        status,
        claimHistory: [],
        startDate: Timestamp.fromDate(input.startDate),
        endDate: Timestamp.fromDate(input.endDate),
        createdAt: Timestamp.now(),
        createdBy: profile.uid,
      });

      toast.success('Warranty added');
      return docRef.id;
    },
    [orgId, profile?.uid]
  );

  // Update warranty
  const updateWarranty = useCallback(
    async (id: string, updates: Partial<Omit<WarrantyItem, 'id' | 'orgId' | 'createdAt'>>) => {
      if (!profile?.uid) return;

      const updateData: Record<string, unknown> = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      if (updates.startDate) {
        updateData.startDate = Timestamp.fromDate(updates.startDate);
      }
      if (updates.endDate) {
        updateData.endDate = Timestamp.fromDate(updates.endDate);
      }

      // Remove claimHistory from direct updates - use addClaim instead
      delete updateData.claimHistory;

      await updateDoc(doc(db, 'warranties', id), updateData);
      toast.success('Warranty updated');
    },
    [profile?.uid]
  );

  // Delete warranty
  const deleteWarranty = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'warranties', id));
    toast.success('Warranty deleted');
  }, []);

  // Add a claim to a warranty
  const addClaim = useCallback(
    async (warrantyId: string, claim: Omit<WarrantyClaim, 'id'>) => {
      const warranty = warranties.find((w) => w.id === warrantyId);
      if (!warranty) throw new Error('Warranty not found');

      const newClaim: WarrantyClaim = {
        id: `claim_${Date.now()}`,
        ...claim,
      };

      const updatedHistory = [
        ...warranty.claimHistory.map((c) => ({
          ...c,
          date: Timestamp.fromDate(c.date),
          resolvedAt: c.resolvedAt ? Timestamp.fromDate(c.resolvedAt) : null,
        })),
        {
          ...newClaim,
          date: Timestamp.fromDate(claim.date),
          resolvedAt: claim.resolvedAt ? Timestamp.fromDate(claim.resolvedAt) : null,
        },
      ];

      await updateDoc(doc(db, 'warranties', warrantyId), {
        claimHistory: updatedHistory,
        status: 'claimed',
        updatedAt: Timestamp.now(),
      });

      toast.success('Claim added');
    },
    [warranties]
  );

  // Resolve a claim
  const resolveClaim = useCallback(
    async (warrantyId: string, claimId: string, resolution: string) => {
      const warranty = warranties.find((w) => w.id === warrantyId);
      if (!warranty) throw new Error('Warranty not found');

      const updatedHistory = warranty.claimHistory.map((c) => {
        if (c.id === claimId) {
          return {
            ...c,
            resolution,
            resolvedAt: Timestamp.now(),
            date: Timestamp.fromDate(c.date),
          };
        }
        return {
          ...c,
          date: Timestamp.fromDate(c.date),
          resolvedAt: c.resolvedAt ? Timestamp.fromDate(c.resolvedAt) : null,
        };
      });

      await updateDoc(doc(db, 'warranties', warrantyId), {
        claimHistory: updatedHistory,
        updatedAt: Timestamp.now(),
      });

      toast.success('Claim resolved');
    },
    [warranties]
  );

  return {
    warranties,
    loading,
    stats,
    addWarranty,
    updateWarranty,
    deleteWarranty,
    addClaim,
    resolveClaim,
  };
}
