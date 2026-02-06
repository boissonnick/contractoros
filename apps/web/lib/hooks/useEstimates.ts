/**
 * @fileoverview Estimate Management Hooks
 *
 * Provides comprehensive estimate data management with real-time Firestore updates.
 *
 * This module exports several hooks:
 * - useEstimates: List and filter estimates
 * - useEstimate: Single estimate with CRUD operations
 * - useEstimateStats: Aggregate estimate statistics
 *
 * Also exports standalone functions:
 * - createEstimate: Create a new estimate with auto-numbering
 * - calculateEstimateTotals: Calculate totals from line items
 * - convertEstimateToInvoice: Convert an accepted estimate into a draft invoice
 * - reviseEstimate: Create a new revision of an existing estimate
 * - duplicateEstimate: Duplicate an estimate as a new draft
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
import { Estimate, EstimateStatus, EstimateLineItem } from '@/types';
import { reserveNumber } from '@/lib/utils/auto-number';
import { logger } from '@/lib/utils/logger';

// Collection path - estimates use root collection (backward compat)
const getEstimatesCollectionPath = (orgId: string) => `organizations/${orgId}/estimates`;

// Also support root-level estimates collection for backward compatibility
const ROOT_ESTIMATES_COLLECTION = 'estimates';

// Date fields for Estimate entity
const ESTIMATE_DATE_FIELDS = [
  'createdAt',
  'updatedAt',
  'validUntil',
  'sentAt',
  'viewedAt',
  'acceptedAt',
  'declinedAt',
  'signedAt',
] as const;

// Converter for Estimate documents
const estimateConverter = createConverter<Estimate>((id, data) => {
  const converted = convertTimestamps(data as Record<string, unknown>, ESTIMATE_DATE_FIELDS);

  // Check for expired status (client-side calculation)
  let status = converted.status as EstimateStatus;
  if (['sent', 'viewed'].includes(status)) {
    const validUntil = converted.validUntil as Date | undefined;
    if (validUntil && validUntil < new Date()) {
      status = 'expired';
    }
  }

  return {
    id,
    ...converted,
    status,
  } as Estimate;
});

// ============================================
// useEstimates - Main estimates list hook
// ============================================

export interface UseEstimatesOptions {
  orgId: string;
  status?: EstimateStatus | 'all';
  clientId?: string;
  projectId?: string;
  search?: string;
  useOrgScoped?: boolean;
}

export interface UseEstimatesReturn {
  estimates: Estimate[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
  totalCount: number;
}

/**
 * Hook for fetching and filtering estimates with real-time updates.
 *
 * @param {UseEstimatesOptions} options - Configuration options
 * @returns {UseEstimatesReturn} Estimates data and operations
 *
 * @example
 * const { estimates, loading } = useEstimates({ orgId });
 *
 * @example
 * const { estimates } = useEstimates({
 *   orgId,
 *   status: 'sent',
 *   clientId: 'client-123'
 * });
 */
export function useEstimates({
  orgId,
  status,
  clientId,
  projectId,
  search,
  useOrgScoped = false, // Default false for backward compat with existing root collection
}: UseEstimatesOptions): UseEstimatesReturn {
  // Determine collection path
  const collectionPath = useMemo(() => {
    if (useOrgScoped) {
      return getEstimatesCollectionPath(orgId);
    }
    return ROOT_ESTIMATES_COLLECTION;
  }, [orgId, useOrgScoped]);

  // Build constraints based on filters
  const constraints = useMemo(() => {
    const c: QueryConstraint[] = [orderBy('createdAt', 'desc')];

    // For root collection, add orgId filter
    if (!useOrgScoped) {
      c.unshift(where('orgId', '==', orgId));
    }

    // Status filter (excluding 'all' and 'expired' which is calculated client-side)
    if (status && status !== 'all' && status !== 'expired') {
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
  const { items, loading, error, refetch, count } = useFirestoreCollection<Estimate>({
    path: collectionPath,
    constraints,
    converter: estimateConverter,
    enabled: !!orgId,
  });

  // Client-side filtering for search and expired status
  const filteredEstimates = useMemo(() => {
    let result = items;

    // Filter by expired status (calculated client-side)
    if (status === 'expired') {
      result = result.filter((estimate) => estimate.status === 'expired');
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (estimate) =>
          estimate.name.toLowerCase().includes(searchLower) ||
          estimate.number.toLowerCase().includes(searchLower) ||
          estimate.clientName?.toLowerCase().includes(searchLower) ||
          estimate.projectName?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [items, status, search]);

  return {
    estimates: filteredEstimates,
    loading,
    error,
    refresh: refetch,
    totalCount: count,
  };
}

// ============================================
// useEstimate - Single estimate hook
// ============================================

export interface UseEstimateReturn {
  estimate: Estimate | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
  updateEstimate: (updates: Partial<Estimate>) => Promise<void>;
  deleteEstimate: () => Promise<void>;
  markAsSent: () => Promise<void>;
  markAsAccepted: () => Promise<void>;
  markAsDeclined: (reason?: string) => Promise<void>;
  duplicateEstimate: () => Promise<string>;
}

/**
 * Hook for fetching and managing a single estimate with real-time updates.
 *
 * @param {string|undefined} estimateId - Estimate ID to fetch
 * @param {string} orgId - Organization ID
 * @param {boolean} useOrgScoped - Use org-scoped collection (default false for backward compat)
 *
 * @returns {UseEstimateReturn} Estimate data and operations
 */
export function useEstimate(
  estimateId: string | undefined,
  orgId: string,
  useOrgScoped: boolean = false
): UseEstimateReturn {
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const collectionPath = useOrgScoped
    ? getEstimatesCollectionPath(orgId)
    : ROOT_ESTIMATES_COLLECTION;

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Use shared CRUD hook
  const { update, remove } = useFirestoreCrud<Estimate>(collectionPath, {
    entityName: 'Estimate',
    showToast: false,
  });

  useEffect(() => {
    if (!estimateId || !orgId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      doc(db, collectionPath, estimateId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setEstimate(null);
          setLoading(false);
          return;
        }

        setEstimate(estimateConverter(snapshot.id, snapshot.data()));
        setLoading(false);
      },
      (err) => {
        logger.error('Error fetching estimate', { error: err, hook: 'useEstimates' });
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [estimateId, orgId, collectionPath, refreshKey]);

  const updateEstimate = useCallback(
    async (updates: Partial<Estimate>) => {
      if (!estimateId || !orgId) throw new Error('Estimate ID and Org ID required');
      await update(estimateId, updates);
    },
    [estimateId, orgId, update]
  );

  const deleteEstimate = useCallback(async () => {
    if (!estimateId || !orgId) throw new Error('Estimate ID and Org ID required');
    await remove(estimateId);
  }, [estimateId, orgId, remove]);

  const markAsSent = useCallback(async () => {
    if (!estimateId || !orgId) throw new Error('Estimate ID and Org ID required');

    await updateDoc(doc(db, collectionPath, estimateId), {
      status: 'sent',
      sentAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }, [estimateId, orgId, collectionPath]);

  const markAsAccepted = useCallback(async () => {
    if (!estimateId || !orgId) throw new Error('Estimate ID and Org ID required');

    await updateDoc(doc(db, collectionPath, estimateId), {
      status: 'accepted',
      acceptedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }, [estimateId, orgId, collectionPath]);

  const markAsDeclined = useCallback(
    async (reason?: string) => {
      if (!estimateId || !orgId) throw new Error('Estimate ID and Org ID required');

      await updateDoc(doc(db, collectionPath, estimateId), {
        status: 'declined',
        declinedAt: Timestamp.now(),
        declineReason: reason || '',
        updatedAt: Timestamp.now(),
      });
    },
    [estimateId, orgId, collectionPath]
  );

  const duplicateEstimateAction = useCallback(async (): Promise<string> => {
    if (!estimate || !orgId) throw new Error('Estimate and Org required');

    const number = await reserveNumber(orgId, 'estimate');

    const duplicated: Record<string, unknown> = {
      orgId: estimate.orgId,
      number,
      name: `${estimate.name} (Copy)`,
      description: estimate.description,
      status: 'draft',
      clientId: estimate.clientId,
      clientName: estimate.clientName,
      clientEmail: estimate.clientEmail,
      clientPhone: estimate.clientPhone,
      clientAddress: estimate.clientAddress,
      projectId: estimate.projectId,
      projectName: estimate.projectName,
      projectAddress: estimate.projectAddress,
      lineItems: estimate.lineItems,
      sections: estimate.sections,
      subtotal: estimate.subtotal,
      taxRate: estimate.taxRate,
      taxAmount: estimate.taxAmount,
      discount: estimate.discount,
      discountType: estimate.discountType,
      total: estimate.total,
      markupPercent: estimate.markupPercent,
      profitMargin: estimate.profitMargin,
      paymentTerms: estimate.paymentTerms,
      depositRequired: estimate.depositRequired,
      depositPercent: estimate.depositPercent,
      scopeOfWork: estimate.scopeOfWork,
      exclusions: estimate.exclusions,
      notes: estimate.notes,
      termsAndConditions: estimate.termsAndConditions,
      revisionNumber: 0,
      createdBy: estimate.createdBy,
      createdByName: estimate.createdByName,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, collectionPath), duplicated);
    return docRef.id;
  }, [estimate, orgId, collectionPath]);

  return {
    estimate,
    loading,
    error,
    refresh,
    updateEstimate,
    deleteEstimate,
    markAsSent,
    markAsAccepted,
    markAsDeclined,
    duplicateEstimate: duplicateEstimateAction,
  };
}

// ============================================
// useEstimateStats - Aggregate statistics
// ============================================

export interface EstimateStats {
  total: number;
  draftCount: number;
  sentCount: number;
  acceptedCount: number;
  declinedCount: number;
  expiredCount: number;
  totalValue: number;
  wonValue: number;
  pendingValue: number;
  winRate: number;
}

export function useEstimateStats(orgId: string): { stats: EstimateStats; loading: boolean } {
  const { estimates, loading } = useEstimates({ orgId });

  const stats = useMemo<EstimateStats>(() => {
    if (!estimates.length) {
      return {
        total: 0,
        draftCount: 0,
        sentCount: 0,
        acceptedCount: 0,
        declinedCount: 0,
        expiredCount: 0,
        totalValue: 0,
        wonValue: 0,
        pendingValue: 0,
        winRate: 0,
      };
    }

    const drafts = estimates.filter((e) => e.status === 'draft');
    const sent = estimates.filter((e) => ['sent', 'viewed'].includes(e.status));
    const accepted = estimates.filter((e) => e.status === 'accepted');
    const declined = estimates.filter((e) => e.status === 'declined');
    const expired = estimates.filter((e) => e.status === 'expired');

    const totalValue = estimates.reduce((sum, e) => sum + e.total, 0);
    const wonValue = accepted.reduce((sum, e) => sum + e.total, 0);
    const pendingValue = sent.reduce((sum, e) => sum + e.total, 0);

    const decided = accepted.length + declined.length;
    const winRate = decided > 0 ? Math.round((accepted.length / decided) * 100) : 0;

    return {
      total: estimates.length,
      draftCount: drafts.length,
      sentCount: sent.length,
      acceptedCount: accepted.length,
      declinedCount: declined.length,
      expiredCount: expired.length,
      totalValue,
      wonValue,
      pendingValue,
      winRate,
    };
  }, [estimates]);

  return { stats, loading };
}

// ============================================
// Estimate CRUD Operations
// ============================================

export interface CreateEstimateData {
  name: string;
  description?: string;
  clientId?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  projectId?: string;
  projectName?: string;
  projectAddress?: string;
  lineItems: EstimateLineItem[];
  sections?: Estimate['sections'];
  taxRate?: number;
  discount?: number;
  discountType?: 'percent' | 'fixed';
  markupPercent?: number;
  paymentTerms?: string;
  depositPercent?: number;
  validUntil?: Date;
  scopeOfWork?: string;
  exclusions?: string;
  notes?: string;
  termsAndConditions?: string;
}

/**
 * Creates a new estimate with auto-generated number.
 *
 * @param data Estimate data
 * @param orgId Organization ID
 * @param userId User ID
 * @param userName User display name
 * @param useOrgScoped Use org-scoped collection
 * @returns Created estimate ID
 */
export async function createEstimate(
  data: CreateEstimateData,
  orgId: string,
  userId: string,
  userName: string,
  useOrgScoped: boolean = false
): Promise<string> {
  if (!orgId) throw new Error('Organization ID required');

  // Calculate totals from line items
  const { subtotal, taxAmount, markupAmount: _markupAmount, total, depositRequired } = calculateEstimateTotals(
    data.lineItems,
    data.taxRate,
    data.markupPercent,
    data.discount,
    data.discountType,
    data.depositPercent
  );

  // Generate estimate number
  const number = await reserveNumber(orgId, 'estimate');

  const estimate: Record<string, unknown> = {
    ...data,
    number,
    orgId,
    status: 'draft',
    subtotal,
    taxAmount,
    total,
    markupPercent: data.markupPercent || 0,
    depositRequired,
    depositPercent: data.depositPercent || 0,
    revisionNumber: 0,
    createdBy: userId,
    createdByName: userName,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  // Convert validUntil Date to Timestamp
  if (data.validUntil) {
    estimate.validUntil = Timestamp.fromDate(data.validUntil);
  }

  const collPath = useOrgScoped
    ? getEstimatesCollectionPath(orgId)
    : ROOT_ESTIMATES_COLLECTION;

  const docRef = await addDoc(collection(db, collPath), estimate);
  return docRef.id;
}

/**
 * Calculates estimate totals from line items.
 */
export function calculateEstimateTotals(
  lineItems: EstimateLineItem[],
  taxRate: number = 0,
  markupPercent: number = 0,
  discount: number = 0,
  discountType: 'percent' | 'fixed' = 'percent',
  depositPercent: number = 0
): {
  subtotal: number;
  markupAmount: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  depositRequired: number;
} {
  const subtotal = lineItems.reduce((sum, item) => sum + item.totalCost, 0);
  const markupAmount = subtotal * (markupPercent / 100);
  const subtotalWithMarkup = subtotal + markupAmount;

  const discountAmount = discountType === 'percent'
    ? subtotalWithMarkup * (discount / 100)
    : discount;

  const afterDiscount = subtotalWithMarkup - discountAmount;
  const taxAmount = afterDiscount * (taxRate / 100);
  const total = afterDiscount + taxAmount;
  const depositRequired = total * (depositPercent / 100);

  return {
    subtotal,
    markupAmount,
    discountAmount,
    taxAmount,
    total,
    depositRequired,
  };
}

// ============================================
// Estimate → Invoice Conversion
// ============================================

/**
 * Converts an accepted estimate into a draft invoice.
 * Creates a new invoice document and links it to the estimate.
 *
 * @param estimate The estimate to convert
 * @param orgId Organization ID
 * @param userId User ID
 * @param userName User display name
 * @returns Created invoice ID
 */
export async function convertEstimateToInvoice(
  estimate: Estimate,
  orgId: string,
  userId: string,
  userName: string
): Promise<string> {
  if (!orgId) throw new Error('Organization ID required');

  // Generate invoice number
  const invoiceNumber = await reserveNumber(orgId, 'invoice');

  // Convert estimate line items to invoice line items
  const invoiceLineItems = estimate.lineItems.map((item, index) => ({
    id: `item-${Date.now()}-${index}`,
    description: item.name,
    details: item.description || '',
    quantity: item.quantity,
    unitPrice: item.unitCost,
    amount: item.totalCost,
    category: item.category,
    sortOrder: item.sortOrder,
  }));

  const subtotal = invoiceLineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = subtotal * ((estimate.taxRate || 0) / 100);
  const total = subtotal + taxAmount;

  // Calculate due date from payment terms
  const getDaysFromTerms = (terms: string): number => {
    if (!terms || terms === 'Due on Receipt') return 0;
    const match = terms.match(/Net\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : 30;
  };

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + getDaysFromTerms(estimate.paymentTerms || 'Net 30'));

  const invoice: Record<string, unknown> = {
    type: 'standard',
    number: invoiceNumber,
    orgId,
    status: 'draft',
    clientId: estimate.clientId,
    clientName: estimate.clientName,
    clientEmail: estimate.clientEmail,
    clientPhone: estimate.clientPhone,
    billingAddress: estimate.clientAddress,
    projectId: estimate.projectId,
    projectName: estimate.projectName,
    projectAddress: estimate.projectAddress,
    lineItems: invoiceLineItems,
    subtotal,
    taxRate: estimate.taxRate || 0,
    taxAmount,
    total,
    amountDue: total,
    amountPaid: 0,
    paymentTerms: estimate.paymentTerms || 'Net 30',
    dueDate: Timestamp.fromDate(dueDate),
    notes: estimate.notes,
    // Link back to estimate
    estimateId: estimate.id,
    estimateNumber: estimate.number,
    createdBy: userId,
    createdByName: userName,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  // Create invoice in root collection (matching existing pattern)
  const docRef = await addDoc(collection(db, 'invoices'), invoice);

  // Update the estimate to link to the invoice
  await updateDoc(doc(db, 'estimates', estimate.id), {
    convertedToInvoiceId: docRef.id,
    updatedAt: Timestamp.now(),
  });

  return docRef.id;
}

// ============================================
// Estimate Revision
// ============================================

/**
 * Creates a new revision of an existing estimate.
 * Links the new revision to the original and marks the original as 'revised'.
 *
 * @param estimate The estimate to revise
 * @param orgId Organization ID
 * @param userId User ID
 * @param userName User display name
 * @returns Created revision estimate ID
 */
export async function reviseEstimate(
  estimate: Estimate,
  orgId: string,
  userId: string,
  userName: string
): Promise<string> {
  if (!orgId) throw new Error('Organization ID required');

  const collPath = ROOT_ESTIMATES_COLLECTION;

  // Create revised copy
  const revised: Record<string, unknown> = {
    orgId: estimate.orgId,
    number: estimate.number, // Keep same number
    name: estimate.name,
    description: estimate.description,
    status: 'draft',
    clientId: estimate.clientId,
    clientName: estimate.clientName,
    clientEmail: estimate.clientEmail,
    clientPhone: estimate.clientPhone,
    clientAddress: estimate.clientAddress,
    projectId: estimate.projectId,
    projectName: estimate.projectName,
    projectAddress: estimate.projectAddress,
    lineItems: estimate.lineItems,
    sections: estimate.sections,
    subtotal: estimate.subtotal,
    taxRate: estimate.taxRate,
    taxAmount: estimate.taxAmount,
    discount: estimate.discount,
    discountType: estimate.discountType,
    total: estimate.total,
    markupPercent: estimate.markupPercent,
    profitMargin: estimate.profitMargin,
    paymentTerms: estimate.paymentTerms,
    depositRequired: estimate.depositRequired,
    depositPercent: estimate.depositPercent,
    scopeOfWork: estimate.scopeOfWork,
    exclusions: estimate.exclusions,
    notes: estimate.notes,
    termsAndConditions: estimate.termsAndConditions,
    revisionNumber: (estimate.revisionNumber || 0) + 1,
    previousVersionId: estimate.id,
    createdBy: userId,
    createdByName: userName,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  // Add validUntil if present
  if (estimate.validUntil) {
    revised.validUntil = Timestamp.fromDate(new Date(estimate.validUntil));
  }

  const docRef = await addDoc(collection(db, collPath), revised);

  // Mark original as revised
  await updateDoc(doc(db, collPath, estimate.id), {
    status: 'revised',
    updatedAt: Timestamp.now(),
  });

  return docRef.id;
}

// ============================================
// Estimate Status Labels
// ============================================

export const ESTIMATE_STATUS_LABELS: Record<EstimateStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  viewed: 'Viewed',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
  revised: 'Revised',
};
