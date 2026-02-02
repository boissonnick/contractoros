/**
 * Offline Tasks Service
 * Manages task status updates when offline
 */

import { saveOffline, getOfflineData } from './storage';
import { addToQueue, subscribeToQueue } from './sync-queue';
import { checkNetworkStatus } from './network-status';
import { Task, TaskStatus } from '@/types';

// Offline task update record
export interface OfflineTaskUpdate {
  localId: string;
  taskId: string;
  projectId: string;
  orgId: string;
  updates: {
    status?: TaskStatus;
    completedAt?: number; // timestamp
    notes?: string;
    actualHours?: number;
  };
  timestamp: number;
  syncStatus: 'pending' | 'synced' | 'conflict';
}

// Cached task for offline access
export interface CachedTask {
  task: Task;
  cachedAt: number;
}

const UPDATES_STORAGE_KEY = 'offline-task-updates';
const TASKS_CACHE_KEY = 'offline-tasks-cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate unique local ID
 */
function generateLocalId(): string {
  return `local_update_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Get all offline task updates
 */
async function getAllUpdates(): Promise<OfflineTaskUpdate[]> {
  const data = await getOfflineData<OfflineTaskUpdate[]>(UPDATES_STORAGE_KEY);
  return data || [];
}

/**
 * Save all updates to storage
 */
async function saveUpdates(updates: OfflineTaskUpdate[]): Promise<void> {
  await saveOffline(UPDATES_STORAGE_KEY, updates, CACHE_TTL);
}

/**
 * Get cached tasks
 */
async function getCachedTasks(): Promise<Record<string, CachedTask>> {
  const data = await getOfflineData<Record<string, CachedTask>>(TASKS_CACHE_KEY);
  return data || {};
}

/**
 * Save cached tasks
 */
async function saveCachedTasks(tasks: Record<string, CachedTask>): Promise<void> {
  await saveOffline(TASKS_CACHE_KEY, tasks, CACHE_TTL);
}

/**
 * Offline Task Service Class
 */
export class OfflineTaskService {
  private pendingCount = 0;
  private listeners: Set<(count: number) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      subscribeToQueue(() => {
        this.updatePendingCount();
      });
      this.updatePendingCount();
    }
  }

  /**
   * Update task status (works offline)
   */
  async updateTaskStatus(
    taskId: string,
    projectId: string,
    orgId: string,
    status: TaskStatus,
    notes?: string
  ): Promise<string> {
    const localId = generateLocalId();
    const now = Date.now();

    const update: OfflineTaskUpdate = {
      localId,
      taskId,
      projectId,
      orgId,
      updates: {
        status,
        notes,
        completedAt: status === 'completed' ? now : undefined,
      },
      timestamp: now,
      syncStatus: 'pending',
    };

    // Save update locally
    const updates = await getAllUpdates();

    // Remove any existing pending update for this task
    const filtered = updates.filter((u) => u.taskId !== taskId || u.syncStatus === 'synced');
    filtered.push(update);
    await saveUpdates(filtered);

    // Update the cached task
    await this.updateCachedTask(taskId, update.updates);

    // If online, queue for sync immediately
    if (checkNetworkStatus()) {
      await addToQueue('update', 'tasks', taskId, {
        status,
        notes,
        completedAt: status === 'completed' ? { _type: 'timestamp', value: now } : null,
        updatedAt: { _type: 'timestamp', value: now },
      });
    }

    this.updatePendingCount();
    return localId;
  }

  /**
   * Log actual hours on a task
   */
  async logActualHours(
    taskId: string,
    projectId: string,
    orgId: string,
    hours: number
  ): Promise<string> {
    const localId = generateLocalId();
    const now = Date.now();

    const update: OfflineTaskUpdate = {
      localId,
      taskId,
      projectId,
      orgId,
      updates: {
        actualHours: hours,
      },
      timestamp: now,
      syncStatus: 'pending',
    };

    const updates = await getAllUpdates();
    updates.push(update);
    await saveUpdates(updates);

    await this.updateCachedTask(taskId, { actualHours: hours });

    if (checkNetworkStatus()) {
      await addToQueue('update', 'tasks', taskId, {
        actualHours: hours,
        updatedAt: { _type: 'timestamp', value: now },
      });
    }

    this.updatePendingCount();
    return localId;
  }

  /**
   * Get tasks with offline updates merged
   */
  async getTasks(orgId: string, projectId: string): Promise<Task[]> {
    const cachedTasks = await getCachedTasks();
    const pendingUpdates = await this.getPendingUpdates();

    // Filter tasks for this project
    const projectTasks = Object.values(cachedTasks)
      .filter((ct) => ct.task.orgId === orgId && ct.task.projectId === projectId)
      .map((ct) => ct.task);

    // Apply pending updates
    return projectTasks.map((task) => {
      const update = pendingUpdates.find((u) => u.taskId === task.id);
      if (update) {
        return {
          ...task,
          status: update.updates.status || task.status,
          completedAt: update.updates.completedAt
            ? new Date(update.updates.completedAt)
            : task.completedAt,
          actualHours: update.updates.actualHours ?? task.actualHours,
          _pendingSync: true,
        } as Task & { _pendingSync?: boolean };
      }
      return task;
    });
  }

  /**
   * Get tasks assigned to current user
   */
  async getMyTasks(orgId: string, userId: string): Promise<Task[]> {
    const cachedTasks = await getCachedTasks();
    const pendingUpdates = await this.getPendingUpdates();

    const myTasks = Object.values(cachedTasks)
      .filter((ct) => ct.task.orgId === orgId && ct.task.assignedTo?.includes(userId))
      .map((ct) => ct.task);

    return myTasks.map((task) => {
      const update = pendingUpdates.find((u) => u.taskId === task.id);
      if (update) {
        return {
          ...task,
          status: update.updates.status || task.status,
          completedAt: update.updates.completedAt
            ? new Date(update.updates.completedAt)
            : task.completedAt,
          actualHours: update.updates.actualHours ?? task.actualHours,
          _pendingSync: true,
        } as Task & { _pendingSync?: boolean };
      }
      return task;
    });
  }

  /**
   * Get all pending updates
   */
  async getPendingUpdates(): Promise<OfflineTaskUpdate[]> {
    const updates = await getAllUpdates();
    return updates.filter((u) => u.syncStatus === 'pending');
  }

  /**
   * Get pending count
   */
  getPendingCount(): number {
    return this.pendingCount;
  }

  /**
   * Mark update as synced
   */
  async markAsSynced(localId: string): Promise<void> {
    const updates = await getAllUpdates();
    const index = updates.findIndex((u) => u.localId === localId);

    if (index !== -1) {
      updates[index].syncStatus = 'synced';
      await saveUpdates(updates);
      this.updatePendingCount();
    }
  }

  /**
   * Cache tasks for offline access
   */
  async cacheTasks(tasks: Task[]): Promise<void> {
    const cached = await getCachedTasks();
    const now = Date.now();

    for (const task of tasks) {
      cached[task.id] = {
        task,
        cachedAt: now,
      };
    }

    await saveCachedTasks(cached);
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
   * Clear synced updates older than 24 hours
   */
  async cleanupOldUpdates(): Promise<void> {
    const updates = await getAllUpdates();
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;

    const filtered = updates.filter(
      (u) => u.syncStatus === 'pending' || u.timestamp > cutoff
    );

    if (filtered.length !== updates.length) {
      await saveUpdates(filtered);
    }
  }

  /**
   * Update a cached task
   */
  private async updateCachedTask(
    taskId: string,
    updates: Partial<OfflineTaskUpdate['updates']>
  ): Promise<void> {
    const cached = await getCachedTasks();

    if (cached[taskId]) {
      const task = cached[taskId].task;
      if (updates.status) task.status = updates.status;
      if (updates.completedAt) task.completedAt = new Date(updates.completedAt);
      if (updates.actualHours !== undefined) task.actualHours = updates.actualHours;
      cached[taskId].cachedAt = Date.now();
      await saveCachedTasks(cached);
    }
  }

  /**
   * Update pending count
   */
  private async updatePendingCount(): Promise<void> {
    try {
      const updates = await getAllUpdates();
      this.pendingCount = updates.filter((u) => u.syncStatus === 'pending').length;
      this.listeners.forEach((listener) => listener(this.pendingCount));
    } catch (err) {
      console.error('Failed to update pending count:', err);
    }
  }
}

// Singleton instance
let serviceInstance: OfflineTaskService | null = null;

export function getOfflineTaskService(): OfflineTaskService {
  if (!serviceInstance) {
    serviceInstance = new OfflineTaskService();
  }
  return serviceInstance;
}

// Task status options for UI
export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'gray' },
  { value: 'assigned', label: 'Assigned', color: 'blue' },
  { value: 'in_progress', label: 'In Progress', color: 'yellow' },
  { value: 'blocked', label: 'Blocked', color: 'red' },
  { value: 'review', label: 'In Review', color: 'purple' },
  { value: 'completed', label: 'Completed', color: 'green' },
];
