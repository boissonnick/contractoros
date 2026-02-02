/**
 * Offline Daily Logs Service
 * Manages daily log creation and updates when offline
 */

import { saveOffline, getOfflineData, deleteOfflineData } from './storage';
import { addToQueue, getQueueLength, subscribeToQueue } from './sync-queue';
import { checkNetworkStatus } from './network-status';
import { DailyLogCategory, WeatherCondition } from '@/types';

// Offline daily log with sync tracking
export interface OfflineDailyLog {
  localId: string;
  serverId?: string; // Set after sync
  projectId: string;
  projectName: string;
  orgId: string;
  userId: string;
  userName: string;
  date: string; // ISO date YYYY-MM-DD

  // Content
  category: DailyLogCategory;
  title: string;
  description: string;

  // Weather
  weather?: {
    condition: WeatherCondition;
    tempHigh?: number;
    tempLow?: number;
    notes?: string;
  };

  // Work details
  workPerformed: string[];
  workersOnSite: string[]; // User IDs
  crewCount: number;
  hoursWorked: number;

  // Issues
  delays?: string;
  issues?: string;
  notes?: string;

  // Sync tracking
  syncStatus: 'pending' | 'synced' | 'conflict';
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'offline-daily-logs';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Generate unique local ID
 */
function generateLocalId(): string {
  return `local_log_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Get all offline daily logs from storage
 */
async function getAllLogs(): Promise<OfflineDailyLog[]> {
  const data = await getOfflineData<OfflineDailyLog[]>(STORAGE_KEY);
  return data || [];
}

/**
 * Save all logs to storage
 */
async function saveLogs(logs: OfflineDailyLog[]): Promise<void> {
  await saveOffline(STORAGE_KEY, logs, CACHE_TTL);
}

/**
 * Offline Daily Log Service Class
 */
export class OfflineDailyLogService {
  private pendingCount = 0;
  private listeners: Set<(count: number) => void> = new Set();

  constructor() {
    // Subscribe to sync queue changes
    if (typeof window !== 'undefined') {
      subscribeToQueue((count) => {
        this.updatePendingCount();
      });
      this.updatePendingCount();
    }
  }

  /**
   * Create a new daily log (works offline)
   */
  async createDailyLog(
    log: Omit<OfflineDailyLog, 'localId' | 'syncStatus' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const localId = generateLocalId();
    const now = Date.now();

    const offlineLog: OfflineDailyLog = {
      ...log,
      localId,
      syncStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    // Save to local storage
    const logs = await getAllLogs();
    logs.push(offlineLog);
    await saveLogs(logs);

    // If online, queue for sync immediately
    if (checkNetworkStatus()) {
      await this.queueForSync(offlineLog);
    }

    this.updatePendingCount();
    return localId;
  }

  /**
   * Update an existing daily log
   */
  async updateDailyLog(localId: string, updates: Partial<OfflineDailyLog>): Promise<void> {
    const logs = await getAllLogs();
    const index = logs.findIndex((l) => l.localId === localId);

    if (index === -1) {
      throw new Error('Daily log not found');
    }

    const updatedLog: OfflineDailyLog = {
      ...logs[index],
      ...updates,
      updatedAt: Date.now(),
      syncStatus: logs[index].serverId ? 'pending' : logs[index].syncStatus,
    };

    logs[index] = updatedLog;
    await saveLogs(logs);

    // Queue update for sync if online
    if (checkNetworkStatus() && updatedLog.serverId) {
      await addToQueue('update', 'dailyLogs', updatedLog.serverId, {
        ...this.toFirestoreFormat(updatedLog),
      });
    }

    this.updatePendingCount();
  }

  /**
   * Get all daily logs (merges offline with optional server data)
   */
  async getDailyLogs(orgId: string, projectId?: string): Promise<OfflineDailyLog[]> {
    const logs = await getAllLogs();

    return logs.filter((log) => {
      if (log.orgId !== orgId) return false;
      if (projectId && log.projectId !== projectId) return false;
      return true;
    }).sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get today's log for a project
   */
  async getTodaysLog(projectId: string): Promise<OfflineDailyLog | null> {
    const today = new Date().toISOString().split('T')[0];
    const logs = await getAllLogs();

    return logs.find(
      (log) => log.projectId === projectId && log.date === today
    ) || null;
  }

  /**
   * Get a specific log by local ID
   */
  async getLog(localId: string): Promise<OfflineDailyLog | null> {
    const logs = await getAllLogs();
    return logs.find((l) => l.localId === localId) || null;
  }

  /**
   * Delete a daily log
   */
  async deleteDailyLog(localId: string): Promise<void> {
    const logs = await getAllLogs();
    const log = logs.find((l) => l.localId === localId);

    if (!log) return;

    // If synced, queue delete operation
    if (log.serverId && checkNetworkStatus()) {
      await addToQueue('delete', 'dailyLogs', log.serverId, {});
    }

    const filtered = logs.filter((l) => l.localId !== localId);
    await saveLogs(filtered);
    this.updatePendingCount();
  }

  /**
   * Get count of pending (unsynced) logs
   */
  getPendingCount(): number {
    return this.pendingCount;
  }

  /**
   * Get all pending logs
   */
  async getPendingLogs(): Promise<OfflineDailyLog[]> {
    const logs = await getAllLogs();
    return logs.filter((l) => l.syncStatus === 'pending');
  }

  /**
   * Mark a log as synced
   */
  async markAsSynced(localId: string, serverId: string): Promise<void> {
    const logs = await getAllLogs();
    const index = logs.findIndex((l) => l.localId === localId);

    if (index !== -1) {
      logs[index].serverId = serverId;
      logs[index].syncStatus = 'synced';
      await saveLogs(logs);
      this.updatePendingCount();
    }
  }

  /**
   * Subscribe to pending count changes
   */
  subscribeToPendingCount(listener: (count: number) => void): () => void {
    this.listeners.add(listener);
    listener(this.pendingCount);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Cache server logs for offline access
   */
  async cacheServerLogs(logs: OfflineDailyLog[]): Promise<void> {
    const existingLogs = await getAllLogs();
    const localPending = existingLogs.filter((l) => l.syncStatus === 'pending');

    // Merge: keep local pending, add/update server logs
    const serverLogsWithStatus = logs.map((l) => ({
      ...l,
      syncStatus: 'synced' as const,
    }));

    const merged = [...localPending];
    for (const serverLog of serverLogsWithStatus) {
      const existingIndex = merged.findIndex(
        (l) => l.serverId === serverLog.serverId || l.localId === serverLog.localId
      );
      if (existingIndex === -1) {
        merged.push(serverLog);
      }
    }

    await saveLogs(merged);
  }

  /**
   * Queue a log for sync
   */
  private async queueForSync(log: OfflineDailyLog): Promise<void> {
    await addToQueue('create', 'dailyLogs', log.localId, {
      ...this.toFirestoreFormat(log),
      _localId: log.localId,
    });
  }

  /**
   * Convert to Firestore format
   */
  private toFirestoreFormat(log: OfflineDailyLog): Record<string, unknown> {
    return {
      projectId: log.projectId,
      projectName: log.projectName,
      orgId: log.orgId,
      userId: log.userId,
      userName: log.userName,
      date: log.date,
      category: log.category,
      title: log.title,
      description: log.description,
      weather: log.weather,
      workPerformed: log.workPerformed,
      crewMembers: log.workersOnSite,
      crewCount: log.crewCount,
      hoursWorked: log.hoursWorked,
      notes: log.notes,
      issues: log.issues ? [{ description: log.issues, impact: 'medium', resolved: false }] : undefined,
    };
  }

  /**
   * Update pending count
   */
  private async updatePendingCount(): Promise<void> {
    try {
      const logs = await getAllLogs();
      this.pendingCount = logs.filter((l) => l.syncStatus === 'pending').length;
      this.listeners.forEach((listener) => listener(this.pendingCount));
    } catch (err) {
      console.error('Failed to update pending count:', err);
    }
  }
}

// Singleton instance
let serviceInstance: OfflineDailyLogService | null = null;

export function getOfflineDailyLogService(): OfflineDailyLogService {
  if (!serviceInstance) {
    serviceInstance = new OfflineDailyLogService();
  }
  return serviceInstance;
}

// Weather condition options for caching
// Matches WeatherCondition type: 'clear' | 'partly_cloudy' | 'cloudy' | 'rain' | 'heavy_rain' | 'snow' | 'storm' | 'extreme_heat' | 'extreme_cold' | 'wind'
export const WEATHER_CONDITIONS: { value: WeatherCondition; label: string; icon: string }[] = [
  { value: 'clear', label: 'Clear/Sunny', icon: 'sun' },
  { value: 'partly_cloudy', label: 'Partly Cloudy', icon: 'cloud-sun' },
  { value: 'cloudy', label: 'Cloudy', icon: 'cloud' },
  { value: 'rain', label: 'Rain', icon: 'cloud-rain' },
  { value: 'heavy_rain', label: 'Heavy Rain', icon: 'cloud-showers-heavy' },
  { value: 'storm', label: 'Storm/Thunderstorm', icon: 'bolt' },
  { value: 'snow', label: 'Snow', icon: 'snowflake' },
  { value: 'wind', label: 'Windy', icon: 'wind' },
  { value: 'extreme_heat', label: 'Extreme Heat', icon: 'temperature-high' },
  { value: 'extreme_cold', label: 'Extreme Cold', icon: 'temperature-low' },
];
