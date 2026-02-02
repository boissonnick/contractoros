/**
 * Bulk Project Operations
 *
 * Functions for performing bulk operations on projects.
 */

import {
  doc,
  writeBatch,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ProjectStatus } from '@/types';
import {
  BulkResult,
  BulkProgressCallback,
  FIRESTORE_BATCH_LIMIT,
} from '../types';

/**
 * Bulk update project status
 */
export async function bulkUpdateProjectStatus(
  orgId: string,
  projectIds: string[],
  newStatus: ProjectStatus,
  onProgress?: BulkProgressCallback
): Promise<BulkResult> {
  const startTime = Date.now();
  const success: string[] = [];
  const failed: { id: string; error: string }[] = [];

  // Process in batches
  const batches = chunkArray(projectIds, FIRESTORE_BATCH_LIMIT);

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = writeBatch(db);
    const batchIds = batches[batchIndex];

    for (const projectId of batchIds) {
      try {
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);

        if (!projectDoc.exists()) {
          failed.push({ id: projectId, error: 'Project not found' });
          continue;
        }

        const projectData = projectDoc.data();
        if (projectData.orgId !== orgId) {
          failed.push({ id: projectId, error: 'Permission denied' });
          continue;
        }

        // Build update data
        const updateData: Record<string, unknown> = {
          status: newStatus,
          updatedAt: Timestamp.now(),
        };

        // Set completion date if marking as completed
        if (newStatus === 'completed' && !projectData.actualEndDate) {
          updateData.actualEndDate = Timestamp.now();
        }

        batch.update(projectRef, updateData);
        success.push(projectId);

        // Report progress
        if (onProgress) {
          onProgress({
            completed: success.length + failed.length,
            total: projectIds.length,
            currentItem: projectId,
            successCount: success.length,
            failedCount: failed.length,
          });
        }
      } catch (error) {
        failed.push({
          id: projectId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Commit batch
    try {
      await batch.commit();
    } catch (error) {
      // If batch fails, mark all as failed
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
    total: projectIds.length,
    duration: Date.now() - startTime,
  };
}

/**
 * Bulk archive projects
 */
export async function bulkArchiveProjects(
  orgId: string,
  projectIds: string[],
  archive: boolean = true,
  userId: string,
  onProgress?: BulkProgressCallback
): Promise<BulkResult> {
  const startTime = Date.now();
  const success: string[] = [];
  const failed: { id: string; error: string }[] = [];

  const batches = chunkArray(projectIds, FIRESTORE_BATCH_LIMIT);

  for (const batchIds of batches) {
    const batch = writeBatch(db);

    for (const projectId of batchIds) {
      try {
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);

        if (!projectDoc.exists()) {
          failed.push({ id: projectId, error: 'Project not found' });
          continue;
        }

        const projectData = projectDoc.data();
        if (projectData.orgId !== orgId) {
          failed.push({ id: projectId, error: 'Permission denied' });
          continue;
        }

        const updateData: Record<string, unknown> = {
          isArchived: archive,
          updatedAt: Timestamp.now(),
        };

        if (archive) {
          updateData.archivedAt = Timestamp.now();
          updateData.archivedBy = userId;
        } else {
          updateData.archivedAt = null;
          updateData.archivedBy = null;
        }

        batch.update(projectRef, updateData);
        success.push(projectId);

        if (onProgress) {
          onProgress({
            completed: success.length + failed.length,
            total: projectIds.length,
            currentItem: projectId,
            successCount: success.length,
            failedCount: failed.length,
          });
        }
      } catch (error) {
        failed.push({
          id: projectId,
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
    total: projectIds.length,
    duration: Date.now() - startTime,
  };
}

/**
 * Bulk assign project manager
 */
export async function bulkAssignProjectManager(
  orgId: string,
  projectIds: string[],
  pmUserId: string,
  pmUserName: string,
  onProgress?: BulkProgressCallback
): Promise<BulkResult> {
  const startTime = Date.now();
  const success: string[] = [];
  const failed: { id: string; error: string }[] = [];

  const batches = chunkArray(projectIds, FIRESTORE_BATCH_LIMIT);

  for (const batchIds of batches) {
    const batch = writeBatch(db);

    for (const projectId of batchIds) {
      try {
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);

        if (!projectDoc.exists()) {
          failed.push({ id: projectId, error: 'Project not found' });
          continue;
        }

        const projectData = projectDoc.data();
        if (projectData.orgId !== orgId) {
          failed.push({ id: projectId, error: 'Permission denied' });
          continue;
        }

        batch.update(projectRef, {
          pmId: pmUserId,
          pmName: pmUserName,
          updatedAt: Timestamp.now(),
        });
        success.push(projectId);

        if (onProgress) {
          onProgress({
            completed: success.length + failed.length,
            total: projectIds.length,
            currentItem: projectId,
            successCount: success.length,
            failedCount: failed.length,
          });
        }
      } catch (error) {
        failed.push({
          id: projectId,
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
    total: projectIds.length,
    duration: Date.now() - startTime,
  };
}

/**
 * Bulk add tags to projects
 */
export async function bulkTagProjects(
  orgId: string,
  projectIds: string[],
  tags: string[],
  replace: boolean = false,
  onProgress?: BulkProgressCallback
): Promise<BulkResult> {
  const startTime = Date.now();
  const success: string[] = [];
  const failed: { id: string; error: string }[] = [];

  const batches = chunkArray(projectIds, FIRESTORE_BATCH_LIMIT);

  for (const batchIds of batches) {
    const batch = writeBatch(db);

    for (const projectId of batchIds) {
      try {
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);

        if (!projectDoc.exists()) {
          failed.push({ id: projectId, error: 'Project not found' });
          continue;
        }

        const projectData = projectDoc.data();
        if (projectData.orgId !== orgId) {
          failed.push({ id: projectId, error: 'Permission denied' });
          continue;
        }

        let newTags: string[];
        if (replace) {
          newTags = [...tags];
        } else {
          const existingTags = projectData.tags || [];
          newTags = Array.from(new Set([...existingTags, ...tags]));
        }

        batch.update(projectRef, {
          tags: newTags,
          updatedAt: Timestamp.now(),
        });
        success.push(projectId);

        if (onProgress) {
          onProgress({
            completed: success.length + failed.length,
            total: projectIds.length,
            currentItem: projectId,
            successCount: success.length,
            failedCount: failed.length,
          });
        }
      } catch (error) {
        failed.push({
          id: projectId,
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
    total: projectIds.length,
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
