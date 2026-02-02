'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import type { CloseoutChecklistItem } from '@/types';
import { calculateCloseoutProgress } from '@/lib/closeout/checklist-templates';

interface UseCloseoutChecklistOptions {
  projectId: string;
}

interface CloseoutProgress {
  completed: number;
  total: number;
  percentage: number;
  byCategory: {
    documentation: { completed: number; total: number; percentage: number };
    inspection: { completed: number; total: number; percentage: number };
    client: { completed: number; total: number; percentage: number };
    financial: { completed: number; total: number; percentage: number };
    warranty: { completed: number; total: number; percentage: number };
  };
}

interface UseCloseoutChecklistReturn {
  items: CloseoutChecklistItem[];
  loading: boolean;
  error: string | null;
  progress: CloseoutProgress;
  toggleItem: (itemId: string) => Promise<void>;
  updateItemNotes: (itemId: string, notes: string) => Promise<void>;
  initializeChecklist: () => Promise<void>;
  refresh: () => Promise<void>;
  isComplete: boolean;
}

export function useCloseoutChecklist({ projectId }: UseCloseoutChecklistOptions): UseCloseoutChecklistReturn {
  const { user } = useAuth();
  const [items, setItems] = useState<CloseoutChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChecklist = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}/closeout`);
      if (!res.ok) throw new Error('Failed to fetch closeout checklist');

      const data = await res.json();
      setItems(data.items || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchChecklist();
  }, [fetchChecklist]);

  const progress = calculateCloseoutProgress(items);

  const toggleItem = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const newCompleted = !item.completed;

    // Optimistic update
    setItems(prev =>
      prev.map(i =>
        i.id === itemId
          ? {
              ...i,
              completed: newCompleted,
              completedAt: newCompleted ? new Date() : undefined,
              completedBy: newCompleted ? user?.uid : undefined,
            }
          : i
      )
    );

    try {
      const res = await fetch(`/api/projects/${projectId}/closeout/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completed: newCompleted,
          completedAt: newCompleted ? new Date().toISOString() : null,
          completedBy: newCompleted ? user?.uid : null,
        }),
      });

      if (!res.ok) throw new Error('Failed to update item');
    } catch (err) {
      // Revert on error
      setItems(prev =>
        prev.map(i =>
          i.id === itemId
            ? {
                ...i,
                completed: !newCompleted,
                completedAt: item.completedAt,
                completedBy: item.completedBy,
              }
            : i
        )
      );
      throw err;
    }
  };

  const updateItemNotes = async (itemId: string, notes: string) => {
    const res = await fetch(`/api/projects/${projectId}/closeout/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });

    if (!res.ok) throw new Error('Failed to update notes');

    setItems(prev =>
      prev.map(i => (i.id === itemId ? { ...i, notes } : i))
    );
  };

  const initializeChecklist = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}/closeout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) throw new Error('Failed to initialize checklist');

      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const isComplete = items.length > 0 && items.every(i => i.completed);

  return {
    items,
    loading,
    error,
    progress,
    toggleItem,
    updateItemNotes,
    initializeChecklist,
    refresh: fetchChecklist,
    isComplete,
  };
}
