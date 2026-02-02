/**
 * Bulk Task Operations
 *
 * Functions for performing bulk operations on tasks.
 */

import {
  doc,
  writeBatch,
  getDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { TaskStatus } from '@/types';
import {
  BulkResult,
  BulkProgressCallback,
  FIRESTORE_BATCH_LIMIT,
} from '../types';

/**
 * Bulk update task status
 */
export async function bulkUpdateTaskStatus(
  orgId: string,
  taskIds: string[],
  newStatus: TaskStatus,
  onProgress?: BulkProgressCallback
): Promise<BulkResult> {
  const startTime = Date.now();
  const success: string[] = [];
  const failed: { id: string; error: string }[] = [];

  const batches = chunkArray(taskIds, FIRESTORE_BATCH_LIMIT);

  for (const batchIds of batches) {
    const batch = writeBatch(db);

    for (const taskId of batchIds) {
      try {
        const taskRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskRef);

        if (!taskDoc.exists()) {
          failed.push({ id: taskId, error: 'Task not found' });
          continue;
        }

        const taskData = taskDoc.data();
        if (taskData.orgId !== orgId) {
          failed.push({ id: taskId, error: 'Permission denied' });
          continue;
        }

        const updateData: Record<string, unknown> = {
          status: newStatus,
          updatedAt: Timestamp.now(),
        };

        // Set completion date if marking as completed
        if (newStatus === 'completed' && !taskData.completedAt) {
          updateData.completedAt = Timestamp.now();
        }

        // Clear completion date if moving from completed to another status
        if (newStatus !== 'completed' && taskData.completedAt) {
          updateData.completedAt = null;
        }

        batch.update(taskRef, updateData);
        success.push(taskId);

        if (onProgress) {
          onProgress({
            completed: success.length + failed.length,
            total: taskIds.length,
            currentItem: taskId,
            successCount: success.length,
            failedCount: failed.length,
          });
        }
      } catch (error) {
        failed.push({
          id: taskId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    try {
      await batch.commit();
    } catch (error) {
      const batchError = error instanceof Error ? error.message : 'Batch commit failed';
      for (const id of batchIds) {
        if (!failed.find((f) => f.id === id)) {
          failed.push({ id, error: batchError });
          const successIndex = success.indexOf(id);
          if (successIndex > -1) {
            success.splice(successIndex, 1);
          }
        }
      }
    }
  }

  return {
    success,
    failed,
    total: taskIds.length,
    duration: Date.now() - startTime,
  };
}

/**
 * Bulk assign tasks to users
 */
export async function bulkAssignTasks(
  orgId: string,
  taskIds: string[],
  userIds: string[],
  replace: boolean = false,
  onProgress?: BulkProgressCallback
): Promise<BulkResult> {
  const startTime = Date.now();
  const success: string[] = [];
  const failed: { id: string; error: string }[] = [];

  const batches = chunkArray(taskIds, FIRESTORE_BATCH_LIMIT);

  for (const batchIds of batches) {
    const batch = writeBatch(db);

    for (const taskId of batchIds) {
      try {
        const taskRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskRef);

        if (!taskDoc.exists()) {
          failed.push({ id: taskId, error: 'Task not found' });
          continue;
        }

        const taskData = taskDoc.data();
        if (taskData.orgId !== orgId) {
          failed.push({ id: taskId, error: 'Permission denied' });
          continue;
        }

        let newAssignees: string[];
        if (replace) {
          newAssignees = [...userIds];
        } else {
          const existingAssignees = taskData.assignedTo || [];
          newAssignees = Array.from(new Set([...existingAssignees, ...userIds]));
        }

        // Update status to assigned if currently pending
        const updateData: Record<string, unknown> = {
          assignedTo: newAssignees,
          updatedAt: Timestamp.now(),
        };

        if (taskData.status === 'pending' && newAssignees.length > 0) {
          updateData.status = 'assigned';
        }

        batch.update(taskRef, updateData);
        success.push(taskId);

        if (onProgress) {
          onProgress({
            completed: success.length + failed.length,
            total: taskIds.length,
            currentItem: taskId,
            successCount: success.length,
            failedCount: failed.length,
          });
        }
      } catch (error) {
        failed.push({
          id: taskId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    try {
      await batch.commit();
    } catch (error) {
      const batchError = error instanceof Error ? error.message : 'Batch commit failed';
      for (const id of batchIds) {
        if (!failed.find((f) => f.id === id)) {
          failed.push({ id, error: batchError });
          const successIndex = success.indexOf(id);
          if (successIndex > -1) {
            success.splice(successIndex, 1);
          }
        }
      }
    }
  }

  return {
    success,
    failed,
    total: taskIds.length,
    duration: Date.now() - startTime,
  };
}

/**
 * Bulk unassign users from tasks
 */
export async function bulkUnassignTasks(
  orgId: string,
  taskIds: string[],
  userIds: string[],
  onProgress?: BulkProgressCallback
): Promise<BulkResult> {
  const startTime = Date.now();
  const success: string[] = [];
  const failed: { id: string; error: string }[] = [];

  const batches = chunkArray(taskIds, FIRESTORE_BATCH_LIMIT);

  for (const batchIds of batches) {
    const batch = writeBatch(db);

    for (const taskId of batchIds) {
      try {
        const taskRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskRef);

        if (!taskDoc.exists()) {
          failed.push({ id: taskId, error: 'Task not found' });
          continue;
        }

        const taskData = taskDoc.data();
        if (taskData.orgId !== orgId) {
          failed.push({ id: taskId, error: 'Permission denied' });
          continue;
        }

        const existingAssignees: string[] = taskData.assignedTo || [];
        const newAssignees = existingAssignees.filter(
          (id) => !userIds.includes(id)
        );

        const updateData: Record<string, unknown> = {
          assignedTo: newAssignees,
          updatedAt: Timestamp.now(),
        };

        // Revert to pending if no assignees left
        if (newAssignees.length === 0 && taskData.status === 'assigned') {
          updateData.status = 'pending';
        }

        batch.update(taskRef, updateData);
        success.push(taskId);

        if (onProgress) {
          onProgress({
            completed: success.length + failed.length,
            total: taskIds.length,
            currentItem: taskId,
            successCount: success.length,
            failedCount: failed.length,
          });
        }
      } catch (error) {
        failed.push({
          id: taskId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    try {
      await batch.commit();
    } catch (error) {
      const batchError = error instanceof Error ? error.message : 'Batch commit failed';
      for (const id of batchIds) {
        if (!failed.find((f) => f.id === id)) {
          failed.push({ id, error: batchError });
          const successIndex = success.indexOf(id);
          if (successIndex > -1) {
            success.splice(successIndex, 1);
          }
        }
      }
    }
  }

  return {
    success,
    failed,
    total: taskIds.length,
    duration: Date.now() - startTime,
  };
}

/**
 * Bulk delete tasks (permanent)
 */
export async function bulkDeleteTasks(
  orgId: string,
  taskIds: string[],
  onProgress?: BulkProgressCallback
): Promise<BulkResult> {
  const startTime = Date.now();
  const success: string[] = [];
  const failed: { id: string; error: string }[] = [];

  // For deletes, we process one at a time to avoid partial batch failures
  // affecting unrelated documents
  for (let i = 0; i < taskIds.length; i++) {
    const taskId = taskIds[i];

    try {
      const taskRef = doc(db, 'tasks', taskId);
      const taskDoc = await getDoc(taskRef);

      if (!taskDoc.exists()) {
        failed.push({ id: taskId, error: 'Task not found' });
        continue;
      }

      const taskData = taskDoc.data();
      if (taskData.orgId !== orgId) {
        failed.push({ id: taskId, error: 'Permission denied' });
        continue;
      }

      await deleteDoc(taskRef);
      success.push(taskId);

      if (onProgress) {
        onProgress({
          completed: success.length + failed.length,
          total: taskIds.length,
          currentItem: taskId,
          successCount: success.length,
          failedCount: failed.length,
        });
      }
    } catch (error) {
      failed.push({
        id: taskId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    success,
    failed,
    total: taskIds.length,
    duration: Date.now() - startTime,
  };
}

/**
 * Bulk update task priority
 */
export async function bulkUpdateTaskPriority(
  orgId: string,
  taskIds: string[],
  priority: 'low' | 'medium' | 'high' | 'urgent',
  onProgress?: BulkProgressCallback
): Promise<BulkResult> {
  const startTime = Date.now();
  const success: string[] = [];
  const failed: { id: string; error: string }[] = [];

  const batches = chunkArray(taskIds, FIRESTORE_BATCH_LIMIT);

  for (const batchIds of batches) {
    const batch = writeBatch(db);

    for (const taskId of batchIds) {
      try {
        const taskRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskRef);

        if (!taskDoc.exists()) {
          failed.push({ id: taskId, error: 'Task not found' });
          continue;
        }

        const taskData = taskDoc.data();
        if (taskData.orgId !== orgId) {
          failed.push({ id: taskId, error: 'Permission denied' });
          continue;
        }

        batch.update(taskRef, {
          priority,
          updatedAt: Timestamp.now(),
        });
        success.push(taskId);

        if (onProgress) {
          onProgress({
            completed: success.length + failed.length,
            total: taskIds.length,
            currentItem: taskId,
            successCount: success.length,
            failedCount: failed.length,
          });
        }
      } catch (error) {
        failed.push({
          id: taskId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    try {
      await batch.commit();
    } catch (error) {
      const batchError = error instanceof Error ? error.message : 'Batch commit failed';
      for (const id of batchIds) {
        if (!failed.find((f) => f.id === id)) {
          failed.push({ id, error: batchError });
          const successIndex = success.indexOf(id);
          if (successIndex > -1) {
            success.splice(successIndex, 1);
          }
        }
      }
    }
  }

  return {
    success,
    failed,
    total: taskIds.length,
    duration: Date.now() - startTime,
  };
}

/**
 * Helper to chunk array into smaller arrays
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
