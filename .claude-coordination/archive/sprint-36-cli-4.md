# Sprint 36: CLI 4 - Enhanced Client Portal Utils

You are CLI 4 for ContractorOS Sprint 36: Enhanced Client Portal.

Working directory: /Users/nickbodkins/contractoros/apps/web

## RULES
- Do NOT run tsc until ALL tasks complete
- Create files, commit, move on

---

## Task 1: useClientPortal Hook
Create: lib/hooks/useClientPortal.ts

```typescript
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
```

Commit: "feat(hooks): Add useClientPortal hook"

---

## Task 2: useSelections Hook
Create: lib/hooks/useSelections.ts

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ProjectSelection } from '@/types';

export function useSelections({ token }: { token: string }) {
  const [selections, setSelections] = useState<ProjectSelection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSelections = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/client/${token}/selections`);
      if (res.ok) {
        const data = await res.json();
        setSelections(data.selections || []);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchSelections(); }, [fetchSelections]);

  const approveSelection = async (selectionId: string, optionId: string) => {
    await fetch(`/api/client/${token}/selections`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selectionId, optionId, approved: true }),
    });
    await fetchSelections();
  };

  const stats = {
    total: selections.length,
    approved: selections.filter(s => s.clientApproved).length,
    pending: selections.filter(s => !s.clientApproved).length,
  };

  return { selections, loading, approveSelection, stats, refresh: fetchSelections };
}
```

Commit: "feat(hooks): Add useSelections hook"

---

## Task 3: useClientNotes Hook
Create: lib/hooks/useClientNotes.ts

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ClientNote } from '@/types';

export function useClientNotes({ token }: { token: string }) {
  const [notes, setNotes] = useState<ClientNote[]>([]);
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
```

Commit: "feat(hooks): Add useClientNotes hook"

---

## Task 4: Client Portal Utilities
Create: lib/client-portal/utils.ts

```typescript
import type { PhaseProgress } from '@/types';

export const SELECTION_CATEGORIES = [
  'flooring',
  'countertops',
  'cabinets',
  'fixtures',
  'lighting',
  'paint',
  'tile',
  'appliances',
  'hardware',
  'other',
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  flooring: 'Flooring',
  countertops: 'Countertops',
  cabinets: 'Cabinets',
  fixtures: 'Fixtures',
  lighting: 'Lighting',
  paint: 'Paint Colors',
  tile: 'Tile',
  appliances: 'Appliances',
  hardware: 'Hardware',
  other: 'Other',
};

export const DOCUMENT_CATEGORIES = [
  'contract',
  'plans',
  'permits',
  'invoices',
  'change_orders',
  'warranty',
  'other',
] as const;

export function calculateOverallProgress(phases: PhaseProgress[]): number {
  if (!phases.length) return 0;
  const total = phases.reduce((sum, p) => sum + p.percent, 0);
  return Math.round(total / phases.length);
}

export function groupPhotosByDate<T extends { createdAt: Date }>(
  photos: T[]
): Record<string, T[]> {
  return photos.reduce((acc, photo) => {
    const date = new Date(photo.createdAt).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(photo);
    return acc;
  }, {} as Record<string, T[]>);
}

export function filterDocumentsForClient<T extends { category?: string }>(
  docs: T[]
): T[] {
  const clientCategories = ['contract', 'plans', 'invoices', 'change_orders', 'warranty'];
  return docs.filter(d => !d.category || clientCategories.includes(d.category));
}

export function formatProgress(percent: number): string {
  return `${Math.round(percent)}%`;
}
```

Commit: "feat(client-portal): Add client portal utilities"

---

## Task 5: Module Exports
Create: lib/client-portal/index.ts

```typescript
export * from './utils';
```

Commit: "chore: Add client portal module exports"

---

## Final Step
```bash
npx tsc --noEmit 2>&1 | head -20
```

---

## AUTO-REPORT (Required - Do this when done)
```bash
echo "CLI: 4
STATUS: complete
TASK: Sprint 36 Utils - useClientPortal, useSelections, useClientNotes, utilities
COMMIT: $(git rev-parse --short HEAD)
MESSAGE: Ready for review" > /Users/nickbodkins/contractoros/.claude-coordination/cli-4-$(date +%s).status
```
