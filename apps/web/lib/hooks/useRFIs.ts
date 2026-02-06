'use client';

import { useState, useEffect, useCallback } from 'react';
import type { RFI, RFIStatus } from '@/types';
import { toast } from '@/components/ui/Toast';

interface UseRFIsOptions {
  projectId: string;
  status?: RFIStatus;
}

export function useRFIs({ projectId, status }: UseRFIsOptions) {
  const [rfis, setRFIs] = useState<RFI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRFIs = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (status) params.set('status', status);

      const res = await fetch(`/api/projects/${projectId}/rfis?${params}`);
      if (!res.ok) throw new Error('Failed to fetch RFIs');

      const data = await res.json();
      setRFIs(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [projectId, status]);

  useEffect(() => { fetchRFIs(); }, [fetchRFIs]);

  const createRFI = async (data: Partial<RFI>) => {
    const res = await fetch(`/api/projects/${projectId}/rfis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create RFI');
    const newRFI = await res.json();
    setRFIs(prev => [newRFI, ...prev]);
    toast.success('RFI created');
    return newRFI;
  };

  const updateRFI = async (rfiId: string, data: Partial<RFI>) => {
    const res = await fetch(`/api/projects/${projectId}/rfis/${rfiId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update RFI');
    await fetchRFIs();
    toast.success('RFI updated');
  };

  const respondToRFI = async (rfiId: string, _responseText: string) => {
    await updateRFI(rfiId, { status: 'answered' });
  };

  const closeRFI = async (rfiId: string) => {
    await updateRFI(rfiId, { status: 'closed' });
  };

  const stats = {
    total: rfis.length,
    draft: rfis.filter(r => r.status === 'draft').length,
    open: rfis.filter(r => r.status === 'open').length,
    pendingResponse: rfis.filter(r => r.status === 'pending_response').length,
    answered: rfis.filter(r => r.status === 'answered').length,
    closed: rfis.filter(r => r.status === 'closed').length,
    overdue: rfis.filter(r => r.dueDate && new Date(r.dueDate) < new Date() && r.status !== 'closed').length,
  };

  return { rfis, loading, error, stats, createRFI, updateRFI, respondToRFI, closeRFI, refresh: fetchRFIs };
}
