# ContractorOS Development Guide

> **Purpose:** Enable any developer or AI assistant to pick up work seamlessly across sessions.
> **Last Updated:** 2026-01-28
> **Current Sprint:** Sprint 4 (Client Management) - COMPLETED

---

## Quick Start for New Sessions

### 1. Understand Current State
```bash
# Check what's been worked on
git status
git log --oneline -10

# Read the sprint status
cat docs/SPRINT_STATUS.md
```

### 2. Key Documents to Read
| Document | Purpose | When to Read |
|----------|---------|--------------|
| `CLAUDE.md` | Architecture, commands, secrets | Every session |
| `docs/SPRINT_STATUS.md` | Current progress, next tasks | Every session |
| `docs/bugfixes/MASTER_ROADMAP.md` | Full backlog, priorities | When starting new features |
| `docs/ARCHITECTURE.md` | Technical patterns, conventions | When building new modules |
| `docs/COMPONENT_PATTERNS.md` | UI component usage | When building UI |

### 3. Before Writing Code
1. Run TypeScript check: `cd apps/web && npx tsc --noEmit`
2. Check for existing patterns in similar modules
3. Update `SPRINT_STATUS.md` with what you're working on

---

## Project Structure

```
contractoros/
├── apps/web/                    # Next.js 14 frontend
│   ├── app/                     # App Router pages
│   │   ├── dashboard/           # Main contractor portal
│   │   ├── client/              # Client portal (magic link)
│   │   ├── sub/                 # Subcontractor portal
│   │   ├── field/               # Field worker portal
│   │   ├── sign/                # E-signature public pages
│   │   └── portal/              # Client portal (planned)
│   ├── components/              # React components
│   │   ├── ui/                  # Shared primitives (Button, Card, etc.)
│   │   ├── projects/            # Project-related components
│   │   ├── tasks/               # Task components
│   │   ├── clients/             # Client management (NEW)
│   │   └── esignature/          # E-signature components
│   ├── lib/                     # Utilities and hooks
│   │   ├── hooks/               # Custom React hooks
│   │   ├── firebase/            # Firebase config
│   │   ├── esignature/          # E-signature services
│   │   └── theme/               # Theme provider
│   └── types/                   # TypeScript types
├── functions/                   # Firebase Cloud Functions
│   └── src/
│       ├── index.ts             # Function exports
│       └── email/               # Email templates and senders
└── docs/                        # Documentation
    ├── DEVELOPMENT_GUIDE.md     # This file
    ├── ARCHITECTURE.md          # Technical architecture
    ├── SPRINT_STATUS.md         # Current progress
    ├── COMPONENT_PATTERNS.md    # UI patterns
    └── bugfixes/                # Roadmap and planning
        └── MASTER_ROADMAP.md    # Single source of truth
```

---

## Development Workflow

### Starting a New Feature

1. **Find the feature in MASTER_ROADMAP.md**
   ```bash
   # Search for feature
   grep -n "FEAT-" docs/bugfixes/MASTER_ROADMAP.md
   ```

2. **Check for existing similar patterns**
   ```bash
   # Example: Building a new module like "vendors"
   # Look at how "clients" was built
   ls -la apps/web/app/dashboard/clients/
   ls -la apps/web/components/clients/
   cat apps/web/lib/hooks/useClients.ts
   ```

3. **Create the standard structure**
   - Page: `apps/web/app/dashboard/{module}/page.tsx`
   - Detail: `apps/web/app/dashboard/{module}/[id]/page.tsx`
   - Hook: `apps/web/lib/hooks/use{Module}.ts`
   - Components: `apps/web/components/{module}/`
   - Types: Add to `apps/web/types/index.ts`

4. **Update documentation**
   - Add to `SPRINT_STATUS.md`
   - Update `ARCHITECTURE.md` if adding new patterns

### Code Conventions

#### File Naming
- Pages: `page.tsx` (Next.js App Router convention)
- Components: `PascalCase.tsx` (e.g., `AddClientModal.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useClients.ts`)
- Types: Add to central `types/index.ts`

#### Component Structure
```typescript
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useMyHook } from '@/lib/hooks/useMyHook';
import { Button, Card } from '@/components/ui';
import { SomeIcon } from '@heroicons/react/24/outline';

interface MyComponentProps {
  // Props
}

export function MyComponent({ ...props }: MyComponentProps) {
  // State
  // Effects
  // Handlers
  // Render
}

export default MyComponent;
```

#### Hook Structure
```typescript
import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, query, where, onSnapshot, doc, addDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const COLLECTION_NAME = 'myCollection';

// Labels/constants
export const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
};

// Main list hook
export function useMyItems(options: { orgId: string; filter?: string }) {
  const [items, setItems] = useState<MyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!options.orgId) return;

    const q = query(
      collection(db, COLLECTION_NAME),
      where('orgId', '==', options.orgId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as MyType[];
      setItems(data);
      setLoading(false);
    }, (err) => {
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [options.orgId]);

  return { items, loading, error };
}

// Single item hook with CRUD
export function useMyItem(itemId: string | undefined, orgId: string) {
  // Similar pattern with updateItem, deleteItem methods
}

// Helper functions
export async function createMyItem(data: Omit<MyType, 'id' | 'createdAt'>) {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...data,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}
```

---

## Module Completion Checklist

When building a new module, ensure these are complete:

### Data Layer
- [ ] Types defined in `types/index.ts`
- [ ] Main list hook (`useItems`)
- [ ] Single item hook with CRUD (`useItem`)
- [ ] Helper functions for create/update
- [ ] Label constants exported

### Pages
- [ ] List page with search/filter
- [ ] Detail page with tabs (if applicable)
- [ ] Loading states (Skeleton components)
- [ ] Empty states
- [ ] Error handling

### Components
- [ ] Add modal (multi-step if complex)
- [ ] Edit modal
- [ ] List item card
- [ ] Status badges
- [ ] Index file exporting all components

### Integration
- [ ] TypeScript passes (`npx tsc --noEmit`)
- [ ] Navigation added to AppShell (if applicable)
- [ ] Sprint status updated

---

## Common Patterns

### Modal Pattern
```typescript
interface MyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (id: string) => void;
}

export function MyModal({ isOpen, onClose, onSuccess }: MyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Title</h2>
          <button onClick={onClose}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        {/* Content */}
        <form className="p-4 space-y-4">
          {/* Form fields */}
        </form>
      </Card>
    </div>
  );
}
```

### Form with Zod Validation
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  status: z.enum(['active', 'inactive'] as const),
});

type FormData = z.infer<typeof schema>;

// In component:
const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: { status: 'active' },
});
```

### Tab Pattern
```typescript
type TabType = 'overview' | 'details' | 'history';

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <HomeIcon className="h-4 w-4" /> },
  // ...
];

const [activeTab, setActiveTab] = useState<TabType>('overview');

// Render tabs
<div className="border-b">
  <nav className="flex gap-4">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={cn(
          "flex items-center gap-2 px-4 py-3 border-b-2",
          activeTab === tab.id
            ? "border-brand-primary text-brand-primary"
            : "border-transparent text-gray-500"
        )}
      >
        {tab.icon}
        {tab.label}
      </button>
    ))}
  </nav>
</div>
```

---

## Firestore Collections

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| `users` | User profiles | uid, orgId, email, role |
| `organizations` | Org settings | name, ownerId, settings |
| `projects` | Projects | orgId, name, status, clientId |
| `phases` | Project phases | projectId, name, order |
| `tasks` | Tasks | projectId, phaseId, assignees |
| `clients` | Client CRM | orgId, name, status, financials |
| `signatureRequests` | E-signatures | orgId, documentType, status |
| `communicationLogs` | Client comms | clientId, type, content |

---

## Troubleshooting

### TypeScript Errors
```bash
# Full check
cd apps/web && npx tsc --noEmit

# Check specific file
npx tsc --noEmit apps/web/components/myfile.tsx
```

### Common Type Issues
1. **Missing fields**: Check the type definition in `types/index.ts`
2. **Omit types**: Use `Omit<Type, 'field1' | 'field2'>` for partial types
3. **Optional vs required**: Add `?` for optional, ensure required fields exist

### Firestore Issues
1. **Permission denied**: Check `firestore.rules`
2. **Missing index**: Firebase console will show required index link
3. **Type mismatch**: Ensure Timestamp conversion with `.toDate()`

---

## Quick Reference

### Commands
```bash
npm run dev              # Start dev server
npm run build            # Production build
npx tsc --noEmit         # Type check
npm run emulators        # Firebase emulators
```

### Key Files
- Types: `apps/web/types/index.ts`
- Auth: `apps/web/lib/auth.tsx`
- Firebase: `apps/web/lib/firebase/config.ts`
- Theme: `apps/web/lib/theme/ThemeProvider.tsx`
- UI Components: `apps/web/components/ui/`

### Import Aliases
```typescript
import { X } from '@/components/ui';     // UI components
import { X } from '@/lib/hooks/useX';    // Hooks
import { X } from '@/lib/auth';          // Auth context
import { X } from '@/types';             // Types
```
