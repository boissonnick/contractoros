/**
 * Generic Firestore CRUD Operations Hook
 *
 * Provides standardized create, update, and delete operations with:
 * - Automatic timestamp management
 * - Toast notifications
 * - Error handling
 * - Type safety
 *
 * @example
 * // Basic usage
 * const { create, update, remove } = useFirestoreCrud<Client>(
 *   `organizations/${orgId}/clients`,
 *   { entityName: 'Client' }
 * );
 *
 * // Create
 * const id = await create({ name: 'Acme Corp', status: 'active' });
 *
 * // Update
 * await update(clientId, { status: 'inactive' });
 *
 * // Delete
 * await remove(clientId);
 */

'use client';

import { useCallback } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  DocumentData,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { toast } from '@/components/ui/Toast';
import { logger } from '@/lib/utils/logger';

export interface UseFirestoreCrudOptions<T> {
  /**
   * Human-readable name for toast messages (e.g., 'Client', 'Expense')
   */
  entityName?: string;

  /**
   * Transform data before writing to Firestore.
   * Use to convert Date to Timestamp, remove undefined fields, etc.
   */
  toFirestore?: (data: Partial<T>) => DocumentData;

  /**
   * Whether to show toast notifications (default: true)
   */
  showToast?: boolean;

  /**
   * Custom success messages
   */
  messages?: {
    created?: string;
    updated?: string;
    deleted?: string;
  };
}

export interface UseFirestoreCrudResult<T> {
  /**
   * Create a new document
   * @returns The new document ID
   */
  create: (data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;

  /**
   * Update an existing document
   */
  update: (id: string, data: Partial<T>) => Promise<void>;

  /**
   * Delete a document
   */
  remove: (id: string) => Promise<void>;

  /**
   * Batch create multiple documents
   * @returns Array of new document IDs
   */
  batchCreate: (items: Array<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<string[]>;

  /**
   * Batch update multiple documents
   */
  batchUpdate: (updates: Array<{ id: string; data: Partial<T> }>) => Promise<void>;

  /**
   * Batch delete multiple documents
   */
  batchRemove: (ids: string[]) => Promise<void>;
}

/**
 * Default transformer that converts Date objects to Timestamps
 * and removes undefined values.
 */
function defaultToFirestore<T>(data: Partial<T>): DocumentData {
  const result: DocumentData = {};

  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    // Skip undefined values
    if (value === undefined) continue;

    // Convert Date to Timestamp
    if (value instanceof Date) {
      result[key] = Timestamp.fromDate(value);
    }
    // Keep null values (explicit null should clear fields)
    else if (value === null) {
      result[key] = null;
    }
    // Handle nested objects (but not arrays)
    else if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      result[key] = defaultToFirestore(value as Record<string, unknown>);
    }
    // Pass through other values
    else {
      result[key] = value;
    }
  }

  return result;
}

export function useFirestoreCrud<T extends { id?: string }>(
  collectionPath: string,
  options: UseFirestoreCrudOptions<T> = {}
): UseFirestoreCrudResult<T> {
  const {
    entityName = 'Item',
    toFirestore = defaultToFirestore,
    showToast = true,
    messages = {},
  } = options;

  const create = useCallback(
    async (data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
      try {
        const docData = toFirestore(data as Partial<T>);
        const docRef = await addDoc(collection(db, collectionPath), {
          ...docData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        if (showToast) {
          toast.success(messages.created || `${entityName} created`);
        }

        return docRef.id;
      } catch (error) {
        logger.error(`Error creating ${entityName}`, { error: error, hook: 'useFirestoreCrud' });
        if (showToast) {
          toast.error(
            `Failed to create ${entityName}`,
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
        throw error;
      }
    },
    [collectionPath, entityName, toFirestore, showToast, messages.created]
  );

  const update = useCallback(
    async (id: string, data: Partial<T>): Promise<void> => {
      try {
        const docData = toFirestore(data);
        await updateDoc(doc(db, collectionPath, id), {
          ...docData,
          updatedAt: Timestamp.now(),
        });

        if (showToast) {
          toast.success(messages.updated || `${entityName} updated`);
        }
      } catch (error) {
        logger.error(`Error updating ${entityName}`, { error: error, hook: 'useFirestoreCrud' });
        if (showToast) {
          toast.error(
            `Failed to update ${entityName}`,
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
        throw error;
      }
    },
    [collectionPath, entityName, toFirestore, showToast, messages.updated]
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      try {
        await deleteDoc(doc(db, collectionPath, id));

        if (showToast) {
          toast.success(messages.deleted || `${entityName} deleted`);
        }
      } catch (error) {
        logger.error(`Error deleting ${entityName}`, { error: error, hook: 'useFirestoreCrud' });
        if (showToast) {
          toast.error(
            `Failed to delete ${entityName}`,
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
        throw error;
      }
    },
    [collectionPath, entityName, showToast, messages.deleted]
  );

  const batchCreate = useCallback(
    async (items: Array<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<string[]> => {
      try {
        const batch = writeBatch(db);
        const ids: string[] = [];

        for (const item of items) {
          const docRef = doc(collection(db, collectionPath));
          const docData = toFirestore(item as Partial<T>);
          batch.set(docRef, {
            ...docData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
          ids.push(docRef.id);
        }

        await batch.commit();

        if (showToast) {
          toast.success(`${items.length} ${entityName}s created`);
        }

        return ids;
      } catch (error) {
        logger.error(`Error batch creating ${entityName}s`, { error: error, hook: 'useFirestoreCrud' });
        if (showToast) {
          toast.error(
            `Failed to create ${entityName}s`,
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
        throw error;
      }
    },
    [collectionPath, entityName, toFirestore, showToast]
  );

  const batchUpdate = useCallback(
    async (updates: Array<{ id: string; data: Partial<T> }>): Promise<void> => {
      try {
        const batch = writeBatch(db);

        for (const { id, data } of updates) {
          const docRef = doc(db, collectionPath, id);
          const docData = toFirestore(data);
          batch.update(docRef, {
            ...docData,
            updatedAt: Timestamp.now(),
          });
        }

        await batch.commit();

        if (showToast) {
          toast.success(`${updates.length} ${entityName}s updated`);
        }
      } catch (error) {
        logger.error(`Error batch updating ${entityName}s`, { error: error, hook: 'useFirestoreCrud' });
        if (showToast) {
          toast.error(
            `Failed to update ${entityName}s`,
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
        throw error;
      }
    },
    [collectionPath, entityName, toFirestore, showToast]
  );

  const batchRemove = useCallback(
    async (ids: string[]): Promise<void> => {
      try {
        const batch = writeBatch(db);

        for (const id of ids) {
          batch.delete(doc(db, collectionPath, id));
        }

        await batch.commit();

        if (showToast) {
          toast.success(`${ids.length} ${entityName}s deleted`);
        }
      } catch (error) {
        logger.error(`Error batch deleting ${entityName}s`, { error: error, hook: 'useFirestoreCrud' });
        if (showToast) {
          toast.error(
            `Failed to delete ${entityName}s`,
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
        throw error;
      }
    },
    [collectionPath, entityName, showToast]
  );

  return {
    create,
    update,
    remove,
    batchCreate,
    batchUpdate,
    batchRemove,
  };
}

export default useFirestoreCrud;
