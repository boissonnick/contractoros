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
import { Permit, PermitStatus, PermitInspection, PermitType } from '@/types';
import { useAuth } from '@/lib/auth';
import { toast } from '@/components/ui/Toast';

interface UsePermitsOptions {
  projectId?: string;
  status?: PermitStatus;
}

export const PERMIT_TYPE_LABELS: Record<PermitType, string> = {
  building: 'Building',
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  mechanical: 'Mechanical',
  demolition: 'Demolition',
  grading: 'Grading',
  fence: 'Fence',
  sign: 'Sign',
  other: 'Other',
};

export const PERMIT_STATUS_LABELS: Record<PermitStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  denied: 'Denied',
  expired: 'Expired',
  closed: 'Closed',
};

export function usePermits(options: UsePermitsOptions = {}) {
  const { profile } = useAuth();
  const [permits, setPermits] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(true);

  const orgId = profile?.orgId;

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    const constraints: any[] = [
      where('orgId', '==', orgId),
      orderBy('createdAt', 'desc'),
    ];

    if (options.projectId) {
      constraints.push(where('projectId', '==', options.projectId));
    }

    if (options.status) {
      constraints.push(where('status', '==', options.status));
    }

    const q = query(collection(db, 'permits'), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            submittedDate: data.submittedDate?.toDate(),
            approvedDate: data.approvedDate?.toDate(),
            expirationDate: data.expirationDate?.toDate(),
            feePaidDate: data.feePaidDate?.toDate(),
            inspections: (data.inspections || []).map((i: any) => ({
              ...i,
              scheduledDate: i.scheduledDate?.toDate(),
              completedDate: i.completedDate?.toDate(),
            })),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate(),
          } as Permit;
        });

        // Auto-update expired permits
        const now = new Date();
        items.forEach((item) => {
          if (item.expirationDate && item.expirationDate < now && item.status === 'approved') {
            updateDoc(doc(db, 'permits', item.id), { status: 'expired' });
          }
        });

        setPermits(items);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading permits:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId, options.projectId, options.status]);

  // Stats
  const stats = useMemo(() => {
    const draft = permits.filter((p) => p.status === 'draft').length;
    const submitted = permits.filter((p) => p.status === 'submitted').length;
    const underReview = permits.filter((p) => p.status === 'under_review').length;
    const approved = permits.filter((p) => p.status === 'approved').length;
    const denied = permits.filter((p) => p.status === 'denied').length;
    const expired = permits.filter((p) => p.status === 'expired').length;
    return { draft, submitted, underReview, approved, denied, expired, total: permits.length };
  }, [permits]);

  // Add permit
  const addPermit = useCallback(
    async (input: Omit<Permit, 'id' | 'orgId' | 'createdAt' | 'createdBy' | 'inspections'>) => {
      if (!orgId || !profile?.uid) throw new Error('Not authenticated');

      const permitData: Record<string, unknown> = {
        ...input,
        orgId,
        inspections: [],
        createdAt: Timestamp.now(),
        createdBy: profile.uid,
      };

      // Convert dates to Timestamps
      if (input.submittedDate) {
        permitData.submittedDate = Timestamp.fromDate(input.submittedDate);
      }
      if (input.approvedDate) {
        permitData.approvedDate = Timestamp.fromDate(input.approvedDate);
      }
      if (input.expirationDate) {
        permitData.expirationDate = Timestamp.fromDate(input.expirationDate);
      }
      if (input.feePaidDate) {
        permitData.feePaidDate = Timestamp.fromDate(input.feePaidDate);
      }

      const docRef = await addDoc(collection(db, 'permits'), permitData);

      toast.success('Permit added');
      return docRef.id;
    },
    [orgId, profile?.uid]
  );

  // Update permit
  const updatePermit = useCallback(
    async (id: string, updates: Partial<Omit<Permit, 'id' | 'orgId' | 'createdAt'>>) => {
      if (!profile?.uid) return;

      const updateData: Record<string, unknown> = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      // Convert dates to Timestamps
      if (updates.submittedDate) {
        updateData.submittedDate = Timestamp.fromDate(updates.submittedDate);
      }
      if (updates.approvedDate) {
        updateData.approvedDate = Timestamp.fromDate(updates.approvedDate);
      }
      if (updates.expirationDate) {
        updateData.expirationDate = Timestamp.fromDate(updates.expirationDate);
      }
      if (updates.feePaidDate) {
        updateData.feePaidDate = Timestamp.fromDate(updates.feePaidDate);
      }

      // Remove inspections from direct updates - use addInspection instead
      delete updateData.inspections;

      await updateDoc(doc(db, 'permits', id), updateData);
      toast.success('Permit updated');
    },
    [profile?.uid]
  );

  // Delete permit
  const deletePermit = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'permits', id));
    toast.success('Permit deleted');
  }, []);

  // Add an inspection to a permit
  const addInspection = useCallback(
    async (permitId: string, inspection: Omit<PermitInspection, 'id'>) => {
      const permit = permits.find((p) => p.id === permitId);
      if (!permit) throw new Error('Permit not found');

      const newInspection: PermitInspection = {
        id: `insp_${Date.now()}`,
        ...inspection,
      };

      const updatedInspections = [
        ...permit.inspections.map((i) => ({
          ...i,
          scheduledDate: i.scheduledDate ? Timestamp.fromDate(i.scheduledDate) : null,
          completedDate: i.completedDate ? Timestamp.fromDate(i.completedDate) : null,
        })),
        {
          ...newInspection,
          scheduledDate: inspection.scheduledDate ? Timestamp.fromDate(inspection.scheduledDate) : null,
          completedDate: inspection.completedDate ? Timestamp.fromDate(inspection.completedDate) : null,
        },
      ];

      await updateDoc(doc(db, 'permits', permitId), {
        inspections: updatedInspections,
        updatedAt: Timestamp.now(),
      });

      toast.success('Inspection added');
    },
    [permits]
  );

  // Update an inspection
  const updateInspection = useCallback(
    async (permitId: string, inspectionId: string, updates: Partial<Omit<PermitInspection, 'id'>>) => {
      const permit = permits.find((p) => p.id === permitId);
      if (!permit) throw new Error('Permit not found');

      const updatedInspections = permit.inspections.map((i) => {
        const baseInspection = {
          ...i,
          scheduledDate: i.scheduledDate ? Timestamp.fromDate(i.scheduledDate) : null,
          completedDate: i.completedDate ? Timestamp.fromDate(i.completedDate) : null,
        };

        if (i.id === inspectionId) {
          return {
            ...baseInspection,
            ...updates,
            scheduledDate: updates.scheduledDate ? Timestamp.fromDate(updates.scheduledDate) : baseInspection.scheduledDate,
            completedDate: updates.completedDate ? Timestamp.fromDate(updates.completedDate) : baseInspection.completedDate,
          };
        }
        return baseInspection;
      });

      await updateDoc(doc(db, 'permits', permitId), {
        inspections: updatedInspections,
        updatedAt: Timestamp.now(),
      });

      toast.success('Inspection updated');
    },
    [permits]
  );

  return {
    permits,
    loading,
    stats,
    addPermit,
    updatePermit,
    deletePermit,
    addInspection,
    updateInspection,
  };
}
