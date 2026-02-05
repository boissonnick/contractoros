'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import type { PunchItem, PunchItemStatus } from '@/types';

interface UsePunchListOptions {
  projectId: string;
  status?: PunchItemStatus;
}

interface UsePunchListReturn {
  items: PunchItem[];
  loading: boolean;
  error: string | null;
  stats: {
    total: number;
    open: number;
    inProgress: number;
    readyForReview: number;
    approved: number;
    rejected: number;
    percentComplete: number;
  };
  createItem: (data: Partial<PunchItem>) => Promise<PunchItem>;
  updateItem: (itemId: string, data: Partial<PunchItem>) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  updateStatus: (itemId: string, status: PunchItemStatus) => Promise<void>;
  refresh: () => Promise<void>;
}

export function usePunchList({ projectId, status }: UsePunchListOptions): UsePunchListReturn {
  const { user: _user } = useAuth();
  const [items, setItems] = useState<PunchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (status) params.set('status', status);

      const res = await fetch(`/api/projects/${projectId}/punch-list?${params}`);
      if (!res.ok) throw new Error('Failed to fetch punch items');

      const data = await res.json();
      setItems(data.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [projectId, status]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const stats = {
    total: items.length,
    open: items.filter(i => i.status === 'open').length,
    inProgress: items.filter(i => i.status === 'in_progress').length,
    readyForReview: items.filter(i => i.status === 'ready_for_review').length,
    approved: items.filter(i => i.status === 'approved').length,
    rejected: items.filter(i => i.status === 'rejected').length,
    percentComplete: items.length > 0
      ? Math.round((items.filter(i => i.status === 'approved').length / items.length) * 100)
      : 0,
  };

  const createItem = async (data: Partial<PunchItem>) => {
    const res = await fetch(`/api/projects/${projectId}/punch-list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create item');
    const newItem = await res.json();
    setItems(prev => [newItem, ...prev]);
    return newItem;
  };

  const updateItem = async (itemId: string, data: Partial<PunchItem>) => {
    const res = await fetch(`/api/projects/${projectId}/punch-list/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update item');
    await fetchItems();
  };

  const deleteItem = async (itemId: string) => {
    const res = await fetch(`/api/projects/${projectId}/punch-list/${itemId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete item');
    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  const updateStatus = async (itemId: string, newStatus: PunchItemStatus) => {
    await updateItem(itemId, { status: newStatus });
  };

  return {
    items,
    loading,
    error,
    stats,
    createItem,
    updateItem,
    deleteItem,
    updateStatus,
    refresh: fetchItems,
  };
}
