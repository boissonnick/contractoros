# ContractorOS — Project Intelligence

> **For AI Assistants:** This is your primary context file. Read this first, then check `docs/SPRINT_STATUS.md` for current work.

## Quick Start for New Sessions

```bash
# 1. Check current status
cat docs/SPRINT_STATUS.md

# 2. Verify TypeScript
cd apps/web && npx tsc --noEmit

# 3. Review relevant docs
cat docs/DEVELOPMENT_GUIDE.md      # How to build features
cat docs/ARCHITECTURE.md           # Technical patterns
cat docs/COMPONENT_PATTERNS.md     # UI component usage
cat docs/MASTER_ROADMAP.md         # Full backlog
cat docs/DEPLOYMENT_CHECKLIST.md   # Firebase rules/deploy requirements
```

---

## What This Is

Field-first construction project management platform. Multi-portal app serving general contractors (dashboard), subcontractors, clients, and field workers. Built on Next.js 14 + Firebase.

**Current State (2026-01-28):**
- Sprint 4 (Client Management) COMPLETED
- E-Signature system COMPLETED
- Documentation strategy COMPLETED
- Next: Sprint 5 - Photo Docs OR Payment Processing OR SMS/Text

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

## Firestore Rules & Permissions

When adding new collections or subcollections, ensure corresponding rules exist in `firestore.rules`.

### Common Permission Error Pattern

If you see `Error: Missing or insufficient permissions`:
1. Check that the collection path has a matching rule in `firestore.rules`
2. Organization-scoped collections use pattern: `organizations/{orgId}/collectionName/{docId}`
3. These require `isSameOrg(orgId)` helper for access control

### Deploying Rules

```bash
firebase deploy --only firestore:rules --project contractoros-483812
```

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
