"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  writeBatch,
  limit,
  startAfter,
  getDocs,
  QueryConstraint,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Task, TaskStatus, TaskPriority, TaskDependency, TaskAttachment, TaskChecklistItem, RecurrenceConfig } from '@/types';
import { useAuth } from '@/lib/auth';
import { toast } from '@/components/ui/Toast';
import { logger } from '@/lib/utils/logger';

// ---- Firestore ↔ Task converters ----

function fromFirestore(id: string, data: Record<string, unknown>): Task {
  return {
    id,
    orgId: data.orgId as string,
    projectId: data.projectId as string,
    phaseId: data.phaseId as string | undefined,
    parentTaskId: data.parentTaskId as string | undefined,
    title: data.title as string,
    description: data.description as string | undefined,
    status: data.status as TaskStatus,
    priority: data.priority as TaskPriority,
    assignedTo: (data.assignedTo as string[]) || [],
    assignedSubId: data.assignedSubId as string | undefined,
    trade: data.trade as string | undefined,
    startDate: data.startDate ? (data.startDate as Timestamp).toDate() : undefined,
    dueDate: data.dueDate ? (data.dueDate as Timestamp).toDate() : undefined,
    duration: data.duration as number | undefined,
    estimatedHours: data.estimatedHours as number | undefined,
    actualHours: data.actualHours as number | undefined,
    completedAt: data.completedAt ? (data.completedAt as Timestamp).toDate() : undefined,
    dependencies: (data.dependencies as TaskDependency[]) || [],
    attachments: ((data.attachments as unknown[]) || []).map((a: unknown) => {
      const att = a as Record<string, unknown>;
      return {
        ...att,
        uploadedAt: att.uploadedAt ? (att.uploadedAt as Timestamp).toDate() : new Date(),
      } as TaskAttachment;
    }),
    // Sprint 5: Checklist
    checklist: (data.checklist as TaskChecklistItem[]) || undefined,
    // Sprint 5: Recurring
    isRecurring: data.isRecurring as boolean | undefined,
    recurrenceConfig: data.recurrenceConfig as RecurrenceConfig | undefined,
    recurringParentId: data.recurringParentId as string | undefined,
    recurrenceIndex: data.recurrenceIndex as number | undefined,
    templateId: data.templateId as string | undefined,

    order: (data.order as number) ?? 0,
    createdBy: data.createdBy as string,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
  };
}

function toFirestore(task: Partial<Task>): Record<string, unknown> {
  const data: Record<string, unknown> = { ...task };
  delete data.id;

  // Convert dates to Timestamps
  if (task.startDate) data.startDate = Timestamp.fromDate(task.startDate);
  if (task.dueDate) data.dueDate = Timestamp.fromDate(task.dueDate);
  if (task.completedAt) data.completedAt = Timestamp.fromDate(task.completedAt);
  if (task.createdAt) data.createdAt = Timestamp.fromDate(task.createdAt);

  data.updatedAt = Timestamp.now();

  // Convert attachment dates
  if (task.attachments) {
    data.attachments = task.attachments.map((a) => ({
      ...a,
      uploadedAt: Timestamp.fromDate(a.uploadedAt),
    }));
  }

  // Convert recurrenceConfig dates
  if (task.recurrenceConfig) {
    const rc = { ...task.recurrenceConfig };
    if (rc.endDate) {
      (rc as Record<string, unknown>).endDate = Timestamp.fromDate(new Date(rc.endDate));
    }
    if (rc.lastGeneratedAt) {
      (rc as Record<string, unknown>).lastGeneratedAt = Timestamp.fromDate(new Date(rc.lastGeneratedAt));
    }
    data.recurrenceConfig = rc;
  }

  // Convert checklist item dates
  if (task.checklist) {
    data.checklist = task.checklist.map((item) => {
      const mapped: Record<string, unknown> = { ...item };
      if (item.completedAt) {
        mapped.completedAt = Timestamp.fromDate(new Date(item.completedAt));
      }
      return mapped;
    });
  }

  // Firestore rejects undefined values — strip them
  Object.keys(data).forEach((k) => {
    if (data[k] === undefined) delete data[k];
  });

  return data;
}

// ---- Hook ----

export interface UseTasksOptions {
  projectId: string;
  phaseId?: string | null;
  parentTaskId?: string | null; // for fetching subtasks
}

export interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  addTask: (task: NewTaskInput) => Promise<string>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  reorderTasks: (taskIds: string[], newOrder: number[]) => Promise<void>;
  // Sprint 5: Bulk operations
  bulkUpdateStatus: (taskIds: string[], status: TaskStatus) => Promise<void>;
  bulkAssign: (taskIds: string[], assigneeIds: string[]) => Promise<void>;
  bulkDelete: (taskIds: string[]) => Promise<void>;
  bulkSetPriority: (taskIds: string[], priority: TaskPriority) => Promise<void>;
}

export interface NewTaskInput {
  title: string;
  description?: string;
  phaseId?: string;
  parentTaskId?: string;
  priority?: TaskPriority;
  assignedTo?: string[];
  assignedSubId?: string;
  trade?: string;
  startDate?: Date;
  dueDate?: Date;
  duration?: number;
  estimatedHours?: number;
  dependencies?: TaskDependency[];
  // Sprint 5 additions
  checklist?: TaskChecklistItem[];
  isRecurring?: boolean;
  recurrenceConfig?: RecurrenceConfig;
  templateId?: string;
}

/**
 * Hook for managing project tasks with real-time updates and bulk operations.
 *
 * Provides comprehensive task management including CRUD operations,
 * status transitions, reordering, and bulk actions. Subscribes to Firestore
 * for real-time updates when tasks change.
 *
 * @param {UseTasksOptions} options - Configuration options
 * @param {string} options.projectId - Project ID to fetch tasks for (required)
 * @param {string|null} [options.phaseId] - Filter tasks by phase ID
 * @param {string|null} [options.parentTaskId] - Filter to subtasks of a parent task, or null for root tasks
 *
 * @returns {UseTasksReturn} Tasks data and operations
 * @returns {Task[]} tasks - Array of tasks matching the filters, ordered by position
 * @returns {boolean} loading - True while initial fetch is in progress
 * @returns {string|null} error - Error message if the subscription failed
 * @returns {Function} addTask - Create a new task, returns the new task ID
 * @returns {Function} updateTask - Update a task by ID with partial data
 * @returns {Function} deleteTask - Delete a task by ID
 * @returns {Function} moveTask - Change a task's status (handles completedAt automatically)
 * @returns {Function} reorderTasks - Reorder multiple tasks by setting new order values
 * @returns {Function} bulkUpdateStatus - Update status of multiple tasks at once
 * @returns {Function} bulkAssign - Assign multiple tasks to team members
 * @returns {Function} bulkDelete - Delete multiple tasks at once
 * @returns {Function} bulkSetPriority - Set priority for multiple tasks
 *
 * @example
 * // Basic task list for a project
 * const { tasks, loading, addTask } = useTasks({ projectId });
 *
 * if (loading) return <Spinner />;
 *
 * return tasks.map(task => <TaskCard key={task.id} task={task} />);
 *
 * @example
 * // Create a new task
 * const { addTask } = useTasks({ projectId });
 *
 * const taskId = await addTask({
 *   title: 'Install drywall',
 *   priority: 'high',
 *   assignedTo: [userId],
 *   dueDate: new Date()
 * });
 *
 * @example
 * // Kanban board with status changes
 * const { tasks, moveTask } = useTasks({ projectId });
 *
 * const handleDrop = async (taskId: string, newStatus: TaskStatus) => {
 *   await moveTask(taskId, newStatus);
 * };
 *
 * @example
 * // Bulk operations for selected tasks
 * const { bulkUpdateStatus, bulkAssign } = useTasks({ projectId });
 *
 * // Complete multiple tasks
 * await bulkUpdateStatus(selectedTaskIds, 'completed');
 *
 * // Assign to team member
 * await bulkAssign(selectedTaskIds, [assigneeId]);
 */
export function useTasks({ projectId, phaseId, parentTaskId }: UseTasksOptions): UseTasksReturn {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time listener
  useEffect(() => {
    if (!projectId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const constraints = [
      where('projectId', '==', projectId),
      orderBy('order', 'asc'),
      orderBy('createdAt', 'asc'),
    ];

    // Optional phase filter
    if (phaseId) {
      constraints.unshift(where('phaseId', '==', phaseId));
    }

    // Optional subtask filter
    if (parentTaskId !== undefined) {
      constraints.unshift(
        parentTaskId
          ? where('parentTaskId', '==', parentTaskId)
          : where('parentTaskId', '==', null)
      );
    }

    const q = query(collection(db, 'tasks'), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const result: Task[] = [];
        snapshot.forEach((docSnap) => {
          result.push(fromFirestore(docSnap.id, docSnap.data()));
        });
        setTasks(result);
        setLoading(false);
        setError(null);
      },
      (err) => {
        logger.error('Tasks listener error', { error: err, hook: 'useTasks' });
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId, phaseId, parentTaskId]);

  const addTask = useCallback(
    async (input: NewTaskInput): Promise<string> => {
      if (!profile?.orgId) throw new Error('No organization');

      try {
        const maxOrder = tasks.length > 0 ? Math.max(...tasks.map((t) => t.order)) + 1 : 0;

        const taskData = toFirestore({
          orgId: profile.orgId,
          projectId,
          phaseId: input.phaseId,
          parentTaskId: input.parentTaskId,
          title: input.title,
          description: input.description,
          status: 'pending' as TaskStatus,
          priority: input.priority || 'medium',
          assignedTo: input.assignedTo || [],
          assignedSubId: input.assignedSubId,
          trade: input.trade,
          startDate: input.startDate,
          dueDate: input.dueDate,
          duration: input.duration,
          estimatedHours: input.estimatedHours,
          dependencies: input.dependencies || [],
          attachments: [],
          // Sprint 5
          checklist: input.checklist,
          isRecurring: input.isRecurring,
          recurrenceConfig: input.recurrenceConfig,
          templateId: input.templateId,
          order: maxOrder,
          createdBy: user?.uid || '',
          createdAt: new Date(),
        });

        const docRef = await addDoc(collection(db, 'tasks'), taskData);

        // Log activity
        if (profile && user) {
          import('@/lib/activity').then(({ logActivity }) => {
            logActivity({
              orgId: profile.orgId,
              type: 'task',
              message: `Created task: ${taskData.title}`,
              userId: user.uid,
              userName: profile.displayName,
              projectId,
            });
          });
        }

        toast.success('Task created');
        return docRef.id;
      } catch (err) {
        logger.error('Failed to add task', { error: err, hook: 'useTasks' });
        toast.error('Failed to create task');
        throw err;
      }
    },
    [projectId, profile, user, tasks]
  );

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      const data = toFirestore(updates);
      await updateDoc(doc(db, 'tasks', taskId), data);
      // Don't toast on every update (status changes are frequent)
    } catch (err) {
      logger.error('Failed to update task', { error: err, hook: 'useTasks' });
      toast.error('Failed to update task');
      throw err;
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      toast.success('Task deleted');
    } catch (err) {
      logger.error('Failed to delete task', { error: err, hook: 'useTasks' });
      toast.error('Failed to delete task');
      throw err;
    }
  }, []);

  const moveTask = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      const updates: Record<string, unknown> = {
        status: newStatus,
        updatedAt: Timestamp.now(),
      };
      if (newStatus === 'completed') {
        updates.completedAt = Timestamp.now();
      }
      await updateDoc(doc(db, 'tasks', taskId), updates);
    },
    []
  );

  const reorderTasks = useCallback(async (taskIds: string[], newOrders: number[]) => {
    const batch = writeBatch(db);
    taskIds.forEach((id, i) => {
      batch.update(doc(db, 'tasks', id), { order: newOrders[i], updatedAt: Timestamp.now() });
    });
    await batch.commit();
  }, []);

  // Sprint 5: Bulk operations
  const bulkUpdateStatus = useCallback(async (taskIds: string[], status: TaskStatus) => {
    try {
      const batch = writeBatch(db);
      taskIds.forEach((id) => {
        const updates: Record<string, unknown> = { status, updatedAt: Timestamp.now() };
        if (status === 'completed') {
          updates.completedAt = Timestamp.now();
        }
        batch.update(doc(db, 'tasks', id), updates);
      });
      await batch.commit();
      toast.success(`Updated ${taskIds.length} task${taskIds.length > 1 ? 's' : ''}`);
    } catch (err) {
      logger.error('Failed to bulk update status', { error: err, hook: 'useTasks' });
      toast.error('Failed to update tasks');
      throw err;
    }
  }, []);

  const bulkAssign = useCallback(async (taskIds: string[], assigneeIds: string[]) => {
    try {
      const batch = writeBatch(db);
      taskIds.forEach((id) => {
        batch.update(doc(db, 'tasks', id), { assignedTo: assigneeIds, updatedAt: Timestamp.now() });
      });
      await batch.commit();
      toast.success(`Assigned ${taskIds.length} task${taskIds.length > 1 ? 's' : ''}`);
    } catch (err) {
      logger.error('Failed to bulk assign', { error: err, hook: 'useTasks' });
      toast.error('Failed to assign tasks');
      throw err;
    }
  }, []);

  const bulkDelete = useCallback(async (taskIds: string[]) => {
    try {
      const batch = writeBatch(db);
      taskIds.forEach((id) => {
        batch.delete(doc(db, 'tasks', id));
      });
      await batch.commit();
      toast.success(`Deleted ${taskIds.length} task${taskIds.length > 1 ? 's' : ''}`);
    } catch (err) {
      logger.error('Failed to bulk delete', { error: err, hook: 'useTasks' });
      toast.error('Failed to delete tasks');
      throw err;
    }
  }, []);

  const bulkSetPriority = useCallback(async (taskIds: string[], priority: TaskPriority) => {
    try {
      const batch = writeBatch(db);
      taskIds.forEach((id) => {
        batch.update(doc(db, 'tasks', id), { priority, updatedAt: Timestamp.now() });
      });
      await batch.commit();
      toast.success(`Updated priority for ${taskIds.length} task${taskIds.length > 1 ? 's' : ''}`);
    } catch (err) {
      logger.error('Failed to bulk set priority', { error: err, hook: 'useTasks' });
      toast.error('Failed to update task priorities');
      throw err;
    }
  }, []);

  return {
    tasks, loading, error,
    addTask, updateTask, deleteTask, moveTask, reorderTasks,
    bulkUpdateStatus, bulkAssign, bulkDelete, bulkSetPriority,
  };
}

// ============================================================================
// Paginated Tasks Hook
// ============================================================================

/**
 * Options for the paginated tasks hook
 */
export interface UsePaginatedTasksOptions {
  /** Project ID to filter tasks (optional) */
  projectId?: string;
  /** Phase ID to filter tasks (optional) */
  phaseId?: string;
  /** Status to filter tasks (optional) */
  status?: TaskStatus;
  /** Assignee user ID to filter tasks (optional) */
  assigneeId?: string;
  /** Priority to filter tasks (optional) */
  priority?: TaskPriority;
  /** Number of items per page (default: 50) */
  pageSize?: number;
  /** Whether to enable the query (default: true) */
  enabled?: boolean;
}

/**
 * Result returned by the paginated tasks hook
 */
export interface UsePaginatedTasksResult {
  /** Current page of tasks */
  tasks: Task[];
  /** Loading state */
  loading: boolean;
  /** Error if query failed */
  error: string | null;
  /** Whether there are more tasks to load */
  hasMore: boolean;
  /** Load the next page of tasks */
  loadMore: () => Promise<void>;
  /** Refresh data (reset to page 1) */
  refresh: () => Promise<void>;
  /** Total number of tasks loaded */
  totalLoaded: number;
  /** Current page size */
  pageSize: number;
  /** Whether initial fetch is complete */
  initialized: boolean;
  /** Update a single task */
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  /** Delete a single task */
  deleteTask: (taskId: string) => Promise<void>;
  /** Move a task to a new status */
  moveTask: (taskId: string, newStatus: TaskStatus) => Promise<void>;
}

/**
 * Paginated hook for fetching tasks with cursor-based pagination.
 *
 * Unlike useTasks which loads all tasks at once, this hook supports
 * pagination to handle large task lists efficiently.
 *
 * @param orgId - Organization ID (required for org-scoped queries)
 * @param options - Filtering and pagination options
 *
 * @example
 * // Basic usage - all tasks for an org
 * const { tasks, loading, hasMore, loadMore } = usePaginatedTasks(orgId);
 *
 * @example
 * // Filter by project and status
 * const { tasks, loadMore, hasMore } = usePaginatedTasks(orgId, {
 *   projectId: 'proj123',
 *   status: 'in_progress',
 *   pageSize: 25,
 * });
 *
 * @example
 * // With LoadMore component
 * <TaskList tasks={tasks} />
 * <LoadMore
 *   hasMore={hasMore}
 *   loading={loading}
 *   onLoadMore={loadMore}
 *   itemCount={totalLoaded}
 * />
 */
export function usePaginatedTasks(
  orgId: string | undefined,
  options: UsePaginatedTasksOptions = {}
): UsePaginatedTasksResult {
  const {
    projectId,
    phaseId,
    status,
    assigneeId,
    priority,
    pageSize: initialPageSize = 50,
    enabled = true,
  } = options;

  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [pageSize] = useState(initialPageSize);
  const [initialized, setInitialized] = useState(false);

  // Refs
  const lastDocRef = useRef<DocumentSnapshot | null>(null);
  const fetchInProgressRef = useRef(false);

  // Memoize filters key for dependency tracking
  const filtersKey = useMemo(
    () => JSON.stringify({ projectId, phaseId, status, assigneeId, priority }),
    [projectId, phaseId, status, assigneeId, priority]
  );

  /**
   * Build query constraints based on options
   */
  const buildConstraints = useCallback((): QueryConstraint[] => {
    const constraints: QueryConstraint[] = [];

    // Org filter (required for security)
    if (orgId) {
      constraints.push(where('orgId', '==', orgId));
    }

    // Optional filters
    if (projectId) {
      constraints.push(where('projectId', '==', projectId));
    }
    if (phaseId) {
      constraints.push(where('phaseId', '==', phaseId));
    }
    if (status) {
      constraints.push(where('status', '==', status));
    }
    if (assigneeId) {
      constraints.push(where('assignedTo', 'array-contains', assigneeId));
    }
    if (priority) {
      constraints.push(where('priority', '==', priority));
    }

    // Ordering - createdAt desc for newest first
    constraints.push(orderBy('createdAt', 'desc'));

    return constraints;
  }, [orgId, projectId, phaseId, status, assigneeId, priority]);

  /**
   * Fetch tasks with pagination
   */
  const fetchTasks = useCallback(
    async (isLoadMore = false) => {
      if (!orgId || !enabled || fetchInProgressRef.current) {
        return;
      }

      fetchInProgressRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const constraints = buildConstraints();

        // Add pagination
        if (isLoadMore && lastDocRef.current) {
          constraints.push(startAfter(lastDocRef.current));
        }
        constraints.push(limit(pageSize + 1)); // Fetch one extra to check if there's more

        const q = query(collection(db, 'tasks'), ...constraints);
        const snapshot = await getDocs(q);
        const docs = snapshot.docs;

        // Determine if there are more pages
        const hasMoreItems = docs.length > pageSize;
        const pageData = hasMoreItems ? docs.slice(0, pageSize) : docs;

        // Convert documents to typed items
        const newTasks = pageData.map((docSnap) =>
          fromFirestore(docSnap.id, docSnap.data())
        );

        // Store last document for cursor
        lastDocRef.current = pageData[pageData.length - 1] || null;

        // Update state
        if (isLoadMore) {
          setTasks((prev) => [...prev, ...newTasks]);
        } else {
          setTasks(newTasks);
        }
        setHasMore(hasMoreItems);
        setInitialized(true);
      } catch (err) {
        logger.error('Error fetching paginated tasks', { error: err, hook: 'useTasks' });
        setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
      } finally {
        setLoading(false);
        fetchInProgressRef.current = false;
      }
    },
    [orgId, enabled, buildConstraints, pageSize]
  );

  // Initial fetch when dependencies change
  useEffect(() => {
    if (!orgId || !enabled) {
      setTasks([]);
      setInitialized(false);
      lastDocRef.current = null;
      return;
    }

    // Reset on filter changes
    lastDocRef.current = null;
    setHasMore(true);
    fetchTasks(false);
  }, [orgId, filtersKey, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Load more tasks
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchTasks(true);
  }, [hasMore, loading, fetchTasks]);

  /**
   * Refresh data (reset to first page)
   */
  const refresh = useCallback(async () => {
    lastDocRef.current = null;
    setHasMore(true);
    await fetchTasks(false);
  }, [fetchTasks]);

  /**
   * Update a single task
   */
  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      const data = toFirestore(updates);
      await updateDoc(doc(db, 'tasks', taskId), data);
      // Update local state optimistically
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
      );
    } catch (err) {
      logger.error('Failed to update task', { error: err, hook: 'useTasks' });
      toast.error('Failed to update task');
      throw err;
    }
  }, []);

  /**
   * Delete a single task
   */
  const deleteTask = useCallback(async (taskId: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      // Update local state optimistically
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success('Task deleted');
    } catch (err) {
      logger.error('Failed to delete task', { error: err, hook: 'useTasks' });
      toast.error('Failed to delete task');
      throw err;
    }
  }, []);

  /**
   * Move a task to a new status
   */
  const moveTask = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    try {
      const updates: Record<string, unknown> = {
        status: newStatus,
        updatedAt: Timestamp.now(),
      };
      if (newStatus === 'completed') {
        updates.completedAt = Timestamp.now();
      }
      await updateDoc(doc(db, 'tasks', taskId), updates);
      // Update local state optimistically
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: newStatus,
                completedAt: newStatus === 'completed' ? new Date() : t.completedAt,
              }
            : t
        )
      );
    } catch (err) {
      logger.error('Failed to move task', { error: err, hook: 'useTasks' });
      toast.error('Failed to update task status');
      throw err;
    }
  }, []);

  return {
    tasks,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    totalLoaded: tasks.length,
    pageSize,
    initialized,
    updateTask,
    deleteTask,
    moveTask,
  };
}
