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
import { StripePayment, PaymentLink, SavedPaymentMethod, PaymentStatus } from '@/types';
import { useAuth } from '@/lib/auth';
import { toast } from '@/components/ui/Toast';
import { generatePaymentLinkToken, getPaymentLinkExpiration } from '@/lib/payments/paymentUtils';

// Convert Firestore data to StripePayment
function paymentFromFirestore(id: string, data: Record<string, unknown>): StripePayment {
  return {
    id,
    orgId: data.orgId as string,
    invoiceId: data.invoiceId as string,
    projectId: data.projectId as string,
    clientId: data.clientId as string,
    amount: data.amount as number,
    currency: (data.currency as 'USD') || 'USD',
    paymentMethod: data.paymentMethod as StripePayment['paymentMethod'],
    stripePaymentIntentId: data.stripePaymentIntentId as string,
    stripeCustomerId: data.stripeCustomerId as string | undefined,
    stripeChargeId: data.stripeChargeId as string | undefined,
    status: data.status as PaymentStatus,
    failureReason: data.failureReason as string | undefined,
    failureCode: data.failureCode as string | undefined,
    description: data.description as string,
    reference: data.reference as string | undefined,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    processedAt: data.processedAt ? (data.processedAt as Timestamp).toDate() : undefined,
    completedAt: data.completedAt ? (data.completedAt as Timestamp).toDate() : undefined,
    refundedAt: data.refundedAt ? (data.refundedAt as Timestamp).toDate() : undefined,
    refundId: data.refundId as string | undefined,
    refundAmount: data.refundAmount as number | undefined,
    refundReason: data.refundReason as string | undefined,
    isSplitPayment: data.isSplitPayment as boolean | undefined,
    splitType: data.splitType as StripePayment['splitType'] | undefined,
    parentPaymentId: data.parentPaymentId as string | undefined,
    receiptUrl: data.receiptUrl as string | undefined,
    receiptSentAt: data.receiptSentAt ? (data.receiptSentAt as Timestamp).toDate() : undefined,
    createdBy: data.createdBy as string | undefined,
    metadata: data.metadata as Record<string, string> | undefined,
  };
}

// Convert Firestore data to PaymentLink
function paymentLinkFromFirestore(id: string, data: Record<string, unknown>): PaymentLink {
  return {
    id,
    orgId: data.orgId as string,
    invoiceId: data.invoiceId as string,
    projectId: data.projectId as string,
    clientId: data.clientId as string,
    token: data.token as string,
    amount: data.amount as number,
    currency: (data.currency as 'USD') || 'USD',
    status: data.status as PaymentLink['status'],
    paymentId: data.paymentId as string | undefined,
    expiresAt: data.expiresAt ? (data.expiresAt as Timestamp).toDate() : new Date(),
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    usedAt: data.usedAt ? (data.usedAt as Timestamp).toDate() : undefined,
  };
}

// Convert Firestore data to SavedPaymentMethod
function savedMethodFromFirestore(id: string, data: Record<string, unknown>): SavedPaymentMethod {
  return {
    id,
    orgId: data.orgId as string,
    clientId: data.clientId as string,
    stripePaymentMethodId: data.stripePaymentMethodId as string,
    stripeCustomerId: data.stripeCustomerId as string,
    type: data.type as SavedPaymentMethod['type'],
    last4: data.last4 as string | undefined,
    brand: data.brand as string | undefined,
    expMonth: data.expMonth as number | undefined,
    expYear: data.expYear as number | undefined,
    accountLast4: data.accountLast4 as string | undefined,
    bankName: data.bankName as string | undefined,
    accountType: data.accountType as 'checking' | 'savings' | undefined,
    isDefault: (data.isDefault as boolean) || false,
    nickname: data.nickname as string | undefined,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
    deletedAt: data.deletedAt ? (data.deletedAt as Timestamp).toDate() : undefined,
  };
}

export interface UsePaymentsOptions {
  invoiceId?: string;
  projectId?: string;
  clientId?: string;
}

/**
 * Hook for managing payments with Stripe integration and payment links.
 *
 * Provides payment management including Stripe payment intents, payment links
 * for client self-service, refund processing, and payment statistics.
 * Subscribes to Firestore for real-time payment status updates.
 *
 * @param {UsePaymentsOptions} [options={}] - Filter options
 * @param {string} [options.invoiceId] - Filter payments by invoice ID
 * @param {string} [options.projectId] - Filter payments by project ID
 * @param {string} [options.clientId] - Filter payments by client ID
 *
 * @returns {Object} Payment data and operations
 * @returns {StripePayment[]} payments - Array of payments matching filters
 * @returns {PaymentLink[]} paymentLinks - Active payment links for the filter
 * @returns {boolean} loading - True while initial fetch is in progress
 * @returns {Function} createPaymentIntent - Create a Stripe payment intent for card/ACH
 * @returns {Function} createPaymentLink - Generate a shareable payment link for clients
 * @returns {Function} cancelPaymentLink - Cancel an active payment link
 * @returns {Function} processRefund - Process a full or partial refund
 * @returns {Function} getStats - Get payment statistics (totals, counts by status)
 *
 * @example
 * // View payments for an invoice
 * const { payments, loading, createPaymentLink } = usePayments({
 *   invoiceId: 'inv123'
 * });
 *
 * if (loading) return <Spinner />;
 *
 * return payments.map(p => <PaymentRow key={p.id} payment={p} />);
 *
 * @example
 * // Create a payment link to send to client
 * const { createPaymentLink } = usePayments();
 *
 * const link = await createPaymentLink({
 *   invoiceId: 'inv123',
 *   projectId: 'proj456',
 *   clientId: 'client789',
 *   amount: 1500.00,
 *   expirationDays: 7
 * });
 *
 * console.log(link.url); // https://yoursite.com/pay/token123
 *
 * @example
 * // Get payment statistics
 * const { getStats, payments } = usePayments({ projectId });
 * const stats = getStats();
 *
 * console.log(`Collected: $${stats.totalCollected}`);
 * console.log(`Pending: $${stats.totalPending}`);
 * console.log(`${stats.completed} completed, ${stats.pending} pending`);
 *
 * @example
 * // Process a refund
 * const { processRefund } = usePayments();
 *
 * // Full refund
 * await processRefund(paymentId);
 *
 * // Partial refund
 * await processRefund(paymentId, 50.00, 'Customer requested partial refund');
 */
export function usePayments(options: UsePaymentsOptions = {}) {
  const { user, profile } = useAuth();
  const [payments, setPayments] = useState<StripePayment[]>([]);
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);

  const orgId = profile?.orgId;

  // Subscribe to payments
  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    // Use org-scoped collection for better security
    const paymentsCollection = collection(db, `organizations/${orgId}/payments`);

    let q = query(
      paymentsCollection,
      orderBy('createdAt', 'desc')
    );

    // Filter by invoice if provided
    if (options.invoiceId) {
      q = query(
        paymentsCollection,
        where('invoiceId', '==', options.invoiceId),
        orderBy('createdAt', 'desc')
      );
    }

    // Filter by project if provided
    if (options.projectId) {
      q = query(
        paymentsCollection,
        where('projectId', '==', options.projectId),
        orderBy('createdAt', 'desc')
      );
    }

    // Filter by client if provided
    if (options.clientId) {
      q = query(
        paymentsCollection,
        where('clientId', '==', options.clientId),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setPayments(snapshot.docs.map((d) => paymentFromFirestore(d.id, d.data())));
        setLoading(false);
      },
      (err) => {
        console.error('usePayments error:', err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [orgId, options.invoiceId, options.projectId, options.clientId]);

  // Subscribe to payment links
  useEffect(() => {
    if (!orgId) return;

    let q = query(
      collection(db, 'paymentLinks'),
      where('orgId', '==', orgId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );

    if (options.invoiceId) {
      q = query(
        collection(db, 'paymentLinks'),
        where('orgId', '==', orgId),
        where('invoiceId', '==', options.invoiceId),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setPaymentLinks(snapshot.docs.map((d) => paymentLinkFromFirestore(d.id, d.data())));
      },
      (err) => {
        console.error('usePayments links error:', err);
      }
    );

    return unsubscribe;
  }, [orgId, options.invoiceId]);

  /**
   * Create a payment intent (calls API route)
   */
  const createPaymentIntent = useCallback(
    async (params: {
      invoiceId: string;
      projectId: string;
      clientId: string;
      amount: number;
      description: string;
      paymentMethod?: 'card' | 'ach';
    }) => {
      if (!user || !orgId) {
        toast.error('You must be logged in to create payments');
        return null;
      }

      try {
        const response = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...params,
            orgId,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create payment');
        }

        const data = await response.json();
        return data;
      } catch (err) {
        console.error('Create payment intent error:', err);
        toast.error(err instanceof Error ? err.message : 'Failed to create payment');
        return null;
      }
    },
    [user, orgId]
  );

  /**
   * Create a payment link for email/SMS sharing
   */
  const createPaymentLink = useCallback(
    async (params: {
      invoiceId: string;
      projectId: string;
      clientId: string;
      amount: number;
      expirationDays?: number;
    }) => {
      if (!user || !orgId) {
        toast.error('You must be logged in to create payment links');
        return null;
      }

      try {
        const token = generatePaymentLinkToken();
        const expiresAt = getPaymentLinkExpiration(params.expirationDays || 7);

        const linkData = {
          orgId,
          invoiceId: params.invoiceId,
          projectId: params.projectId,
          clientId: params.clientId,
          token,
          amount: params.amount,
          currency: 'USD',
          status: 'active',
          expiresAt: Timestamp.fromDate(expiresAt),
          createdAt: Timestamp.now(),
        };

        const docRef = await addDoc(collection(db, 'paymentLinks'), linkData);

        toast.success('Payment link created');
        return {
          id: docRef.id,
          token,
          url: `${window.location.origin}/pay/${token}`,
          expiresAt,
        };
      } catch (err) {
        console.error('Create payment link error:', err);
        toast.error('Failed to create payment link');
        return null;
      }
    },
    [user, orgId]
  );

  /**
   * Cancel a payment link
   */
  const cancelPaymentLink = useCallback(async (linkId: string) => {
    try {
      await updateDoc(doc(db, 'paymentLinks', linkId), {
        status: 'cancelled',
        updatedAt: Timestamp.now(),
      });
      toast.success('Payment link cancelled');
    } catch (err) {
      console.error('Cancel payment link error:', err);
      toast.error('Failed to cancel payment link');
    }
  }, []);

  /**
   * Process a refund
   */
  const processRefund = useCallback(
    async (paymentId: string, amount?: number, reason?: string) => {
      if (!user || !orgId) {
        toast.error('You must be logged in to process refunds');
        return false;
      }

      try {
        const response = await fetch(`/api/payments/${paymentId}/refund`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            reason,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to process refund');
        }

        toast.success('Refund processed successfully');
        return true;
      } catch (err) {
        console.error('Process refund error:', err);
        toast.error(err instanceof Error ? err.message : 'Failed to process refund');
        return false;
      }
    },
    [user, orgId]
  );

  /**
   * Get payment statistics
   */
  const getStats = useCallback(() => {
    const completed = payments.filter((p) => p.status === 'completed');
    const pending = payments.filter((p) => p.status === 'pending' || p.status === 'processing');
    const failed = payments.filter((p) => p.status === 'failed');

    return {
      total: payments.length,
      completed: completed.length,
      pending: pending.length,
      failed: failed.length,
      totalCollected: completed.reduce((sum, p) => sum + p.amount, 0),
      totalPending: pending.reduce((sum, p) => sum + p.amount, 0),
      totalRefunded: payments
        .filter((p) => p.status === 'refunded' || p.status === 'partially_refunded')
        .reduce((sum, p) => sum + (p.refundAmount || 0), 0),
    };
  }, [payments]);

  return {
    payments,
    paymentLinks,
    loading,
    createPaymentIntent,
    createPaymentLink,
    cancelPaymentLink,
    processRefund,
    getStats,
  };
}

/**
 * Hook for managing saved payment methods for a client.
 *
 * Allows clients to save and manage their payment methods (cards, bank accounts)
 * for faster checkout. Supports setting default methods and soft-deleting methods.
 *
 * @param {string} clientId - The client ID to fetch payment methods for
 *
 * @returns {Object} Saved payment methods and operations
 * @returns {SavedPaymentMethod[]} methods - Array of saved payment methods
 * @returns {boolean} loading - True while initial fetch is in progress
 * @returns {Function} setDefaultMethod - Set a method as the default
 * @returns {Function} deleteMethod - Soft-delete a saved method
 * @returns {SavedPaymentMethod|undefined} defaultMethod - The default payment method
 *
 * @example
 * // Display saved payment methods
 * const { methods, loading, defaultMethod } = useSavedPaymentMethods(clientId);
 *
 * if (loading) return <Spinner />;
 *
 * return methods.map(method => (
 *   <PaymentMethodCard
 *     key={method.id}
 *     method={method}
 *     isDefault={method.id === defaultMethod?.id}
 *   />
 * ));
 *
 * @example
 * // Set default payment method
 * const { setDefaultMethod } = useSavedPaymentMethods(clientId);
 * await setDefaultMethod(methodId);
 */
export function useSavedPaymentMethods(clientId: string) {
  const { profile } = useAuth();
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  const orgId = profile?.orgId;

  useEffect(() => {
    if (!orgId || !clientId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'savedPaymentMethods'),
      where('orgId', '==', orgId),
      where('clientId', '==', clientId),
      where('deletedAt', '==', null),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setMethods(snapshot.docs.map((d) => savedMethodFromFirestore(d.id, d.data())));
        setLoading(false);
      },
      (err) => {
        console.error('useSavedPaymentMethods error:', err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [orgId, clientId]);

  /**
   * Set a payment method as default
   */
  const setDefaultMethod = useCallback(
    async (methodId: string) => {
      if (!orgId || !clientId) return;

      try {
        // Unset current default
        const currentDefault = methods.find((m) => m.isDefault);
        if (currentDefault) {
          await updateDoc(doc(db, 'savedPaymentMethods', currentDefault.id), {
            isDefault: false,
            updatedAt: Timestamp.now(),
          });
        }

        // Set new default
        await updateDoc(doc(db, 'savedPaymentMethods', methodId), {
          isDefault: true,
          updatedAt: Timestamp.now(),
        });

        toast.success('Default payment method updated');
      } catch (err) {
        console.error('Set default method error:', err);
        toast.error('Failed to update default payment method');
      }
    },
    [orgId, clientId, methods]
  );

  /**
   * Delete a saved payment method
   */
  const deleteMethod = useCallback(async (methodId: string) => {
    try {
      // Soft delete
      await updateDoc(doc(db, 'savedPaymentMethods', methodId), {
        deletedAt: Timestamp.now(),
      });

      toast.success('Payment method removed');
    } catch (err) {
      console.error('Delete method error:', err);
      toast.error('Failed to remove payment method');
    }
  }, []);

  return {
    methods,
    loading,
    setDefaultMethod,
    deleteMethod,
    defaultMethod: methods.find((m) => m.isDefault) || methods[0],
  };
}
