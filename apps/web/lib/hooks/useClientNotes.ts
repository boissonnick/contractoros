'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ClientPortalNote } from '@/types';

export function useClientNotes({ token }: { token: string }) {
  const [notes, setNotes] = useState<ClientPortalNote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/client/${token}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const createNote = async (content: string) => {
    await fetch(`/api/client/${token}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    await fetchNotes();
  };

  const markAddressed = async (noteId: string) => {
    await fetch(`/api/client/${token}/notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId, addressed: true }),
    });
    await fetchNotes();
  };

  return { notes, loading, createNote, markAddressed, refresh: fetchNotes };
}
