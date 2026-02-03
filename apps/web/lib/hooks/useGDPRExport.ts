'use client';

/**
 * useGDPRExport Hook
 *
 * Provides GDPR data export functionality with request management,
 * status tracking, and download handling.
 *
 * Usage:
 * ```tsx
 * const {
 *   requests,
 *   loading,
 *   createRequest,
 *   cancelRequest,
 *   downloadExport,
 *   processExport,
 * } = useGDPRExport();
 *
 * // Create a new export request
 * await createRequest({
 *   format: 'json',
 *   includeAttachments: false,
 *   dataCategories: ['profile', 'projects', 'tasks'],
 * });
 *
 * // Process and download immediately
 * await processExport(requestId);
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  DataExportRequest,
  DataCategory,
  ExportFormat,
  CreateExportRequestInput,
  createExportRequest,
  getExportRequest,
  cancelExportRequest as cancelExportRequestFn,
  updateExportRequestStatus,
  getUserDataForExport,
  downloadExportFile,
  isExportExpired,
  EXPORT_STATUS_LABELS,
  EXPORT_STATUS_CONFIG,
  DATA_CATEGORY_LABELS,
  DATA_CATEGORY_DESCRIPTIONS,
  ALL_DATA_CATEGORIES,
  DEFAULT_USER_CATEGORIES,
} from '@/lib/security/gdpr-export';
import { logAuditEvent } from '@/lib/security/audit-logger';

// ============================================
// Types
// ============================================

interface UseGDPRExportOptions {
  /** Auto-refresh interval in milliseconds (0 = disabled) */
  autoRefreshInterval?: number;
  /** Show only requests from current user (default: true for non-admins) */
  onlyOwnRequests?: boolean;
}

interface UseGDPRExportReturn {
  /** List of export requests */
  requests: DataExportRequest[];
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether user can request exports */
  canRequestExport: boolean;
  /** Whether user can export other users' data (admin only) */
  canExportOthers: boolean;

  // Actions
  /** Create a new export request */
  createRequest: (options: {
    format: ExportFormat;
    includeAttachments: boolean;
    dataCategories: DataCategory[];
    targetUserId?: string;
    targetUserEmail?: string;
  }) => Promise<string | null>;

  /** Cancel a pending export request */
  cancelRequest: (requestId: string) => Promise<boolean>;

  /** Process an export request and generate the download */
  processExport: (requestId: string) => Promise<boolean>;

  /** Download a completed export */
  downloadExport: (request: DataExportRequest) => void;

  /** Refresh the requests list */
  refresh: () => void;
}

// ============================================
// Hook Implementation
// ============================================

export function useGDPRExport(options: UseGDPRExportOptions = {}): UseGDPRExportReturn {
  const { profile, user } = useAuth();
  const { autoRefreshInterval = 0, onlyOwnRequests = true } = options;

  const [requests, setRequests] = useState<DataExportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const orgId = profile?.orgId;
  const userId = profile?.uid;
  const userEmail = profile?.email || user?.email;
  const userName = profile?.displayName;
  const isAdmin = profile?.role === 'OWNER' || profile?.role === 'PM';

  // Determine permissions
  const canRequestExport = !!orgId && !!userId;
  const canExportOthers = isAdmin;

  // Subscribe to export requests
  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      setRequests([]);
      return;
    }

    setLoading(true);
    setError(null);

    const requestsRef = collection(db, `organizations/${orgId}/dataExportRequests`);

    // Build query based on permissions
    let q;
    if (onlyOwnRequests && !isAdmin) {
      q = query(
        requestsRef,
        where('requestedBy', '==', userId),
        orderBy('requestedAt', 'desc')
      );
    } else {
      q = query(requestsRef, orderBy('requestedAt', 'desc'));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const exportRequests: DataExportRequest[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            orgId,
            requestedBy: data.requestedBy,
            requestedByEmail: data.requestedByEmail,
            requestedByName: data.requestedByName,
            targetUserId: data.targetUserId,
            targetUserEmail: data.targetUserEmail,
            status: data.status,
            requestedAt: data.requestedAt?.toDate() || new Date(),
            startedAt: data.startedAt?.toDate(),
            completedAt: data.completedAt?.toDate(),
            expiresAt: data.expiresAt?.toDate(),
            downloadUrl: data.downloadUrl,
            format: data.format,
            includeAttachments: data.includeAttachments,
            dataCategories: data.dataCategories,
            errorMessage: data.errorMessage,
            recordCounts: data.recordCounts,
            totalRecords: data.totalRecords,
            fileSizeBytes: data.fileSizeBytes,
          };
        });

        setRequests(exportRequests);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to fetch export requests:', err);
        setError('Failed to load export requests');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId, userId, isAdmin, onlyOwnRequests, refreshTrigger]);

  // Auto-refresh for processing status updates
  useEffect(() => {
    if (!autoRefreshInterval || autoRefreshInterval <= 0) return;

    const interval = setInterval(() => {
      setRefreshTrigger((prev) => prev + 1);
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval]);

  // Create new export request
  const createRequest = useCallback(
    async (requestOptions: {
      format: ExportFormat;
      includeAttachments: boolean;
      dataCategories: DataCategory[];
      targetUserId?: string;
      targetUserEmail?: string;
    }): Promise<string | null> => {
      if (!orgId || !userId || !userEmail) {
        setError('You must be logged in to request data export');
        return null;
      }

      // Check if targeting another user (admin only)
      if (requestOptions.targetUserId && requestOptions.targetUserId !== userId) {
        if (!isAdmin) {
          setError('You do not have permission to export other users\' data');
          return null;
        }
      }

      try {
        const input: CreateExportRequestInput = {
          requestedBy: userId,
          requestedByEmail: userEmail,
          requestedByName: userName,
          targetUserId: requestOptions.targetUserId || userId,
          targetUserEmail: requestOptions.targetUserEmail || userEmail,
          format: requestOptions.format,
          includeAttachments: requestOptions.includeAttachments,
          dataCategories: requestOptions.dataCategories,
        };

        const requestId = await createExportRequest(orgId, input);

        // Log audit event
        await logAuditEvent(orgId, {
          userId,
          userEmail,
          userName,
          action: 'CREATE',
          resource: 'system',
          resourceId: requestId,
          details: {
            type: 'gdpr_export_request',
            format: requestOptions.format,
            categories: requestOptions.dataCategories,
            targetUserId: requestOptions.targetUserId || userId,
          },
          severity: 'info',
        });

        return requestId;
      } catch (err) {
        console.error('Failed to create export request:', err);
        setError('Failed to create export request');
        return null;
      }
    },
    [orgId, userId, userEmail, userName, isAdmin]
  );

  // Cancel export request
  const cancelRequest = useCallback(
    async (requestId: string): Promise<boolean> => {
      if (!orgId || !userId || !userEmail) return false;

      try {
        const request = await getExportRequest(orgId, requestId);

        if (!request) {
          setError('Export request not found');
          return false;
        }

        // Check permissions
        if (request.requestedBy !== userId && !isAdmin) {
          setError('You do not have permission to cancel this request');
          return false;
        }

        // Can only cancel pending requests
        if (request.status !== 'pending') {
          setError('Only pending requests can be cancelled');
          return false;
        }

        await cancelExportRequestFn(orgId, requestId);

        // Log audit event
        await logAuditEvent(orgId, {
          userId,
          userEmail,
          userName,
          action: 'UPDATE',
          resource: 'system',
          resourceId: requestId,
          details: {
            type: 'gdpr_export_cancelled',
          },
          severity: 'info',
        });

        return true;
      } catch (err) {
        console.error('Failed to cancel export request:', err);
        setError('Failed to cancel export request');
        return false;
      }
    },
    [orgId, userId, userEmail, userName, isAdmin]
  );

  // Process export (collect data and generate download)
  const processExport = useCallback(
    async (requestId: string): Promise<boolean> => {
      if (!orgId || !userId || !userEmail) return false;

      try {
        const request = await getExportRequest(orgId, requestId);

        if (!request) {
          setError('Export request not found');
          return false;
        }

        // Check permissions
        if (request.requestedBy !== userId && !isAdmin) {
          setError('You do not have permission to process this request');
          return false;
        }

        // Can only process pending requests
        if (request.status !== 'pending') {
          setError('This request has already been processed');
          return false;
        }

        // Update status to processing
        await updateExportRequestStatus(orgId, requestId, 'processing');

        try {
          // Collect user data
          const targetUserId = request.targetUserId || request.requestedBy;
          const exportData = await getUserDataForExport(
            orgId,
            targetUserId,
            request.dataCategories,
            requestId
          );

          // Generate and download the file
          downloadExportFile(exportData, request.format);

          // Calculate approximate file size
          const jsonStr = JSON.stringify(exportData);
          const fileSizeBytes = new Blob([jsonStr]).size;

          // Update status to completed
          await updateExportRequestStatus(orgId, requestId, 'completed', {
            recordCounts: exportData.exportMetadata.recordCounts as Record<DataCategory, number>,
            fileSizeBytes,
          });

          // Log audit event
          await logAuditEvent(orgId, {
            userId,
            userEmail,
            userName,
            action: 'EXPORT',
            resource: 'system',
            resourceId: requestId,
            details: {
              type: 'gdpr_export_completed',
              format: request.format,
              categories: request.dataCategories,
              recordCounts: exportData.exportMetadata.recordCounts,
              fileSizeBytes,
            },
            severity: 'info',
          });

          return true;
        } catch (processError) {
          // Update status to failed
          await updateExportRequestStatus(orgId, requestId, 'failed', {
            errorMessage: processError instanceof Error ? processError.message : 'Unknown error',
          });

          throw processError;
        }
      } catch (err) {
        console.error('Failed to process export:', err);
        setError('Failed to process export');
        return false;
      }
    },
    [orgId, userId, userEmail, userName, isAdmin]
  );

  // Download completed export
  const downloadExport = useCallback(
    (request: DataExportRequest): void => {
      if (request.status !== 'completed') {
        setError('This export is not ready for download');
        return;
      }

      if (isExportExpired(request)) {
        setError('This export has expired. Please create a new request.');
        return;
      }

      // Re-process and download
      // Note: In production, you might store the export in cloud storage
      // and provide a direct download URL
      processExport(request.id);
    },
    [processExport]
  );

  // Manual refresh
  const refresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return {
    requests,
    loading,
    error,
    canRequestExport,
    canExportOthers,
    createRequest,
    cancelRequest,
    processExport,
    downloadExport,
    refresh,
  };
}

// Re-export types and constants for convenience
export type {
  DataExportRequest,
  DataCategory,
  ExportFormat,
};

export {
  EXPORT_STATUS_LABELS,
  EXPORT_STATUS_CONFIG,
  DATA_CATEGORY_LABELS,
  DATA_CATEGORY_DESCRIPTIONS,
  ALL_DATA_CATEGORIES,
  DEFAULT_USER_CATEGORIES,
  isExportExpired,
  formatFileSize,
  getExpirationMessage,
} from '@/lib/security/gdpr-export';

export default useGDPRExport;
