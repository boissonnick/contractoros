'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import { convertTimestampsDeep } from '@/lib/firebase/timestamp-converter';
import {
  DailyLogEntry,
  DailyLogCategory,
  DailyLogSummary,
  DailyLogPhoto,
} from '@/types';

interface UseDailyLogsOptions {
  projectId?: string;
  userId?: string;
  category?: DailyLogCategory;
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  includePrivate?: boolean;
}

interface UseDailyLogsReturn {
  logs: DailyLogEntry[];
  loading: boolean;
  error: string | null;

  // CRUD operations
  createLog: (log: Omit<DailyLogEntry, 'id' | 'orgId' | 'userId' | 'userName' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateLog: (logId: string, updates: Partial<DailyLogEntry>) => Promise<void>;
  deleteLog: (logId: string) => Promise<void>;

  // Photo operations
  addPhoto: (logId: string, photo: Omit<DailyLogPhoto, 'id' | 'uploadedAt'>) => Promise<void>;
  removePhoto: (logId: string, photoId: string) => Promise<void>;

  // Summaries
  getDailySummary: (date: string, projectId?: string) => DailyLogSummary | null;
  getDateRange: () => { earliest: string; latest: string } | null;

  // Refresh
  refresh: () => void;
}

export function useDailyLogs(options: UseDailyLogsOptions = {}): UseDailyLogsReturn {
  const { user, profile } = useAuth();
  const [logs, setLogs] = useState<DailyLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const orgId = profile?.orgId;
  const currentUserId = profile?.uid;
  const currentUserName = profile?.displayName || user?.email || 'Unknown';
  const isManager = profile?.role === 'OWNER' || profile?.role === 'PM';

  // Fetch logs with real-time updates
  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    const constraints: QueryConstraint[] = [];

    // Filter by project
    if (options.projectId) {
      constraints.push(where('projectId', '==', options.projectId));
    }

    // Filter by user
    if (options.userId) {
      constraints.push(where('userId', '==', options.userId));
    }

    // Filter by category
    if (options.category) {
      constraints.push(where('category', '==', options.category));
    }

    // Date range filters
    if (options.startDate) {
      constraints.push(where('date', '>=', options.startDate));
    }
    if (options.endDate) {
      constraints.push(where('date', '<=', options.endDate));
    }

    // Order by date descending, then by creation time
    constraints.push(orderBy('date', 'desc'));
    constraints.push(orderBy('createdAt', 'desc'));

    const q = query(
      collection(db, `organizations/${orgId}/dailyLogs`),
      ...constraints
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let logsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...convertTimestampsDeep(doc.data()),
        })) as DailyLogEntry[];

        // Filter private logs if not a manager and not including private
        if (!isManager && !options.includePrivate) {
          logsData = logsData.filter(log => !log.isPrivate || log.userId === currentUserId);
        }

        setLogs(logsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching daily logs:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId, currentUserId, isManager, options.projectId, options.userId, options.category, options.startDate, options.endDate, options.includePrivate, refreshTrigger]);

  // Create log
  const createLog = useCallback(async (
    logData: Omit<DailyLogEntry, 'id' | 'orgId' | 'userId' | 'userName' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    if (!orgId || !currentUserId) {
      throw new Error('Not authenticated');
    }

    const now = new Date();
    const docRef = await addDoc(
      collection(db, `organizations/${orgId}/dailyLogs`),
      {
        ...logData,
        orgId,
        userId: currentUserId,
        userName: currentUserName,
        photos: logData.photos?.map(p => ({
          ...p,
          uploadedAt: Timestamp.fromDate(new Date(p.uploadedAt)),
        })) || [],
        followUpDate: logData.followUpDate ? Timestamp.fromDate(logData.followUpDate) : null,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      }
    );

    return docRef.id;
  }, [orgId, currentUserId, currentUserName]);

  // Update log
  const updateLog = useCallback(async (logId: string, updates: Partial<DailyLogEntry>): Promise<void> => {
    if (!orgId) throw new Error('Not authenticated');

    const now = new Date();
    const updateData: Record<string, unknown> = {
      ...updates,
      editedBy: currentUserId,
      updatedAt: Timestamp.fromDate(now),
    };

    // Convert dates
    if (updates.followUpDate) {
      updateData.followUpDate = Timestamp.fromDate(updates.followUpDate);
    }

    // Convert photos
    if (updates.photos) {
      updateData.photos = updates.photos.map(p => ({
        ...p,
        uploadedAt: Timestamp.fromDate(new Date(p.uploadedAt)),
      }));
    }

    await updateDoc(doc(db, `organizations/${orgId}/dailyLogs/${logId}`), updateData);
  }, [orgId, currentUserId]);

  // Delete log
  const deleteLog = useCallback(async (logId: string): Promise<void> => {
    if (!orgId) throw new Error('Not authenticated');
    await deleteDoc(doc(db, `organizations/${orgId}/dailyLogs/${logId}`));
  }, [orgId]);

  // Add photo to log
  const addPhoto = useCallback(async (
    logId: string,
    photo: Omit<DailyLogPhoto, 'id' | 'uploadedAt'>
  ): Promise<void> => {
    if (!orgId) throw new Error('Not authenticated');

    const log = logs.find(l => l.id === logId);
    if (!log) throw new Error('Log not found');

    const newPhoto: DailyLogPhoto = {
      ...photo,
      id: `photo_${Date.now()}`,
      uploadedAt: new Date(),
    };

    await updateLog(logId, {
      photos: [...log.photos, newPhoto],
    });
  }, [orgId, logs, updateLog]);

  // Remove photo from log
  const removePhoto = useCallback(async (logId: string, photoId: string): Promise<void> => {
    if (!orgId) throw new Error('Not authenticated');

    const log = logs.find(l => l.id === logId);
    if (!log) throw new Error('Log not found');

    await updateLog(logId, {
      photos: log.photos.filter(p => p.id !== photoId),
    });
  }, [orgId, logs, updateLog]);

  // Get daily summary
  const getDailySummary = useCallback((date: string, projectId?: string): DailyLogSummary | null => {
    const dayLogs = logs.filter(log => {
      if (log.date !== date) return false;
      if (projectId && log.projectId !== projectId) return false;
      return true;
    });

    if (dayLogs.length === 0) return null;

    // Count categories
    const categories: Record<DailyLogCategory, number> = {
      general: 0,
      progress: 0,
      issue: 0,
      safety: 0,
      weather: 0,
      delivery: 0,
      inspection: 0,
      client_interaction: 0,
      subcontractor: 0,
      equipment: 0,
    };

    let crewCount = 0;
    let hoursWorked = 0;
    let issueCount = 0;
    let photoCount = 0;
    let weather: DailyLogSummary['weather'] | undefined;

    for (const log of dayLogs) {
      categories[log.category] = (categories[log.category] || 0) + 1;
      crewCount = Math.max(crewCount, log.crewCount || 0);
      hoursWorked += log.hoursWorked || 0;
      issueCount += log.issues?.length || 0;
      photoCount += log.photos?.length || 0;

      // Use first weather entry found
      if (!weather && log.weather) {
        weather = {
          condition: log.weather.condition,
          temperatureHigh: log.weather.temperatureHigh,
          temperatureLow: log.weather.temperatureLow,
        };
      }
    }

    return {
      date,
      projectId: projectId || dayLogs[0].projectId,
      projectName: dayLogs[0].projectName,
      totalEntries: dayLogs.length,
      categories,
      crewCount,
      hoursWorked,
      issueCount,
      photoCount,
      weather,
    };
  }, [logs]);

  // Get date range of logs
  const getDateRange = useCallback((): { earliest: string; latest: string } | null => {
    if (logs.length === 0) return null;

    const dates = logs.map(l => l.date).sort();
    return {
      earliest: dates[0],
      latest: dates[dates.length - 1],
    };
  }, [logs]);

  // Refresh function
  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return {
    logs,
    loading,
    error,
    createLog,
    updateLog,
    deleteLog,
    addPhoto,
    removePhoto,
    getDailySummary,
    getDateRange,
    refresh,
  };
}

// Hook for project-specific logs
export function useProjectDailyLogs(projectId: string, options: Omit<UseDailyLogsOptions, 'projectId'> = {}) {
  return useDailyLogs({ ...options, projectId });
}

// Hook for today's logs
export function useTodayLogs(projectId?: string) {
  const today = new Date().toISOString().split('T')[0];
  return useDailyLogs({
    projectId,
    startDate: today,
    endDate: today,
  });
}
