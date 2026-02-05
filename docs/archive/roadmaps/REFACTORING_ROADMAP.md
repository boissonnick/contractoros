# ContractorOS Refactoring Roadmap

> **Purpose:** Reduce code duplication, speed up feature development, minimize token waste during AI sessions.
> **Created:** 2026-01-29
> **Estimated Impact:** ~30% code reduction, ~70% faster feature development

---

## Executive Summary

The codebase has grown organically with significant copy-paste patterns. This roadmap prioritizes refactoring that will:
1. **Reduce tokens** - Smaller, focused files instead of large monoliths
2. **Speed development** - Reusable abstractions instead of copy-paste
3. **Prevent bugs** - Centralized logic instead of duplicated implementations

---

## Phase 1: Foundation Utilities (Immediate - Do First)

### 1.1 Firestore Timestamp Converter
**File:** `lib/firebase/timestamp-converter.ts`
**Impact:** Used by 8+ hooks, saves ~60 lines
**Current duplication in:** useClients, useExpenses, useTasks, useTimeEntries, useMaterials, useSubcontractors, usePayroll, useDailyLogs

```typescript
// Create this utility
export function convertFirestoreTimestamps<T extends Record<string, unknown>>(
  data: T,
  dateFields: (keyof T)[]
): T {
  const result = { ...data };
  for (const field of dateFields) {
    const value = result[field];
    if (value && typeof value === 'object' && 'toDate' in value) {
      (result as Record<string, unknown>)[field as string] = (value as { toDate: () => Date }).toDate();
    }
  }
  return result;
}

// Common date field configs per entity
export const DATE_FIELDS = {
  client: ['createdAt', 'updatedAt', 'lastContactDate'],
  expense: ['createdAt', 'updatedAt', 'date', 'approvedAt', 'reimbursedAt'],
  task: ['createdAt', 'updatedAt', 'dueDate', 'startDate', 'completedAt'],
  timeEntry: ['createdAt', 'updatedAt', 'clockIn', 'clockOut'],
  // ... etc
} as const;
```

### 1.2 Generic Firestore Collection Hook
**File:** `lib/hooks/useFirestoreCollection.ts`
**Impact:** Replaces repetitive query logic in 8+ hooks, saves ~300 lines

```typescript
export function useFirestoreCollection<T>({
  path,
  constraints,
  converter,
  enabled = true,
}: {
  path: string;
  constraints: QueryConstraint[];
  converter: (id: string, data: DocumentData) => T;
  enabled?: boolean;
}) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, path), ...constraints);
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => converter(doc.id, doc.data()));
        setItems(data);
        setLoading(false);
      },
      (err) => {
        console.error(`Error fetching ${path}:`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [path, JSON.stringify(constraints), enabled]);

  return { items, loading, error, refetch: () => setLoading(true) };
}
```

### 1.3 Generic CRUD Operations
**File:** `lib/hooks/useFirestoreCrud.ts`
**Impact:** Centralizes create/update/delete with toast handling, saves ~400 lines

```typescript
export function useFirestoreCrud<T extends { id?: string }>(
  collectionPath: string,
  options?: {
    toFirestore?: (item: Partial<T>) => Record<string, unknown>;
    entityName?: string; // For toast messages
  }
) {
  const create = useCallback(async (data: Omit<T, 'id' | 'createdAt'>) => {
    const docData = options?.toFirestore?.(data as Partial<T>) ?? data;
    const docRef = await addDoc(collection(db, collectionPath), {
      ...docData,
      createdAt: Timestamp.now(),
    });
    toast.success(`${options?.entityName || 'Item'} created`);
    return docRef.id;
  }, [collectionPath]);

  const update = useCallback(async (id: string, data: Partial<T>) => {
    const docData = options?.toFirestore?.(data) ?? data;
    await updateDoc(doc(db, collectionPath, id), {
      ...docData,
      updatedAt: Timestamp.now(),
    });
    toast.success(`${options?.entityName || 'Item'} updated`);
  }, [collectionPath]);

  const remove = useCallback(async (id: string) => {
    await deleteDoc(doc(db, collectionPath, id));
    toast.success(`${options?.entityName || 'Item'} deleted`);
  }, [collectionPath]);

  return { create, update, remove };
}
```

---

## Phase 2: UI Component Library (High Priority)

### 2.1 Missing Form Components
**Location:** `components/ui/`

| Component | Used By | Current State |
|-----------|---------|---------------|
| `Select.tsx` | 10+ pages | Using raw `<select>` |
| `Checkbox.tsx` | 5+ forms | Using raw `<input type="checkbox">` |
| `DatePicker.tsx` | 8+ forms | Inconsistent implementations |
| `TagInput.tsx` | 3+ forms | Duplicated add/remove logic |
| `MultiSelect.tsx` | 2+ forms | Not standardized |

**Priority:** Create `Select.tsx` and `DatePicker.tsx` first (highest reuse).

### 2.2 Page Layout Components
**Location:** `components/ui/`

```typescript
// PageHeader.tsx - Used by 5+ pages
export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}) { ... }

// StatsGrid.tsx - Used by 4+ pages
export function StatsGrid({
  stats,
}: {
  stats: Array<{
    label: string;
    value: string | number;
    icon?: React.ComponentType<{ className?: string }>;
    change?: { value: number; trend: 'up' | 'down' };
  }>;
}) { ... }

// FilterBar.tsx - Used by 6+ pages
export function FilterBar({
  searchPlaceholder,
  onSearch,
  filters,
  onFilterChange,
}: {
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  filters?: Array<{
    key: string;
    label: string;
    options: Array<{ label: string; value: string }>;
  }>;
  onFilterChange?: (key: string, value: string) => void;
}) { ... }
```

### 2.3 FormModal Component
**File:** `components/ui/FormModal.tsx`
**Impact:** Replaces boilerplate in 5+ modal components

```typescript
export function FormModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  onSubmit,
  submitLabel = 'Save',
  loading = false,
  size = 'md',
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onSubmit: () => void | Promise<void>;
  submitLabel?: string;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} size={size}>
      <form onSubmit={async (e) => { e.preventDefault(); await onSubmit(); }}>
        <div className="p-6">
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
          <div className="mt-4 space-y-4">
            {children}
          </div>
        </div>
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
```

---

## Phase 3: Type Organization (Medium Priority)

### 3.1 Split Types File
**Current:** `types/index.ts` (6000+ lines)
**Target:** Domain-specific type files with barrel export

```
types/
├── index.ts          # Re-exports all (keeps imports working)
├── core.ts           # User, Organization, Auth (~200 lines)
├── project.ts        # Project, Phase, Task (~400 lines)
├── financial.ts      # Invoice, Estimate, Expense, Payroll (~600 lines)
├── scheduling.ts     # Schedule, TimeEntry, DailyLog (~300 lines)
├── client.ts         # Client, ClientNote, Communication (~150 lines)
├── materials.ts      # Materials, Equipment, PO (~400 lines)
├── documents.ts      # SOW, ChangeOrder, RFI, Submittal (~400 lines)
└── constants.ts      # All const arrays (TRADES, STATUSES, etc.)
```

**Migration approach:**
1. Create new files with copied types
2. Update `index.ts` to re-export from new files
3. No import changes needed in consuming code
4. Delete original definitions from `index.ts`

---

## Phase 4: Page Templates (Lower Priority)

### 4.1 DataListPage Template
For pages that follow: Header → Stats → Search/Filter → List → Modals

```typescript
// components/templates/DataListPage.tsx
export function DataListPage<T>({
  title,
  description,
  stats,
  searchPlaceholder,
  filters,
  items,
  loading,
  error,
  emptyState,
  renderItem,
  addButton,
}: DataListPageProps<T>) { ... }

// Usage in clients/page.tsx becomes:
<DataListPage
  title="Clients"
  description="Manage your client relationships"
  stats={clientStats}
  items={clients}
  loading={loading}
  filters={[{ key: 'status', options: STATUS_OPTIONS }]}
  renderItem={(client) => <ClientCard client={client} />}
  addButton={{ label: 'Add Client', onClick: () => setShowAdd(true) }}
/>
```

---

## Implementation Priority

### Sprint A: Foundation (Do This First)
1. `lib/firebase/timestamp-converter.ts` - 30 min
2. `lib/hooks/useFirestoreCollection.ts` - 1 hour
3. `lib/hooks/useFirestoreCrud.ts` - 1 hour
4. Refactor ONE hook (useClients) to use new utilities - 1 hour

### Sprint B: UI Components
1. `components/ui/Select.tsx` - 30 min
2. `components/ui/DatePicker.tsx` - 45 min
3. `components/ui/FormModal.tsx` - 30 min
4. `components/ui/PageHeader.tsx` - 30 min
5. `components/ui/StatsGrid.tsx` - 30 min
6. `components/ui/FilterBar.tsx` - 30 min

### Sprint C: Type Reorganization
1. Create type files (copy, don't delete yet)
2. Update index.ts to re-export
3. Verify no breaking changes
4. Remove duplicates from index.ts

### Sprint D: Page Templates
1. Create `DataListPage` template
2. Refactor one page (clients) to use template
3. Document pattern
4. Gradually migrate other pages

---

## File Size Targets

After refactoring, file sizes should be:

| File | Current | Target |
|------|---------|--------|
| `types/index.ts` | 6000 lines | 100 lines (re-exports) |
| `useClients.ts` | 490 lines | 150 lines |
| `useExpenses.ts` | 432 lines | 120 lines |
| `clients/page.tsx` | 300 lines | 100 lines |
| Modal components | 200-400 lines | 80-150 lines |

---

## AI Session Optimization

After this refactoring:

**Before:** To add a CRUD feature, AI must:
- Read 500-line reference hook
- Read 300-line reference modal
- Read 6000-line types file
- Copy-paste and modify ~900 lines

**After:** To add a CRUD feature, AI must:
- Read 50-line generic hook usage example
- Read 80-line FormModal usage example
- Read ~100-line type section
- Write ~260 lines of new code

**Token savings per feature: ~70%**

---

## Checklist for New Features (Post-Refactor)

When building a new CRUD module:

```markdown
## New Module: [Name]

### Types (types/[domain].ts)
- [ ] Define entity interface
- [ ] Define status type
- [ ] Add to DATE_FIELDS config
- [ ] Export from types/index.ts

### Hook (lib/hooks/use[Module].ts)
- [ ] Use useFirestoreCollection for list
- [ ] Use useFirestoreCrud for operations
- [ ] Add custom methods if needed

### Components (components/[module]/)
- [ ] Card component (for list items)
- [ ] FormModal (using FormModal base)
- [ ] index.ts exports

### Page (app/dashboard/[module]/page.tsx)
- [ ] Use DataListPage template OR
- [ ] Use PageHeader + FilterBar + list

### Firestore
- [ ] Add rules to firestore.rules
- [ ] Add indexes if needed
- [ ] Deploy: firebase deploy --only firestore
```

---

## Notes

- **Don't refactor everything at once** - Do incrementally as you touch files
- **Keep backwards compatibility** - Old patterns should still work
- **Document as you go** - Update DEVELOPMENT_GUIDE.md with new patterns
- **Test after each change** - Run `npx tsc --noEmit` frequently
