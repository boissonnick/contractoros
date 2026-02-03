/**
 * Custom Reports Hook
 *
 * Provides CRUD operations and real-time subscription for custom reports.
 */

'use client';

import { useMemo, useCallback, useState } from 'react';
import { collection, orderBy, DocumentData, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/auth';
import { useFirestoreCollection } from './useFirestoreCollection';
import { useFirestoreCrud } from './useFirestoreCrud';
import {
  CustomReportConfig,
  executeReportQuery,
  createDefaultReportConfig,
  generateReportId,
} from '@/lib/reports/report-builder';

// Convert Firestore data to CustomReportConfig
function convertReport(id: string, data: DocumentData): CustomReportConfig {
  return {
    id,
    name: data.name || 'Untitled Report',
    description: data.description || '',
    dataSource: data.dataSource || 'projects',
    fields: data.fields || [],
    filters: data.filters || [],
    visualization: data.visualization || 'table',
    groupBy: data.groupBy || undefined,
    sortBy: data.sortBy || undefined,
    sortDirection: data.sortDirection || 'asc',
    createdAt: data.createdAt?.toDate?.() || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || new Date(),
    createdBy: data.createdBy || '',
    isShared: data.isShared || false,
    sharedWith: data.sharedWith || [],
  };
}

export interface UseCustomReportsResult {
  reports: CustomReportConfig[];
  loading: boolean;
  error: Error | null;
  createReport: (config: Omit<CustomReportConfig, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateReport: (id: string, config: Partial<CustomReportConfig>) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
  duplicateReport: (report: CustomReportConfig) => Promise<string>;
  executeReport: (config: CustomReportConfig) => Promise<Record<string, unknown>[]>;
  executing: boolean;
  reportData: Record<string, unknown>[];
  reportError: Error | null;
}

export function useCustomReports(): UseCustomReportsResult {
  const { profile } = useAuth();
  const orgId = profile?.orgId;
  const userId = profile?.uid;

  const [reportData, setReportData] = useState<Record<string, unknown>[]>([]);
  const [executing, setExecuting] = useState(false);
  const [reportError, setReportError] = useState<Error | null>(null);

  // Collection path
  const collectionPath = `organizations/${orgId}/customReports`;

  // Query constraints
  const constraints = useMemo(
    () => [orderBy('updatedAt', 'desc')],
    []
  );

  // Converter
  const converter = useCallback(
    (id: string, data: DocumentData) => convertReport(id, data),
    []
  );

  // Subscribe to reports
  const { items: reports, loading, error } = useFirestoreCollection<CustomReportConfig>({
    path: collectionPath,
    constraints,
    converter,
    enabled: !!orgId,
  });

  // CRUD operations
  const { create, update, remove } = useFirestoreCrud<CustomReportConfig>(collectionPath, {
    entityName: 'Report',
  });

  // Create a new report
  const createReport = useCallback(
    async (config: Omit<CustomReportConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
      const reportData = {
        ...config,
        createdBy: userId,
      };
      return create(reportData as Omit<CustomReportConfig, 'id' | 'createdAt' | 'updatedAt'>);
    },
    [create, userId]
  );

  // Update an existing report
  const updateReport = useCallback(
    async (id: string, config: Partial<CustomReportConfig>) => {
      return update(id, config);
    },
    [update]
  );

  // Delete a report
  const deleteReport = useCallback(
    async (id: string) => {
      return remove(id);
    },
    [remove]
  );

  // Duplicate a report
  const duplicateReport = useCallback(
    async (report: CustomReportConfig) => {
      const duplicated = {
        ...report,
        name: `${report.name} (Copy)`,
        createdBy: userId,
        isShared: false,
        sharedWith: [],
      };
      // Remove id, createdAt, updatedAt for creation
      const { id, createdAt, updatedAt, ...reportData } = duplicated;
      return create(reportData as Omit<CustomReportConfig, 'id' | 'createdAt' | 'updatedAt'>);
    },
    [create, userId]
  );

  // Execute a report
  const executeReport = useCallback(
    async (config: CustomReportConfig) => {
      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      setExecuting(true);
      setReportError(null);

      try {
        const data = await executeReportQuery(orgId, config);
        setReportData(data);
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to execute report');
        setReportError(error);
        throw error;
      } finally {
        setExecuting(false);
      }
    },
    [orgId]
  );

  return {
    reports,
    loading,
    error,
    createReport,
    updateReport,
    deleteReport,
    duplicateReport,
    executeReport,
    executing,
    reportData,
    reportError,
  };
}

export default useCustomReports;
