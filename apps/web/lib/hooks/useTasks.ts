"use client";

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
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Task, TaskStatus, TaskPriority, TaskDependency, TaskAttachment, TaskChecklistItem, RecurrenceConfig } from '@/types';
import { useAuth } from '@/lib/auth';

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
        console.error('Tasks listener error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId, phaseId, parentTaskId]);

  const addTask = useCallback(
    async (input: NewTaskInput): Promise<string> => {
      if (!profile?.orgId) throw new Error('No organization');

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

      return docRef.id;
    },
    [projectId, profile, user, tasks]
  );

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    const data = toFirestore(updates);
    await updateDoc(doc(db, 'tasks', taskId), data);
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    await deleteDoc(doc(db, 'tasks', taskId));
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
    const batch = writeBatch(db);
    taskIds.forEach((id) => {
      const updates: Record<string, unknown> = { status, updatedAt: Timestamp.now() };
      if (status === 'completed') {
        updates.completedAt = Timestamp.now();
      }
      batch.update(doc(db, 'tasks', id), updates);
    });
    await batch.commit();
  }, []);

  const bulkAssign = useCallback(async (taskIds: string[], assigneeIds: string[]) => {
    const batch = writeBatch(db);
    taskIds.forEach((id) => {
      batch.update(doc(db, 'tasks', id), { assignedTo: assigneeIds, updatedAt: Timestamp.now() });
    });
    await batch.commit();
  }, []);

  const bulkDelete = useCallback(async (taskIds: string[]) => {
    const batch = writeBatch(db);
    taskIds.forEach((id) => {
      batch.delete(doc(db, 'tasks', id));
    });
    await batch.commit();
  }, []);

  const bulkSetPriority = useCallback(async (taskIds: string[], priority: TaskPriority) => {
    const batch = writeBatch(db);
    taskIds.forEach((id) => {
      batch.update(doc(db, 'tasks', id), { priority, updatedAt: Timestamp.now() });
    });
    await batch.commit();
  }, []);

  return {
    tasks, loading, error,
    addTask, updateTask, deleteTask, moveTask, reorderTasks,
    bulkUpdateStatus, bulkAssign, bulkDelete, bulkSetPriority,
  };
}
