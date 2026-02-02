/**
 * Offline Time Entries Service
 * Provides offline-first time entry functionality with sync support
 */

import { TimeEntry, TimeEntryLocation, UserRole } from '@/types';
import { saveOffline, getOfflineData } from './storage';
import { addToQueue, subscribeToQueue } from './sync-queue';
import { checkNetworkStatus } from './network-status';

// Key prefix for offline time entries
const OFFLINE_ENTRIES_KEY = 'offline-time-entries';

/**
 * Offline time entry with local tracking fields
 */
export interface OfflineTimeEntry extends Omit<TimeEntry, 'id'> {
  localId: string;  // UUID generated client-side
  syncStatus: 'pending' | 'synced' | 'conflict';
  serverId?: string; // Firebase ID once synced
  offlineCreatedAt: number; // Timestamp for ordering
}

/**
 * Filters for querying time entries
 */
export interface TimeEntryFilters {
  userId?: string;
  projectId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string[];
}

/**
 * Generate a unique local ID
 */
function generateLocalId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Get the storage key for an org's offline entries
 */
function getEntriesKey(orgId: string): string {
  return `${OFFLINE_ENTRIES_KEY}:${orgId}`;
}

/**
 * Get all offline time entries for an organization
 */
export async function getOfflineTimeEntries(orgId: string): Promise<OfflineTimeEntry[]> {
  const entries = await getOfflineData<OfflineTimeEntry[]>(getEntriesKey(orgId));
  return entries || [];
}

/**
 * Save offline time entries
 */
async function saveOfflineTimeEntries(orgId: string, entries: OfflineTimeEntry[]): Promise<void> {
  await saveOffline(getEntriesKey(orgId), entries);
}

/**
 * Create a new time entry (works offline)
 */
export async function createOfflineTimeEntry(
  orgId: string,
  userId: string,
  userName: string,
  userRole: UserRole,
  entry: Omit<OfflineTimeEntry, 'localId' | 'syncStatus' | 'offlineCreatedAt' | 'orgId' | 'userId' | 'userName' | 'userRole'>
): Promise<string> {
  const localId = generateLocalId();
  const now = Date.now();

  const offlineEntry: OfflineTimeEntry = {
    ...entry,
    localId,
    orgId,
    userId,
    userName,
    userRole,
    syncStatus: 'pending',
    offlineCreatedAt: now,
  };

  // Get existing entries and add new one
  const existingEntries = await getOfflineTimeEntries(orgId);
  existingEntries.unshift(offlineEntry); // Add to beginning (most recent)
  await saveOfflineTimeEntries(orgId, existingEntries);

  // If online, queue for sync immediately
  if (checkNetworkStatus()) {
    await queueEntryForSync(orgId, localId, offlineEntry, 'create');
  }

  return localId;
}

/**
 * Update an offline time entry
 */
export async function updateOfflineTimeEntry(
  orgId: string,
  localId: string,
  updates: Partial<TimeEntry>
): Promise<void> {
  const entries = await getOfflineTimeEntries(orgId);
  const index = entries.findIndex((e) => e.localId === localId);

  if (index === -1) {
    throw new Error('Entry not found');
  }

  // Update the entry
  entries[index] = {
    ...entries[index],
    ...updates,
    syncStatus: 'pending', // Mark as needing sync
  };

  await saveOfflineTimeEntries(orgId, entries);

  // Queue for sync if online
  if (checkNetworkStatus()) {
    await queueEntryForSync(orgId, localId, entries[index], 'update');
  }
}

/**
 * Delete an offline time entry
 */
export async function deleteOfflineTimeEntry(orgId: string, localId: string): Promise<void> {
  const entries = await getOfflineTimeEntries(orgId);
  const entry = entries.find((e) => e.localId === localId);

  if (!entry) {
    throw new Error('Entry not found');
  }

  // If already synced, we need to delete from server too
  if (entry.serverId) {
    if (checkNetworkStatus()) {
      await queueEntryForSync(orgId, localId, entry, 'delete');
    } else {
      // Mark for deletion when back online
      entry.syncStatus = 'pending';
      await saveOfflineTimeEntries(orgId, entries);
      return;
    }
  }

  // Remove from local storage
  const updatedEntries = entries.filter((e) => e.localId !== localId);
  await saveOfflineTimeEntries(orgId, updatedEntries);
}

/**
 * Get merged time entries (offline + synced)
 */
export async function getMergedTimeEntries(
  orgId: string,
  syncedEntries: TimeEntry[],
  filters?: TimeEntryFilters
): Promise<(TimeEntry & { syncStatus?: 'pending' | 'synced' | 'conflict' })[]> {
  const offlineEntries = await getOfflineTimeEntries(orgId);

  // Convert offline entries to TimeEntry format
  const offlineAsTimeEntries = offlineEntries
    .filter((e) => e.syncStatus === 'pending')
    .map((e) => ({
      ...e,
      id: e.localId, // Use localId as id for display
    }));

  // Merge: offline pending entries first, then synced entries
  const merged = [
    ...offlineAsTimeEntries,
    ...syncedEntries.map((e) => ({ ...e, syncStatus: 'synced' as const })),
  ];

  // Apply filters
  let filtered = merged;

  if (filters?.userId) {
    filtered = filtered.filter((e) => e.userId === filters.userId);
  }

  if (filters?.projectId) {
    filtered = filtered.filter((e) => e.projectId === filters.projectId);
  }

  if (filters?.startDate) {
    filtered = filtered.filter((e) => new Date(e.clockIn) >= filters.startDate!);
  }

  if (filters?.endDate) {
    filtered = filtered.filter((e) => new Date(e.clockIn) <= filters.endDate!);
  }

  if (filters?.status && filters.status.length > 0) {
    filtered = filtered.filter((e) => filters.status!.includes(e.status));
  }

  // Sort by clockIn, most recent first
  filtered.sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime());

  return filtered;
}

/**
 * Queue an entry for sync
 */
async function queueEntryForSync(
  orgId: string,
  localId: string,
  entry: OfflineTimeEntry,
  operation: 'create' | 'update' | 'delete'
): Promise<void> {
  const collection = `organizations/${orgId}/timeEntries`;
  const documentId = entry.serverId || localId;

  // Convert entry to plain object for sync
  const data: Record<string, unknown> = {
    ...entry,
    clockIn: entry.clockIn instanceof Date ? entry.clockIn.toISOString() : entry.clockIn,
    clockOut: entry.clockOut instanceof Date ? entry.clockOut.toISOString() : entry.clockOut,
    createdAt: entry.createdAt instanceof Date ? entry.createdAt.toISOString() : entry.createdAt,
  };

  // Remove offline-specific fields
  delete data.localId;
  delete data.syncStatus;
  delete data.offlineCreatedAt;
  delete data.serverId;

  await addToQueue(operation, collection, documentId, data);
}

/**
 * Get the number of pending offline entries
 */
export async function getPendingOfflineEntriesCount(orgId: string): Promise<number> {
  const entries = await getOfflineTimeEntries(orgId);
  return entries.filter((e) => e.syncStatus === 'pending').length;
}

/**
 * Mark an entry as synced
 */
export async function markEntrySynced(
  orgId: string,
  localId: string,
  serverId: string
): Promise<void> {
  const entries = await getOfflineTimeEntries(orgId);
  const index = entries.findIndex((e) => e.localId === localId);

  if (index !== -1) {
    entries[index].syncStatus = 'synced';
    entries[index].serverId = serverId;
    await saveOfflineTimeEntries(orgId, entries);
  }
}

/**
 * Get or create active time entry (for clock in/out)
 */
export async function getActiveOfflineEntry(orgId: string, userId: string): Promise<OfflineTimeEntry | null> {
  const entries = await getOfflineTimeEntries(orgId);
  return entries.find(
    (e) => e.userId === userId && (e.status === 'active' || e.status === 'paused')
  ) || null;
}

/**
 * Clock in offline
 */
export async function clockInOffline(
  orgId: string,
  userId: string,
  userName: string,
  userRole: UserRole,
  options?: {
    projectId?: string;
    projectName?: string;
    taskId?: string;
    taskName?: string;
    notes?: string;
    location?: TimeEntryLocation;
    hourlyRate?: number;
  }
): Promise<string> {
  // Check if already clocked in
  const activeEntry = await getActiveOfflineEntry(orgId, userId);
  if (activeEntry) {
    throw new Error('Already clocked in. Please clock out first.');
  }

  const now = new Date();

  return createOfflineTimeEntry(orgId, userId, userName, userRole, {
    projectId: options?.projectId,
    projectName: options?.projectName,
    taskId: options?.taskId,
    taskName: options?.taskName,
    notes: options?.notes,
    clockInLocation: options?.location,
    hourlyRate: options?.hourlyRate,
    type: 'clock',
    status: 'active',
    clockIn: now,
    breaks: [],
    createdAt: now,
  });
}

/**
 * Clock out offline
 */
export async function clockOutOffline(
  orgId: string,
  localId: string,
  options?: {
    notes?: string;
    location?: TimeEntryLocation;
  }
): Promise<void> {
  const entries = await getOfflineTimeEntries(orgId);
  const entry = entries.find((e) => e.localId === localId);

  if (!entry) {
    throw new Error('Entry not found');
  }

  const now = new Date();
  const clockIn = new Date(entry.clockIn);
  const totalMinutes = Math.round((now.getTime() - clockIn.getTime()) / 60000);

  // Calculate break minutes
  const totalBreakMinutes = entry.breaks.reduce((sum, b) => {
    if (b.endTime) {
      return sum + Math.round((new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 60000);
    }
    return sum;
  }, 0);

  await updateOfflineTimeEntry(orgId, localId, {
    clockOut: now,
    clockOutLocation: options?.location,
    notes: options?.notes || entry.notes,
    status: 'completed',
    totalMinutes: totalMinutes - totalBreakMinutes,
    totalBreakMinutes,
  });
}

/**
 * Create a manual time entry offline
 */
export async function createManualEntryOffline(
  orgId: string,
  userId: string,
  userName: string,
  userRole: UserRole,
  entry: {
    projectId?: string;
    projectName?: string;
    taskId?: string;
    taskName?: string;
    notes?: string;
    clockIn: Date;
    clockOut: Date;
    hourlyRate?: number;
  }
): Promise<string> {
  const totalMinutes = Math.round(
    (entry.clockOut.getTime() - entry.clockIn.getTime()) / 60000
  );

  return createOfflineTimeEntry(orgId, userId, userName, userRole, {
    projectId: entry.projectId,
    projectName: entry.projectName,
    taskId: entry.taskId,
    taskName: entry.taskName,
    notes: entry.notes,
    clockIn: entry.clockIn,
    clockOut: entry.clockOut,
    hourlyRate: entry.hourlyRate,
    type: 'manual',
    status: 'completed',
    totalMinutes,
    breaks: [],
    createdAt: new Date(),
  });
}

/**
 * Offline Time Entry Service class for encapsulated usage
 */
export class OfflineTimeEntryService {
  private orgId: string;
  private userId: string;
  private userName: string;
  private userRole: UserRole;
  private hourlyRate?: number;

  constructor(
    orgId: string,
    userId: string,
    userName: string,
    userRole: UserRole,
    hourlyRate?: number
  ) {
    this.orgId = orgId;
    this.userId = userId;
    this.userName = userName;
    this.userRole = userRole;
    this.hourlyRate = hourlyRate;
  }

  async createTimeEntry(
    entry: Omit<OfflineTimeEntry, 'localId' | 'syncStatus' | 'offlineCreatedAt' | 'orgId' | 'userId' | 'userName' | 'userRole'>
  ): Promise<string> {
    return createOfflineTimeEntry(
      this.orgId,
      this.userId,
      this.userName,
      this.userRole,
      entry
    );
  }

  async updateTimeEntry(localId: string, updates: Partial<TimeEntry>): Promise<void> {
    return updateOfflineTimeEntry(this.orgId, localId, updates);
  }

  async deleteTimeEntry(localId: string): Promise<void> {
    return deleteOfflineTimeEntry(this.orgId, localId);
  }

  async getTimeEntries(_filters?: TimeEntryFilters): Promise<OfflineTimeEntry[]> {
    // TODO: Implement filter support for offline entries
    return getOfflineTimeEntries(this.orgId);
  }

  async getMergedEntries(
    syncedEntries: TimeEntry[],
    filters?: TimeEntryFilters
  ): Promise<(TimeEntry & { syncStatus?: 'pending' | 'synced' | 'conflict' })[]> {
    return getMergedTimeEntries(this.orgId, syncedEntries, filters);
  }

  async getPendingCount(): Promise<number> {
    return getPendingOfflineEntriesCount(this.orgId);
  }

  async getActiveEntry(): Promise<OfflineTimeEntry | null> {
    return getActiveOfflineEntry(this.orgId, this.userId);
  }

  async clockIn(options?: {
    projectId?: string;
    projectName?: string;
    taskId?: string;
    taskName?: string;
    notes?: string;
    location?: TimeEntryLocation;
  }): Promise<string> {
    return clockInOffline(
      this.orgId,
      this.userId,
      this.userName,
      this.userRole,
      { ...options, hourlyRate: this.hourlyRate }
    );
  }

  async clockOut(localId: string, options?: {
    notes?: string;
    location?: TimeEntryLocation;
  }): Promise<void> {
    return clockOutOffline(this.orgId, localId, options);
  }

  async createManualEntry(entry: {
    projectId?: string;
    projectName?: string;
    taskId?: string;
    taskName?: string;
    notes?: string;
    clockIn: Date;
    clockOut: Date;
  }): Promise<string> {
    return createManualEntryOffline(
      this.orgId,
      this.userId,
      this.userName,
      this.userRole,
      { ...entry, hourlyRate: this.hourlyRate }
    );
  }

  subscribeToPendingCount(callback: (count: number) => void): () => void {
    return subscribeToQueue(callback);
  }
}
