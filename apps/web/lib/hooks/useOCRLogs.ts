'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import { logger } from '@/lib/utils/logger';

export interface OCRLogEntry {
  id: string;
  expenseId?: string;
  success: boolean;
  model: string;
  confidence: number;
  processingTimeMs: number;
  error?: string;
  orgId: string;
  userId: string;
  createdAt: Date;
}

interface OCRLogStats {
  totalScans: number;
  successRate: number; // percentage
  avgConfidence: number;
  avgProcessingTime: number; // ms
  byModel: Record<string, { count: number; avgConfidence: number }>;
}

export interface UseOCRLogsReturn {
  logs: OCRLogEntry[];
  loading: boolean;
  error: string | null;
  stats: OCRLogStats | null;
}

/**
 * Hook for querying OCR log entries for admin-facing analytics.
 *
 * Reads from `organizations/{orgId}/ocrLogs` (one-time read, not real-time).
 * Only available to OWNER and PM roles.
 *
 * @returns {UseOCRLogsReturn} OCR logs, loading state, error, and computed stats
 */
export function useOCRLogs(): UseOCRLogsReturn {
  const { profile } = useAuth();
  const orgId = profile?.orgId;
  const role = profile?.role;
  const isAdmin = role === 'OWNER' || role === 'PM';

  const [logs, setLogs] = useState<OCRLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId || !isAdmin) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchLogs() {
      try {
        setLoading(true);
        setError(null);

        const logsRef = collection(db, 'organizations', orgId!, 'ocrLogs');
        const q = query(
          logsRef,
          orderBy('createdAt', 'desc'),
          limit(200)
        );

        const snapshot = await getDocs(q);
        if (cancelled) return;

        const entries: OCRLogEntry[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          const createdAtVal = data.createdAt;

          return {
            id: doc.id,
            expenseId: data.expenseId || undefined,
            success: data.success ?? false,
            model: data.model || 'unknown',
            confidence: data.confidence ?? 0,
            processingTimeMs: data.processingTimeMs ?? 0,
            error: data.error || undefined,
            orgId: data.orgId || '',
            userId: data.userId || '',
            createdAt:
              createdAtVal instanceof Timestamp
                ? createdAtVal.toDate()
                : createdAtVal instanceof Date
                  ? createdAtVal
                  : new Date(createdAtVal),
          };
        });

        setLogs(entries);
      } catch (err) {
        if (cancelled) return;
        logger.error('Failed to fetch OCR logs', { error: err, hook: 'useOCRLogs' });
        setError(
          err instanceof Error ? err.message : 'Failed to fetch OCR logs'
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchLogs();

    return () => {
      cancelled = true;
    };
  }, [orgId, isAdmin]);

  const stats = useMemo<OCRLogStats | null>(() => {
    if (logs.length === 0) return null;

    const totalScans = logs.length;
    const successCount = logs.filter((l) => l.success).length;
    const successRate = totalScans > 0 ? (successCount / totalScans) * 100 : 0;

    const totalConfidence = logs.reduce((sum, l) => sum + l.confidence, 0);
    const avgConfidence = totalScans > 0 ? totalConfidence / totalScans : 0;

    const totalTime = logs.reduce((sum, l) => sum + l.processingTimeMs, 0);
    const avgProcessingTime = totalScans > 0 ? totalTime / totalScans : 0;

    const byModel: Record<string, { count: number; avgConfidence: number }> =
      {};
    for (const log of logs) {
      if (!byModel[log.model]) {
        byModel[log.model] = { count: 0, avgConfidence: 0 };
      }
      byModel[log.model].count += 1;
    }

    // Compute average confidence per model
    for (const modelName of Object.keys(byModel)) {
      const modelLogs = logs.filter((l) => l.model === modelName);
      const modelConfidenceSum = modelLogs.reduce(
        (sum, l) => sum + l.confidence,
        0
      );
      byModel[modelName].avgConfidence =
        modelLogs.length > 0 ? modelConfidenceSum / modelLogs.length : 0;
    }

    return {
      totalScans,
      successRate,
      avgConfidence,
      avgProcessingTime,
      byModel,
    };
  }, [logs]);

  return { logs, loading, error, stats };
}
