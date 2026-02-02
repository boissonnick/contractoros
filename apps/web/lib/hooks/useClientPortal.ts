'use client';

import { useState, useEffect } from 'react';

interface UseClientPortalOptions {
  token: string;
}

export function useClientPortal({ token }: UseClientPortalOptions) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(null);
  const [selections, setSelections] = useState([]);
  const [notes, setNotes] = useState([]);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    if (!token) return;

    const fetchAll = async () => {
      try {
        setLoading(true);
        const [progressRes, selectionsRes, notesRes, docsRes] = await Promise.all([
          fetch(`/api/client/${token}/progress`),
          fetch(`/api/client/${token}/selections`),
          fetch(`/api/client/${token}/notes`),
          fetch(`/api/client/${token}/documents`),
        ]);

        if (progressRes.ok) setProgress(await progressRes.json());
        if (selectionsRes.ok) setSelections((await selectionsRes.json()).selections || []);
        if (notesRes.ok) setNotes((await notesRes.json()).notes || []);
        if (docsRes.ok) setDocuments((await docsRes.json()).documents || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [token]);

  return { loading, error, progress, selections, notes, documents };
}
