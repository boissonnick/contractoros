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
import { toast } from '@/components/ui/Toast';
import {
  TimeEntry,
  TimeEntryStatus,
  TimeEntryBreak,
  TimeEntryLocation,
  TimeEntryEdit,
  DailyTimeSummary,
  WeeklyTimeSummary,
  BreakType,
} from '@/types';

interface UseTimeEntriesOptions {
  userId?: string;
  projectId?: string;
  status?: TimeEntryStatus | TimeEntryStatus[];
  startDate?: Date;
  endDate?: Date;
  includeAllUsers?: boolean;
}

interface UseTimeEntriesReturn {
  entries: TimeEntry[];
  activeEntry: TimeEntry | null;
  loading: boolean;
  error: string | null;

  // Clock operations
  clockIn: (options?: {
    projectId?: string;
    projectName?: string;
    taskId?: string;
    taskName?: string;
    notes?: string;
    location?: TimeEntryLocation;
  }) => Promise<string>;
  clockOut: (entryId: string, options?: {
    notes?: string;
    location?: TimeEntryLocation;
  }) => Promise<void>;

  // Break operations
  startBreak: (entryId: string, type: BreakType, isPaid?: boolean) => Promise<void>;
  endBreak: (entryId: string, breakId: string) => Promise<void>;

  // Manual entry operations
  createManualEntry: (entry: Omit<TimeEntry, 'id' | 'orgId' | 'userId' | 'userName' | 'userRole' | 'type' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateEntry: (entryId: string, updates: Partial<TimeEntry>, reason?: string) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;

  // Approval workflow
  submitForApproval: (entryId: string) => Promise<void>;
  approveEntry: (entryId: string) => Promise<void>;
  rejectEntry: (entryId: string, reason: string) => Promise<void>;

  // Summaries
  getDailySummary: (date: Date, userId?: string) => DailyTimeSummary | null;
  getWeeklySummary: (weekStart: Date, userId?: string) => WeeklyTimeSummary | null;

  // Refresh
  refresh: () => void;
}

// Calculate total minutes from entry
function calculateTotalMinutes(clockIn: Date, clockOut: Date, breaks: TimeEntryBreak[]): number {
  const totalMs = clockOut.getTime() - clockIn.getTime();
  const totalMinutes = Math.round(totalMs / 60000);

  // Subtract unpaid breaks
  const unpaidBreakMinutes = breaks
    .filter(b => !b.isPaid && b.endTime)
    .reduce((sum, b) => {
      const breakMs = new Date(b.endTime!).getTime() - new Date(b.startTime).getTime();
      return sum + Math.round(breakMs / 60000);
    }, 0);

  return Math.max(0, totalMinutes - unpaidBreakMinutes);
}

export function useTimeEntries(options: UseTimeEntriesOptions = {}): UseTimeEntriesReturn {
  const { user, profile } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const orgId = profile?.orgId;
  const currentUserId = profile?.uid;
  const currentUserName = profile?.displayName || user?.email || 'Unknown';
  const currentUserRole = profile?.role || 'EMPLOYEE';

  // Fetch entries with real-time updates
  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    const constraints: QueryConstraint[] = [];

    // Filter by user or all users
    if (!options.includeAllUsers && (options.userId || currentUserId)) {
      constraints.push(where('userId', '==', options.userId || currentUserId));
    }

    // Filter by project
    if (options.projectId) {
      constraints.push(where('projectId', '==', options.projectId));
    }

    // Filter by status
    if (options.status) {
      if (Array.isArray(options.status)) {
        constraints.push(where('status', 'in', options.status));
      } else {
        constraints.push(where('status', '==', options.status));
      }
    }

    // Date range filters
    if (options.startDate) {
      constraints.push(where('clockIn', '>=', Timestamp.fromDate(options.startDate)));
    }
    if (options.endDate) {
      constraints.push(where('clockIn', '<=', Timestamp.fromDate(options.endDate)));
    }

    // Order by clock in time
    constraints.push(orderBy('clockIn', 'desc'));

    const q = query(
      collection(db, `organizations/${orgId}/timeEntries`),
      ...constraints
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const entriesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...convertTimestampsDeep(doc.data()),
        })) as TimeEntry[];
        setEntries(entriesData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching time entries:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId, currentUserId, options.userId, options.projectId, options.status, options.startDate, options.endDate, options.includeAllUsers, refreshTrigger]);

  // Get active entry (currently clocked in)
  const activeEntry = entries.find(e => e.status === 'active' || e.status === 'paused') || null;

  // Clock in
  const clockIn = useCallback(async (clockInOptions?: {
    projectId?: string;
    projectName?: string;
    taskId?: string;
    taskName?: string;
    notes?: string;
    location?: TimeEntryLocation;
  }): Promise<string> => {
    if (!orgId || !currentUserId) {
      throw new Error('Not authenticated');
    }

    // Check if already clocked in
    if (activeEntry) {
      throw new Error('Already clocked in. Please clock out first.');
    }

    const now = new Date();

    // Build entry data, only including defined values (Firestore doesn't allow undefined)
    const entryData: Record<string, unknown> = {
      orgId,
      userId: currentUserId,
      userName: currentUserName,
      userRole: currentUserRole,
      type: 'clock',
      status: 'active',
      clockIn: Timestamp.fromDate(now),
      breaks: [],
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };

    // Only add optional fields if they have values
    if (clockInOptions?.projectId) entryData.projectId = clockInOptions.projectId;
    if (clockInOptions?.projectName) entryData.projectName = clockInOptions.projectName;
    if (clockInOptions?.taskId) entryData.taskId = clockInOptions.taskId;
    if (clockInOptions?.taskName) entryData.taskName = clockInOptions.taskName;
    if (clockInOptions?.notes) entryData.notes = clockInOptions.notes;
    if (profile?.hourlyRate) entryData.hourlyRate = profile.hourlyRate;
    if (clockInOptions?.location) {
      entryData.clockInLocation = {
        ...clockInOptions.location,
        timestamp: Timestamp.fromDate(clockInOptions.location.timestamp),
      };
    }

    try {
      const docRef = await addDoc(
        collection(db, `organizations/${orgId}/timeEntries`),
        entryData
      );
      toast.success('Clocked in successfully');
      return docRef.id;
    } catch (err) {
      console.error('Clock in error:', err);
      toast.error('Failed to clock in', 'Please try again');
      throw err;
    }
  }, [orgId, currentUserId, currentUserName, currentUserRole, profile?.hourlyRate, activeEntry]);

  // Clock out
  const clockOut = useCallback(async (entryId: string, clockOutOptions?: {
    notes?: string;
    location?: TimeEntryLocation;
  }): Promise<void> => {
    if (!orgId) throw new Error('Not authenticated');

    const entry = entries.find(e => e.id === entryId);
    if (!entry) throw new Error('Entry not found');

    const now = new Date();
    const totalMinutes = calculateTotalMinutes(entry.clockIn, now, entry.breaks);

    // Check for active breaks and end them
    const updatedBreaks = entry.breaks.map(b => {
      if (!b.endTime) {
        const breakDuration = Math.round((now.getTime() - new Date(b.startTime).getTime()) / 60000);
        return { ...b, endTime: now, duration: breakDuration };
      }
      return b;
    });

    const totalBreakMinutes = updatedBreaks.reduce((sum, b) => sum + (b.duration || 0), 0);

    try {
      await updateDoc(doc(db, `organizations/${orgId}/timeEntries/${entryId}`), {
        clockOut: Timestamp.fromDate(now),
        status: 'completed',
        totalMinutes,
        totalBreakMinutes,
        breaks: updatedBreaks.map(b => ({
          ...b,
          startTime: Timestamp.fromDate(new Date(b.startTime)),
          endTime: b.endTime ? Timestamp.fromDate(new Date(b.endTime)) : null,
        })),
        notes: clockOutOptions?.notes || entry.notes,
        clockOutLocation: clockOutOptions?.location ? {
          ...clockOutOptions.location,
          timestamp: Timestamp.fromDate(clockOutOptions.location.timestamp),
        } : undefined,
        updatedAt: Timestamp.fromDate(now),
      });
      toast.success('Clocked out successfully');
    } catch (err) {
      console.error('Clock out error:', err);
      toast.error('Failed to clock out', 'Please try again');
      throw err;
    }
  }, [orgId, entries]);

  // Start break
  const startBreak = useCallback(async (entryId: string, type: BreakType, isPaid = false): Promise<void> => {
    if (!orgId) throw new Error('Not authenticated');

    const entry = entries.find(e => e.id === entryId);
    if (!entry) throw new Error('Entry not found');
    if (entry.status !== 'active') throw new Error('Can only take breaks when clocked in');

    const now = new Date();
    const newBreak: TimeEntryBreak = {
      id: `break_${Date.now()}`,
      type,
      startTime: now,
      isPaid,
    };

    try {
      await updateDoc(doc(db, `organizations/${orgId}/timeEntries/${entryId}`), {
        status: 'paused',
        breaks: [...entry.breaks, {
          ...newBreak,
          startTime: Timestamp.fromDate(now),
        }],
        updatedAt: Timestamp.fromDate(now),
      });
      toast.success('Break started');
    } catch (err) {
      console.error('Start break error:', err);
      toast.error('Failed to start break');
      throw err;
    }
  }, [orgId, entries]);

  // End break
  const endBreak = useCallback(async (entryId: string, breakId: string): Promise<void> => {
    if (!orgId) throw new Error('Not authenticated');

    const entry = entries.find(e => e.id === entryId);
    if (!entry) throw new Error('Entry not found');

    const now = new Date();
    const updatedBreaks = entry.breaks.map(b => {
      if (b.id === breakId && !b.endTime) {
        const duration = Math.round((now.getTime() - new Date(b.startTime).getTime()) / 60000);
        return { ...b, endTime: now, duration };
      }
      return b;
    });

    try {
      await updateDoc(doc(db, `organizations/${orgId}/timeEntries/${entryId}`), {
        status: 'active',
        breaks: updatedBreaks.map(b => ({
          ...b,
          startTime: Timestamp.fromDate(new Date(b.startTime)),
          endTime: b.endTime ? Timestamp.fromDate(new Date(b.endTime)) : null,
        })),
        updatedAt: Timestamp.fromDate(now),
      });
      toast.success('Break ended');
    } catch (err) {
      console.error('End break error:', err);
      toast.error('Failed to end break');
      throw err;
    }
  }, [orgId, entries]);

  // Create manual entry
  const createManualEntry = useCallback(async (entryData: Omit<TimeEntry, 'id' | 'orgId' | 'userId' | 'userName' | 'userRole' | 'type' | 'status' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    if (!orgId || !currentUserId) throw new Error('Not authenticated');

    const now = new Date();
    const totalMinutes = entryData.clockOut
      ? calculateTotalMinutes(entryData.clockIn, entryData.clockOut, entryData.breaks || [])
      : 0;

    try {
      const docRef = await addDoc(
        collection(db, `organizations/${orgId}/timeEntries`),
        {
          ...entryData,
          orgId,
          userId: currentUserId,
          userName: currentUserName,
          userRole: currentUserRole,
          type: 'manual',
          status: 'completed',
          totalMinutes,
          clockIn: Timestamp.fromDate(entryData.clockIn),
          clockOut: entryData.clockOut ? Timestamp.fromDate(entryData.clockOut) : null,
          breaks: (entryData.breaks || []).map(b => ({
            ...b,
            startTime: Timestamp.fromDate(new Date(b.startTime)),
            endTime: b.endTime ? Timestamp.fromDate(new Date(b.endTime)) : null,
          })),
          createdAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now),
        }
      );
      toast.success('Time entry created');
      return docRef.id;
    } catch (err) {
      console.error('Create manual entry error:', err);
      toast.error('Failed to create time entry');
      throw err;
    }
  }, [orgId, currentUserId, currentUserName, currentUserRole]);

  // Update entry
  const updateEntry = useCallback(async (entryId: string, updates: Partial<TimeEntry>, reason?: string): Promise<void> => {
    if (!orgId || !currentUserId) throw new Error('Not authenticated');

    const entry = entries.find(e => e.id === entryId);
    if (!entry) throw new Error('Entry not found');

    const now = new Date();
    const editHistory: TimeEntryEdit[] = [...(entry.editHistory || [])];

    // Track changes
    for (const [key, value] of Object.entries(updates)) {
      if (entry[key as keyof TimeEntry] !== value) {
        editHistory.push({
          editedAt: now,
          editedBy: currentUserId,
          editedByName: currentUserName,
          field: key,
          oldValue: String(entry[key as keyof TimeEntry]),
          newValue: String(value),
          reason,
        });
      }
    }

    // Recalculate total if times changed
    let totalMinutes = entry.totalMinutes;
    if (updates.clockIn || updates.clockOut) {
      const clockIn = updates.clockIn || entry.clockIn;
      const clockOut = updates.clockOut || entry.clockOut;
      if (clockOut) {
        totalMinutes = calculateTotalMinutes(clockIn, clockOut, entry.breaks);
      }
    }

    const updateData: Record<string, unknown> = {
      ...updates,
      totalMinutes,
      editHistory: editHistory.map(e => ({
        ...e,
        editedAt: Timestamp.fromDate(e.editedAt),
      })),
      editedBy: currentUserId,
      updatedAt: Timestamp.fromDate(now),
    };

    if (updates.clockIn) updateData.clockIn = Timestamp.fromDate(updates.clockIn);
    if (updates.clockOut) updateData.clockOut = Timestamp.fromDate(updates.clockOut);

    try {
      await updateDoc(doc(db, `organizations/${orgId}/timeEntries/${entryId}`), updateData);
      toast.success('Time entry updated');
    } catch (err) {
      console.error('Update entry error:', err);
      toast.error('Failed to update time entry');
      throw err;
    }
  }, [orgId, currentUserId, currentUserName, entries]);

  // Delete entry
  const deleteEntry = useCallback(async (entryId: string): Promise<void> => {
    if (!orgId) throw new Error('Not authenticated');
    try {
      await deleteDoc(doc(db, `organizations/${orgId}/timeEntries/${entryId}`));
      toast.success('Time entry deleted');
    } catch (err) {
      console.error('Delete entry error:', err);
      toast.error('Failed to delete time entry');
      throw err;
    }
  }, [orgId]);

  // Submit for approval
  const submitForApproval = useCallback(async (entryId: string): Promise<void> => {
    if (!orgId) throw new Error('Not authenticated');

    const now = new Date();
    try {
      await updateDoc(doc(db, `organizations/${orgId}/timeEntries/${entryId}`), {
        status: 'pending_approval',
        submittedAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      });
      toast.success('Time entry submitted for approval');
    } catch (err) {
      console.error('Submit for approval error:', err);
      toast.error('Failed to submit for approval');
      throw err;
    }
  }, [orgId]);

  // Approve entry
  const approveEntry = useCallback(async (entryId: string): Promise<void> => {
    if (!orgId || !currentUserId) throw new Error('Not authenticated');

    const now = new Date();
    try {
      await updateDoc(doc(db, `organizations/${orgId}/timeEntries/${entryId}`), {
        status: 'approved',
        approvedBy: currentUserId,
        approvedByName: currentUserName,
        approvedAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      });
      toast.success('Time entry approved');
    } catch (err) {
      console.error('Approve entry error:', err);
      toast.error('Failed to approve time entry');
      throw err;
    }
  }, [orgId, currentUserId, currentUserName]);

  // Reject entry
  const rejectEntry = useCallback(async (entryId: string, reason: string): Promise<void> => {
    if (!orgId || !currentUserId) throw new Error('Not authenticated');

    const now = new Date();
    try {
      await updateDoc(doc(db, `organizations/${orgId}/timeEntries/${entryId}`), {
        status: 'rejected',
        rejectedBy: currentUserId,
        rejectedByName: currentUserName,
        rejectedAt: Timestamp.fromDate(now),
        rejectionReason: reason,
        updatedAt: Timestamp.fromDate(now),
      });
      toast.success('Time entry rejected');
    } catch (err) {
      console.error('Reject entry error:', err);
      toast.error('Failed to reject time entry');
      throw err;
    }
  }, [orgId, currentUserId, currentUserName]);

  // Get daily summary
  const getDailySummary = useCallback((date: Date, userId?: string): DailyTimeSummary | null => {
    const targetUserId = userId || currentUserId;
    if (!targetUserId) return null;

    const dateStr = date.toISOString().split('T')[0];
    const dayEntries = entries.filter(e => {
      const entryDate = new Date(e.clockIn).toISOString().split('T')[0];
      return entryDate === dateStr && e.userId === targetUserId;
    });

    if (dayEntries.length === 0) return null;

    const totalMinutes = dayEntries.reduce((sum, e) => sum + (e.totalMinutes || 0), 0);
    const breakMinutes = dayEntries.reduce((sum, e) => sum + (e.totalBreakMinutes || 0), 0);
    const overtimeMinutes = Math.max(0, totalMinutes - 480); // 8 hours = 480 minutes

    // Group by project
    const projectMap = new Map<string, { projectId: string; projectName: string; minutes: number }>();
    for (const entry of dayEntries) {
      if (entry.projectId) {
        const existing = projectMap.get(entry.projectId);
        if (existing) {
          existing.minutes += entry.totalMinutes || 0;
        } else {
          projectMap.set(entry.projectId, {
            projectId: entry.projectId,
            projectName: entry.projectName || 'Unknown Project',
            minutes: entry.totalMinutes || 0,
          });
        }
      }
    }

    return {
      date: dateStr,
      userId: targetUserId,
      userName: dayEntries[0]?.userName || 'Unknown',
      totalHours: totalMinutes / 60,
      regularHours: Math.min(totalMinutes, 480) / 60,
      overtimeHours: overtimeMinutes / 60,
      breakHours: breakMinutes / 60,
      entries: dayEntries,
      projectBreakdown: Array.from(projectMap.values()).map(p => ({
        projectId: p.projectId,
        projectName: p.projectName,
        hours: p.minutes / 60,
      })),
    };
  }, [entries, currentUserId]);

  // Get weekly summary
  const getWeeklySummary = useCallback((weekStart: Date, userId?: string): WeeklyTimeSummary | null => {
    const targetUserId = userId || currentUserId;
    if (!targetUserId) return null;

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const dailySummaries: DailyTimeSummary[] = [];
    let totalMinutes = 0;
    let breakMinutes = 0;
    const projectMap = new Map<string, { projectId: string; projectName: string; minutes: number }>();

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dailySummary = getDailySummary(date, targetUserId);
      if (dailySummary) {
        dailySummaries.push(dailySummary);
        totalMinutes += dailySummary.totalHours * 60;
        breakMinutes += dailySummary.breakHours * 60;

        for (const proj of dailySummary.projectBreakdown) {
          const existing = projectMap.get(proj.projectId);
          if (existing) {
            existing.minutes += proj.hours * 60;
          } else {
            projectMap.set(proj.projectId, {
              projectId: proj.projectId,
              projectName: proj.projectName,
              minutes: proj.hours * 60,
            });
          }
        }
      }
    }

    if (dailySummaries.length === 0) return null;

    const overtimeMinutes = Math.max(0, totalMinutes - 2400); // 40 hours = 2400 minutes

    return {
      userId: targetUserId,
      userName: dailySummaries[0]?.userName || 'Unknown',
      weekStart,
      weekEnd,
      totalHours: totalMinutes / 60,
      regularHours: Math.min(totalMinutes, 2400) / 60,
      overtimeHours: overtimeMinutes / 60,
      breakHours: breakMinutes / 60,
      dailySummaries,
      projectBreakdown: Array.from(projectMap.values()).map(p => ({
        projectId: p.projectId,
        projectName: p.projectName,
        hours: p.minutes / 60,
      })),
    };
  }, [getDailySummary, currentUserId]);

  // Refresh function
  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return {
    entries,
    activeEntry,
    loading,
    error,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    createManualEntry,
    updateEntry,
    deleteEntry,
    submitForApproval,
    approveEntry,
    rejectEntry,
    getDailySummary,
    getWeeklySummary,
    refresh,
  };
}

// Hook for getting current user's active time entry
export function useActiveTimeEntry() {
  const { entries, activeEntry, loading, clockIn, clockOut, startBreak, endBreak } = useTimeEntries({
    status: ['active', 'paused'],
  });

  return {
    activeEntry,
    isClockingLoading: loading,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
  };
}

// Hook for managers to view team time entries
export function useTeamTimeEntries(options: {
  startDate?: Date;
  endDate?: Date;
  status?: TimeEntryStatus | TimeEntryStatus[];
} = {}) {
  return useTimeEntries({
    ...options,
    includeAllUsers: true,
  });
}
