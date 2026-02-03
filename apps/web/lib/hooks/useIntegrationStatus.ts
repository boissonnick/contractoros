/**
 * @fileoverview Integration Status Hooks
 *
 * Provides hooks for fetching integration connection status, sync logs,
 * and triggering manual sync operations.
 *
 * This module exports:
 * - useIntegrationStatus: Fetch all integration connection statuses
 * - useIntegrationSyncLogs: Fetch sync history logs for integrations
 * - useTriggerSync: Function to trigger manual sync for an integration
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  Timestamp,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import { convertTimestamps } from '@/lib/firebase/timestamp-converter';

// ============================================
// Types
// ============================================

export type IntegrationType = 'quickbooks' | 'gusto' | 'stripe';
export type SyncStatus = 'healthy' | 'warning' | 'error' | 'never_synced';

export interface IntegrationStatus {
  id: string;
  type: IntegrationType;
  connected: boolean;
  connectedAt?: Date;
  lastSyncAt?: Date;
  nextSyncAt?: Date;
  syncStatus: SyncStatus;
  itemsSyncedLast24h: number;
  errorCount: number;
  lastError?: string;
  accessTokenExpiry?: Date;
  orgId: string;
}

export interface SyncLogEntry {
  id: string;
  integrationType: IntegrationType;
  status: 'success' | 'partial' | 'failed';
  startedAt: Date;
  completedAt: Date;
  itemsSynced: number;
  itemsFailed: number;
  errorMessage?: string;
  errorDetails?: string;
  syncType: 'manual' | 'scheduled' | 'webhook';
  direction: 'push' | 'pull' | 'bidirectional';
  entityTypes: string[];
  orgId: string;
}

export interface SyncHistorySummary {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  partialSyncs: number;
  lastWeekSyncs: number;
  averageDuration: number;
}

// ============================================
// Constants
// ============================================

export const INTEGRATION_LABELS: Record<IntegrationType, string> = {
  quickbooks: 'QuickBooks Online',
  gusto: 'Gusto',
  stripe: 'Stripe',
};

export const INTEGRATION_DESCRIPTIONS: Record<IntegrationType, string> = {
  quickbooks: 'Accounting & invoicing',
  gusto: 'Payroll & HR',
  stripe: 'Payments',
};

export const SYNC_STATUS_LABELS: Record<SyncStatus, string> = {
  healthy: 'Healthy',
  warning: 'Warning',
  error: 'Error',
  never_synced: 'Never Synced',
};

const INTEGRATION_DATE_FIELDS = [
  'connectedAt',
  'lastSyncAt',
  'nextSyncAt',
  'accessTokenExpiry',
] as const;

const SYNC_LOG_DATE_FIELDS = ['startedAt', 'completedAt'] as const;

// Collection paths
const getIntegrationsPath = (orgId: string) => `organizations/${orgId}/integrations`;
const getSyncLogsPath = (orgId: string) => `organizations/${orgId}/integrationSyncLogs`;

// ============================================
// useIntegrationStatus - Fetch all integration statuses
// ============================================

interface UseIntegrationStatusReturn {
  integrations: IntegrationStatus[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
  getIntegration: (type: IntegrationType) => IntegrationStatus | undefined;
}

/**
 * Hook for fetching integration connection statuses with real-time updates.
 *
 * @returns {UseIntegrationStatusReturn} Integration statuses and operations
 *
 * @example
 * const { integrations, loading, getIntegration } = useIntegrationStatus();
 * const qbStatus = getIntegration('quickbooks');
 */
export function useIntegrationStatus(): UseIntegrationStatusReturn {
  const { profile } = useAuth();
  const orgId = profile?.orgId;

  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      collection(db, getIntegrationsPath(orgId)),
      (snapshot) => {
        const items = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...convertTimestamps(data as Record<string, unknown>, INTEGRATION_DATE_FIELDS),
            orgId,
          } as IntegrationStatus;
        });

        // Add placeholder entries for disconnected integrations
        const allIntegrations: IntegrationStatus[] = (['quickbooks', 'gusto', 'stripe'] as IntegrationType[]).map(
          (type) => {
            const existing = items.find((i) => i.type === type);
            if (existing) return existing;

            return {
              id: type,
              type,
              connected: false,
              syncStatus: 'never_synced' as SyncStatus,
              itemsSyncedLast24h: 0,
              errorCount: 0,
              orgId,
            };
          }
        );

        setIntegrations(allIntegrations);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching integration statuses:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId, refreshKey]);

  const getIntegration = useCallback(
    (type: IntegrationType) => integrations.find((i) => i.type === type),
    [integrations]
  );

  return {
    integrations,
    loading,
    error,
    refresh,
    getIntegration,
  };
}

// ============================================
// useIntegrationSyncLogs - Fetch sync history
// ============================================

interface UseIntegrationSyncLogsOptions {
  integrationType?: IntegrationType;
  limit?: number;
}

interface UseIntegrationSyncLogsReturn {
  logs: SyncLogEntry[];
  loading: boolean;
  error: Error | null;
  summary: SyncHistorySummary;
  refresh: () => void;
}

/**
 * Hook for fetching integration sync logs with real-time updates.
 *
 * @param {UseIntegrationSyncLogsOptions} options - Filter options
 * @returns {UseIntegrationSyncLogsReturn} Sync logs and summary
 *
 * @example
 * const { logs, summary, loading } = useIntegrationSyncLogs({ integrationType: 'quickbooks' });
 */
export function useIntegrationSyncLogs(
  options: UseIntegrationSyncLogsOptions = {}
): UseIntegrationSyncLogsReturn {
  const { profile } = useAuth();
  const orgId = profile?.orgId;
  const { integrationType, limit: queryLimit = 50 } = options;

  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let q = query(
      collection(db, getSyncLogsPath(orgId)),
      orderBy('startedAt', 'desc'),
      limit(queryLimit)
    );

    if (integrationType) {
      q = query(
        collection(db, getSyncLogsPath(orgId)),
        where('integrationType', '==', integrationType),
        orderBy('startedAt', 'desc'),
        limit(queryLimit)
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...convertTimestamps(data as Record<string, unknown>, SYNC_LOG_DATE_FIELDS),
            orgId,
          } as SyncLogEntry;
        });

        setLogs(items);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching sync logs:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId, integrationType, queryLimit, refreshKey]);

  const summary = useMemo((): SyncHistorySummary => {
    if (!logs.length) {
      return {
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        partialSyncs: 0,
        lastWeekSyncs: 0,
        averageDuration: 0,
      };
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const lastWeekLogs = logs.filter((log) => log.startedAt >= oneWeekAgo);

    const totalDuration = logs.reduce((sum, log) => {
      const duration = log.completedAt.getTime() - log.startedAt.getTime();
      return sum + duration;
    }, 0);

    return {
      totalSyncs: logs.length,
      successfulSyncs: logs.filter((l) => l.status === 'success').length,
      failedSyncs: logs.filter((l) => l.status === 'failed').length,
      partialSyncs: logs.filter((l) => l.status === 'partial').length,
      lastWeekSyncs: lastWeekLogs.length,
      averageDuration: Math.round(totalDuration / logs.length / 1000), // in seconds
    };
  }, [logs]);

  return {
    logs,
    loading,
    error,
    summary,
    refresh,
  };
}

// ============================================
// useTriggerSync - Trigger manual sync
// ============================================

interface UseTriggerSyncReturn {
  triggerSync: (type: IntegrationType, options?: TriggerSyncOptions) => Promise<void>;
  syncing: IntegrationType | null;
  error: Error | null;
}

interface TriggerSyncOptions {
  direction?: 'push' | 'pull' | 'bidirectional';
  entityTypes?: string[];
}

/**
 * Hook for triggering manual sync operations.
 *
 * @returns {UseTriggerSyncReturn} Sync trigger function and state
 *
 * @example
 * const { triggerSync, syncing, error } = useTriggerSync();
 * await triggerSync('quickbooks', { direction: 'pull' });
 */
export function useTriggerSync(): UseTriggerSyncReturn {
  const { profile } = useAuth();
  const orgId = profile?.orgId;

  const [syncing, setSyncing] = useState<IntegrationType | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const triggerSync = useCallback(
    async (type: IntegrationType, options: TriggerSyncOptions = {}) => {
      if (!orgId) {
        setError(new Error('Organization ID required'));
        return;
      }

      setSyncing(type);
      setError(null);

      try {
        const { direction = 'bidirectional', entityTypes = ['all'] } = options;

        // Create a sync request document
        // In production, this would trigger a Cloud Function
        const syncRequest = {
          integrationType: type,
          status: 'pending',
          requestedAt: Timestamp.now(),
          requestedBy: profile?.uid,
          direction,
          entityTypes,
          orgId,
        };

        await addDoc(collection(db, `organizations/${orgId}/syncRequests`), syncRequest);

        // Simulate sync completion for demo purposes
        // In production, Cloud Functions would process the request
        const startedAt = Timestamp.now();

        // Create a mock sync log entry
        setTimeout(async () => {
          try {
            const syncLog = {
              integrationType: type,
              status: 'success' as const,
              startedAt,
              completedAt: Timestamp.now(),
              itemsSynced: Math.floor(Math.random() * 50) + 10,
              itemsFailed: 0,
              syncType: 'manual' as const,
              direction,
              entityTypes,
              orgId,
            };

            await addDoc(collection(db, getSyncLogsPath(orgId)), syncLog);

            // Update integration status
            const integrationRef = doc(db, getIntegrationsPath(orgId), type);
            const integrationDoc = await getDoc(integrationRef);

            if (integrationDoc.exists()) {
              await updateDoc(integrationRef, {
                lastSyncAt: Timestamp.now(),
                syncStatus: 'healthy',
                itemsSyncedLast24h: (integrationDoc.data().itemsSyncedLast24h || 0) + syncLog.itemsSynced,
              });
            }

            setSyncing(null);
          } catch (err) {
            console.error('Error updating sync status:', err);
            setSyncing(null);
          }
        }, 2000);
      } catch (err) {
        console.error('Error triggering sync:', err);
        setError(err as Error);
        setSyncing(null);
      }
    },
    [orgId, profile?.uid]
  );

  return {
    triggerSync,
    syncing,
    error,
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get the status indicator color based on sync status
 */
export function getSyncStatusColor(status: SyncStatus): {
  bg: string;
  text: string;
  dot: string;
} {
  switch (status) {
    case 'healthy':
      return { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' };
    case 'warning':
      return { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' };
    case 'error':
      return { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' };
    case 'never_synced':
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' };
  }
}

/**
 * Format relative time for last sync
 */
export function formatLastSync(date: Date | undefined): string {
  if (!date) return 'Never';

  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}

/**
 * Calculate sync health based on recent activity
 */
export function calculateSyncHealth(
  integration: IntegrationStatus,
  recentLogs: SyncLogEntry[]
): SyncStatus {
  if (!integration.connected) return 'never_synced';
  if (!integration.lastSyncAt) return 'never_synced';

  // Check for recent errors
  const recentErrors = recentLogs.filter(
    (log) =>
      log.status === 'failed' &&
      log.startedAt >= new Date(Date.now() - 24 * 60 * 60 * 1000)
  );

  if (recentErrors.length >= 3) return 'error';
  if (recentErrors.length >= 1) return 'warning';

  // Check if last sync was too long ago (more than 24 hours)
  const hoursSinceSync = (Date.now() - integration.lastSyncAt.getTime()) / (1000 * 60 * 60);
  if (hoursSinceSync > 24) return 'warning';

  return 'healthy';
}
