# Refactoring Opportunities & Architectural Improvements

> Branch: `feature/bug-fixes-1.28`
> Last Updated: 2026-01-28

---

## Overview

This document identifies code sections that should be refactored to:
1. Reduce code duplication
2. Improve maintainability
3. Reduce token usage for future AI-assisted development
4. Establish consistent patterns
5. Enable easier testing

---

## REFACTOR #1: Modal Component Consolidation

### Current State
Multiple modal implementations with inconsistent patterns:

| File | Pattern | Scroll | Close | Transitions |
|------|---------|--------|-------|-------------|
| TaskDetailModal.tsx | Custom div | overflow-y-auto on outer | X button | None |
| SubDetailModal.tsx | Custom div | max-h-[90vh] + flex | X button | None |
| PhaseDetailModal.tsx | Custom div | Varies | X button | None |
| ConfirmDialog.tsx | Headless UI | N/A (short) | Both | Transition |

### Proposed Solution

Create `BaseModal` component:

```tsx
// apps/web/components/ui/BaseModal.tsx
interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
  footer?: React.ReactNode;
  preventClose?: boolean; // For dirty state
  onCloseAttempt?: () => void; // Called when close blocked
}
```

**Benefits:**
- Single source of truth for modal behavior
- Consistent animations and accessibility
- Built-in dirty state support
- Easier to test one component

### Files to Create
```
apps/web/components/ui/BaseModal.tsx
apps/web/lib/hooks/useModalDirtyState.ts
```

### Files to Modify
```
apps/web/components/tasks/TaskDetailModal.tsx
apps/web/components/subcontractors/SubDetailModal.tsx
apps/web/components/projects/phases/PhaseDetailModal.tsx
apps/web/components/projects/punchlist/PunchItemDetailModal.tsx
apps/web/components/projects/rfis/RFIDetailModal.tsx
apps/web/components/projects/submittals/SubmittalDetailModal.tsx
```

### Estimated Impact
- **Lines reduced:** ~200-300 across all modals
- **Bugs prevented:** Scroll issues, close behavior, accessibility
- **Token savings:** ~40% on modal-related operations

---

## REFACTOR #2: Form Component Library

### Current State
Forms implemented inconsistently:
- Some use React Hook Form + Zod
- Some use uncontrolled inputs
- Validation feedback varies by form
- Required field indicators missing

### Proposed Solution

Create form primitives:

```tsx
// apps/web/components/ui/FormField.tsx
interface FormFieldProps {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

// Usage:
<FormField label="Company Name" name="company" required error={errors.company}>
  <Input {...register('company')} />
</FormField>
```

```tsx
// apps/web/components/ui/FormSection.tsx
interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}
```

```tsx
// apps/web/components/ui/FormActions.tsx
interface FormActionsProps {
  onCancel?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  isDirty?: boolean;
}
```

### Files to Create
```
apps/web/components/ui/FormField.tsx
apps/web/components/ui/FormSection.tsx
apps/web/components/ui/FormActions.tsx
apps/web/components/ui/FormError.tsx
apps/web/lib/hooks/useFormWithValidation.ts
```

### Forms to Update
```
apps/web/components/subcontractors/SubForm.tsx
apps/web/components/tasks/TaskForm.tsx
apps/web/components/projects/phases/PhaseForm.tsx
apps/web/components/projects/scope/ScopeItemForm.tsx
apps/web/components/projects/change-orders/ChangeOrderForm.tsx
apps/web/app/dashboard/settings/organization/page.tsx
```

### Estimated Impact
- **Consistency:** All forms behave identically
- **Accessibility:** Proper label/input association
- **Token savings:** ~50% on form-related operations

---

## REFACTOR #3: Toast/Notification System

### Current State
From CLAUDE.md: "Silent error handling — no toast notifications on failures"

Currently:
- No centralized toast system
- `Toast.tsx` exists but unclear if used
- CRUD operations fail silently
- Users have no feedback

### Proposed Solution

Implement react-hot-toast with custom wrapper:

```tsx
// apps/web/lib/toast.ts
import toast from 'react-hot-toast';

export const showToast = {
  success: (message: string) => toast.success(message),
  error: (message: string, options?: { retry?: () => void }) => {
    toast.error(message, {
      action: options?.retry ? { label: 'Retry', onClick: options.retry } : undefined,
    });
  },
  loading: (message: string) => toast.loading(message),
  promise: <T>(promise: Promise<T>, messages: { loading: string; success: string; error: string }) =>
    toast.promise(promise, messages),
};
```

### Integration Points
Every hook with CRUD operations needs toast calls:

```
lib/hooks/useTasks.ts        → add, update, delete
lib/hooks/usePhases.ts       → add, update, delete, status change
lib/hooks/useScopes.ts       → add, update, approve, reject
lib/hooks/useChangeOrders.ts → add, update, approve, reject
lib/hooks/useSubcontractors.ts → add, update, delete
lib/hooks/useTaxRates.ts     → add, update, delete
```

### Files to Modify
```
apps/web/components/Providers.tsx (add Toaster)
apps/web/lib/hooks/*.ts (all hooks with mutations)
apps/web/components/ui/Toast.tsx (replace or remove)
```

### Estimated Impact
- **UX improvement:** Users know operations succeed/fail
- **Debugging:** Visible error messages
- **Retry capability:** Users can retry failed operations

---

## REFACTOR #4: Error Boundary Enhancement

### Current State
- Single ErrorBoundary at app level
- Errors crash entire page
- No graceful recovery

### Proposed Solution

Create granular error boundaries:

```tsx
// apps/web/components/ErrorBoundary.tsx (enhanced)
interface ErrorBoundaryProps {
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
  children: React.ReactNode;
}

// Default fallback with retry
const DefaultFallback = ({ reset }) => (
  <div className="p-4 bg-red-50 rounded-lg">
    <p className="text-red-800">Something went wrong</p>
    <Button onClick={reset}>Try Again</Button>
  </div>
);
```

### Implementation Strategy
1. Wrap each major section in ErrorBoundary
2. Create route-level error.tsx files (Next.js 14 convention)
3. Log errors to monitoring (future: Sentry)

### Files to Create/Modify
```
apps/web/app/dashboard/error.tsx
apps/web/app/dashboard/projects/error.tsx
apps/web/app/dashboard/projects/[id]/error.tsx
apps/web/components/ErrorBoundary.tsx
```

### Estimated Impact
- **Resilience:** Errors don't crash whole app
- **Recovery:** Users can retry without refresh
- **Debugging:** Errors logged with context

---

## REFACTOR #5: AuthProvider Architecture

### Current State
From CLAUDE.md: "AuthProvider architecture needs refactoring"

`lib/auth.tsx` likely has:
- Mixed concerns (auth state + user profile + permissions)
- Complex loading states
- Token refresh issues

### Proposed Solution

Separate concerns into distinct providers:

```tsx
// apps/web/lib/auth/AuthProvider.tsx
// Handles: Firebase auth state only

// apps/web/lib/auth/UserProfileProvider.tsx
// Handles: User document from Firestore

// apps/web/lib/auth/PermissionsProvider.tsx
// Handles: Role-based access control

// apps/web/lib/auth/index.tsx
// Composes all providers
```

### Hook Structure
```tsx
// Low-level auth state
const { user, loading, signIn, signOut } = useAuth();

// User profile data
const { profile, updateProfile } = useUserProfile();

// Permissions checks
const { can, role } = usePermissions();

// Combined convenience hook
const { user, profile, can, isLoading } = useSession();
```

### Files to Create
```
apps/web/lib/auth/AuthProvider.tsx
apps/web/lib/auth/UserProfileProvider.tsx
apps/web/lib/auth/PermissionsProvider.tsx
apps/web/lib/auth/index.tsx
apps/web/lib/hooks/useAuth.ts
apps/web/lib/hooks/useUserProfile.ts
apps/web/lib/hooks/usePermissions.ts
apps/web/lib/hooks/useSession.ts
```

### Estimated Impact
- **Maintainability:** Clear separation of concerns
- **Testing:** Each provider testable independently
- **Performance:** Selective re-renders

---

## REFACTOR #6: Firestore Hook Patterns

### Current State
Hooks in `lib/hooks/` have similar patterns but slight variations:
- Real-time subscriptions setup
- Loading/error state handling
- CRUD operation patterns
- Date/Timestamp conversion

### Proposed Solution

Create base hook factory:

```tsx
// apps/web/lib/hooks/createFirestoreHook.ts
interface FirestoreHookConfig<T> {
  collection: string | ((params: any) => string);
  transform?: (doc: DocumentData) => T;
  orderBy?: { field: string; direction: 'asc' | 'desc' };
}

export function createFirestoreHook<T>(config: FirestoreHookConfig<T>) {
  return function useCollection(params?: any) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Standard subscription logic
    // Standard CRUD operations
    // Standard date conversion

    return { data, loading, error, add, update, remove };
  };
}

// Usage:
export const useTasks = createFirestoreHook<Task>({
  collection: ({ projectId }) => `projects/${projectId}/tasks`,
  transform: (doc) => ({ ...doc, dueDate: doc.dueDate?.toDate() }),
  orderBy: { field: 'createdAt', direction: 'desc' },
});
```

### Benefits
- **Consistency:** All hooks behave identically
- **DRY:** No repeated boilerplate
- **Testing:** Test factory once, hooks automatically correct
- **Token savings:** ~60% when modifying hook behavior

### Files to Create
```
apps/web/lib/hooks/createFirestoreHook.ts
apps/web/lib/hooks/firestoreHelpers.ts
```

### Hooks to Refactor
```
apps/web/lib/hooks/useTasks.ts
apps/web/lib/hooks/usePhases.ts
apps/web/lib/hooks/useScopes.ts
apps/web/lib/hooks/useChangeOrders.ts
apps/web/lib/hooks/useSubcontractors.ts
apps/web/lib/hooks/useBids.ts
apps/web/lib/hooks/useTimeEntries.ts
apps/web/lib/hooks/useTaxRates.ts
```

---

## REFACTOR #7: Component Prop Patterns

### Current State
Components have inconsistent prop patterns:
- Some use `isOpen` / `onClose`
- Some use `open` / `setOpen`
- Some use `visible` / `onHide`

### Proposed Solution

Standardize on React/Headless UI conventions:

```typescript
// Modal pattern
interface ModalProps {
  open: boolean;
  onClose: () => void;
}

// Form pattern
interface FormProps {
  defaultValues?: Partial<FormData>;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel?: () => void;
}

// List pattern
interface ListProps<T> {
  items: T[];
  loading?: boolean;
  emptyMessage?: string;
  onItemClick?: (item: T) => void;
}
```

### Impact
- **Predictability:** Developers know prop names
- **IDE support:** Better autocomplete
- **Documentation:** Self-documenting patterns

---

## REFACTOR #8: Type Organization

### Current State
`types/index.ts` is 2,391 lines - difficult to navigate and maintain.

### Proposed Solution

Split by domain:

```
apps/web/types/
├── index.ts          # Re-exports all
├── auth.ts           # User, Org, permissions
├── projects.ts       # Project, Phase, Task
├── scope.ts          # Scope, ScopeItem, SOW
├── change-orders.ts  # ChangeOrder, Approval
├── subcontractors.ts # Subcontractor, Bid
├── time.ts           # TimeEntry, Timesheet
├── financial.ts      # Estimate, Invoice, Payment
├── integrations.ts   # Accounting, Sync
└── common.ts         # Shared utilities
```

### Migration Strategy
1. Create new files with types
2. Update `index.ts` to re-export
3. Existing imports continue to work
4. Gradually update imports to specific files

### Benefits
- **Navigation:** Find types faster
- **Maintainability:** Smaller files to edit
- **Tree-shaking:** Import only needed types
- **Token savings:** AI reads smaller files

---

## REFACTOR #9: Page Component Patterns

### Current State
Page components in `app/` directory have varying structures:
- Some fetch data in component
- Some use hooks
- Loading states inconsistent
- Error handling varies

### Proposed Solution

Standardize page template:

```tsx
// Template for all pages
export default function SomePage() {
  // 1. Auth check (if needed)
  const { user } = useSession();

  // 2. Route params
  const params = useParams();

  // 3. Data hooks
  const { data, loading, error } = useData(params.id);

  // 4. Local state
  const [modalOpen, setModalOpen] = useState(false);

  // 5. Loading state
  if (loading) return <PageSkeleton />;

  // 6. Error state
  if (error) return <PageError error={error} />;

  // 7. Empty state
  if (!data) return <EmptyState />;

  // 8. Main render
  return (
    <PageLayout title="...">
      {/* Content */}
    </PageLayout>
  );
}
```

### Files to Create
```
apps/web/components/ui/PageLayout.tsx
apps/web/components/ui/PageSkeleton.tsx
apps/web/components/ui/PageError.tsx
apps/web/components/ui/EmptyState.tsx
```

---

## IMPLEMENTATION PRIORITY

### Phase 1: Foundation (Do First)
1. REFACTOR #3: Toast System - Immediate UX win
2. REFACTOR #2: FormField component - Enables #19 (required indicators)
3. REFACTOR #1: BaseModal - Fixes multiple bugs at once

### Phase 2: Architecture
4. REFACTOR #5: AuthProvider - Addresses known tech debt
5. REFACTOR #6: Firestore Hook Factory - Reduces future work
6. REFACTOR #4: Error Boundaries - Improves stability

### Phase 3: Organization
7. REFACTOR #8: Type splitting - Maintainability
8. REFACTOR #9: Page patterns - Consistency
9. REFACTOR #7: Prop standardization - DX improvement

---

## METRICS TO TRACK

| Metric | Before | Target |
|--------|--------|--------|
| Modal component LOC | ~800 total | ~300 total |
| Form validation consistency | ~40% | 100% |
| Error feedback coverage | ~10% | 100% |
| Test coverage | 0% | 50% critical paths |
| Type file size | 2,391 lines | <500 lines per file |
| Hook boilerplate per hook | ~80 lines | ~10 lines |

---

## TOKEN OPTIMIZATION NOTES

For AI-assisted development, these refactors provide significant benefits:

1. **BaseModal**: Instead of reading 5 different modal implementations, read one.

2. **FormField**: Standard pattern means AI doesn't need to analyze each form's validation approach.

3. **Firestore Hook Factory**: Modifying behavior in one place affects all hooks - fewer files to change.

4. **Type splitting**: AI can load only relevant type files, not entire 2,400 line file.

5. **Page patterns**: Consistent structure means AI can focus on business logic, not boilerplate.

**Estimated token reduction per operation:**
- Modal fixes: 40-60% reduction
- Form fixes: 50-70% reduction
- Hook modifications: 60-80% reduction
- Type updates: 30-50% reduction
