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
import { Task, TaskStatus, TaskPriority, TaskDependency, TaskAttachment } from '@/types';
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
        order: maxOrder,
        createdBy: user?.uid || '',
        createdAt: new Date(),
      });

      const docRef = await addDoc(collection(db, 'tasks'), taskData);
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

  return { tasks, loading, error, addTask, updateTask, deleteTask, moveTask, reorderTasks };
}
