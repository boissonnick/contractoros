# Patterns & Templates - Quick Reference

**Last Updated:** 2026-02-04
**Purpose:** Quick-reference guide for common patterns in ContractorOS

---

## Quick Links

| Pattern | Use When | Example File |
|---------|----------|--------------|
| Firestore Hook | Reading collection | `lib/hooks/useClients.ts` |
| Form Modal | Creating/editing records | `components/ui/FormModal.tsx` |
| Card Component | Displaying record summaries | `components/clients/ClientCard.tsx` |
| Data Table | List views with sorting/filtering | `components/ui/DataTable.tsx` |
| Page Header | Page title with actions | `components/ui/PageHeader.tsx` |

---

## Firestore Hook Pattern

**Use:** Reading real-time data from Firestore collections

**Template:**
```typescript
import { useAuth } from '@/contexts/AuthContext';
import { useFirestoreCollection } from '@/lib/hooks/useFirestoreCollection';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export function useClients() {
  const { user } = useAuth();
  const orgId = user?.orgId;

  const { items, loading, error } = useFirestoreCollection<Client>(
    orgId
      ? query(
          collection(db, `organizations/${orgId}/clients`),
          where('status', '==', 'active'),
          orderBy('name', 'asc')
        )
      : null,  // null = don't subscribe yet
    'Client'
  );

  return { clients: items, loading, error };
}
```

**Key points:**
- Early return if `!orgId`
- Use `useFirestoreCollection` for real-time
- Return consistent `{ items, loading, error }` shape

---

## Form Modal Pattern

**Use:** Creating or editing records with validation

**Template:**
```typescript
'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FormModal from '@/components/ui/FormModal';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ClientFormModal({
  isOpen,
  onClose,
  client
}: Props) {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: client || {},
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (client) {
        await updateClient(client.id, data);
      } else {
        await createClient(data);
      }
      onClose();
    } catch (error) {
      console.error('Failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={client ? 'Edit Client' : 'New Client'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Name *
          </label>
          <input
            {...register('name')}
            className="mt-1 block w-full rounded-md border-gray-300"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </FormModal>
  );
}
```

**Key points:**
- Use Zod for validation
- React Hook Form for form state
- Loading state during submission
- Error handling with try/catch

---

## Card Component Pattern

**Use:** Displaying record summaries in grid layouts

**Template:**
```typescript
import { Client } from '@/types';
import { BuildingOfficeIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

export function ClientCard({ client, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">{client.name}</h3>
        </div>
        <span className={`badge ${getStatusColor(client.status)}`}>
          {client.status}
        </span>
      </div>

      {/* Content */}
      <div className="space-y-2 text-sm text-gray-600">
        {client.email && (
          <div className="flex items-center gap-2">
            <EnvelopeIcon className="h-4 w-4" />
            <span>{client.email}</span>
          </div>
        )}
        {client.phone && (
          <div className="flex items-center gap-2">
            <PhoneIcon className="h-4 w-4" />
            <span>{client.phone}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Projects: {client.projectCount || 0}</span>
          <span>Since {formatDate(client.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'inactive': return 'bg-gray-100 text-gray-800';
    case 'archived': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}
```

**Key points:**
- Heroicons for consistent icons
- Status badges with color coding
- Hover effects for interactivity
- Footer with metadata

---

## Data Table Pattern

**Use:** List views with sorting, filtering, and actions

**Template:**
```typescript
import DataTable from '@/components/ui/DataTable';
import { Client } from '@/types';

const columns = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true,
  },
  {
    key: 'status',
    label: 'Status',
    render: (client: Client) => (
      <span className={`badge ${getStatusColor(client.status)}`}>
        {client.status}
      </span>
    ),
  },
  {
    key: 'actions',
    label: '',
    render: (client: Client) => (
      <button onClick={() => handleEdit(client)} className="btn-sm">
        Edit
      </button>
    ),
  },
];

export default function ClientTable({ clients }: Props) {
  return (
    <DataTable
      data={clients}
      columns={columns}
      keyExtractor={(client) => client.id}
      emptyMessage="No clients found"
    />
  );
}
```

**Key points:**
- Column definitions with key, label, sortable
- Custom render functions for formatted cells
- Actions column for row-level operations

---

## Page Header Pattern

**Use:** Standard page title with breadcrumbs and actions

**Template:**
```typescript
import PageHeader from '@/components/ui/PageHeader';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function ClientsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Clients"
        description="Manage your client relationships and contact information"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Clients' },
        ]}
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Client
          </button>
        }
      />

      {/* Page content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ... */}
      </div>
    </div>
  );
}
```

**Key points:**
- Consistent page layout
- Breadcrumb navigation
- Primary action button in header

---

## Empty State Pattern

**Use:** When no data is available

**Template:**
```typescript
import EmptyState from '@/components/ui/EmptyState';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';

{clients.length === 0 && (
  <EmptyState
    icon={BuildingOfficeIcon}
    title="No clients yet"
    description="Get started by adding your first client"
    action={
      <button onClick={() => setShowModal(true)} className="btn-primary">
        Add Client
      </button>
    }
  />
)}
```

---

## Loading State Pattern

**Use:** While data is being fetched

**Template:**
```typescript
import Skeleton from '@/components/ui/Skeleton';

{loading ? (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[...Array(6)].map((_, i) => (
      <Skeleton key={i} className="h-40" />
    ))}
  </div>
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {clients.map(client => (
      <ClientCard key={client.id} client={client} />
    ))}
  </div>
)}
```

---

## Timestamp Conversion Pattern

**Use:** Converting Firestore Timestamps to Dates

**Template:**
```typescript
import { convertTimestamps } from '@/lib/firebase/timestamp-converter';

// After fetching from Firestore
const clientData = docSnap.data();
const client = convertTimestamps(clientData as Client);

// Now client.createdAt is Date, not Timestamp
console.log(client.createdAt.toLocaleDateString());
```

---

## CRUD Operations Pattern

**Use:** Creating, reading, updating, deleting records

**Template:**
```typescript
import { doc, collection, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// Create
export async function createClient(orgId: string, data: Partial<Client>) {
  const ref = collection(db, `organizations/${orgId}/clients`);
  return await addDoc(ref, {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

// Update
export async function updateClient(orgId: string, clientId: string, data: Partial<Client>) {
  const ref = doc(db, `organizations/${orgId}/clients`, clientId);
  return await updateDoc(ref, {
    ...data,
    updatedAt: new Date(),
  });
}

// Delete
export async function deleteClient(orgId: string, clientId: string) {
  const ref = doc(db, `organizations/${orgId}/clients`, clientId);
  return await deleteDoc(ref);
}
```

---

## Tailwind Class Patterns

### Layout
```typescript
// Page container
className="min-h-screen bg-gray-50"

// Content container
className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"

// Grid layouts
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
```

### Cards
```typescript
className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
```

### Buttons
```typescript
// Primary
className="btn-primary"  // or manually:
className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"

// Secondary
className="btn-secondary"  // or manually:
className="bg-gray-200 text-gray-900 px-4 py-2 rounded-md hover:bg-gray-300"
```

### Badges
```typescript
className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
```

---

## Icon Usage

**Always use Heroicons (outline version):**

```typescript
import {
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

// Usage
<BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
```

**Sizing:**
- Small icons: `h-4 w-4`
- Medium icons: `h-5 w-5`
- Large icons: `h-6 w-6`

---

## Complete Example: Feature Implementation

**Scenario:** Add a new "Projects" feature

**1. Create types (types/index.ts):**
```typescript
export interface Project {
  id: string;
  orgId: string;
  name: string;
  clientId: string;
  status: 'planning' | 'active' | 'completed';
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**2. Create hook (lib/hooks/useProjects.ts):**
```typescript
// Use pattern from "Firestore Hook Pattern" above
```

**3. Create card component (components/projects/ProjectCard.tsx):**
```typescript
// Use pattern from "Card Component Pattern" above
```

**4. Create form modal (components/projects/ProjectFormModal.tsx):**
```typescript
// Use pattern from "Form Modal Pattern" above
```

**5. Create page (app/dashboard/projects/page.tsx):**
```typescript
// Combine PageHeader + DataTable + Empty State patterns
```

**6. Add Firestore rules (firestore.rules):**
```javascript
match /organizations/{orgId}/projects/{projectId} {
  allow read, write: if isSameOrg(orgId);
}
```

**7. Deploy:**
```bash
firebase deploy --only firestore --project contractoros-483812
```

---

## Reference: Complete Pattern Files

| Pattern | Full Example File |
|---------|------------------|
| Firestore Hook | `lib/hooks/useClients.ts` |
| Form Component | `components/clients/ClientFormModal.tsx` |
| Card Component | `components/clients/ClientCard.tsx` |
| Data Table | `components/ui/DataTable.tsx` |
| Page Layout | `app/dashboard/clients/page.tsx` |
| CRUD Operations | `lib/api/clients.ts` |

---

*For detailed patterns, see full component files. For architecture decisions, see `docs/ARCHITECTURE.md`*
