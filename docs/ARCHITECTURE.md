# ContractorOS Technical Architecture

> **Purpose:** Deep technical reference for understanding system design and making architectural decisions.
> **Last Updated:** 2026-01-28

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  Next.js 14 App Router (apps/web)                               │
│  ├── Dashboard Portal (/dashboard/*)  - Contractors/PMs         │
│  ├── Client Portal (/client/*, /portal/*) - Homeowners          │
│  ├── Sub Portal (/sub/*) - Subcontractors                       │
│  ├── Field Portal (/field/*) - Field workers                    │
│  └── Public Pages (/sign/*) - E-signature, payments             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  Firebase Services                                               │
│  ├── Firestore - NoSQL document database                        │
│  ├── Authentication - Email/password, magic links               │
│  ├── Storage - Files, photos, signed documents                  │
│  └── Cloud Functions - Triggers, webhooks, emails               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                            │
├─────────────────────────────────────────────────────────────────┤
│  ├── Resend - Transactional emails                              │
│  ├── Google Maps - Address autocomplete, maps                   │
│  ├── Stripe (planned) - Payment processing                      │
│  └── Twilio (planned) - SMS messaging                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Next.js 14 App Router

We use the App Router with server/client component split:

```
apps/web/app/
├── layout.tsx              # Root layout (providers)
├── page.tsx                # Landing page
├── globals.css             # Global styles
├── dashboard/              # Protected routes
│   ├── layout.tsx          # Dashboard layout (AppShell)
│   ├── page.tsx            # Dashboard home
│   ├── projects/           # Project management
│   ├── clients/            # Client CRM
│   ├── estimates/          # Estimates & quotes
│   ├── signatures/         # E-signature management
│   └── settings/           # User/org settings
├── sign/                   # Public e-signature
│   └── [token]/page.tsx    # Magic link signing
└── api/                    # API routes (minimal use)
```

### Component Architecture

```
components/
├── ui/                     # Design system primitives
│   ├── Button.tsx          # Base button
│   ├── Card.tsx            # Card container
│   ├── Badge.tsx           # Status badges
│   ├── Input.tsx           # Form inputs
│   ├── Toast.tsx           # Notifications
│   ├── EmptyState.tsx      # Empty state display
│   ├── Skeleton.tsx        # Loading states
│   ├── AppShell.tsx        # Main layout wrapper
│   └── index.ts            # Exports
├── projects/               # Project domain
│   ├── scope/              # SOW/scope builder
│   ├── tasks/              # Task management
│   │   ├── kanban/         # Kanban view
│   │   ├── list/           # List view
│   │   └── gantt/          # Gantt chart
│   └── phases/             # Phase management
├── clients/                # Client domain
│   ├── AddClientModal.tsx
│   ├── EditClientModal.tsx
│   ├── ClientSourceSelect.tsx
│   └── index.ts
├── esignature/             # E-signature domain
│   ├── SignaturePad.tsx
│   ├── SendForSignatureModal.tsx
│   └── SignatureStatusBadge.tsx
└── tasks/                  # Task detail components
    ├── TaskCard.tsx
    ├── TaskDetailModal.tsx
    └── TaskFilters.tsx
```

### State Management

**No global state library** - We use:
1. **React Context** for auth (`lib/auth.tsx`)
2. **Custom hooks** for Firestore data (`lib/hooks/`)
3. **Local state** for UI state
4. **URL state** for filters/pagination

#### Hook Pattern
```typescript
// Real-time subscription with cleanup
export function useItems(orgId: string) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;

    const q = query(collection(db, 'items'), where('orgId', '==', orgId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orgId]);

  return { items, loading };
}
```

---

## Data Architecture

### Firestore Schema

```
firestore/
├── users/{userId}
│   ├── uid: string
│   ├── email: string
│   ├── displayName: string
│   ├── orgId: string
│   ├── role: 'owner' | 'admin' | 'pm' | 'field'
│   └── createdAt: Timestamp
│
├── organizations/{orgId}
│   ├── name: string
│   ├── ownerUid: string
│   ├── settings: { brandColors, logo, etc. }
│   └── createdAt: Timestamp
│
├── projects/{projectId}
│   ├── orgId: string
│   ├── clientId: string (reference)
│   ├── name: string
│   ├── status: 'planning' | 'active' | 'completed' | 'on_hold'
│   ├── phases: Phase[] (subcollection or embedded)
│   └── createdAt: Timestamp
│
├── tasks/{taskId}
│   ├── orgId: string
│   ├── projectId: string
│   ├── phaseId: string
│   ├── title: string
│   ├── status: 'todo' | 'in_progress' | 'review' | 'done'
│   ├── assignees: string[]
│   └── createdAt: Timestamp
│
├── clients/{clientId}
│   ├── orgId: string
│   ├── firstName: string
│   ├── lastName: string
│   ├── email: string
│   ├── status: 'active' | 'past' | 'potential' | 'inactive'
│   ├── source: ClientSource
│   ├── financials: ClientFinancials
│   ├── addresses: ClientAddress[]
│   ├── notes: ClientNote[]
│   └── createdAt: Timestamp
│
├── signatureRequests/{requestId}
│   ├── orgId: string
│   ├── documentType: 'estimate' | 'contract' | 'change_order'
│   ├── documentId: string
│   ├── signers: SignerInfo[]
│   ├── status: SignatureRequestStatus
│   ├── auditTrail: SignatureAuditEntry[]
│   └── createdAt: Timestamp
│
└── communicationLogs/{logId}
    ├── orgId: string
    ├── clientId: string
    ├── type: 'email' | 'phone' | 'text' | 'meeting' | 'note'
    ├── direction: 'inbound' | 'outbound'
    ├── content: string
    └── createdAt: Timestamp
```

### Data Access Patterns

| Pattern | When to Use | Example |
|---------|-------------|---------|
| Direct query | Simple list with filters | Tasks by project |
| Real-time listener | Live updates needed | Kanban board |
| Compound query | Multiple filters | Tasks by project + status |
| Aggregation | Stats/counts | Client lifetime value |

### Security Rules Pattern
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User must be authenticated
    function isAuth() {
      return request.auth != null;
    }

    // User belongs to the org
    function isOrgMember(orgId) {
      return isAuth() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.orgId == orgId;
    }

    match /clients/{clientId} {
      allow read, write: if isOrgMember(resource.data.orgId);
    }
  }
}
```

---

## Authentication Architecture

### Auth Flow
```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Login   │────▶│ Firebase │────▶│  Create  │
│   Form   │     │   Auth   │     │  Session │
└──────────┘     └──────────┘     └──────────┘
                                        │
                                        ▼
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Access  │◀────│  Auth    │◀────│  Fetch   │
│  Granted │     │ Context  │     │  Profile │
└──────────┘     └──────────┘     └──────────┘
```

### Magic Link Auth (for clients)
```typescript
// Generate token
const token = Buffer.from(JSON.stringify({
  requestId,
  signerId,
  exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
})).toString('base64');

// Signing URL
const url = `${baseUrl}/sign/${token}`;

// Verify token (on sign page)
const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
if (decoded.exp < Date.now()) throw new Error('Token expired');
```

---

## Cloud Functions Architecture

### Function Types

```typescript
// functions/src/index.ts

// 1. HTTP Callable Functions
export const healthCheck = onCall({ region: REGION }, async () => {
  return { status: 'ok' };
});

// 2. Firestore Triggers
export const onSignatureRequestUpdated = onDocumentUpdated(
  { document: 'signatureRequests/{requestId}', region: REGION },
  async (event) => {
    // React to document changes
  }
);

// 3. Auth Triggers
export const onUserCreated = beforeUserCreated(
  { region: REGION },
  async (event) => {
    // Set up new user
  }
);
```

### Email Architecture
```
functions/src/email/
├── emailTemplates.ts       # HTML templates
└── sendSignatureEmails.ts  # Send functions

Templates:
- signatureRequestEmailTemplate(signerName, documentTitle, signingUrl)
- signatureReminderEmailTemplate(signerName, documentTitle, signingUrl)
- signatureCompletedEmailTemplate(requesterName, documentTitle, downloadUrl)
```

---

## Styling Architecture

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary)',
          secondary: 'var(--brand-secondary)',
        }
      }
    }
  }
}
```

### CSS Variables (Theme)
```css
:root {
  --brand-primary: #2563eb;
  --brand-secondary: #1e40af;
  /* Set dynamically from org settings */
}
```

### Component Styling Pattern
```typescript
// Use cn() for conditional classes
import { cn } from '@/lib/utils';

<button
  className={cn(
    "px-4 py-2 rounded-lg font-medium",
    variant === 'primary' && "bg-brand-primary text-white",
    variant === 'secondary' && "bg-gray-100 text-gray-700",
    disabled && "opacity-50 cursor-not-allowed"
  )}
>
```

---

## Error Handling

### Client-Side
```typescript
// Toast notifications for user feedback
import { toast } from '@/components/ui/Toast';

try {
  await saveData();
  toast.success('Saved successfully');
} catch (err) {
  console.error('Save failed:', err);
  toast.error('Failed to save. Please try again.');
}
```

### Form Validation
```typescript
// Zod schema + React Hook Form
const schema = z.object({
  email: z.string().email('Invalid email'),
});

// Display errors inline
{errors.email && (
  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
)}
```

---

## Performance Patterns

### Data Loading
1. **Skeleton states** during initial load
2. **Optimistic updates** for immediate feedback
3. **Real-time listeners** with cleanup
4. **Pagination** for large lists (TODO)

### Code Splitting
- Next.js automatic page splitting
- Dynamic imports for heavy components
- Lazy loading modals

### Image Optimization
- Next.js Image component
- Firebase Storage for user uploads
- Compression before upload (TODO)

---

## Security Checklist

### Data Access
- [ ] Firestore rules enforce org isolation
- [ ] User can only access their org's data
- [ ] Public pages use magic link tokens
- [ ] Tokens expire appropriately

### Input Validation
- [ ] Zod schemas for all forms
- [ ] Server-side validation in Cloud Functions
- [ ] Sanitize user input before storage

### Authentication
- [ ] Protected routes check auth state
- [ ] Session timeout handling
- [ ] Secure token storage

---

## Module Architecture Template

When creating a new module (e.g., "vendors"), follow this structure:

```
1. Types (apps/web/types/index.ts)
   - VendorStatus type
   - Vendor interface
   - VendorFinancials interface

2. Hook (apps/web/lib/hooks/useVendors.ts)
   - useVendors(options) - list with filters
   - useVendor(id, orgId) - single with CRUD
   - createVendor(data) - helper function
   - VENDOR_STATUS_LABELS - constants

3. Pages
   - apps/web/app/dashboard/vendors/page.tsx - list
   - apps/web/app/dashboard/vendors/[id]/page.tsx - detail

4. Components (apps/web/components/vendors/)
   - AddVendorModal.tsx
   - EditVendorModal.tsx
   - VendorCard.tsx
   - index.ts - exports
```

This pattern ensures consistency and makes code predictable.
