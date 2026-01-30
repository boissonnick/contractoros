# ContractorOS — Project Intelligence

> **For AI Assistants:** This is your primary context file. Read this first, then check `docs/SPRINT_STATUS.md` for current work.

## Quick Start for New Sessions

```bash
# 1. Check current status
cat docs/SPRINT_STATUS.md

# 2. Verify TypeScript
cd apps/web && npx tsc --noEmit

# 3. Review relevant docs (only what's needed for current sprint)
cat docs/DEVELOPMENT_GUIDE.md      # How to build features
cat docs/ARCHITECTURE.md           # Technical patterns
```

---

## Token Optimization & Sprint Scoping

> **CRITICAL:** The `types/index.ts` file is ~6,000 lines (139KB). Reading the entire file wastes significant context. Follow these guidelines to minimize token usage.

### DO NOT Read Full Types File

Instead of reading `types/index.ts`, use targeted approaches:

```bash
# Find specific type definitions
grep -n "export interface PayrollRun" apps/web/types/index.ts
grep -n "export type ExpenseStatus" apps/web/types/index.ts

# Find section boundaries (types are organized by section)
grep -n "^// [A-Z]" apps/web/types/index.ts | head -30

# Read only relevant section (example: lines 1074-1115 for payroll)
# Use Read tool with offset/limit parameters
```

### Types File Section Map

| Lines | Section | Use For |
|-------|---------|---------|
| 1-153 | User & Organization | Auth, profiles, org settings |
| 154-580 | Permissions & Roles | RBAC, invitations |
| 581-669 | Projects | Project CRUD |
| 670-750 | Activity & Phases | Project phases, templates |
| 751-855 | Quotes & Preferences | Client preferences |
| 856-1040 | Tasks & Scope | Task management |
| 1041-1115 | Time Tracking & Payroll | Time entries, payroll |
| 1116-1230 | Scheduling | Calendar, availability |
| 1231-1390 | Subcontractors & Bids | Sub management |
| 1391-1560 | Expenses & Materials | Expense tracking, POs |
| 1560-1710 | Photos & Issues | Documentation |
| 1710-1800 | Invoices & Daily Logs | Billing, logs |
| 1800-2100 | SOW & Change Orders | Scope documents |
| 2100-2350 | Estimates & Proposals | Estimating |
| 2350-2630 | Accounting Integration | QuickBooks, Xero |
| 2630-2740 | Selections & Warranty | Client experience |
| 2740-3000 | Messaging & Safety | SMS, compliance |
| 3000+ | Equipment & Tools | Tool tracking |

### Sprint Scoping Checklist

Before starting a sprint, identify and document:

1. **Primary types needed** - List 3-5 specific interfaces
2. **Existing hooks to reference** - Which `lib/hooks/` files are similar
3. **UI components to reuse** - Check `components/ui/` first
4. **Firestore collections** - List new collections needed

Example sprint scope doc:
```markdown
## Sprint 9B: Payroll Module Scope

**Types needed:**
- PayrollRun (lines 1102-1115)
- TimeEntry (already defined in time tracking section)
- UserProfile.payroll fields (lines 66-86)

**Reference hooks:**
- useTimeEntries.ts (similar CRUD pattern)
- useExpenses.ts (similar approval workflow)

**New Firestore collections:**
- organizations/{orgId}/payrollRuns/{runId}
```

### Incremental Reading Strategy

When you need types, read incrementally:

1. **First:** Grep for the specific type name
2. **Then:** Read only 50-100 lines around that section
3. **Never:** Read the full 6000-line file unless absolutely necessary

---

## What This Is

Field-first construction project management platform. Multi-portal app serving general contractors (dashboard), subcontractors, clients, and field workers. Built on Next.js 14 + Firebase.

**Current State (2026-01-29):**
- Sprint 9A (Bug Fixes & Data Architecture) COMPLETED
- Client data now org-scoped, demo team members persist to Firestore
- Payroll types added to UserProfile
- Next: Sprint 9B (Full Payroll Module) OR Sprint 9C (CSV Import)

---

## Documentation Index

| Document | Purpose | Location |
|----------|---------|----------|
| **SPRINT_STATUS.md** | Current progress, next tasks | `docs/` |
| **DEVELOPMENT_GUIDE.md** | How to build features, patterns | `docs/` |
| **ARCHITECTURE.md** | Technical deep-dive | `docs/` |
| **COMPONENT_PATTERNS.md** | UI component library | `docs/` |
| **DEPLOYMENT_CHECKLIST.md** | Firebase rules, deploy requirements | `docs/` |
| **TESTING_STRATEGY.md** | Testing requirements, common mistakes | `docs/` |
| **FEATURE_TEMPLATE.md** | New feature checklist | `docs/` |
| **MASTER_ROADMAP.md** | Complete backlog, priorities | `docs/` |
| **HELP_DOCUMENTATION_PLAN.md** | User docs & help system plan | `docs/` |
| **CHANGELOG.md** | Version history, all changes | Root |
| **TYPE_INDEX.md** | Types file section map (read this, not index.ts) | `apps/web/types/` |

---

## Architecture

```
apps/web/          → Next.js 14 App Router frontend (deployed to Cloud Run us-west1)
functions/         → Firebase Cloud Functions Gen 2 (us-east1), handles email + user creation
```

- **Auth:** Firebase Authentication (email/password, magic links for clients)
- **Database:** Firestore (NoSQL)
- **Styling:** Tailwind CSS with CSS variables for brand colors
- **Forms:** React Hook Form + Zod validation
- **State:** Custom Firestore hooks (lib/hooks/), no global state library
- **PDF Generation:** @react-pdf/renderer
- **Icons:** Heroicons (outline variant)

---

## Local Environment

- **Node:** v20 via Homebrew (`brew link node@20` — keg-only, must be symlinked)
- **npm:** v10.8.2
- **Firebase CLI:** v15.4.0 (`firebase` in PATH via Homebrew)
- **Docker:** Docker Desktop for Mac
- **gcloud:** Google Cloud SDK (`gcloud` in PATH via Homebrew)
- All tools in `/opt/homebrew/bin/`. Node@20 bin also at `/opt/homebrew/opt/node@20/bin/`.

---

## Commands

All commands run from `apps/web/` unless noted:
```bash
npm run dev              # Start Next.js dev server
npm run build            # Production build
npm run start            # Start production server
npx tsc --noEmit         # Type check (RUN THIS OFTEN)
npm run emulators        # Start Firebase emulators
```

---

## Docker Management (Local Development)

**CRITICAL:** Always use the local build script for Docker builds. Never use `docker build` directly — it will fail due to missing Firebase environment variables.

### Local Docker Build & Run

```bash
# From apps/web/ directory:

# 1. Build using local script (reads .env.local for Firebase keys)
./docker-build-local.sh

# 2. ALWAYS stop and remove old container first
docker stop contractoros-web 2>/dev/null
docker rm contractoros-web 2>/dev/null

# 3. Start new container
docker run -d -p 3000:8080 --name contractoros-web contractoros-web

# 4. Verify running with correct version
docker ps
```

### Why Direct `docker build` Fails

The Dockerfile requires Firebase environment variables as build args (NEXT_PUBLIC_FIREBASE_*). These are:
- **Production:** Injected by Cloud Build from GCP Secret Manager
- **Local:** Read from `.env.local` by `docker-build-local.sh`

Running `docker build .` directly results in:
```
FirebaseError: Firebase: Error (auth/invalid-api-key)
Error occurred prerendering page "/_not-found"
```

### Container Lifecycle Checklist

Always confirm:
1. ✅ Old container stopped (`docker stop contractoros-web`)
2. ✅ Old container removed (`docker rm contractoros-web`)
3. ✅ New container started (`docker run ...`)
4. ✅ Container running (`docker ps` shows STATUS "Up")
5. ✅ Version badge in app footer shows expected git commit hash

---

## Complete Local Build & Deploy Workflow

**CRITICAL:** Follow this workflow for EVERY release. Firebase indexes must be deployed alongside code changes to avoid "requires an index" errors.

### Full Release Checklist

```bash
# From project root:

# 1. TypeScript check (catch errors before build)
cd apps/web && npx tsc --noEmit

# 2. Deploy Firebase rules & indexes FIRST (before Docker build)
#    This ensures indexes are building while you build Docker
firebase deploy --only firestore --project contractoros-483812

# 3. Build Docker image (from apps/web/)
./docker-build-local.sh

# 4. Stop and remove old container
docker stop contractoros-web 2>/dev/null
docker rm contractoros-web 2>/dev/null

# 5. Start new container
docker run -d -p 3000:8080 --name contractoros-web contractoros-web

# 6. Verify deployment
docker ps  # Should show "Up" status
# Check http://localhost:3000 - version badge should match commit
```

### Why Firebase Deploy Must Come First

Firebase composite indexes take time to build (30 seconds to several minutes). By deploying Firestore rules/indexes BEFORE building Docker:
- Indexes start building immediately
- Docker build runs in parallel
- By the time Docker is ready, indexes are usually done
- No need to "build twice" or wait for index errors

### Quick Reference Commands

```bash
# Deploy everything (rules + indexes)
firebase deploy --only firestore --project contractoros-483812

# Check index build status
firebase firestore:indexes --project contractoros-483812

# Full rebuild (copy-paste ready)
cd apps/web && npx tsc --noEmit && \
firebase deploy --only firestore --project contractoros-483812 && \
./docker-build-local.sh && \
docker stop contractoros-web 2>/dev/null; \
docker rm contractoros-web 2>/dev/null; \
docker run -d -p 3000:8080 --name contractoros-web contractoros-web && \
docker ps
```

---

## Portal Routes (app/)

| Route prefix | Portal | Users |
|---|---|---|
| `/dashboard/` | PM/Owner dashboard | General contractors, project managers |
| `/dashboard/clients/` | Client CRM | NEW - Client management |
| `/dashboard/signatures/` | E-Signature tracking | NEW - Signature requests |
| `/dashboard/estimates/` | Estimates | NEW - With e-signature |
| `/client/` | Client portal | Homeowners, property owners |
| `/sub/` | Subcontractor portal | Subcontractors |
| `/field/` | Field worker portal | Employees on-site |
| `/sign/[token]/` | Public signing | NEW - Magic link signing |

---

## Module Map

### Core Modules
- `components/ui/` — Shared primitives: Button, Card, Badge, Toast, EmptyState, Skeleton
- `lib/hooks/` — Firestore data hooks with real-time subscriptions
- `lib/firebase/` — Firebase config, storage helpers
- `types/index.ts` — All TypeScript types (central location)

### Feature Modules
- `components/projects/` — Project UI: phases, scope, tasks (kanban/gantt/list)
- `components/clients/` — **NEW** Client CRM: AddClientModal, EditClientModal, etc.
- `components/esignature/` — **NEW** E-signature: SignaturePad, SendForSignatureModal
- `components/tasks/` — Task detail: comments, attachments, assignments
- `components/subcontractors/` — Sub management

### Service Modules
- `lib/esignature/` — **NEW** PDF generation, signature service
- `lib/hooks/useClients.ts` — **NEW** Client CRUD operations
- `lib/hooks/useSignatureRequests.ts` — **NEW** Signature tracking

---

## Recently Added Types (types/index.ts)

### Client Module
```typescript
ClientStatus = 'active' | 'past' | 'potential' | 'inactive'
ClientSource = 'referral' | 'google' | 'social_media' | 'yard_sign' | 'vehicle_wrap' | 'website' | 'repeat' | 'other'
Client, ClientFinancials, ClientAddress, ClientNote, ClientCommunicationLog
```

### E-Signature Module
```typescript
SignatureRequestStatus = 'draft' | 'pending' | 'viewed' | 'signed' | 'declined' | 'expired' | 'cancelled'
SignatureRequest, SignerInfo, SignatureAuditEntry
```

---

## Do Not Modify (without approval)

- `apps/web/Dockerfile` — Multi-stage build tuned for Cloud Run
- `cloudbuild.yaml` — Production CI/CD pipeline
- `firestore.rules` — Security rules (changes need careful review)
- `firestore.indexes.json` — Composite indexes (only add, never remove)

---

## Key Technical Decisions

- **App Router (not Pages Router):** All routes use Next.js 14 app/ directory
- **Client-side Firestore:** Direct Firestore reads from React hooks, no API layer
- **Standalone output:** next.config.js uses `output: 'standalone'` for Docker
- **No test framework:** Zero test coverage (known tech debt)
- **Real-time subscriptions:** Use `onSnapshot` for live updates
- **Magic links:** For client portal and e-signature access

---

## Secrets Management

All secrets stored in **GCP Secret Manager** (project: `contractoros-483812`).

**Current Secrets:**
| Secret Name | Description |
|-------------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API Key |
| `MAILGUN_API_KEY` | Mailgun API Key (for Cloud Functions) |
| `MAILGUN_DOMAIN` | Mailgun sending domain |

**Adding New Secrets:**
```bash
# Create secret in GCP
echo -n "secret-value" | gcloud secrets create SECRET_NAME --data-file=- --project=contractoros-483812

# Grant Cloud Build access
gcloud secrets add-iam-policy-binding SECRET_NAME \
  --member="serviceAccount:424251610296@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=contractoros-483812
```

---

## Firestore Rules, Indexes & Permissions

When adding new collections or subcollections, ensure:
1. Corresponding rules exist in `firestore.rules`
2. Required composite indexes are added to `firestore.indexes.json`

### Common Permission Error Pattern

If you see `Error: Missing or insufficient permissions`:
1. Check that the collection path has a matching rule in `firestore.rules`
2. Organization-scoped collections use pattern: `organizations/{orgId}/collectionName/{docId}`
3. These require `isSameOrg(orgId)` helper for access control

### Index Error Pattern

If you see `requires an index` error:
1. The error message includes a link to create the index in Firebase Console
2. Better: Add the index to `firestore.indexes.json` and deploy

### Deploying Rules & Indexes

**IMPORTANT:** Always deploy BOTH rules and indexes when making Firestore changes.

```bash
# Deploy rules only
firebase deploy --only firestore:rules --project contractoros-483812

# Deploy indexes only
firebase deploy --only firestore:indexes --project contractoros-483812

# Deploy both (recommended)
firebase deploy --only firestore --project contractoros-483812
```

### Build & Deploy Checklist

When making changes that affect Firestore queries:
1. ✅ Add/update rules in `firestore.rules`
2. ✅ Add required composite indexes to `firestore.indexes.json`
3. ✅ Deploy: `firebase deploy --only firestore --project contractoros-483812`
4. ✅ Wait for indexes to build (check Firebase Console)

### Rule Helpers

```javascript
isSameOrg(orgId)  // User belongs to same org
isAdmin()         // User is OWNER or PM
isOwner(userId)   // User owns the resource
```

---

## Known Issues / Tech Debt

- No pagination — will break at scale
- No tests — critical paths unguarded
- AuthProvider architecture needs refactoring
- Silent error handling in some places

---

## Pre-Flight Checks (Run Before Every Build)

> **Purpose:** Catch common errors before wasting time on Docker builds or deployments.

### Quick Validation Script

```bash
# Run this BEFORE any build or deploy
cd apps/web && \
echo "1. TypeScript check..." && npx tsc --noEmit && \
echo "2. Checking for common import errors..." && \
grep -r "from '@/types/index'" --include="*.tsx" --include="*.ts" . | head -5 && \
echo "✅ Pre-flight checks passed"
```

### Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot find module '@/types'` | Wrong import path | Use `from '@/types'` not `from '@/types/index'` |
| `Property X does not exist on type Y` | Type mismatch | Check exact interface in types file |
| `FirebaseError: Missing permissions` | Firestore rules | Add rule to `firestore.rules`, deploy |
| `requires an index` | Composite query | Add index to `firestore.indexes.json`, deploy |
| `Module not found: Can't resolve` | Missing export | Check component's `index.ts` exports |
| `'X' is declared but never used` | TypeScript strict | Remove unused imports/variables |

### Type Definition Gotchas

1. **Timestamp vs Date**: Firestore stores `Timestamp`, convert with `.toDate()` when reading
2. **Optional fields**: Use `field?: Type` for nullable Firestore fields
3. **Omit pattern**: Use `Omit<Type, 'id' | 'createdAt'>` for create operations
4. **Union types**: Check all union values are handled in switch statements

### Firestore Rules Checklist

Before adding a new collection:
- [ ] Add read/write rules to `firestore.rules`
- [ ] Use `isSameOrg(orgId)` for org-scoped collections
- [ ] Add composite indexes if query has multiple `where` clauses + `orderBy`
- [ ] Deploy rules: `firebase deploy --only firestore --project contractoros-483812`
- [ ] Wait for index build (30s-2min)

### Hook Pattern Checklist

When creating a new `useX.ts` hook:
- [ ] **Use shared utilities** (see below) instead of copy-paste
- [ ] Import from `firebase/firestore`, not `firebase`
- [ ] Use `onSnapshot` for real-time, `getDocs` for one-time reads
- [ ] Always check `if (!orgId) return` early
- [ ] Return `{ items, loading, error }` consistently
- [ ] Export label constants (e.g., `STATUS_LABELS`)

---

## Shared Utilities (Use These!)

> **Purpose:** Reduce code duplication and speed up feature development.
> **See:** `docs/REFACTORING_ROADMAP.md` for full details.

### Timestamp Converter
**File:** `lib/firebase/timestamp-converter.ts`

```typescript
import { convertTimestamps, DATE_FIELDS } from '@/lib/firebase/timestamp-converter';

// In your hook's converter function:
const client = convertTimestamps(doc.data(), DATE_FIELDS.client);
// Converts Firestore Timestamps to JS Dates for: createdAt, updatedAt, lastContactDate
```

### Generic Collection Hook
**File:** `lib/hooks/useFirestoreCollection.ts`

```typescript
import { useFirestoreCollection } from '@/lib/hooks/useFirestoreCollection';

const { items, loading, error } = useFirestoreCollection<Client>({
  path: `organizations/${orgId}/clients`,
  constraints: [where('status', '==', 'active'), orderBy('name')],
  converter: (id, data) => ({ id, ...convertTimestamps(data, DATE_FIELDS.client) } as Client),
  enabled: !!orgId,
});
```

### Generic CRUD Hook
**File:** `lib/hooks/useFirestoreCrud.ts`

```typescript
import { useFirestoreCrud } from '@/lib/hooks/useFirestoreCrud';

const { create, update, remove, batchCreate } = useFirestoreCrud<Client>(
  `organizations/${orgId}/clients`,
  { entityName: 'Client' }
);

// Create with auto-timestamps and toast
const id = await create({ name: 'Acme Corp', status: 'active' });

// Update with auto-timestamps
await update(clientId, { status: 'inactive' });

// Batch operations
await batchCreate([client1, client2, client3]);
```

### UI Components
**File:** `components/ui/`

```typescript
// Page header with title, description, actions, breadcrumbs
import { PageHeader } from '@/components/ui';
<PageHeader
  title="Clients"
  description="Manage your client relationships"
  actions={<Button>Add Client</Button>}
/>

// Stats grid with icons and trends
import { StatsGrid } from '@/components/ui';
<StatsGrid stats={[
  { label: 'Total', value: 42, icon: UsersIcon },
  { label: 'Active', value: 35, icon: CheckCircleIcon, change: { value: 5, trend: 'up' } },
]} />

// Search and filter bar
import { FilterBar, useFilterBar } from '@/components/ui';
const { search, filters, setSearch, setFilter } = useFilterBar({ initialFilters: { status: '' } });
<FilterBar
  searchPlaceholder="Search clients..."
  onSearch={setSearch}
  filters={[{ key: 'status', label: 'Status', options: statusOptions }]}
  filterValues={filters}
  onFilterChange={setFilter}
/>

// Form modal with standard layout
import { FormModal, useFormModal } from '@/components/ui';
const { isOpen, open, close, loading, handleSubmit } = useFormModal();
<FormModal
  isOpen={isOpen}
  onClose={close}
  title="Add Client"
  loading={loading}
  onSubmit={() => handleSubmit(async () => { await create(formData); })}
>
  {/* Form fields */}
</FormModal>
```

---

## Workflow for Building New Features

1. **Check MASTER_ROADMAP.md** for feature spec
2. **Check existing patterns** in similar modules (e.g., clients for CRM patterns)
3. **Create in order:**
   - Types in `types/index.ts`
   - Hook in `lib/hooks/use{Module}.ts`
   - Pages in `app/dashboard/{module}/`
   - Components in `components/{module}/`
4. **Run TypeScript check:** `npx tsc --noEmit`
5. **Update SPRINT_STATUS.md** with progress

See `docs/DEVELOPMENT_GUIDE.md` for detailed patterns and examples.
