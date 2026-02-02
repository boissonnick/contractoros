# ContractorOS — Claude Code Instructions

> **For AI Assistants:** Read this file completely on session start. It contains critical context.

---

## Session Quick Start

```bash
# 1. Identify your session role (see "Multi-Session Roles" below)
# 2. Check current status
cat docs/SPRINT_STATUS.md | head -100

# 3. Verify environment
cd apps/web && npx tsc --noEmit

# 4. Check what's running
docker ps
```

---

## Multi-Session Workflow

This project uses **parallel Claude Code sessions** for maximum productivity. Each session has a specific role.

### Session Roles

| Role | Terminal | Responsibilities | Branch Strategy |
|------|----------|-----------------|-----------------|
| **Controller** | Terminal 1 | Coordination, CLAUDE.md maintenance, sprint planning, code review | `main` |
| **Dev Sprint** | Terminal 2 | Feature development, UI components, hooks | Feature branches |
| **Database** | Terminal 3 | Firestore rules, indexes, Cloud Functions | `main` or feature |
| **E2E Testing** | Terminal 4 | Chrome MCP testing, regression, UAT | `main` |

### Communication Protocol

Sessions communicate via:
1. **SPRINT_STATUS.md** — Primary status document (check before starting work)
2. **Git commits** — Pull frequently to get other sessions' changes
3. **File markers** — Use `// TODO(session-name): message` for cross-session tasks

### Conflict Prevention Rules

1. **Never edit the same file simultaneously** across sessions
2. **Controller owns:** CLAUDE.md, SPRINT_STATUS.md, sprint plan docs
3. **Dev Sprint owns:** components/, app/dashboard/, lib/hooks/
4. **Database owns:** firestore.rules, firestore.indexes.json, functions/
5. **E2E owns:** e2e/, test reports

---

## Project Overview

**ContractorOS** — Field-first construction project management platform.

| Portal | Route | Users |
|--------|-------|-------|
| PM Dashboard | `/dashboard/` | General contractors, project managers |
| Client Portal | `/client/` | Homeowners, property owners |
| Sub Portal | `/sub/` | Subcontractors |
| Field Portal | `/field/` | Employees on-site |
| Public Signing | `/sign/[token]/` | Magic link e-signature |

---

## Architecture

```
apps/web/          → Next.js 14 App Router (Cloud Run us-west1)
functions/         → Firebase Cloud Functions Gen 2 (us-east1)
```

| Layer | Technology |
|-------|-----------|
| Auth | Firebase Authentication |
| Database | Firestore (NoSQL) |
| Styling | Tailwind CSS + CSS variables |
| Forms | React Hook Form + Zod |
| State | Custom Firestore hooks (no Redux/Zustand) |
| PDF | @react-pdf/renderer |
| Icons | Heroicons (outline) |

---

## Critical Commands

All commands from `apps/web/` unless noted:

```bash
# Development
npm run dev              # Start dev server (:3000)
npx tsc --noEmit         # Type check (RUN FREQUENTLY)

# Docker (local testing)
./docker-build-local.sh  # Build image (reads .env.local)
docker stop contractoros-web; docker rm contractoros-web
docker run -d -p 3000:8080 --name contractoros-web contractoros-web

# Firebase
firebase deploy --only firestore --project contractoros-483812
firebase deploy --only functions --project contractoros-483812

# Full rebuild (copy-paste ready)
npx tsc --noEmit && \
firebase deploy --only firestore --project contractoros-483812 && \
./docker-build-local.sh && \
docker stop contractoros-web 2>/dev/null; docker rm contractoros-web 2>/dev/null; \
docker run -d -p 3000:8080 --name contractoros-web contractoros-web
```

---

## Token Optimization (CRITICAL)

### Types File Strategy

The `types/index.ts` file is **~6,000 lines (139KB)**. Reading it wastes context.

**DO:**
```bash
# Find specific type
grep -n "export interface PayrollRun" apps/web/types/index.ts

# Read only 50 lines around it
# Use Read tool with offset/limit parameters
```

**DON'T:**
- Read the entire types file
- Search without knowing what you're looking for

### Types Section Map

| Lines | Section |
|-------|---------|
| 1-153 | User & Organization |
| 154-580 | Permissions & Roles |
| 581-669 | Projects |
| 670-750 | Activity & Phases |
| 751-855 | Quotes & Preferences |
| 856-1040 | Tasks & Scope |
| 1041-1115 | Time Tracking & Payroll |
| 1116-1230 | Scheduling |
| 1231-1390 | Subcontractors & Bids |
| 1391-1560 | Expenses & Materials |
| 1560-1710 | Photos & Issues |
| 1710-1800 | Invoices & Daily Logs |
| 1800-2100 | SOW & Change Orders |
| 2100-2350 | Estimates & Proposals |
| 2350-2630 | Accounting Integration |
| 2630-2740 | Selections & Warranty |
| 2740-3000 | Messaging & Safety |
| 3000+ | Equipment & Tools |

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `FirebaseError: Missing permissions` | Missing Firestore rule | Add rule to `firestore.rules`, deploy |
| `requires an index` | Missing composite index | Add to `firestore.indexes.json`, deploy |
| `Cannot find module '@/types'` | Wrong import | Use `from '@/types'` not `from '@/types/index'` |
| `auth/invalid-api-key` | Docker build without env vars | Use `./docker-build-local.sh` not `docker build` |
| Container exists error | Old container not removed | `docker stop contractoros-web; docker rm contractoros-web` |

---

## Firestore Patterns

### Adding New Collections

1. Add types to `types/index.ts`
2. Add rules to `firestore.rules`:
```javascript
match /organizations/{orgId}/newCollection/{docId} {
  allow read, write: if isSameOrg(orgId);
}
```
3. Add indexes to `firestore.indexes.json` if using compound queries
4. Deploy: `firebase deploy --only firestore --project contractoros-483812`

### Rule Helpers

```javascript
isSameOrg(orgId)  // User belongs to same org
isAdmin()         // User is OWNER or PM
isOwner(userId)   // User owns the resource
```

---

## Hook Patterns

Use shared utilities in `lib/hooks/`:

```typescript
// Generic collection hook
import { useFirestoreCollection } from '@/lib/hooks/useFirestoreCollection';

// Generic CRUD operations
import { useFirestoreCrud } from '@/lib/hooks/useFirestoreCrud';

// Timestamp conversion
import { convertTimestamps, DATE_FIELDS } from '@/lib/firebase/timestamp-converter';
```

### Hook Checklist

- [ ] Early return if `!orgId`
- [ ] Use `onSnapshot` for real-time, `getDocs` for one-time
- [ ] Return `{ items, loading, error }` consistently
- [ ] Export label constants (e.g., `STATUS_LABELS`)

---

## UI Component Library

All in `components/ui/`:

| Component | Use For |
|-----------|---------|
| `PageHeader` | Page title, description, actions, breadcrumbs |
| `StatsGrid` | KPI cards with icons and trends |
| `FilterBar` | Search and filter controls |
| `FormModal` | Standard modal with form layout |
| `DataTable` | Sortable, filterable tables |
| `EmptyState` | No-data placeholders |
| `Skeleton` | Loading states |

---

## Do Not Modify (Without Approval)

- `apps/web/Dockerfile` — Multi-stage build for Cloud Run
- `cloudbuild.yaml` — Production CI/CD
- `firestore.rules` — Security rules (review carefully)
- `firestore.indexes.json` — Only add, never remove

---

## Environment

| Tool | Version | Path |
|------|---------|------|
| Node | v20 | `/opt/homebrew/opt/node@20/bin/` |
| npm | v10.8.2 | - |
| Firebase CLI | v15.4.0 | `/opt/homebrew/bin/firebase` |
| Docker | Desktop for Mac | - |
| gcloud | SDK | `/opt/homebrew/bin/gcloud` |

---

## Secrets

All in **GCP Secret Manager** (project: `contractoros-483812`):

- `NEXT_PUBLIC_FIREBASE_*` — Firebase config (6 keys)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — Maps
- `MAILGUN_API_KEY`, `MAILGUN_DOMAIN` — Email
- `QUICKBOOKS_CLIENT_ID`, `QUICKBOOKS_CLIENT_SECRET` — QBO (if configured)

---

## Documentation Index

| Document | Purpose |
|----------|---------|
| `docs/SPRINT_STATUS.md` | Current progress, task tracking |
| `docs/MASTER_ROADMAP.md` | Complete backlog |
| `docs/STRATEGIC_PLAN_FEB_2026.md` | Current sprint plan |
| `docs/DEVELOPMENT_GUIDE.md` | Feature patterns |
| `docs/ARCHITECTURE.md` | Technical deep-dive |
| `docs/TESTING_STRATEGY.md` | E2E testing approach |

---

## E2E Testing

Location: `apps/web/e2e/`

```bash
# In Claude Code with Chrome MCP:
"Run smoke tests from apps/web/e2e/suites/00-smoke.md at localhost:3000"
"Run mobile tests from apps/web/e2e/suites/22-ui-ux-mobile.md at 375x812"
```

| Suite | File | Duration |
|-------|------|----------|
| Smoke | 00-smoke.md | 10 min |
| Security | 02-rbac.md | 20 min |
| Mobile | 22-ui-ux-mobile.md | 30 min |
| Full UAT | 23-uat-checklist.md | 2 hours |

---

## Known Issues / Tech Debt

- No pagination — will break at scale
- No unit tests — E2E tests only
- Mobile UI needs ongoing polish
- AuthProvider architecture needs refactoring
- Some silent error handling

---

## Git Worktree Setup (For Parallel Sessions)

If using worktrees for true parallel development:

```bash
# From project root, create worktrees
git worktree add ../contractoros-dev feature/current-sprint
git worktree add ../contractoros-database database-work
git worktree add ../contractoros-e2e e2e-testing

# Each terminal uses its own worktree
# Terminal 1 (Controller): ~/contractoros (main)
# Terminal 2 (Dev): ~/contractoros-dev
# Terminal 3 (Database): ~/contractoros-database
# Terminal 4 (E2E): ~/contractoros-e2e
```

---

## Session Startup Checklist

1. [ ] Read this CLAUDE.md completely
2. [ ] Check `docs/SPRINT_STATUS.md` for current state
3. [ ] Run `npx tsc --noEmit` to verify build
4. [ ] Check `docker ps` for running containers
5. [ ] Identify your session role
6. [ ] Pull latest: `git pull origin main`
