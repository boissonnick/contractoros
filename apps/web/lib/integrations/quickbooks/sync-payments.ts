/**
 * QuickBooks Payment Sync
 *
 * Synchronization between QuickBooks payments and ContractorOS.
 * Primarily pull-based (QBO → ContractorOS) since payments are typically
 * recorded in the accounting system.
 */

import { adminDb, Timestamp } from '@/lib/firebase/admin';
import { qboQuery } from './client';
import { QBOPayment } from './types';
import {
  getMapping,
  getMappingByQboId,
  upsertMapping,
} from './entity-mapping';
import { startSyncLog, completeSyncLog, failSyncLog } from './sync-logger';

// ============================================
// Types
// ============================================

export interface PaymentSyncResult {
  recorded: number;
  skipped: number;
  errors: Array<{ qboId: string; error: string }>;
}

interface LocalPayment {
  id?: string;
  invoiceId: string;
  projectId: string;
  clientId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  qboPaymentId?: string;
  createdAt: Date;
}

// ============================================
// Field Mapping: QBO Payment → ContractorOS Payment
// ============================================

/**
 * Convert QBO Payment to local payment record
 */
function qboPaymentToLocal(
  qboPayment: QBOPayment,
  invoiceId: string,
  projectId: string,
  clientId: string
): Omit<LocalPayment, 'id' | 'createdAt'> {
  return {
    invoiceId,
    projectId,
    clientId,
    amount: qboPayment.TotalAmt,
    paymentDate: new Date(qboPayment.TxnDate),
    paymentMethod: qboPayment.PaymentMethodRef?.name || 'Other',
    referenceNumber: qboPayment.Id,
    notes: qboPayment.PrivateNote,
    qboPaymentId: qboPayment.Id,
  };
}

// ============================================
// Sync Operations
// ============================================

/**
 * Pull payments from QuickBooks and record them locally
 * Links payments to existing invoice mappings
 */
export async function pullPaymentsFromQBO(
  orgId: string,
  options: {
    modifiedSince?: Date;
    maxResults?: number;
  } = {}
): Promise<PaymentSyncResult> {
  const logId = await startSyncLog(orgId, 'sync_payments');

  const result: PaymentSyncResult = {
    recorded: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const { modifiedSince, maxResults = 100 } = options;

    // Build query
    let query = '';
    if (modifiedSince) {
      const dateStr = modifiedSince.toISOString().split('T')[0];
      query = `MetaData.LastUpdatedTime > '${dateStr}'`;
    }

    // Fetch payments from QBO
    const response = await qboQuery<QBOPayment>(orgId, 'Payment', query, maxResults);
    const payments = (response.QueryResponse as Record<string, QBOPayment[]>).Payment || [];

    for (const qboPayment of payments) {
      if (!qboPayment.Id) continue;

      try {
        // Check if payment already synced
        const existingMapping = await getMappingByQboId(orgId, 'payment', qboPayment.Id);
        if (existingMapping) {
          result.skipped++;
          continue;
        }

        // Find linked invoices from the payment
        const linkedInvoices = qboPayment.Line?.flatMap(
          (line) => line.LinkedTxn?.filter((txn) => txn.TxnType === 'Invoice') || []
        ) || [];

        if (linkedInvoices.length === 0) {
          result.skipped++;
          continue;
        }

        // Process each linked invoice
        for (const linkedInvoice of linkedInvoices) {
          // Find local invoice mapping
          const invoiceMapping = await getMappingByQboId(orgId, 'invoice', linkedInvoice.TxnId);
          if (!invoiceMapping) {
            // Invoice not synced - skip this payment
            continue;
          }

          // Get the invoice to get project and client IDs
          const invoiceDoc = await adminDb
            .collection('organizations')
            .doc(orgId)
            .collection('invoices')
            .doc(invoiceMapping.localId)
            .get();

          if (!invoiceDoc.exists) {
            continue;
          }

          const invoiceData = invoiceDoc.data();
          const projectId = invoiceData?.projectId || '';
          const clientId = invoiceData?.clientId || '';

          // Create local payment record
          const paymentData = qboPaymentToLocal(
            qboPayment,
            invoiceMapping.localId,
            projectId,
            clientId
          );

          // Save payment to Firestore
          const paymentRef = await adminDb
            .collection('organizations')
            .doc(orgId)
            .collection('payments')
            .add({
              ...paymentData,
              createdAt: Timestamp.now(),
            });

          // Create mapping
          await upsertMapping(
            orgId,
            'payment',
            paymentRef.id,
            qboPayment.Id,
            qboPayment.SyncToken || '0'
          );

          // Update invoice with payment info
          await updateInvoiceWithPayment(
            orgId,
            invoiceMapping.localId,
            qboPayment.TotalAmt
          );

          result.recorded++;
        }
      } catch (error) {
        result.errors.push({
          qboId: qboPayment.Id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    await completeSyncLog(orgId, logId, {
      itemsSynced: result.recorded,
      itemsFailed: result.errors.length,
      errors: result.errors.map((e) => `${e.qboId}: ${e.error}`),
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await failSyncLog(orgId, logId, errorMessage);
    throw error;
  }
}

/**
 * Process a single payment from QBO webhook
 */
export async function processPaymentWebhook(
  orgId: string,
  qboPaymentId: string
): Promise<{ recorded: boolean; invoiceId?: string }> {
  // Check if payment already synced
  const existingMapping = await getMappingByQboId(orgId, 'payment', qboPaymentId);
  if (existingMapping) {
    return { recorded: false };
  }

  // Fetch payment details from QBO
  const response = await qboQuery<QBOPayment>(
    orgId,
    'Payment',
    `Id = '${qboPaymentId}'`,
    1
  );
  const payments = (response.QueryResponse as Record<string, QBOPayment[]>).Payment || [];

  if (payments.length === 0) {
    return { recorded: false };
  }

  const qboPayment = payments[0];

  // Find linked invoice
  const linkedInvoice = qboPayment.Line?.flatMap(
    (line) => line.LinkedTxn?.filter((txn) => txn.TxnType === 'Invoice') || []
  )?.[0];

  if (!linkedInvoice) {
    return { recorded: false };
  }

  // Find local invoice mapping
  const invoiceMapping = await getMappingByQboId(orgId, 'invoice', linkedInvoice.TxnId);
  if (!invoiceMapping) {
    return { recorded: false };
  }

  // Get invoice details
  const invoiceDoc = await adminDb
    .collection('organizations')
    .doc(orgId)
    .collection('invoices')
    .doc(invoiceMapping.localId)
    .get();

  if (!invoiceDoc.exists) {
    return { recorded: false };
  }

  const invoiceData = invoiceDoc.data();

  // Create payment record
  const paymentData = qboPaymentToLocal(
    qboPayment,
    invoiceMapping.localId,
    invoiceData?.projectId || '',
    invoiceData?.clientId || ''
  );

  const paymentRef = await adminDb
    .collection('organizations')
    .doc(orgId)
    .collection('payments')
    .add({
      ...paymentData,
      createdAt: Timestamp.now(),
    });

  // Create mapping
  await upsertMapping(
    orgId,
    'payment',
    paymentRef.id,
    qboPayment.Id!,
    qboPayment.SyncToken || '0'
  );

  // Update invoice
  await updateInvoiceWithPayment(
    orgId,
    invoiceMapping.localId,
    qboPayment.TotalAmt
  );

  return { recorded: true, invoiceId: invoiceMapping.localId };
}

/**
 * Update invoice with payment information
 */
async function updateInvoiceWithPayment(
  orgId: string,
  invoiceId: string,
  paymentAmount: number
): Promise<void> {
  const invoiceRef = adminDb
    .collection('organizations')
    .doc(orgId)
    .collection('invoices')
    .doc(invoiceId);

  const invoiceDoc = await invoiceRef.get();
  if (!invoiceDoc.exists) return;

  const invoiceData = invoiceDoc.data();
  const currentAmountPaid = invoiceData?.amountPaid || 0;
  const total = invoiceData?.total || 0;
  const newAmountPaid = currentAmountPaid + paymentAmount;
  const newAmountDue = Math.max(0, total - newAmountPaid);

  const updates: Record<string, unknown> = {
    amountPaid: newAmountPaid,
    amountDue: newAmountDue,
    updatedAt: Timestamp.now(),
  };

  // Update status if fully paid
  if (newAmountDue === 0 && total > 0) {
    updates.status = 'paid';
    updates.paidAt = Timestamp.now();
  } else if (newAmountPaid > 0) {
    updates.status = 'partial';
  }

  await invoiceRef.update(updates);
}

/**
 * Get payment sync status
 */
export async function getPaymentSyncStatus(
  orgId: string,
  paymentId: string
): Promise<{
  isSynced: boolean;
  qboId?: string;
  lastSyncedAt?: Date;
}> {
  const mapping = await getMapping(orgId, 'payment', paymentId);

  if (!mapping) {
    return { isSynced: false };
  }

  return {
    isSynced: true,
    qboId: mapping.qboId,
    lastSyncedAt: mapping.lastSyncedAt,
  };
}
