'use client';

/**
 * useAuditLogs Hook
 *
 * Provides comprehensive audit log access with filtering, pagination,
 * and real-time refresh capabilities. Designed for the audit logs admin page.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { DocumentSnapshot } from 'firebase/firestore';
import {
  AuditLogEntry,
  AuditAction,
  AuditSeverity,
  AuditResource,
  AuditLogFilters,
  getAuditEvents,
  auditHelpers,
  AUDIT_ACTION_LABELS,
  AUDIT_RESOURCE_LABELS,
  AUDIT_SEVERITY_CONFIG,
} from '@/lib/security/audit-logger';
import { exportToCSV, exportToExcel } from '@/lib/exports';
import { format } from 'date-fns';

// ============================================
// Types
// ============================================

interface UseAuditLogsOptions {
  /** Number of entries per page (default: 50) */
  pageSize?: number;
  /** Auto-refresh interval in milliseconds (0 = disabled) */
  autoRefreshInterval?: number;
  /** Initial filters to apply */
  initialFilters?: AuditLogFilters;
}

interface UseAuditLogsReturn {
  /** Current page of audit log entries */
  entries: AuditLogEntry[];
  /** Whether data is being loaded */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Current filter state */
  filters: AuditLogFilters;
  /** Whether there are more pages */
  hasMore: boolean;
  /** Current page number (1-indexed) */
  page: number;
  /** Total entries loaded across all pages */
  totalLoaded: number;

  // Actions
  /** Manually refresh the current page */
  refresh: () => Promise<void>;
  /** Load the next page of results */
  loadMore: () => Promise<void>;
  /** Reset to the first page */
  resetPagination: () => void;
  /** Update filters (resets pagination) */
  setFilters: (filters: AuditLogFilters) => void;
  /** Export current view to CSV */
  exportToCSV: () => void;
  /** Export current view to Excel */
  exportToExcel: () => Promise<void>;
}

// ============================================
// Hook Implementation
// ============================================

export function useAuditLogs(options: UseAuditLogsOptions = {}): UseAuditLogsReturn {
  const { profile } = useAuth();
  const { pageSize = 50, autoRefreshInterval = 0, initialFilters = {} } = options;

  // State
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<AuditLogFilters>(initialFilters);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<DocumentSnapshot | undefined>(undefined);
  const [page, setPage] = useState(1);

  // Fetch entries
  const fetchEntries = useCallback(
    async (isLoadMore = false) => {
      if (!profile?.orgId) return;

      try {
        setLoading(true);
        setError(null);

        const result = await getAuditEvents(
          profile.orgId,
          filters,
          {
            limit: pageSize,
            cursor: isLoadMore ? cursor : undefined,
          }
        );

        if (isLoadMore) {
          setEntries((prev) => [...prev, ...result.entries]);
          setPage((p) => p + 1);
        } else {
          setEntries(result.entries);
          setPage(1);
        }

        setHasMore(result.hasMore);
        setCursor(result.lastDoc);
      } catch (err) {
        console.error('Failed to fetch audit logs:', err);
        setError('Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    },
    [profile?.orgId, filters, pageSize, cursor]
  );

  // Initial load and filter changes
  useEffect(() => {
    setCursor(undefined);
    fetchEntries(false);
  }, [profile?.orgId, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh
  useEffect(() => {
    if (!autoRefreshInterval || autoRefreshInterval <= 0 || !profile?.orgId) {
      return;
    }

    const interval = setInterval(() => {
      fetchEntries(false);
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, profile?.orgId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Actions
  const refresh = useCallback(async () => {
    setCursor(undefined);
    await fetchEntries(false);
  }, [fetchEntries]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchEntries(true);
  }, [hasMore, loading, fetchEntries]);

  const resetPagination = useCallback(() => {
    setCursor(undefined);
    setPage(1);
    setEntries([]);
  }, []);

  const setFilters = useCallback((newFilters: AuditLogFilters) => {
    setFiltersState(newFilters);
    setCursor(undefined);
    setPage(1);
  }, []);

  // Export to CSV
  const handleExportCSV = useCallback(() => {
    if (entries.length === 0) return;

    const rows = entries.map((entry) => [
      format(entry.timestamp, 'yyyy-MM-dd HH:mm:ss'),
      entry.userEmail,
      entry.userName || '',
      AUDIT_ACTION_LABELS[entry.action] || entry.action,
      AUDIT_RESOURCE_LABELS[entry.resource] || entry.resource,
      entry.resourceId || '',
      entry.severity,
      JSON.stringify(entry.details),
      entry.ipAddress || '',
    ]);

    exportToCSV({
      filename: `audit-logs-${format(new Date(), 'yyyy-MM-dd')}`,
      headers: [
        'Timestamp',
        'User Email',
        'User Name',
        'Action',
        'Resource',
        'Resource ID',
        'Severity',
        'Details',
        'IP Address',
      ],
      rows,
    });
  }, [entries]);

  // Export to Excel
  const handleExportExcel = useCallback(async () => {
    if (entries.length === 0) return;

    const data = entries.map((entry) => ({
      Timestamp: format(entry.timestamp, 'yyyy-MM-dd HH:mm:ss'),
      'User Email': entry.userEmail,
      'User Name': entry.userName || '',
      Action: AUDIT_ACTION_LABELS[entry.action] || entry.action,
      Resource: AUDIT_RESOURCE_LABELS[entry.resource] || entry.resource,
      'Resource ID': entry.resourceId || '',
      Severity: AUDIT_SEVERITY_CONFIG[entry.severity].label,
      Details: JSON.stringify(entry.details),
      'IP Address': entry.ipAddress || '',
    }));

    await exportToExcel({
      filename: `audit-logs-${format(new Date(), 'yyyy-MM-dd')}`,
      sheets: [
        {
          name: 'Audit Logs',
          columns: [
            { header: 'Timestamp', key: 'Timestamp', width: 20 },
            { header: 'User Email', key: 'User Email', width: 25 },
            { header: 'User Name', key: 'User Name', width: 20 },
            { header: 'Action', key: 'Action', width: 18 },
            { header: 'Resource', key: 'Resource', width: 15 },
            { header: 'Resource ID', key: 'Resource ID', width: 15 },
            { header: 'Severity', key: 'Severity', width: 12 },
            { header: 'Details', key: 'Details', width: 40 },
            { header: 'IP Address', key: 'IP Address', width: 15 },
          ],
          data,
        },
      ],
    });
  }, [entries]);

  return {
    entries,
    loading,
    error,
    filters,
    hasMore,
    page,
    totalLoaded: entries.length,
    refresh,
    loadMore,
    resetPagination,
    setFilters,
    exportToCSV: handleExportCSV,
    exportToExcel: handleExportExcel,
  };
}

// ============================================
// Convenience Hook for Audit Logger
// ============================================

/**
 * Hook that provides audit logging functions with the current user context
 */
export function useAuditLogger() {
  const { profile } = useAuth();

  const logCreate = useCallback(
    async (
      resource: AuditResource | string,
      resourceId: string,
      resourceName?: string,
      details?: Record<string, unknown>
    ) => {
      if (!profile?.orgId || !profile?.uid || !profile?.email) return;
      await auditHelpers.logCreate(
        profile.orgId,
        resource,
        resourceId,
        profile.uid,
        profile.email,
        { ...details, resourceName }
      );
    },
    [profile?.orgId, profile?.uid, profile?.email]
  );

  const logUpdate = useCallback(
    async (
      resource: AuditResource | string,
      resourceId: string,
      changes: Record<string, { old: unknown; new: unknown }>
    ) => {
      if (!profile?.orgId || !profile?.uid || !profile?.email) return;
      await auditHelpers.logUpdate(
        profile.orgId,
        resource,
        resourceId,
        profile.uid,
        profile.email,
        changes
      );
    },
    [profile?.orgId, profile?.uid, profile?.email]
  );

  const logDelete = useCallback(
    async (
      resource: AuditResource | string,
      resourceId: string,
      resourceName?: string
    ) => {
      if (!profile?.orgId || !profile?.uid || !profile?.email) return;
      await auditHelpers.logDelete(
        profile.orgId,
        resource,
        resourceId,
        profile.uid,
        profile.email,
        { resourceName }
      );
    },
    [profile?.orgId, profile?.uid, profile?.email]
  );

  const logExport = useCallback(
    async (resource: AuditResource | string, format: string, recordCount: number) => {
      if (!profile?.orgId || !profile?.uid || !profile?.email) return;
      await auditHelpers.logExport(
        profile.orgId,
        resource,
        profile.uid,
        profile.email,
        format,
        recordCount
      );
    },
    [profile?.orgId, profile?.uid, profile?.email]
  );

  const logPermissionChange = useCallback(
    async (targetUserId: string, oldRole: string, newRole: string) => {
      if (!profile?.orgId || !profile?.uid || !profile?.email) return;
      await auditHelpers.logPermissionChange(
        profile.orgId,
        targetUserId,
        profile.uid,
        profile.email,
        oldRole,
        newRole
      );
    },
    [profile?.orgId, profile?.uid, profile?.email]
  );

  const logSettingsChange = useCallback(
    async (settingType: string, changedFields: string[]) => {
      if (!profile?.orgId || !profile?.uid || !profile?.email) return;
      await auditHelpers.logSettingsChange(
        profile.orgId,
        profile.uid,
        profile.email,
        settingType,
        changedFields
      );
    },
    [profile?.orgId, profile?.uid, profile?.email]
  );

  const logPayment = useCallback(
    async (invoiceId: string, amount: number, method: string) => {
      if (!profile?.orgId || !profile?.uid || !profile?.email) return;
      await auditHelpers.logPayment(
        profile.orgId,
        profile.uid,
        profile.email,
        invoiceId,
        amount,
        method
      );
    },
    [profile?.orgId, profile?.uid, profile?.email]
  );

  const logImpersonation = useCallback(
    async (impersonatedRole: string, action: 'start' | 'end') => {
      if (!profile?.orgId || !profile?.uid || !profile?.email) return;
      await auditHelpers.logImpersonation(
        profile.orgId,
        profile.uid,
        profile.email,
        impersonatedRole,
        action
      );
    },
    [profile?.orgId, profile?.uid, profile?.email]
  );

  return {
    logCreate,
    logUpdate,
    logDelete,
    logExport,
    logPermissionChange,
    logSettingsChange,
    logPayment,
    logImpersonation,
  };
}

// Re-export types and constants for convenience
export type { AuditLogEntry, AuditAction, AuditSeverity, AuditResource, AuditLogFilters };
export { AUDIT_ACTION_LABELS, AUDIT_RESOURCE_LABELS, AUDIT_SEVERITY_CONFIG };
