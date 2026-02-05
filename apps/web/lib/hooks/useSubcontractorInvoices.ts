'use client';

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
  deleteDoc,
  doc,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import { convertTimestampsDeep } from '@/lib/firebase/timestamp-converter';
import { toast } from '@/components/ui/Toast';
import {
  SubcontractorInvoice,
  APInvoiceStatus,
  LienWaiver,
} from '@/types';

interface UseSubcontractorInvoicesOptions {
  vendorId?: string;
  projectId?: string;
  status?: APInvoiceStatus;
}

interface UseSubcontractorInvoicesReturn {
  invoices: SubcontractorInvoice[];
  loading: boolean;
  error: string | null;

  // CRUD
  createInvoice: (invoice: Omit<SubcontractorInvoice, 'id' | 'orgId' | 'createdAt' | 'createdBy'>) => Promise<string>;
  updateInvoice: (invoiceId: string, updates: Partial<SubcontractorInvoice>) => Promise<void>;
  deleteInvoice: (invoiceId: string) => Promise<void>;

  // Approval workflow
  submitInvoice: (invoiceId: string) => Promise<void>;
  approveInvoice: (invoiceId: string) => Promise<void>;
  disputeInvoice: (invoiceId: string, reason: string) => Promise<void>;
  markPaid: (invoiceId: string, method?: string, checkNumber?: string) => Promise<void>;

  // Lien waivers
  requestLienWaiver: (invoiceId: string, vendorId: string, vendorName: string, projectId: string, waiverType: string, amount: number) => Promise<string>;
  lienWaivers: LienWaiver[];
}

export function useSubcontractorInvoices(
  options: UseSubcontractorInvoicesOptions = {}
): UseSubcontractorInvoicesReturn {
  const { user, profile } = useAuth();
  const [invoices, setInvoices] = useState<SubcontractorInvoice[]>([]);
  const [lienWaivers, setLienWaivers] = useState<LienWaiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orgId = profile?.orgId;
  const currentUserId = profile?.uid;
  const _currentUserName = profile?.displayName || user?.email || 'Unknown';
  const isManager = profile?.role === 'OWNER' || profile?.role === 'PM';

  // Fetch invoices with real-time updates
  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    const constraints: QueryConstraint[] = [];

    if (options.vendorId) {
      constraints.push(where('vendorId', '==', options.vendorId));
    }
    if (options.projectId) {
      constraints.push(where('projectId', '==', options.projectId));
    }
    if (options.status) {
      constraints.push(where('status', '==', options.status));
    }

    constraints.push(orderBy('invoiceDate', 'desc'));
    constraints.push(limit(500));

    const q = query(
      collection(db, `organizations/${orgId}/subcontractorInvoices`),
      ...constraints
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...convertTimestampsDeep(d.data()),
        })) as SubcontractorInvoice[];

        setInvoices(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching subcontractor invoices:', err);
        if (err.message?.includes('requires an index')) {
          setError('Database index required. Please deploy Firestore indexes.');
        } else if (err.message?.includes('permission-denied')) {
          setError('Permission denied. Please check Firestore security rules.');
        } else {
          setError(err.message || 'Failed to load subcontractor invoices');
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId, options.vendorId, options.projectId, options.status]);

  // Fetch lien waivers
  useEffect(() => {
    if (!orgId) return;

    const q = query(
      collection(db, `organizations/${orgId}/lienWaivers`),
      orderBy('createdAt', 'desc'),
      limit(200)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...convertTimestampsDeep(d.data()),
        })) as LienWaiver[];
        setLienWaivers(data);
      },
      (err) => {
        console.error('Error fetching lien waivers:', err);
      }
    );

    return () => unsubscribe();
  }, [orgId]);

  // Create invoice
  const createInvoice = useCallback(async (
    invoiceData: Omit<SubcontractorInvoice, 'id' | 'orgId' | 'createdAt' | 'createdBy'>
  ): Promise<string> => {
    if (!orgId || !currentUserId) throw new Error('Not authenticated');

    try {
      const now = new Date();
      const docRef = await addDoc(
        collection(db, `organizations/${orgId}/subcontractorInvoices`),
        {
          ...invoiceData,
          orgId,
          createdBy: currentUserId,
          createdAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now),
        }
      );
      toast.success('Subcontractor invoice created');
      return docRef.id;
    } catch (err) {
      console.error('Create sub invoice error:', err);
      toast.error('Failed to create invoice');
      throw err;
    }
  }, [orgId, currentUserId]);

  // Update invoice
  const updateInvoice = useCallback(async (
    invoiceId: string,
    updates: Partial<SubcontractorInvoice>
  ): Promise<void> => {
    if (!orgId) throw new Error('Not authenticated');

    try {
      const updateData: Record<string, unknown> = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
      };

      if (updates.approvedAt) {
        updateData.approvedAt = Timestamp.fromDate(updates.approvedAt);
      }
      if (updates.paidAt) {
        updateData.paidAt = Timestamp.fromDate(updates.paidAt);
      }

      await updateDoc(
        doc(db, `organizations/${orgId}/subcontractorInvoices/${invoiceId}`),
        updateData
      );
    } catch (err) {
      console.error('Update sub invoice error:', err);
      toast.error('Failed to update invoice');
      throw err;
    }
  }, [orgId]);

  // Delete invoice
  const deleteInvoice = useCallback(async (invoiceId: string): Promise<void> => {
    if (!orgId) throw new Error('Not authenticated');
    try {
      await deleteDoc(doc(db, `organizations/${orgId}/subcontractorInvoices/${invoiceId}`));
      toast.success('Invoice deleted');
    } catch (err) {
      console.error('Delete sub invoice error:', err);
      toast.error('Failed to delete invoice');
      throw err;
    }
  }, [orgId]);

  // Submit invoice for approval
  const submitInvoice = useCallback(async (invoiceId: string): Promise<void> => {
    if (!orgId) throw new Error('Not authenticated');
    try {
      await updateInvoice(invoiceId, { status: 'submitted' });
      toast.success('Invoice submitted for approval');
    } catch (err) {
      console.error('Submit invoice error:', err);
      throw err;
    }
  }, [orgId, updateInvoice]);

  // Approve invoice
  const approveInvoice = useCallback(async (invoiceId: string): Promise<void> => {
    if (!orgId || !currentUserId) throw new Error('Not authenticated');
    if (!isManager) throw new Error('Only managers can approve invoices');

    try {
      await updateInvoice(invoiceId, {
        status: 'approved',
        approvedBy: currentUserId,
        approvedAt: new Date(),
      });
      toast.success('Invoice approved');
    } catch (err) {
      console.error('Approve invoice error:', err);
      throw err;
    }
  }, [orgId, currentUserId, isManager, updateInvoice]);

  // Dispute invoice
  const disputeInvoice = useCallback(async (invoiceId: string, reason: string): Promise<void> => {
    if (!orgId) throw new Error('Not authenticated');

    try {
      await updateInvoice(invoiceId, {
        status: 'disputed',
        notes: reason,
      });
      toast.success('Invoice marked as disputed');
    } catch (err) {
      console.error('Dispute invoice error:', err);
      throw err;
    }
  }, [orgId, updateInvoice]);

  // Mark invoice as paid
  const markPaid = useCallback(async (
    invoiceId: string,
    method?: string,
    checkNumber?: string
  ): Promise<void> => {
    if (!orgId || !currentUserId) throw new Error('Not authenticated');
    if (!isManager) throw new Error('Only managers can mark invoices as paid');

    try {
      await updateInvoice(invoiceId, {
        status: 'paid',
        paidAt: new Date(),
        paymentMethod: method,
        checkNumber,
      });
      toast.success('Invoice marked as paid');
    } catch (err) {
      console.error('Mark paid error:', err);
      throw err;
    }
  }, [orgId, currentUserId, isManager, updateInvoice]);

  // Request lien waiver
  const requestLienWaiver = useCallback(async (
    invoiceId: string,
    vendorId: string,
    vendorName: string,
    projectId: string,
    waiverType: string,
    amount: number
  ): Promise<string> => {
    if (!orgId || !currentUserId) throw new Error('Not authenticated');

    try {
      const now = new Date();
      const docRef = await addDoc(
        collection(db, `organizations/${orgId}/lienWaivers`),
        {
          invoiceId,
          orgId,
          vendorId,
          vendorName,
          projectId,
          waiverType,
          amount,
          status: 'pending',
          requestedAt: Timestamp.fromDate(now),
          requestedBy: currentUserId,
          createdAt: Timestamp.fromDate(now),
        }
      );

      // Update invoice with lien waiver reference
      await updateInvoice(invoiceId, {
        lienWaiverStatus: 'pending',
        lienWaiverId: docRef.id,
      });

      toast.success('Lien waiver requested');
      return docRef.id;
    } catch (err) {
      console.error('Request lien waiver error:', err);
      toast.error('Failed to request lien waiver');
      throw err;
    }
  }, [orgId, currentUserId, updateInvoice]);

  return {
    invoices,
    loading,
    error,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    submitInvoice,
    approveInvoice,
    disputeInvoice,
    markPaid,
    requestLienWaiver,
    lienWaivers,
  };
}

// Convenience hooks
export function useVendorInvoices(vendorId: string) {
  return useSubcontractorInvoices({ vendorId });
}

export function usePendingApprovalInvoices() {
  return useSubcontractorInvoices({ status: 'submitted' });
}
