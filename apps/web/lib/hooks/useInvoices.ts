/**
 * @fileoverview Invoice Management Hooks
 *
 * Provides comprehensive invoice data management with real-time Firestore updates.
 *
 * This module exports several hooks:
 * - useInvoices: List and filter invoices
 * - useInvoice: Single invoice with CRUD operations
 * - useInvoiceStats: Aggregate invoice statistics
 *
 * Uses shared utilities:
 * - convertTimestamps from lib/firebase/timestamp-converter.ts
 * - useFirestoreCollection from lib/hooks/useFirestoreCollection.ts
 * - useFirestoreCrud from lib/hooks/useFirestoreCrud.ts
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  where,
  orderBy,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { convertTimestamps } from '@/lib/firebase/timestamp-converter';
import { useFirestoreCollection, createConverter } from '@/lib/hooks/useFirestoreCollection';
import { useFirestoreCrud } from '@/lib/hooks/useFirestoreCrud';
import { Invoice, InvoiceStatus, InvoiceLineItem, Payment } from '@/types';
import { reserveNumber } from '@/lib/utils/auto-number';

// Collection path - invoices are org-scoped
const getInvoicesCollectionPath = (orgId: string) => `organizations/${orgId}/invoices`;

// Also support root-level invoices collection for backward compatibility
const ROOT_INVOICES_COLLECTION = 'invoices';

// Date fields for Invoice entity
const INVOICE_DATE_FIELDS = [
  'createdAt',
  'updatedAt',
  'dueDate',
  'sentAt',
  'viewedAt',
  'paidAt',
  'voidedAt',
  'lastReminderAt',
  'nextReminderAt',
] as const;

// Converter for Invoice documents
const invoiceConverter = createConverter<Invoice>((id, data) => {
  const converted = convertTimestamps(data as Record<string, unknown>, INVOICE_DATE_FIELDS);

  // Check for overdue status
  let status = converted.status as InvoiceStatus;
  if (['sent', 'viewed', 'partial'].includes(status)) {
    const dueDate = converted.dueDate as Date | undefined;
    if (dueDate && dueDate < new Date()) {
      status = 'overdue';
    }
  }

  return {
    id,
    ...converted,
    status,
  } as Invoice;
});

// ============================================
// useInvoices - Main invoices list hook
// ============================================

export interface UseInvoicesOptions {
  orgId: string;
  status?: InvoiceStatus | 'all';
  clientId?: string;
  projectId?: string;
  search?: string;
  useOrgScoped?: boolean; // Use org-scoped collection (default) or root collection
}

export interface UseInvoicesReturn {
  invoices: Invoice[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
  totalCount: number;
}

/**
 * Hook for fetching and filtering invoices with real-time updates.
 *
 * @param {UseInvoicesOptions} options - Configuration options
 * @returns {UseInvoicesReturn} Invoices data and operations
 *
 * @example
 * const { invoices, loading } = useInvoices({ orgId });
 *
 * @example
 * const { invoices } = useInvoices({
 *   orgId,
 *   status: 'sent',
 *   clientId: 'client-123'
 * });
 */
export function useInvoices({
  orgId,
  status,
  clientId,
  projectId,
  search,
  useOrgScoped = true,
}: UseInvoicesOptions): UseInvoicesReturn {
  // Determine collection path
  const collectionPath = useMemo(() => {
    if (useOrgScoped) {
      return getInvoicesCollectionPath(orgId);
    }
    return ROOT_INVOICES_COLLECTION;
  }, [orgId, useOrgScoped]);

  // Build constraints based on filters
  const constraints = useMemo(() => {
    const c: QueryConstraint[] = [orderBy('createdAt', 'desc')];

    // For root collection, add orgId filter
    if (!useOrgScoped) {
      c.unshift(where('orgId', '==', orgId));
    }

    // Status filter (excluding 'all' and 'overdue' which is calculated client-side)
    if (status && status !== 'all' && status !== 'overdue') {
      c.unshift(where('status', '==', status));
    }

    if (clientId) {
      c.unshift(where('clientId', '==', clientId));
    }

    if (projectId) {
      c.unshift(where('projectId', '==', projectId));
    }

    return c;
  }, [orgId, status, clientId, projectId, useOrgScoped]);

  // Use shared collection hook
  const { items, loading, error, refetch, count } = useFirestoreCollection<Invoice>({
    path: collectionPath,
    constraints,
    converter: invoiceConverter,
    enabled: !!orgId,
  });

  // Client-side filtering for search and overdue status
  const filteredInvoices = useMemo(() => {
    let result = items;

    // Filter by overdue status (calculated client-side)
    if (status === 'overdue') {
      result = result.filter((invoice) => invoice.status === 'overdue');
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (invoice) =>
          invoice.number.toLowerCase().includes(searchLower) ||
          invoice.clientName?.toLowerCase().includes(searchLower) ||
          invoice.projectName?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [items, status, search]);

  return {
    invoices: filteredInvoices,
    loading,
    error,
    refresh: refetch,
    totalCount: count,
  };
}

// ============================================
// useInvoice - Single invoice hook
// ============================================

export interface UseInvoiceReturn {
  invoice: Invoice | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
  updateInvoice: (updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: () => Promise<void>;
  markAsPaid: (payment: Omit<Payment, 'id' | 'invoiceId' | 'createdAt'>) => Promise<void>;
  sendInvoice: () => Promise<void>;
  voidInvoice: (reason?: string) => Promise<void>;
  addPayment: (payment: Omit<Payment, 'id' | 'invoiceId' | 'createdAt'>) => Promise<void>;
}

/**
 * Hook for fetching and managing a single invoice with real-time updates.
 *
 * @param {string|undefined} invoiceId - Invoice ID to fetch
 * @param {string} orgId - Organization ID
 * @param {boolean} useOrgScoped - Use org-scoped collection (default true)
 *
 * @returns {UseInvoiceReturn} Invoice data and operations
 */
export function useInvoice(
  invoiceId: string | undefined,
  orgId: string,
  useOrgScoped: boolean = true
): UseInvoiceReturn {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const collectionPath = useOrgScoped
    ? getInvoicesCollectionPath(orgId)
    : ROOT_INVOICES_COLLECTION;

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Use shared CRUD hook
  const { update, remove } = useFirestoreCrud<Invoice>(collectionPath, {
    entityName: 'Invoice',
    showToast: false,
  });

  useEffect(() => {
    if (!invoiceId || !orgId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      doc(db, collectionPath, invoiceId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setInvoice(null);
          setLoading(false);
          return;
        }

        setInvoice(invoiceConverter(snapshot.id, snapshot.data()));
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching invoice:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [invoiceId, orgId, collectionPath, refreshKey]);

  const updateInvoice = useCallback(
    async (updates: Partial<Invoice>) => {
      if (!invoiceId || !orgId) throw new Error('Invoice ID and Org ID required');
      await update(invoiceId, updates);
    },
    [invoiceId, orgId, update]
  );

  const deleteInvoice = useCallback(async () => {
    if (!invoiceId || !orgId) throw new Error('Invoice ID and Org ID required');
    await remove(invoiceId);
  }, [invoiceId, orgId, remove]);

  const markAsPaid = useCallback(
    async (payment: Omit<Payment, 'id' | 'invoiceId' | 'createdAt'>) => {
      if (!invoiceId || !invoice || !orgId) throw new Error('Invoice and Org required');

      const newPayment: Payment = {
        ...payment,
        id: `payment_${Date.now()}`,
        invoiceId,
        createdAt: new Date(),
      };

      const newAmountPaid = invoice.amountPaid + payment.amount;
      const newAmountDue = invoice.total - newAmountPaid;
      const isPaidInFull = newAmountDue <= 0;

      await updateDoc(doc(db, collectionPath, invoiceId), {
        status: isPaidInFull ? 'paid' : 'partial',
        amountPaid: newAmountPaid,
        amountDue: Math.max(0, newAmountDue),
        paidAt: isPaidInFull ? Timestamp.now() : invoice.paidAt,
        payments: [...(invoice.payments || []), newPayment],
        updatedAt: Timestamp.now(),
      });
    },
    [invoiceId, invoice, orgId, collectionPath]
  );

  const sendInvoice = useCallback(async () => {
    if (!invoiceId || !invoice || !orgId) throw new Error('Invoice and Org required');

    await updateDoc(doc(db, collectionPath, invoiceId), {
      status: 'sent',
      sentAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }, [invoiceId, invoice, orgId, collectionPath]);

  const voidInvoice = useCallback(
    async (reason?: string) => {
      if (!invoiceId || !orgId) throw new Error('Invoice ID and Org ID required');

      await updateDoc(doc(db, collectionPath, invoiceId), {
        status: 'void',
        voidedAt: Timestamp.now(),
        voidReason: reason || '',
        updatedAt: Timestamp.now(),
      });
    },
    [invoiceId, orgId, collectionPath]
  );

  const addPayment = useCallback(
    async (payment: Omit<Payment, 'id' | 'invoiceId' | 'createdAt'>) => {
      await markAsPaid(payment);
    },
    [markAsPaid]
  );

  return {
    invoice,
    loading,
    error,
    refresh,
    updateInvoice,
    deleteInvoice,
    markAsPaid,
    sendInvoice,
    voidInvoice,
    addPayment,
  };
}

// ============================================
// useInvoiceStats - Aggregate statistics
// ============================================

export interface InvoiceStats {
  total: number;
  outstandingCount: number;
  outstandingAmount: number;
  overdueCount: number;
  overdueAmount: number;
  paidThisMonth: number;
  draftCount: number;
  sentCount: number;
}

export function useInvoiceStats(orgId: string): { stats: InvoiceStats; loading: boolean } {
  const { invoices, loading } = useInvoices({ orgId });

  const stats = useMemo<InvoiceStats>(() => {
    if (!invoices.length) {
      return {
        total: 0,
        outstandingCount: 0,
        outstandingAmount: 0,
        overdueCount: 0,
        overdueAmount: 0,
        paidThisMonth: 0,
        draftCount: 0,
        sentCount: 0,
      };
    }

    const outstanding = invoices.filter((i) =>
      ['sent', 'viewed', 'partial', 'overdue'].includes(i.status)
    );
    const overdue = invoices.filter((i) => i.status === 'overdue');
    const now = new Date();

    const paidThisMonth = invoices
      .filter((i) => {
        if (i.status !== 'paid' || !i.paidAt) return false;
        const paidDate = new Date(i.paidAt);
        return (
          paidDate.getMonth() === now.getMonth() &&
          paidDate.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, i) => sum + i.amountPaid, 0);

    return {
      total: invoices.length,
      outstandingCount: outstanding.length,
      outstandingAmount: outstanding.reduce((sum, i) => sum + i.amountDue, 0),
      overdueCount: overdue.length,
      overdueAmount: overdue.reduce((sum, i) => sum + i.amountDue, 0),
      paidThisMonth,
      draftCount: invoices.filter((i) => i.status === 'draft').length,
      sentCount: invoices.filter((i) => i.status === 'sent').length,
    };
  }, [invoices]);

  return { stats, loading };
}

// ============================================
// Invoice CRUD Operations
// ============================================

export interface CreateInvoiceData {
  type: Invoice['type'];
  clientId?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  billingAddress?: string;
  projectId?: string;
  projectName?: string;
  projectAddress?: string;
  lineItems: InvoiceLineItem[];
  paymentTerms: string;
  taxRate?: number;
  retainage?: number;
  discount?: number;
  discountType?: 'percent' | 'fixed';
  notes?: string;
  internalNotes?: string;
}

/**
 * Creates a new invoice with auto-generated number.
 *
 * @param data Invoice data
 * @param orgId Organization ID
 * @param userId User ID
 * @param userName User display name
 * @param useOrgScoped Use org-scoped collection
 * @returns Created invoice ID
 */
export async function createInvoice(
  data: CreateInvoiceData,
  orgId: string,
  userId: string,
  userName: string,
  useOrgScoped: boolean = true
): Promise<string> {
  if (!orgId) throw new Error('Organization ID required');

  // Calculate totals from line items
  const subtotal = data.lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = subtotal * ((data.taxRate || 0) / 100);
  const retainageAmount = subtotal * ((data.retainage || 0) / 100);

  let discountAmount = 0;
  if (data.discount) {
    discountAmount = data.discountType === 'percent'
      ? subtotal * (data.discount / 100)
      : data.discount;
  }

  const total = subtotal + taxAmount - retainageAmount - discountAmount;
  const amountDue = total;

  // Generate invoice number
  const number = await reserveNumber(orgId, 'invoice');

  // Calculate due date based on payment terms
  const getDaysFromTerms = (terms: string): number => {
    if (terms === 'Due on Receipt') return 0;
    const match = terms.match(/Net\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : 30;
  };

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + getDaysFromTerms(data.paymentTerms));

  const invoice: Omit<Invoice, 'id'> = {
    ...data,
    number,
    orgId,
    status: 'draft',
    subtotal,
    taxAmount,
    retainageAmount,
    total,
    amountDue,
    amountPaid: 0,
    dueDate,
    createdBy: userId,
    createdByName: userName,
    createdAt: new Date(),
  };

  const collectionPath = useOrgScoped
    ? getInvoicesCollectionPath(orgId)
    : ROOT_INVOICES_COLLECTION;

  const docRef = await addDoc(collection(db, collectionPath), {
    ...invoice,
    dueDate: Timestamp.fromDate(dueDate),
    createdAt: Timestamp.now(),
  });

  return docRef.id;
}

/**
 * Calculates invoice totals from line items.
 */
export function calculateInvoiceTotals(
  lineItems: InvoiceLineItem[],
  taxRate: number = 0,
  retainage: number = 0,
  discount: number = 0,
  discountType: 'percent' | 'fixed' = 'percent',
  amountPaid: number = 0
): {
  subtotal: number;
  taxAmount: number;
  retainageAmount: number;
  discountAmount: number;
  total: number;
  amountDue: number;
} {
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const retainageAmount = subtotal * (retainage / 100);
  const discountAmount = discountType === 'percent'
    ? subtotal * (discount / 100)
    : discount;
  const total = subtotal + taxAmount - retainageAmount - discountAmount;
  const amountDue = Math.max(0, total - amountPaid);

  return {
    subtotal,
    taxAmount,
    retainageAmount,
    discountAmount,
    total,
    amountDue,
  };
}

// ============================================
// Invoice Status Labels
// ============================================

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  viewed: 'Viewed',
  partial: 'Partial',
  paid: 'Paid',
  overdue: 'Overdue',
  void: 'Void',
};

export const INVOICE_TYPE_LABELS: Record<Invoice['type'], string> = {
  standard: 'Standard',
  progress: 'Progress',
  aia_g702: 'AIA G702/G703',
  deposit: 'Deposit',
  final: 'Final',
  change_order: 'Change Order',
};
