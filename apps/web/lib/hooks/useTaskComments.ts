"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { TaskComment } from '@/types';
import { useAuth } from '@/lib/auth';
import { logger } from '@/lib/utils/logger';

function fromFirestore(id: string, data: Record<string, unknown>): TaskComment {
  return {
    id,
    taskId: data.taskId as string,
    userId: data.userId as string,
    userName: data.userName as string,
    userAvatar: data.userAvatar as string | undefined,
    content: data.content as string,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
  };
}

export interface UseTaskCommentsReturn {
  comments: TaskComment[];
  loading: boolean;
  error: string | null;
  addComment: (content: string) => Promise<string>;
  updateComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
}

export function useTaskComments(taskId: string | null): UseTaskCommentsReturn {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
      setComments([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'tasks', taskId, 'comments'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const result: TaskComment[] = [];
        snapshot.forEach((docSnap) => {
          result.push(fromFirestore(docSnap.id, docSnap.data()));
        });
        setComments(result);
        setLoading(false);
        setError(null);
      },
      (err) => {
        logger.error('Task comments listener error', { error: err, hook: 'useTaskComments' });
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [taskId]);

  const addComment = useCallback(
    async (content: string): Promise<string> => {
      if (!taskId || !user) throw new Error('Missing task or user');

      const data = {
        taskId,
        userId: user.uid,
        userName: profile?.displayName || user.email || 'Unknown',
        userAvatar: profile?.photoURL || null,
        content,
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'tasks', taskId, 'comments'), data);
      return docRef.id;
    },
    [taskId, user, profile]
  );

  const updateComment = useCallback(
    async (commentId: string, content: string) => {
      if (!taskId) throw new Error('Missing task');
      await updateDoc(doc(db, 'tasks', taskId, 'comments', commentId), {
        content,
        updatedAt: Timestamp.now(),
      });
    },
    [taskId]
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      if (!taskId) throw new Error('Missing task');
      await deleteDoc(doc(db, 'tasks', taskId, 'comments', commentId));
    },
    [taskId]
  );

  return { comments, loading, error, addComment, updateComment, deleteComment };
}
