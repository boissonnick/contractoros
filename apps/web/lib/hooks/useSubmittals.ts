'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Submittal, SubmittalStatus } from '@/types';

interface UseSubmittalsOptions {
  projectId: string;
  status?: SubmittalStatus;
}

export function useSubmittals({ projectId, status }: UseSubmittalsOptions) {
  const [submittals, setSubmittals] = useState<Submittal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmittals = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (status) params.set('status', status);

      const res = await fetch(`/api/projects/${projectId}/submittals?${params}`);
      if (!res.ok) throw new Error('Failed to fetch submittals');

      const data = await res.json();
      setSubmittals(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [projectId, status]);

  useEffect(() => { fetchSubmittals(); }, [fetchSubmittals]);

  const createSubmittal = async (data: Partial<Submittal>) => {
    const res = await fetch(`/api/projects/${projectId}/submittals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create submittal');
    const newSubmittal = await res.json();
    setSubmittals(prev => [newSubmittal, ...prev]);
    return newSubmittal;
  };

  const updateSubmittal = async (submittalId: string, data: Partial<Submittal>) => {
    const res = await fetch(`/api/projects/${projectId}/submittals/${submittalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update submittal');
    await fetchSubmittals();
  };

  const approveSubmittal = async (submittalId: string, comments?: string) => {
    await updateSubmittal(submittalId, {
      status: 'approved',
      reviewComments: comments,
      reviewedAt: new Date(),
    });
  };

  const rejectSubmittal = async (submittalId: string, reason: string) => {
    await updateSubmittal(submittalId, {
      status: 'rejected',
      reviewComments: reason,
      reviewedAt: new Date(),
    });
  };

  const requestRevision = async (submittalId: string, comments: string) => {
    await updateSubmittal(submittalId, {
      status: 'revision_required',
      reviewComments: comments,
      reviewedAt: new Date(),
    });
  };

  const stats = {
    total: submittals.length,
    draft: submittals.filter(s => s.status === 'draft').length,
    submitted: submittals.filter(s => s.status === 'submitted').length,
    underReview: submittals.filter(s => s.status === 'under_review').length,
    approved: submittals.filter(s => s.status === 'approved').length,
    approvedAsNoted: submittals.filter(s => s.status === 'approved_as_noted').length,
    revisionRequired: submittals.filter(s => s.status === 'revision_required').length,
    rejected: submittals.filter(s => s.status === 'rejected').length,
  };

  return {
    submittals,
    loading,
    error,
    stats,
    createSubmittal,
    updateSubmittal,
    approveSubmittal,
    rejectSubmittal,
    requestRevision,
    refresh: fetchSubmittals,
  };
}
