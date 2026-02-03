# ContractorOS Component Patterns

> **Purpose:** UI component library reference and usage patterns.
> **Last Updated:** 2026-02-03

---

## Table of Contents

1. [Page Component Structure](#page-component-structure)
2. [Modal Component Structure](#modal-component-structure)
3. [Form Component Structure](#form-component-structure)
4. [List/Card Component Structure](#listcard-component-structure)
5. [Hook Usage Patterns](#hook-usage-patterns)
6. [Memoization Guidelines](#memoization-guidelines)
7. [UI Component Library](#ui-component-library)

---

## Page Component Structure

Dashboard pages follow a consistent structure with header, filters, stats, content, and loading/error states.

### Standard Page Layout

```tsx
"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useClients, useClientStats } from '@/lib/hooks/useClients';
import { Button, Card, Badge, PageHeader } from '@/components/ui';
import Skeleton, { SkeletonList } from '@/components/ui/Skeleton';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function ClientsPage() {
  const router = useRouter();
  const { profile } = useAuth();

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Data fetching with domain-specific hook
  const { clients, loading, error } = useClients({
    orgId: profile?.orgId || '',
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchQuery,
  });

  const { stats, loading: statsLoading } = useClientStats(profile?.orgId || '');

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <PageHeader
          title="Clients"
          description="Manage your client relationships"
          actions={
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          }
        />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden">
        <h1 className="text-xl font-bold text-gray-900">Clients</h1>
        <p className="text-xs text-gray-500">Manage relationships</p>
      </div>

      {/* Mobile Stats - Horizontal Scroll */}
      <div className="md:hidden flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
        {/* Compact stat cards */}
      </div>

      {/* Desktop Stats Grid */}
      <div className="hidden md:grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Full stat cards */}
      </div>

      {/* Filters */}
      <FilterSection
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      {/* Content with Loading/Error/Empty States */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <ExclamationCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading</h3>
          <p className="text-gray-500">{error.message}</p>
        </Card>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={<UserGroupIcon className="h-16 w-16" />}
          title={searchQuery ? "No matching clients" : "No clients yet"}
          description={searchQuery ? "Try adjusting your search." : "Add your first client."}
          action={!searchQuery ? { label: 'Add Client', onClick: () => setShowAddModal(true) } : undefined}
        />
      ) : (
        <div className="space-y-3">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}

      {/* Modal */}
      <AddClientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={(id) => router.push(`/dashboard/clients/${id}`)}
      />

      {/* Mobile FAB - positioned above bottom nav */}
      <button
        onClick={() => setShowAddModal(true)}
        className="md:hidden fixed right-4 bottom-20 w-14 h-14 rounded-full bg-brand-primary text-white shadow-lg z-30"
      >
        <PlusIcon className="h-6 w-6" />
      </button>
    </div>
  );
}
```

### Key Page Patterns

1. **Responsive Design**: Separate mobile and desktop layouts with `md:hidden` / `hidden md:block`
2. **Loading States**: Use Skeleton components during data fetch
3. **Error Handling**: Dedicated error card with icon and message
4. **Empty States**: Contextual message with primary action when appropriate
5. **Mobile FAB**: Floating action button positioned at `bottom-20` to avoid bottom nav

---

## UI Component Library

All shared components are in `apps/web/components/ui/` and exported from `index.ts`.

### Import Pattern
```typescript
import { Button, Card, Badge, EmptyState, Input } from '@/components/ui';
import { SkeletonCard, SkeletonList } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
```

---

## Core Components

### Button
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

// Usage
<Button variant="primary" onClick={handleSave}>
  <PlusIcon className="h-4 w-4 mr-2" />
  Add Item
</Button>

<Button variant="secondary" size="sm">
  Cancel
</Button>

<Button variant="danger" disabled={isLoading}>
  Delete
</Button>
```

### Card
```typescript
interface CardProps {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

// Usage
<Card className="p-6">
  <h3 className="font-semibold">Title</h3>
  <p className="text-gray-500">Content</p>
</Card>

// Clickable card
<Card
  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
  onClick={() => navigate()}
>
  Content
</Card>
```

### Badge
```typescript
interface BadgeProps {
  className?: string;
  children: React.ReactNode;
}

// Usage with color variants
const statusColors = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  inactive: 'bg-gray-100 text-gray-700',
};

<Badge className={statusColors[status]}>
  {statusLabel}
</Badge>
```

### EmptyState
```typescript
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Usage
<EmptyState
  icon={<UserGroupIcon className="h-full w-full" />}
  title="No clients yet"
  description="Add your first client to start tracking relationships."
  action={{
    label: 'Add Client',
    onClick: () => setShowAddModal(true),
  }}
/>
```

### Skeleton (Loading States)
```typescript
// Card skeleton
<SkeletonCard className="h-[200px]" />

// List skeleton
<SkeletonList count={5} />

// Inline skeleton
<div className="animate-pulse bg-gray-200 h-4 w-32 rounded" />
```

### Toast (Notifications)
```typescript
import { toast } from '@/components/ui/Toast';

// Success
toast.success('Client created successfully');

// Error
toast.error('Failed to save. Please try again.');

// Info
toast.info('Changes saved');

// Warning
toast.warning('This action cannot be undone');
```

---

## Form Components

### Input with Icon
```typescript
<div className="relative">
  <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
  <input
    {...register('email')}
    type="email"
    placeholder="email@example.com"
    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
  />
</div>
```

### Select Dropdown
```typescript
<select
  {...register('status')}
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
>
  {Object.entries(STATUS_LABELS).map(([value, label]) => (
    <option key={value} value={value}>{label}</option>
  ))}
</select>
```

### Textarea
```typescript
<textarea
  {...register('content')}
  rows={4}
  placeholder="Enter details..."
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
/>
```

### Radio Group
```typescript
<div className="flex gap-4">
  <label className="flex items-center gap-2 cursor-pointer">
    <input
      {...register('direction')}
      type="radio"
      value="outbound"
      className="text-brand-primary focus:ring-brand-primary"
    />
    <span className="text-sm">Outbound</span>
  </label>
  <label className="flex items-center gap-2 cursor-pointer">
    <input
      {...register('direction')}
      type="radio"
      value="inbound"
      className="text-brand-primary focus:ring-brand-primary"
    />
    <span className="text-sm">Inbound</span>
  </label>
</div>
```

### Error Display
```typescript
{errors.email && (
  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
)}
```

---

## Layout Patterns

### Page Header
```typescript
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-bold text-gray-900">Page Title</h1>
    <p className="text-gray-500 mt-1">Page description</p>
  </div>
  <Button variant="primary" onClick={() => setShowModal(true)}>
    <PlusIcon className="h-4 w-4 mr-2" />
    Add Item
  </Button>
</div>
```

### Stats Row
```typescript
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <Card className="p-4">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-blue-100 rounded-lg">
        <ChartIcon className="h-5 w-5 text-blue-600" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{count}</p>
        <p className="text-xs text-gray-500">Label</p>
      </div>
    </div>
  </Card>
  {/* More stat cards */}
</div>
```

### Search + Filter Bar
```typescript
<div className="flex flex-col sm:flex-row gap-4">
  <div className="relative flex-1">
    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
    <input
      type="text"
      placeholder="Search..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
    />
  </div>
  <div className="flex items-center gap-2">
    <FunnelIcon className="h-5 w-5 text-gray-400" />
    <select
      value={filter}
      onChange={(e) => setFilter(e.target.value)}
      className="px-3 py-2 border border-gray-300 rounded-lg"
    >
      <option value="all">All</option>
      {/* Filter options */}
    </select>
  </div>
</div>
```

### Tab Navigation
```typescript
type TabType = 'overview' | 'details' | 'history';

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <HomeIcon className="h-4 w-4" /> },
  { id: 'details', label: 'Details', icon: <ListIcon className="h-4 w-4" /> },
  { id: 'history', label: 'History', icon: <ClockIcon className="h-4 w-4" /> },
];

// Render
<div className="border-b border-gray-200">
  <nav className="flex gap-4">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={cn(
          "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
          activeTab === tab.id
            ? "border-brand-primary text-brand-primary"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
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

## Modal Patterns

### Standard Modal Structure
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MyModal({ isOpen, onClose }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Modal Title</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Form fields or content */}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Save
          </Button>
        </div>
      </Card>
    </div>
  );
}
```

### Multi-Step Modal (Wizard)
```typescript
const [step, setStep] = useState(1);
const totalSteps = 3;

// Progress indicator
<div className="px-4 pt-4">
  <div className="flex items-center gap-2">
    {[1, 2, 3].map((s) => (
      <div
        key={s}
        className={`h-2 flex-1 rounded-full ${
          step >= s ? 'bg-brand-primary' : 'bg-gray-200'
        }`}
      />
    ))}
  </div>
  <p className="text-xs text-gray-500 mt-2">
    Step {step} of {totalSteps}: {stepLabels[step]}
  </p>
</div>

// Navigation
<div className="flex items-center justify-between pt-4 border-t">
  <Button
    variant="secondary"
    onClick={() => step > 1 ? setStep(step - 1) : onClose()}
  >
    {step > 1 ? 'Back' : 'Cancel'}
  </Button>
  {step < totalSteps ? (
    <Button variant="primary" onClick={() => setStep(step + 1)}>
      Continue
    </Button>
  ) : (
    <Button variant="primary" onClick={handleSubmit}>
      Create
    </Button>
  )}
</div>
```

---

## List Item Patterns

### Clickable Card Row
```typescript
<Card
  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
  onClick={onClick}
>
  <div className="flex items-start justify-between">
    <div className="flex-1 min-w-0">
      {/* Status badge */}
      <div className="flex items-center gap-2 mb-1">
        <Badge className={statusColors[item.status]}>
          {STATUS_LABELS[item.status]}
        </Badge>
      </div>

      {/* Title */}
      <h3 className="font-medium text-gray-900">{item.name}</h3>

      {/* Meta info */}
      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <CalendarIcon className="h-4 w-4" />
          {formatDate(item.createdAt)}
        </span>
      </div>
    </div>

    <ChevronRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
  </div>
</Card>
```

---

## Icon Usage

We use Heroicons (outline variant by default):
```typescript
import {
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  // ... etc
} from '@heroicons/react/24/outline';
```

Standard sizes:
- In buttons: `h-4 w-4`
- Standalone: `h-5 w-5`
- Large/emphasis: `h-6 w-6`
- In stat cards: `h-5 w-5`

---

## Color Palette

### Status Colors
```typescript
const statusColors = {
  // Success/Active
  active: 'bg-green-100 text-green-700',
  completed: 'bg-green-100 text-green-700',
  signed: 'bg-green-100 text-green-700',

  // Warning/Pending
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  potential: 'bg-blue-100 text-blue-700',

  // Neutral/Past
  past: 'bg-gray-100 text-gray-700',
  draft: 'bg-gray-100 text-gray-700',

  // Error/Inactive
  inactive: 'bg-red-100 text-red-700',
  cancelled: 'bg-red-100 text-red-700',
  declined: 'bg-red-100 text-red-700',
};
```

### Brand Colors (CSS Variables)
```css
/* Set dynamically from org settings */
--brand-primary: #2563eb;
--brand-secondary: #1e40af;
```

Usage:
```typescript
className="text-brand-primary"
className="bg-brand-primary"
className="border-brand-primary"
className="focus:ring-brand-primary"
```

---

## Responsive Patterns

### Mobile-First Columns
```typescript
// 1 col mobile, 2 cols tablet, 4 cols desktop
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
```

### Stack to Row
```typescript
// Stack on mobile, row on larger screens
<div className="flex flex-col sm:flex-row gap-4">
```

### Hidden on Mobile
```typescript
<span className="hidden sm:inline">Full text</span>
<span className="sm:hidden">Short</span>
```

---

## Utility Classes

### Common Tailwind Patterns
```typescript
// Truncate text
className="truncate"

// Line clamp (requires plugin or custom)
className="line-clamp-2"

// Transition
className="transition-all duration-200"
className="hover:shadow-md transition-shadow"

// Focus ring
className="focus:ring-2 focus:ring-brand-primary focus:border-transparent"

// Disabled state
className="disabled:opacity-50 disabled:cursor-not-allowed"
```

### cn() Utility
```typescript
import { cn } from '@/lib/utils';

// Conditional classes
<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  variant === 'primary' && "variant-classes"
)}>
```

---

## Hook Usage Patterns

### Domain-Specific Hook Naming

Hooks use domain-specific naming (e.g., `clients`, `projects`) instead of generic `items`:

```typescript
// Good - Domain specific names
const { clients, loading, error, refresh } = useClients({ orgId });
const { client, updateClient, deleteClient } = useClient(clientId, orgId);
const { projects, loading } = useClientProjects(clientId, orgId);

// Bad - Generic naming
const { items, loading } = useItems({ orgId });
```

### Collection Hook Pattern (useFirestoreCollection)

**File:** `lib/hooks/useFirestoreCollection.ts`

```typescript
import { useFirestoreCollection, createConverter } from '@/lib/hooks/useFirestoreCollection';
import { convertTimestamps } from '@/lib/firebase/timestamp-converter';

// 1. Create a stable converter outside the hook
const clientConverter = createConverter<Client>((id, data) => ({
  id,
  ...convertTimestamps(data, ['createdAt', 'updatedAt', 'lastContactDate']),
} as Client));

// 2. Build domain-specific hook
export function useClients({ orgId, status, search }: UseClientsOptions): UseClientsReturn {
  // Build constraints with useMemo to prevent infinite loops
  const constraints = useMemo(() => {
    const c: QueryConstraint[] = [orderBy('displayName', 'asc')];
    if (status) {
      c.unshift(where('status', '==', status));
    }
    return c;
  }, [status]);

  // Use shared collection hook
  const { items, loading, error, refetch } = useFirestoreCollection<Client>({
    path: `organizations/${orgId}/clients`,
    constraints,
    converter: clientConverter,
    enabled: !!orgId,  // Skip query if no orgId
  });

  // Client-side search filtering
  const filteredClients = useMemo(() => {
    if (!search) return items;
    const searchLower = search.toLowerCase();
    return items.filter((client) =>
      client.displayName.toLowerCase().includes(searchLower) ||
      client.email.toLowerCase().includes(searchLower)
    );
  }, [items, search]);

  return {
    clients: filteredClients,
    loading,
    error,
    refresh: refetch,
  };
}
```

### CRUD Hook Pattern (useFirestoreCrud)

**File:** `lib/hooks/useFirestoreCrud.ts`

```typescript
import { useFirestoreCrud } from '@/lib/hooks/useFirestoreCrud';

export function useClient(clientId: string | undefined, orgId: string): UseClientReturn {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Use shared CRUD hook for operations
  const { update, remove } = useFirestoreCrud<Client>(
    `organizations/${orgId}/clients`,
    { entityName: 'Client', showToast: true }
  );

  // Real-time subscription
  useEffect(() => {
    if (!clientId || !orgId) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, `organizations/${orgId}/clients`, clientId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setClient(null);
        } else {
          setClient(clientConverter(snapshot.id, snapshot.data()));
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [clientId, orgId]);

  const updateClient = useCallback(
    async (updates: Partial<Client>) => {
      if (!clientId) throw new Error('Client ID required');
      await update(clientId, updates);
    },
    [clientId, update]
  );

  return { client, loading, error, updateClient, deleteClient: () => remove(clientId!) };
}
```

### Hook Return Pattern

Always return consistent object shape:

```typescript
interface UseClientsReturn {
  clients: Client[];       // Domain-specific name (not "items")
  loading: boolean;        // Initial load state
  error: Error | null;     // Error object
  refresh: () => void;     // Manual refresh function
}

interface UseClientReturn {
  client: Client | null;   // Single item or null
  loading: boolean;
  error: Error | null;
  refresh: () => void;
  updateClient: (updates: Partial<Client>) => Promise<void>;
  deleteClient: () => Promise<void>;
}
```

### Early Return Pattern

Always check for required parameters before fetching:

```typescript
export function useClient(clientId: string | undefined, orgId: string) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Early return if missing required params
    if (!clientId || !orgId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    // ... fetch logic
  }, [clientId, orgId]);
}
```

### Stats Hook Pattern

Derive stats from existing data hooks:

```typescript
export function useClientStats(orgId: string) {
  const { clients, loading } = useClients({ orgId });

  const stats = useMemo(() => {
    if (!clients.length) {
      return { total: 0, active: 0, totalLifetimeValue: 0 };
    }

    return {
      total: clients.length,
      active: clients.filter((c) => c.status === 'active').length,
      totalLifetimeValue: clients.reduce(
        (sum, c) => sum + (c.financials?.lifetimeValue || 0), 0
      ),
    };
  }, [clients]);

  return { stats, loading };
}
```

---

## Memoization Guidelines

### When to Use useMemo

**DO use useMemo for:**

1. **Expensive computations**
```typescript
const stats = useMemo(() => {
  return clients.reduce((acc, client) => ({
    total: acc.total + 1,
    active: acc.active + (client.status === 'active' ? 1 : 0),
    totalValue: acc.totalValue + (client.financials?.lifetimeValue || 0),
  }), { total: 0, active: 0, totalValue: 0 });
}, [clients]);
```

2. **Query constraints (prevents infinite loops in useEffect)**
```typescript
const constraints = useMemo(() => {
  const c: QueryConstraint[] = [orderBy('createdAt', 'desc')];
  if (status) c.unshift(where('status', '==', status));
  return c;
}, [status]);
```

3. **Filtered/sorted data**
```typescript
const filteredClients = useMemo(() => {
  if (!search) return clients;
  const searchLower = search.toLowerCase();
  return clients.filter(c =>
    c.name.toLowerCase().includes(searchLower)
  );
}, [clients, search]);
```

**DON'T use useMemo for:**
- Simple value transformations
- Primitive values
- Values that change every render anyway

### When to Use useCallback

**DO use useCallback for:**

1. **Functions passed to child components (prevents re-renders)**
```typescript
const handleClick = useCallback(() => {
  router.push(`/clients/${clientId}`);
}, [router, clientId]);

return <ChildComponent onClick={handleClick} />;
```

2. **Functions in useEffect dependency arrays**
```typescript
const refresh = useCallback(() => {
  setRefreshKey(k => k + 1);
}, []);

useEffect(() => {
  refresh();
}, [refresh]);
```

3. **Event handlers that use state/props**
```typescript
const handleSubmit = useCallback(async (e: FormEvent) => {
  e.preventDefault();
  if (onSubmit && !loading) {
    await onSubmit();
  }
}, [onSubmit, loading]);
```

**DON'T use useCallback for:**
- Functions only used in the same component (unless causing re-renders)
- Functions without dependencies
- Simple inline event handlers

### Converter Pattern (createConverter)

Use `createConverter` to create stable converter functions that don't cause re-renders:

```typescript
// Good - Stable reference created outside component
const clientConverter = createConverter<Client>((id, data) => ({
  id,
  ...convertTimestamps(data, DATE_FIELDS),
} as Client));

// Use in hook
const { items } = useFirestoreCollection({
  path: `organizations/${orgId}/clients`,
  converter: clientConverter,  // Stable reference
});

// Bad - Creates new function each render, causing infinite loops
const { items } = useFirestoreCollection({
  converter: (id, data) => ({ id, ...data }),  // New function every render!
});
```

### Common Memoization Pitfalls

1. **Object/array literals in dependencies**
```typescript
// Bad - new object every render
useEffect(() => { ... }, [{ status, search }]);

// Good - primitive values
useEffect(() => { ... }, [status, search]);
```

2. **Inline function in dependency**
```typescript
// Bad - new function every render
useEffect(() => {
  const fn = () => console.log(value);
  fn();
}, [() => console.log(value)]);  // Always different!

// Good - use useCallback
const logValue = useCallback(() => console.log(value), [value]);
useEffect(() => { logValue(); }, [logValue]);
```

3. **Missing dependencies**
```typescript
// Bad - stale closure
useCallback(() => {
  doSomething(status);  // status not in deps!
}, []);

// Good - include all dependencies
useCallback(() => {
  doSomething(status);
}, [status]);
```

---

## FormModal Pattern

The `FormModal` component provides a standardized modal wrapper for forms with loading states and error handling.

**File:** `components/ui/FormModal.tsx`

```typescript
import { FormModal, useFormModal } from '@/components/ui/FormModal';

function ParentComponent() {
  const { isOpen, open, close, loading, error, handleSubmit } = useFormModal();

  const onSubmit = async () => {
    await handleSubmit(async () => {
      await createClient(formData);
    });
  };

  return (
    <>
      <Button onClick={open}>Add Client</Button>

      <FormModal
        isOpen={isOpen}
        onClose={close}
        title="Add Client"
        description="Enter client details"
        submitLabel="Create Client"
        loading={loading}
        error={error}
        onSubmit={onSubmit}
      >
        {/* Form fields */}
      </FormModal>
    </>
  );
}
```

### FormModal Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | boolean | - | Controls modal visibility |
| `onClose` | () => void | - | Close callback |
| `title` | string | - | Modal header title |
| `description?` | string | - | Optional subtitle |
| `onSubmit?` | () => Promise<void> | - | Form submit handler |
| `submitLabel?` | string | 'Save' | Submit button text |
| `cancelLabel?` | string | 'Cancel' | Cancel button text |
| `loading?` | boolean | false | Shows loading state |
| `disabled?` | boolean | false | Disables submit button |
| `size?` | 'sm' \| 'md' \| 'lg' \| 'xl' \| 'full' | 'md' | Modal width |
| `error?` | string \| null | - | Error message |
| `submitVariant?` | 'primary' \| 'danger' | 'primary' | Submit button style |

---

## Form Validation with Zod

Standard pattern for forms using React Hook Form with Zod validation:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// 1. Define schema
const clientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  status: z.enum(['active', 'past', 'potential', 'inactive']),
});

type ClientFormData = z.infer<typeof clientSchema>;

// 2. Initialize form
const {
  register,
  handleSubmit,
  watch,
  setValue,
  reset,
  formState: { errors },
} = useForm<ClientFormData>({
  resolver: zodResolver(clientSchema),
  defaultValues: { status: 'potential' },
});

// 3. Handle submit
const onSubmit = async (data: ClientFormData) => {
  setIsSubmitting(true);
  try {
    await createClient(data);
    toast.success('Client created');
    reset();
    onClose();
  } catch (err) {
    toast.error('Failed to create client');
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## Related Documentation

- [CLAUDE.md](/CLAUDE.md) - Development instructions and session setup
- [DEVELOPMENT_GUIDE.md](/docs/DEVELOPMENT_GUIDE.md) - Feature development patterns
- [ARCHITECTURE.md](/docs/ARCHITECTURE.md) - Technical architecture overview
