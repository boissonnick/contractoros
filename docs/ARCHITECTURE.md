# ContractorOS Technical Architecture

> **Purpose:** Deep technical reference for understanding system design and making architectural decisions.
> **Last Updated:** 2026-02-02

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
│  ├── Mailgun - Transactional emails                             │
│  ├── Google Maps - Address autocomplete, maps                   │
│  ├── QuickBooks Online - Accounting sync                        │
│  ├── Stripe (planned) - Payment processing                      │
│  └── Twilio (planned) - SMS messaging                           │
├─────────────────────────────────────────────────────────────────┤
│                         AI LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  AI Assistant (Multi-model support)                              │
│  ├── Claude (Anthropic) - Primary AI model                      │
│  ├── Gemini (Google) - Default free tier                        │
│  └── GPT-4 (OpenAI) - Enterprise option                         │
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

---

## AI Assistant Architecture

### Overview

The AI Assistant provides contextual help to contractors via a multi-model chat interface.

```
┌────────────────────────────────────────────────────────────┐
│                    AI ASSISTANT FLOW                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  User Input ──▶ Prompt Guard ──▶ Model Router ──▶ Response │
│       │              │               │              │      │
│       ▼              ▼               ▼              ▼      │
│   [Voice/Text]  [Security]     [Claude/Gemini]  [Stream]   │
│                      │           [/GPT-4]           │      │
│                      ▼                              ▼      │
│                 Rate Limiter              Output Guard     │
│                      │                              │      │
│                      ▼                              ▼      │
│                 Audit Log                    Persistence   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
apps/web/lib/assistant/
├── types.ts                    # ChatMessage, AssistantContext types
├── claude-client.ts            # Claude API adapter
├── prompts.ts                  # System prompts and context
├── context-builder.ts          # Build context from user data
├── voice-service.ts            # Text-to-speech service
├── models/
│   ├── model-adapter.ts        # Model adapter interface
│   ├── claude-adapter.ts       # Claude/Anthropic adapter
│   ├── gemini-adapter.ts       # Google Gemini adapter
│   ├── openai-adapter.ts       # OpenAI GPT-4 adapter
│   └── model-router.ts         # Route to correct model
└── security/
    ├── prompt-guard.ts         # Input validation
    ├── output-guard.ts         # Output sanitization
    └── rate-limiter.ts         # Rate limiting

apps/web/components/assistant/
├── AssistantTrigger.tsx        # Floating action button
├── AssistantPanel.tsx          # Slide-out chat panel
├── ChatMessage.tsx             # Message display
├── VoiceInput.tsx              # Voice input overlay
└── index.ts

apps/web/app/api/assistant/
├── route.ts                    # Non-streaming endpoint
└── stream/route.ts             # SSE streaming endpoint
```

### Security Features

- **Prompt Guard:** Validates user input, blocks injection attempts
- **Output Guard:** Sanitizes AI responses, removes sensitive data
- **Rate Limiting:** Per-user limits (30/hour free, 100/hour pro)
- **Audit Logging:** All interactions logged for compliance

### Model Configuration

| Model | Provider | Use Case | Rate Limit |
|-------|----------|----------|------------|
| Gemini 2.0 Flash | Google | Default (free tier) | 30/hour |
| Claude Sonnet | Anthropic | Pro tier | 100/hour |
| GPT-4o | OpenAI | Enterprise | Unlimited |

---

## Intelligence System Architecture

### Overview

The Intelligence System provides pricing insights, bid analysis, and project recommendations using external data sources.

```
apps/web/lib/intelligence/
├── types.ts                    # Intelligence types (500+ lines)
├── material-prices.ts          # FRED API integration
├── labor-rates.ts              # BLS data with regional adjustments
├── bid-intelligence.ts         # Bid analysis and recommendations
└── project-intelligence.ts     # Project profitability/risk

apps/web/components/intelligence/
├── InsightCard.tsx             # Generic insight display
├── MarketComparison.tsx        # Price comparison visual
├── ConfidenceScore.tsx         # Estimate confidence
├── PriceSuggestionCard.tsx     # Pricing recommendations
└── MaterialPriceWidget.tsx     # Dashboard widget

apps/web/lib/hooks/
├── useIntelligence.ts          # Intelligence data hooks
├── useBidIntelligence.ts       # Bid analysis hooks
└── useProjectIntelligence.ts   # Project profitability hooks
```

### Data Sources

| Source | Data | Update Frequency |
|--------|------|------------------|
| FRED API | Material prices (lumber, steel, etc.) | Daily |
| BLS | Labor rates by region | Monthly |
| Internal | Historical project data | Real-time |

---

## QuickBooks Integration

### OAuth Flow

```
User ──▶ /api/integrations/quickbooks/connect
         └──▶ Intuit OAuth ──▶ /api/integrations/quickbooks/callback
                                └──▶ Store tokens in Firestore
```

### Sync Architecture

```
apps/web/lib/integrations/quickbooks/
├── types.ts                    # QBO API types
├── oauth.ts                    # OAuth 2.0 flow
├── client.ts                   # Authenticated API client
├── sync-customers.ts           # Client <-> Customer sync
├── sync-invoices.ts            # Invoice sync
└── index.ts

apps/web/app/api/integrations/quickbooks/
├── connect/route.ts            # Initiate OAuth
├── callback/route.ts           # OAuth callback
├── disconnect/route.ts         # Revoke connection
├── status/route.ts             # Connection status
└── sync/route.ts               # Trigger sync operations
```

### Entity Mapping

Mappings stored in: `organizations/{orgId}/qboEntityMappings/{mappingId}`

| Local Entity | QBO Entity | Sync Direction |
|--------------|------------|----------------|
| Client | Customer | Bidirectional |
| Invoice | Invoice | Push to QBO |
| Payment | Payment | Pull from QBO |

---

## Auto-Numbering System

### Configuration

Stored in: `organizations/{orgId}/settings/numbering`

```typescript
interface NumberingSettings {
  estimates: {
    prefix: string;      // "EST"
    separator: string;   // "-"
    includeYear: boolean;
    yearFormat: '2' | '4';
    padding: number;     // 4 = "0001"
    nextNumber: number;
  };
  invoices: {
    // Same structure
  };
}
```

### Format Examples

| Setting | Format | Example |
|---------|--------|---------|
| Default | `{prefix}-{year}-{number}` | EST-2026-0001 |
| Simple | `{prefix}{number}` | EST0001 |
| Custom | `{prefix}/{year}/{number}` | EST/26/0001 |

---

## Demo Seed Scripts

### Location

```
scripts/
├── seed-demo-org.ts           # Create Horizon Construction Co.
├── seed-demo-projects.ts      # Projects and estimates
├── seed-demo-financial.ts     # Invoices, payments, expenses
├── seed-demo-activities.ts    # Time entries, communications
└── seed-demo-photos.ts        # Project photos (placeholder)
```

### Demo Organization Structure

```
Horizon Construction Co.
├── Users
│   ├── Mike Johnson (Owner)
│   ├── Sarah Williams (PM)
│   ├── Carlos Rodriguez (Foreman)
│   └── 3 Field Workers
├── Clients (8)
│   ├── 5 Residential
│   └── 3 Commercial
├── Projects (12)
│   ├── 5 Completed
│   ├── 4 Active
│   ├── 2 Upcoming
│   └── 1 On Hold
└── Financial Data (12 months)
    ├── 45 Invoices
    ├── 38 Payments
    ├── 500+ Time Entries
    └── 200+ Daily Logs
```

---

## E2E Testing Architecture

### Test Suites

```
apps/web/e2e/
├── RUN_TESTS.md               # Test runner instructions
├── suites/
│   ├── 00-smoke.md            # Quick smoke tests
│   ├── 01-auth.md             # Authentication
│   ├── 02-rbac.md             # Role-based access
│   ├── 03-dashboard.md        # Dashboard
│   ├── 04-projects.md         # Projects
│   ├── 05-clients.md          # Clients
│   ├── 06-team.md             # Team management
│   ├── 07-finances.md         # Invoices/estimates
│   ├── 08-scheduling.md       # Calendar/schedule
│   ├── 09-documents.md        # Documents
│   ├── 10-mobile.md           # Mobile viewport
│   ├── 11-regression.md       # Bug regression
│   ├── 20-ui-ux-desktop.md    # Desktop UI
│   ├── 21-ui-ux-tablet.md     # Tablet UI
│   ├── 22-ui-ux-mobile.md     # Mobile UI
│   ├── 23-uat-checklist.md    # User acceptance
│   ├── 24-ai-assistant.md     # AI Assistant
│   └── 27-regression.md       # Full regression
└── results/
    └── *.md                   # Test results by sprint
```

### Test Execution

Tests are executed via Chrome MCP (Model Context Protocol) or manual browser testing. Each suite contains:
- Test steps
- Expected results
- Screenshots (when applicable)
- Pass/fail criteria
