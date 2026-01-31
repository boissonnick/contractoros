/**
 * QuickBooks Sync Logger
 *
 * Provides audit trail for all sync operations between ContractorOS and QuickBooks.
 * Logs are stored in Firestore for tracking, debugging, and compliance.
 */

import { adminDb, Timestamp } from '@/lib/firebase/admin';
import { AccountingProvider } from '@/types';

// Extended action type to include customers
export type SyncAction =
  | 'sync_customers'
  | 'sync_invoices'
  | 'sync_expenses'
  | 'sync_payments'
  | 'full_sync';

export type SyncLogStatus = 'started' | 'completed' | 'failed';

export interface SyncLog {
  id: string;
  orgId: string;
  provider: AccountingProvider;
  action: SyncAction;
  status: SyncLogStatus;
  itemsSynced: number;
  itemsFailed: number;
  errors: string[];
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // milliseconds
}

export interface SyncResult {
  itemsSynced: number;
  itemsFailed: number;
  errors: string[];
}

// Firestore collection path helper
const getLogsCollectionPath = (orgId: string) =>
  `organizations/${orgId}/accountingSyncLogs`;

/**
 * Start a new sync log
 * Returns the log ID for subsequent updates
 */
export async function startSyncLog(
  orgId: string,
  action: SyncAction,
  provider: AccountingProvider = 'quickbooks'
): Promise<string> {
  const collectionRef = adminDb.collection(getLogsCollectionPath(orgId));

  const docRef = await collectionRef.add({
    orgId,
    provider,
    action,
    status: 'started',
    itemsSynced: 0,
    itemsFailed: 0,
    errors: [],
    startedAt: Timestamp.now(),
  });

  return docRef.id;
}

/**
 * Complete a sync log with results
 */
export async function completeSyncLog(
  orgId: string,
  logId: string,
  result: SyncResult
): Promise<void> {
  const docRef = adminDb.collection(getLogsCollectionPath(orgId)).doc(logId);
  const doc = await docRef.get();

  if (!doc.exists) {
    console.error(`Sync log ${logId} not found`);
    return;
  }

  const data = doc.data();
  const startedAt = data?.startedAt?.toDate() || new Date();
  const completedAt = new Date();
  const duration = completedAt.getTime() - startedAt.getTime();

  await docRef.update({
    status: 'completed',
    itemsSynced: result.itemsSynced,
    itemsFailed: result.itemsFailed,
    errors: result.errors.slice(0, 100), // Limit stored errors
    completedAt: Timestamp.now(),
    duration,
  });
}

/**
 * Mark a sync log as failed
 */
export async function failSyncLog(
  orgId: string,
  logId: string,
  error: string
): Promise<void> {
  const docRef = adminDb.collection(getLogsCollectionPath(orgId)).doc(logId);
  const doc = await docRef.get();

  if (!doc.exists) {
    console.error(`Sync log ${logId} not found`);
    return;
  }

  const data = doc.data();
  const startedAt = data?.startedAt?.toDate() || new Date();
  const completedAt = new Date();
  const duration = completedAt.getTime() - startedAt.getTime();

  await docRef.update({
    status: 'failed',
    errors: [error],
    completedAt: Timestamp.now(),
    duration,
  });
}

/**
 * Get recent sync logs for an organization
 */
export async function getSyncLogs(
  orgId: string,
  limit = 20,
  action?: SyncAction
): Promise<SyncLog[]> {
  const collectionRef = adminDb.collection(getLogsCollectionPath(orgId));

  let query: FirebaseFirestore.Query = collectionRef
    .orderBy('startedAt', 'desc')
    .limit(limit);

  if (action) {
    query = query.where('action', '==', action);
  }

  const snapshot = await query.get();

  return snapshot.docs.map((doc) => docToSyncLog(doc.id, doc.data()));
}

/**
 * Get the most recent sync log for an action
 */
export async function getLastSyncLog(
  orgId: string,
  action?: SyncAction
): Promise<SyncLog | null> {
  const logs = await getSyncLogs(orgId, 1, action);
  return logs[0] || null;
}

/**
 * Check if a sync is currently in progress
 */
export async function isSyncInProgress(
  orgId: string,
  action?: SyncAction
): Promise<boolean> {
  const collectionRef = adminDb.collection(getLogsCollectionPath(orgId));

  let query: FirebaseFirestore.Query = collectionRef
    .where('status', '==', 'started')
    .limit(1);

  if (action) {
    query = query.where('action', '==', action);
  }

  const snapshot = await query.get();
  return !snapshot.empty;
}

/**
 * Clean up old sync logs (keep last N per action)
 */
export async function cleanupOldLogs(
  orgId: string,
  keepCount = 50
): Promise<number> {
  const collectionRef = adminDb.collection(getLogsCollectionPath(orgId));

  // Get all logs ordered by date
  const snapshot = await collectionRef
    .orderBy('startedAt', 'desc')
    .get();

  if (snapshot.size <= keepCount) {
    return 0;
  }

  // Delete logs beyond keepCount
  const docsToDelete = snapshot.docs.slice(keepCount);
  const batch = adminDb.batch();

  for (const doc of docsToDelete) {
    batch.delete(doc.ref);
  }

  await batch.commit();
  return docsToDelete.length;
}

/**
 * Get sync statistics for an organization
 */
export async function getSyncStats(
  orgId: string,
  days = 30
): Promise<{
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  totalItemsSynced: number;
  totalItemsFailed: number;
}> {
  const collectionRef = adminDb.collection(getLogsCollectionPath(orgId));

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const snapshot = await collectionRef
    .where('startedAt', '>=', Timestamp.fromDate(cutoffDate))
    .get();

  let totalSyncs = 0;
  let successfulSyncs = 0;
  let failedSyncs = 0;
  let totalItemsSynced = 0;
  let totalItemsFailed = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    totalSyncs++;

    if (data.status === 'completed') {
      successfulSyncs++;
    } else if (data.status === 'failed') {
      failedSyncs++;
    }

    totalItemsSynced += data.itemsSynced || 0;
    totalItemsFailed += data.itemsFailed || 0;
  }

  return {
    totalSyncs,
    successfulSyncs,
    failedSyncs,
    totalItemsSynced,
    totalItemsFailed,
  };
}

// Helper: Convert Firestore doc to SyncLog
function docToSyncLog(
  id: string,
  data: FirebaseFirestore.DocumentData
): SyncLog {
  return {
    id,
    orgId: data.orgId,
    provider: data.provider,
    action: data.action,
    status: data.status,
    itemsSynced: data.itemsSynced || 0,
    itemsFailed: data.itemsFailed || 0,
    errors: data.errors || [],
    startedAt: data.startedAt?.toDate() || new Date(),
    completedAt: data.completedAt?.toDate(),
    duration: data.duration,
  };
}
