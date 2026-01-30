/**
 * useVoiceLogs Hook
 *
 * Provides real-time subscription to voice logs for the current user/org.
 * Supports filtering by status, date range, and user.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp,
  QueryConstraint,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import { VoiceLog, VoiceLogStatus } from '@/types';
import { convertTimestamps } from '@/lib/firebase/timestamp-converter';

// Date fields to convert from Timestamp to Date
const DATE_FIELDS = [
  'recordedAt',
  'uploadedAt',
  'processedAt',
  'createdAt',
  'updatedAt',
];

interface UseVoiceLogsOptions {
  userId?: string;           // Filter by specific user (admin only)
  status?: VoiceLogStatus;   // Filter by status
  startDate?: Date;          // Filter by date range
  endDate?: Date;
  limitCount?: number;       // Limit number of results
}

interface UseVoiceLogsReturn {
  voiceLogs: VoiceLog[];
  loading: boolean;
  error: string | null;
  retry: (logId: string) => Promise<void>;
}

/**
 * Convert Firestore document to VoiceLog
 */
function docToVoiceLog(id: string, data: Record<string, unknown>): VoiceLog {
  const converted = convertTimestamps(data, DATE_FIELDS);
  return {
    id,
    ...converted,
  } as VoiceLog;
}

/**
 * Hook for real-time voice logs subscription
 */
export function useVoiceLogs(options: UseVoiceLogsOptions = {}): UseVoiceLogsReturn {
  const { profile } = useAuth();
  const [voiceLogs, setVoiceLogs] = useState<VoiceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { userId, status, startDate, endDate, limitCount = 50 } = options;

  useEffect(() => {
    if (!profile?.orgId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const constraints: QueryConstraint[] = [];

    // Filter by user if specified
    if (userId) {
      constraints.push(where('userId', '==', userId));
    }

    // Filter by status if specified
    if (status) {
      constraints.push(where('status', '==', status));
    }

    // Filter by date range
    if (startDate) {
      constraints.push(where('recordedAt', '>=', Timestamp.fromDate(startDate)));
    }
    if (endDate) {
      constraints.push(where('recordedAt', '<=', Timestamp.fromDate(endDate)));
    }

    // Order by most recent first
    constraints.push(orderBy('recordedAt', 'desc'));

    // Limit results
    constraints.push(limit(limitCount));

    const logsRef = collection(db, `organizations/${profile.orgId}/voiceLogs`);
    const q = query(logsRef, ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const logs: VoiceLog[] = [];
        snapshot.forEach((doc) => {
          logs.push(docToVoiceLog(doc.id, doc.data()));
        });
        setVoiceLogs(logs);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching voice logs:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [profile?.orgId, userId, status, startDate?.getTime(), endDate?.getTime(), limitCount]);

  /**
   * Trigger retry for a failed voice log
   */
  const retry = useCallback(async (logId: string) => {
    if (!profile?.orgId) return;

    const logRef = doc(db, `organizations/${profile.orgId}/voiceLogs`, logId);
    await updateDoc(logRef, {
      status: 'uploaded',
      statusMessage: 'Retrying processing...',
      updatedAt: Timestamp.now(),
    });

    // TODO: Trigger processing via API or Pub/Sub
    // await fetch(`/api/voice-logs/${logId}/retry`, { method: 'POST' });
  }, [profile?.orgId]);

  return {
    voiceLogs,
    loading,
    error,
    retry,
  };
}

/**
 * Hook for a single voice log with real-time updates
 */
export function useVoiceLog(logId: string | null): {
  voiceLog: VoiceLog | null;
  loading: boolean;
  error: string | null;
} {
  const { profile } = useAuth();
  const [voiceLog, setVoiceLog] = useState<VoiceLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.orgId || !logId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const logRef = doc(db, `organizations/${profile.orgId}/voiceLogs`, logId);

    const unsubscribe = onSnapshot(
      logRef,
      (doc) => {
        if (doc.exists()) {
          setVoiceLog(docToVoiceLog(doc.id, doc.data()));
        } else {
          setVoiceLog(null);
          setError('Voice log not found');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching voice log:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [profile?.orgId, logId]);

  return { voiceLog, loading, error };
}

/**
 * Hook for voice log statistics
 */
export function useVoiceLogStats(): {
  stats: {
    total: number;
    processing: number;
    completed: number;
    failed: number;
    todayCount: number;
  };
  loading: boolean;
} {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    todayCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.orgId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Get today's start
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const logsRef = collection(db, `organizations/${profile.orgId}/voiceLogs`);
    const q = query(
      logsRef,
      where('recordedAt', '>=', Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))),
      orderBy('recordedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let total = 0;
        let processing = 0;
        let completed = 0;
        let failed = 0;
        let todayCount = 0;

        snapshot.forEach((doc) => {
          const data = doc.data();
          total++;

          const status = data.status as VoiceLogStatus;
          if (['processing', 'uploading', 'uploaded', 'queued'].includes(status)) {
            processing++;
          } else if (status === 'completed') {
            completed++;
          } else if (['failed', 'error'].includes(status)) {
            failed++;
          }

          // Check if recorded today
          const recordedAt = data.recordedAt?.toDate?.() || new Date(data.recordedAt);
          if (recordedAt >= today) {
            todayCount++;
          }
        });

        setStats({ total, processing, completed, failed, todayCount });
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching voice log stats:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [profile?.orgId]);

  return { stats, loading };
}
