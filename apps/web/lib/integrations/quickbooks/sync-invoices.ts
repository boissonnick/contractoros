/**
 * QuickBooks Invoice Sync
 *
 * Synchronization between ContractorOS Invoices and QBO Invoices.
 * Primarily push-based (ContractorOS → QBO), with pull support for payment updates.
 */

import { adminDb, Timestamp } from '@/lib/firebase/admin';
import { Invoice, InvoiceLineItem } from '@/types';
import { qboCreate, qboUpdate, qboQuery, QBOClientError } from './client';
import { QBOInvoice, QBOInvoiceLine, QBORef } from './types';
import {
  getMapping,
  getMappingByQboId,
  upsertMapping,
} from './entity-mapping';
import { startSyncLog, completeSyncLog, failSyncLog } from './sync-logger';

// ============================================
// Field Mapping: ContractorOS Invoice → QBO Invoice
// ============================================

/**
 * Convert a ContractorOS Invoice to a QBO Invoice
 */
export function invoiceToQBOInvoice(
  invoice: Invoice,
  customerQboId: string
): Partial<QBOInvoice> {
  const qboInvoice: Partial<QBOInvoice> = {
    DocNumber: invoice.number,
    TxnDate: formatDate(invoice.createdAt),
    CustomerRef: { value: customerQboId },
    Line: invoiceLinesToQBO(invoice.lineItems, invoice.subtotal),
  };

  // Due date
  if (invoice.dueDate) {
    qboInvoice.DueDate = formatDate(invoice.dueDate);
  }

  // Email
  if (invoice.clientEmail) {
    qboInvoice.BillEmail = { Address: invoice.clientEmail };
  }

  // Customer memo (notes visible to customer)
  if (invoice.notes) {
    qboInvoice.CustomerMemo = { value: invoice.notes.substring(0, 4000) };
  }

  // Private note (internal)
  if (invoice.internalNotes) {
    qboInvoice.PrivateNote = invoice.internalNotes.substring(0, 4000);
  }

  return qboInvoice;
}

/**
 * Convert ContractorOS line items to QBO invoice lines
 */
function invoiceLinesToQBO(
  lineItems: InvoiceLineItem[],
  subtotal: number
): QBOInvoiceLine[] {
  const lines: QBOInvoiceLine[] = lineItems.map((item, index) => ({
    LineNum: index + 1,
    Description: item.description,
    Amount: item.amount,
    DetailType: 'SalesItemLineDetail' as const,
    SalesItemLineDetail: {
      UnitPrice: item.unitPrice,
      Qty: item.quantity,
    },
  }));

  // Add subtotal line (required by QBO)
  lines.push({
    Amount: subtotal,
    DetailType: 'SubTotalLineDetail' as const,
  });

  return lines;
}

/**
 * Format Date to QBO date string (YYYY-MM-DD)
 */
function formatDate(date: Date | undefined): string {
  if (!date) {
    return new Date().toISOString().split('T')[0];
  }
  // Handle both Date objects and Firestore Timestamps
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().split('T')[0];
}

// ============================================
// Field Mapping: QBO Invoice → ContractorOS Invoice
// ============================================

/**
 * Convert QBO Invoice fields to Invoice update data
 * Primarily used for syncing payment/balance updates
 */
export function qboInvoiceToInvoiceUpdate(qboInvoice: QBOInvoice): Partial<Invoice> {
  const update: Partial<Invoice> = {};

  // Sync balance (amount due)
  if (qboInvoice.Balance !== undefined) {
    update.amountDue = qboInvoice.Balance;
    update.amountPaid = (qboInvoice.TotalAmt || 0) - qboInvoice.Balance;
  }

  // Sync status based on QBO status
  if (qboInvoice.Balance === 0 && (qboInvoice.TotalAmt || 0) > 0) {
    update.status = 'paid';
    update.paidAt = new Date();
  }

  return update;
}

// ============================================
// Sync Operations
// ============================================

/**
 * Push a single invoice to QuickBooks
 * Requires the client to be synced first (needs customer QBO ID)
 */
export async function pushInvoiceToQBO(
  orgId: string,
  invoice: Invoice
): Promise<{ qboId: string; created: boolean }> {
  // Get the customer mapping for the client
  if (!invoice.clientId) {
    throw new QBOClientError('Invoice has no clientId', 'VALIDATION_ERROR');
  }

  const customerMapping = await getMapping(orgId, 'client', invoice.clientId);
  if (!customerMapping) {
    throw new QBOClientError(
      'Client is not synced to QuickBooks. Sync client first.',
      'PREREQUISITE_ERROR'
    );
  }

  // Check for existing invoice mapping
  const invoiceMapping = await getMapping(orgId, 'invoice', invoice.id);

  const invoiceData = invoiceToQBOInvoice(invoice, customerMapping.qboId);

  if (invoiceMapping) {
    // Update existing invoice
    const updateData = {
      ...invoiceData,
      Id: invoiceMapping.qboId,
      SyncToken: invoiceMapping.qboSyncToken,
    };

    const updated = await qboUpdate<QBOInvoice>(orgId, 'Invoice', updateData);

    // Update mapping with new sync token
    await upsertMapping(
      orgId,
      'invoice',
      invoice.id,
      invoiceMapping.qboId,
      updated.SyncToken || invoiceMapping.qboSyncToken
    );

    return { qboId: invoiceMapping.qboId, created: false };
  } else {
    // Create new invoice
    const created = await qboCreate<QBOInvoice>(orgId, 'Invoice', invoiceData);

    if (!created.Id) {
      throw new QBOClientError('Invoice created but no ID returned', 'SYNC_ERROR');
    }

    // Create mapping
    await upsertMapping(
      orgId,
      'invoice',
      invoice.id,
      created.Id,
      created.SyncToken || '0'
    );

    return { qboId: created.Id, created: true };
  }
}

/**
 * Pull invoice updates from QuickBooks (primarily for payment sync)
 * Updates local invoices with balance/payment info from QBO
 */
export async function pullInvoiceUpdatesFromQBO(
  orgId: string,
  options: {
    modifiedSince?: Date;
    maxResults?: number;
  } = {}
): Promise<{
  updated: number;
  errors: Array<{ qboId: string; error: string }>;
}> {
  const { modifiedSince, maxResults = 100 } = options;

  // Build query
  let query = '';
  if (modifiedSince) {
    const dateStr = modifiedSince.toISOString().split('T')[0];
    query = `MetaData.LastUpdatedTime > '${dateStr}'`;
  }

  // Fetch invoices from QBO
  const response = await qboQuery<QBOInvoice>(orgId, 'Invoice', query, maxResults);
  const invoices = response.QueryResponse.Invoice || [];

  let updated = 0;
  const errors: Array<{ qboId: string; error: string }> = [];

  for (const qboInvoice of invoices) {
    if (!qboInvoice.Id) continue;

    try {
      // Find mapping for this QBO invoice
      const mapping = await getMappingByQboId(orgId, 'invoice', qboInvoice.Id);

      if (!mapping) {
        // No local invoice mapped - skip
        continue;
      }

      // Update local invoice with balance/payment info
      const updateData = qboInvoiceToInvoiceUpdate(qboInvoice);

      if (Object.keys(updateData).length > 0) {
        await adminDb
          .collection('organizations')
          .doc(orgId)
          .collection('invoices')
          .doc(mapping.localId)
          .update({
            ...updateData,
            updatedAt: Timestamp.now(),
          });

        // Update mapping
        await upsertMapping(
          orgId,
          'invoice',
          mapping.localId,
          mapping.qboId,
          qboInvoice.SyncToken || mapping.qboSyncToken
        );

        updated++;
      }
    } catch (error) {
      errors.push({
        qboId: qboInvoice.Id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { updated, errors };
}

/**
 * Sync a batch of invoices to QuickBooks
 */
export async function syncInvoicesToQBO(
  orgId: string,
  invoiceIds?: string[]
): Promise<{
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ invoiceId: string; error: string }>;
}> {
  // Start sync log
  const logId = await startSyncLog(orgId, 'sync_invoices');

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: Array<{ invoiceId: string; error: string }> = [];

  try {
    // Get invoices to sync
    const invoicesCollection = adminDb
      .collection('organizations')
      .doc(orgId)
      .collection('invoices');

    let snapshot;

    if (invoiceIds && invoiceIds.length > 0) {
      // Firestore 'in' query limited to 30 items
      const allDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
      const batches: string[][] = [];

      for (let i = 0; i < invoiceIds.length; i += 30) {
        batches.push(invoiceIds.slice(i, i + 30));
      }

      for (const batch of batches) {
        const batchSnapshot = await invoicesCollection
          .where('__name__', 'in', batch)
          .get();
        allDocs.push(...batchSnapshot.docs);
      }

      snapshot = { docs: allDocs };
    } else {
      // Sync all sent/unpaid invoices
      snapshot = await invoicesCollection
        .where('status', 'in', ['sent', 'viewed', 'partial'])
        .get();
    }

    for (const doc of snapshot.docs) {
      const invoice = { id: doc.id, ...doc.data() } as Invoice;

      // Skip invoices without a client
      if (!invoice.clientId) {
        skipped++;
        continue;
      }

      try {
        const result = await pushInvoiceToQBO(orgId, invoice);
        if (result.created) {
          created++;
        } else {
          updated++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // If it's a prerequisite error (client not synced), mark as skipped
        if (error instanceof QBOClientError && error.code === 'PREREQUISITE_ERROR') {
          skipped++;
        } else {
          errors.push({ invoiceId: invoice.id, error: errorMessage });
        }
      }
    }

    // Complete sync log
    await completeSyncLog(orgId, logId, {
      itemsSynced: created + updated,
      itemsFailed: errors.length,
      errors: errors.map((e) => `${e.invoiceId}: ${e.error}`),
    });

    return { created, updated, skipped, errors };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await failSyncLog(orgId, logId, errorMessage);
    throw error;
  }
}

/**
 * Sync invoice when it's sent (triggered by status change)
 */
export async function syncInvoiceOnSend(
  orgId: string,
  invoiceId: string
): Promise<{ qboId: string; created: boolean } | null> {
  // Get the invoice
  const doc = await adminDb
    .collection('organizations')
    .doc(orgId)
    .collection('invoices')
    .doc(invoiceId)
    .get();

  if (!doc.exists) {
    console.error(`Invoice ${invoiceId} not found`);
    return null;
  }

  const invoice = { id: doc.id, ...doc.data() } as Invoice;

  // Only sync if client is linked
  if (!invoice.clientId) {
    return null;
  }

  // Check if client is synced
  const customerMapping = await getMapping(orgId, 'client', invoice.clientId);
  if (!customerMapping) {
    // Client not synced - can't sync invoice
    return null;
  }

  try {
    return await pushInvoiceToQBO(orgId, invoice);
  } catch (error) {
    console.error(`Failed to sync invoice ${invoiceId} to QBO:`, error);
    return null;
  }
}

/**
 * Get sync status for an invoice
 */
export async function getInvoiceSyncStatus(
  orgId: string,
  invoiceId: string
): Promise<{
  isSynced: boolean;
  qboId?: string;
  lastSyncedAt?: Date;
  syncStatus?: string;
  syncError?: string;
}> {
  const mapping = await getMapping(orgId, 'invoice', invoiceId);

  if (!mapping) {
    return { isSynced: false };
  }

  return {
    isSynced: true,
    qboId: mapping.qboId,
    lastSyncedAt: mapping.lastSyncedAt,
    syncStatus: mapping.syncStatus,
    syncError: mapping.syncError,
  };
}

/**
 * Get all synced invoices for an organization
 */
export async function getSyncedInvoices(
  orgId: string
): Promise<Array<{ localId: string; qboId: string; lastSyncedAt: Date }>> {
  const snapshot = await adminDb
    .collection(`organizations/${orgId}/qboEntityMappings`)
    .where('entityType', '==', 'invoice')
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      localId: data.localId,
      qboId: data.qboId,
      lastSyncedAt: data.lastSyncedAt?.toDate() || new Date(),
    };
  });
}

/**
 * Void/delete invoice in QuickBooks
 * Note: QBO invoices with payments cannot be deleted
 */
export async function voidInvoiceInQBO(
  orgId: string,
  invoiceId: string
): Promise<boolean> {
  const mapping = await getMapping(orgId, 'invoice', invoiceId);

  if (!mapping) {
    // Not synced - nothing to void
    return false;
  }

  try {
    // Get current invoice from QBO to get latest SyncToken
    const response = await qboQuery<QBOInvoice>(
      orgId,
      'Invoice',
      `Id = '${mapping.qboId}'`,
      1
    );
    const invoices = response.QueryResponse.Invoice || [];

    if (invoices.length === 0) {
      // Already deleted in QBO
      return true;
    }

    const qboInvoice = invoices[0];

    // Check if invoice has payments (balance < total)
    if (qboInvoice.Balance !== undefined && qboInvoice.TotalAmt !== undefined) {
      if (qboInvoice.Balance < qboInvoice.TotalAmt) {
        throw new QBOClientError(
          'Cannot void invoice with payments. Refund payments first.',
          'VALIDATION_ERROR'
        );
      }
    }

    // Void the invoice (set to $0 and mark as voided)
    // QBO doesn't have a direct void operation for invoices - you delete them
    // But deletion fails if there are any transactions
    // For now, we'll just update the mapping to note it was voided locally

    // Update local mapping to mark as voided
    await adminDb
      .collection(`organizations/${orgId}/qboEntityMappings`)
      .doc(mapping.id)
      .update({
        syncStatus: 'voided',
        lastSyncedAt: Timestamp.now(),
      });

    return true;
  } catch (error) {
    console.error(`Failed to void invoice ${invoiceId} in QBO:`, error);
    throw error;
  }
}
