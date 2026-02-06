/**
 * @fileoverview Recurring Invoice Management Hooks
 *
 * Provides recurring invoice schedule management with real-time Firestore updates.
 *
 * This module exports:
 * - useRecurringInvoices: List all recurring invoice schedules
 * - useRecurringInvoice: Single schedule with CRUD operations
 * - createRecurringInvoice: Create a new recurring schedule
 * - toggleRecurringInvoice: Activate/deactivate a schedule
 * - RECURRING_FREQUENCY_LABELS: Display labels for frequencies
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
import {
  RecurringInvoice,
  RecurringFrequency,
  InvoiceType,
  InvoiceLineItem,
} from '@/types';
import { logger } from '@/lib/utils/logger';

// Collection path - recurring invoices are org-scoped
const getRecurringInvoicesCollectionPath = (orgId: string) =>
  `organizations/${orgId}/recurringInvoices`;

// Date fields for RecurringInvoice entity
const RECURRING_INVOICE_DATE_FIELDS = [
  'createdAt',
  'updatedAt',
  'startDate',
  'endDate',
  'nextGenerationDate',
  'lastGeneratedAt',
] as const;

// Converter for RecurringInvoice documents
const recurringInvoiceConverter = createConverter<RecurringInvoice>((id, data) => {
  const converted = convertTimestamps(
    data as Record<string, unknown>,
    RECURRING_INVOICE_DATE_FIELDS
  );

  return {
    id,
    ...converted,
  } as RecurringInvoice;
});

// ============================================
// useRecurringInvoices - Main list hook
// ============================================

export interface UseRecurringInvoicesOptions {
  orgId: string;
  isActive?: boolean | 'all';
  clientId?: string;
  projectId?: string;
  search?: string;
}

export interface UseRecurringInvoicesReturn {
  recurringInvoices: RecurringInvoice[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
  totalCount: number;
}

/**
 * Hook for fetching and filtering recurring invoices with real-time updates.
 *
 * @param {UseRecurringInvoicesOptions} options - Configuration options
 * @returns {UseRecurringInvoicesReturn} Recurring invoices data and operations
 *
 * @example
 * const { recurringInvoices, loading } = useRecurringInvoices({ orgId });
 *
 * @example
 * const { recurringInvoices } = useRecurringInvoices({
 *   orgId,
 *   isActive: true,
 *   clientId: 'client-123'
 * });
 */
export function useRecurringInvoices({
  orgId,
  isActive,
  clientId,
  projectId,
  search,
}: UseRecurringInvoicesOptions): UseRecurringInvoicesReturn {
  const collectionPath = useMemo(
    () => getRecurringInvoicesCollectionPath(orgId),
    [orgId]
  );

  // Build constraints based on filters
  const constraints = useMemo(() => {
    const c: QueryConstraint[] = [orderBy('createdAt', 'desc')];

    if (isActive !== undefined && isActive !== 'all') {
      c.unshift(where('isActive', '==', isActive));
    }

    if (clientId) {
      c.unshift(where('clientId', '==', clientId));
    }

    if (projectId) {
      c.unshift(where('projectId', '==', projectId));
    }

    return c;
  }, [isActive, clientId, projectId]);

  // Use shared collection hook
  const { items, loading, error, refetch, count } = useFirestoreCollection<RecurringInvoice>({
    path: collectionPath,
    constraints,
    converter: recurringInvoiceConverter,
    enabled: !!orgId,
  });

  // Client-side search filtering
  const filteredItems = useMemo(() => {
    if (!search) return items;

    const searchLower = search.toLowerCase();
    return items.filter(
      (item) =>
        item.templateName.toLowerCase().includes(searchLower) ||
        item.clientName?.toLowerCase().includes(searchLower) ||
        item.projectName?.toLowerCase().includes(searchLower)
    );
  }, [items, search]);

  return {
    recurringInvoices: filteredItems,
    loading,
    error,
    refresh: refetch,
    totalCount: count,
  };
}

// ============================================
// useRecurringInvoice - Single schedule hook
// ============================================

export interface UseRecurringInvoiceReturn {
  recurringInvoice: RecurringInvoice | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
  updateRecurringInvoice: (updates: Partial<RecurringInvoice>) => Promise<void>;
  deleteRecurringInvoice: () => Promise<void>;
  toggleActive: (isActive: boolean) => Promise<void>;
}

/**
 * Hook for fetching and managing a single recurring invoice with real-time updates.
 *
 * @param {string|undefined} id - Recurring invoice ID to fetch
 * @param {string} orgId - Organization ID
 * @returns {UseRecurringInvoiceReturn} Recurring invoice data and operations
 */
export function useRecurringInvoice(
  id: string | undefined,
  orgId: string
): UseRecurringInvoiceReturn {
  const [recurringInvoice, setRecurringInvoice] = useState<RecurringInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const collectionPath = getRecurringInvoicesCollectionPath(orgId);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Use shared CRUD hook
  const { update, remove } = useFirestoreCrud<RecurringInvoice>(collectionPath, {
    entityName: 'Recurring Invoice',
    showToast: false,
  });

  useEffect(() => {
    if (!id || !orgId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      doc(db, collectionPath, id),
      (snapshot) => {
        if (!snapshot.exists()) {
          setRecurringInvoice(null);
          setLoading(false);
          return;
        }

        setRecurringInvoice(recurringInvoiceConverter(snapshot.id, snapshot.data()));
        setLoading(false);
      },
      (err) => {
        logger.error('Error fetching recurring invoice', { error: err, hook: 'useRecurringInvoices' });
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id, orgId, collectionPath, refreshKey]);

  const updateRecurringInvoice = useCallback(
    async (updates: Partial<RecurringInvoice>) => {
      if (!id || !orgId) throw new Error('Recurring Invoice ID and Org ID required');
      await update(id, updates);
    },
    [id, orgId, update]
  );

  const deleteRecurringInvoice = useCallback(async () => {
    if (!id || !orgId) throw new Error('Recurring Invoice ID and Org ID required');
    await remove(id);
  }, [id, orgId, remove]);

  const toggleActive = useCallback(
    async (isActive: boolean) => {
      if (!id || !orgId) throw new Error('Recurring Invoice ID and Org ID required');
      await updateDoc(doc(db, collectionPath, id), {
        isActive,
        updatedAt: Timestamp.now(),
      });
    },
    [id, orgId, collectionPath]
  );

  return {
    recurringInvoice,
    loading,
    error,
    refresh,
    updateRecurringInvoice,
    deleteRecurringInvoice,
    toggleActive,
  };
}

// ============================================
// Recurring Invoice CRUD Operations
// ============================================

export interface CreateRecurringInvoiceData {
  templateName: string;
  type: InvoiceType;
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
  frequency: RecurringFrequency;
  startDate: Date;
  endDate?: Date;
  dayOfMonth?: number;
  dayOfWeek?: number;
  autoSend: boolean;
}

/**
 * Calculates the next generation date based on frequency and start date.
 */
function calculateNextGenerationDate(
  startDate: Date,
  frequency: RecurringFrequency,
  dayOfMonth?: number,
  _dayOfWeek?: number
): Date {
  const now = new Date();
  let next = new Date(startDate);

  // If start date is in the future, use it as-is
  if (next > now) return next;

  // Otherwise, advance to the next future date
  while (next <= now) {
    switch (frequency) {
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'biweekly':
        next.setDate(next.getDate() + 14);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        if (dayOfMonth) {
          next.setDate(Math.min(dayOfMonth, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
        }
        break;
      case 'quarterly':
        next.setMonth(next.getMonth() + 3);
        if (dayOfMonth) {
          next.setDate(Math.min(dayOfMonth, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
        }
        break;
      case 'annually':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
  }

  return next;
}

/**
 * Creates a new recurring invoice schedule.
 *
 * @param data Recurring invoice data
 * @param orgId Organization ID
 * @param userId User ID
 * @param userName User display name
 * @returns Created recurring invoice ID
 */
export async function createRecurringInvoice(
  data: CreateRecurringInvoiceData,
  orgId: string,
  userId: string,
  userName: string
): Promise<string> {
  if (!orgId) throw new Error('Organization ID required');

  const nextGenerationDate = calculateNextGenerationDate(
    data.startDate,
    data.frequency,
    data.dayOfMonth,
    data.dayOfWeek
  );

  const recurringInvoice: Omit<RecurringInvoice, 'id'> = {
    ...data,
    orgId,
    nextGenerationDate,
    isActive: true,
    totalGenerated: 0,
    createdBy: userId,
    createdByName: userName,
    createdAt: new Date(),
  };

  const collectionPath = getRecurringInvoicesCollectionPath(orgId);

  const docRef = await addDoc(collection(db, collectionPath), {
    ...recurringInvoice,
    startDate: Timestamp.fromDate(data.startDate),
    endDate: data.endDate ? Timestamp.fromDate(data.endDate) : null,
    nextGenerationDate: Timestamp.fromDate(nextGenerationDate),
    createdAt: Timestamp.now(),
  });

  return docRef.id;
}

/**
 * Toggles a recurring invoice schedule active/inactive.
 *
 * @param id Recurring invoice ID
 * @param orgId Organization ID
 * @param isActive New active state
 */
export async function toggleRecurringInvoice(
  id: string,
  orgId: string,
  isActive: boolean
): Promise<void> {
  if (!id || !orgId) throw new Error('Recurring Invoice ID and Org ID required');

  const collectionPath = getRecurringInvoicesCollectionPath(orgId);

  await updateDoc(doc(db, collectionPath, id), {
    isActive,
    updatedAt: Timestamp.now(),
  });
}

// ============================================
// Recurring Frequency Labels
// ============================================

export const RECURRING_FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  weekly: 'Weekly',
  biweekly: 'Bi-Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annually: 'Annually',
};
