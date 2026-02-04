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

## Sub-Agent Workflow (Parallel Development)

This project uses **sub-agents via the Task tool** for parallel development within a single session. This is more efficient than multiple CLI terminals.

### When to Use Sub-Agents

Use sub-agents (Task tool) for:
- **Parallel independent tasks** — Multiple features that don't share files
- **Research + Implementation** — One agent researches while another codes
- **Data seeding** — Seed scripts run independently
- **Long-running tasks** — Background agents with `run_in_background: true`

### Sub-Agent Types

| Agent Type | Use For | Tools Available |
|------------|---------|-----------------|
| `general-purpose` | Feature development, complex multi-step tasks | All tools |
| `Explore` | Codebase research, finding files, understanding patterns | Read-only tools |
| `Bash` | Running commands, seeds, deployments | Bash only |
| `Plan` | Designing implementation strategies | Read-only tools |

### Launching Parallel Sub-Agents

To run tasks in parallel, include multiple Task tool calls in a **single message**:

```
Example: Launch 3 parallel feature agents
- Agent 1: Seed demo tasks (Bash agent)
- Agent 2: Build SubcontractorCard component (general-purpose)
- Agent 3: Research weather API options (Explore)
```

### Sub-Agent Prompt Templates

#### Feature Development Agent
```
You are a feature development agent for ContractorOS.

TASK: [Specific feature to build]

CONTEXT:
- Next.js 14 App Router at apps/web/
- Firestore with named database "contractoros"
- Use existing UI components from components/ui/
- Follow hook patterns in lib/hooks/useClients.ts

FILES TO CREATE/MODIFY:
- [List specific files]

CONSTRAINTS:
- Do NOT modify: firestore.rules, firestore.indexes.json
- Run `npx tsc --noEmit` before completing
- Follow existing code patterns

DELIVERABLE: Working feature with TypeScript passing
```

#### Data Seeding Agent
```
You are a data seeding agent for ContractorOS.

TASK: [Seed script to run or create]

CONTEXT:
- Scripts location: scripts/seed-demo/
- MUST use named database via: import { getDb } from './db'
- Demo org: Horizon Construction Co.
- OrgId defined in utils.ts

EXECUTION:
cd scripts/seed-demo && npx ts-node [script-name].ts

DELIVERABLE: Confirm records created with count
```

#### UI Component Agent
```
You are a UI component agent for ContractorOS.

TASK: [Component to build]

CONTEXT:
- Components in apps/web/components/
- Use Tailwind CSS for styling
- Use Heroicons (outline) for icons
- Follow PageHeader, Card, Button patterns

PATTERNS TO FOLLOW:
- See components/clients/ClientCard.tsx for card pattern
- See components/ui/DataTable.tsx for table pattern
- See components/ui/FormModal.tsx for modal pattern

DELIVERABLE: TypeScript-safe component matching existing patterns
```

#### Database/Rules Agent
```
You are a database agent for ContractorOS.

TASK: [Rules or indexes to add]

CONTEXT:
- Rules file: firestore.rules
- Indexes file: firestore.indexes.json
- All collections MUST be org-scoped using isSameOrg(orgId)
- Deploy: firebase deploy --only firestore --project contractoros-483812

CONSTRAINTS:
- Never remove existing rules or indexes
- Test rules logic before deploying

DELIVERABLE: Updated rules deployed successfully
```

### File Ownership (Conflict Prevention)

Even with sub-agents, avoid editing the same files simultaneously:

| File Pattern | Owner Agent |
|--------------|-------------|
| `components/**` | UI/Feature agents |
| `lib/hooks/**` | Feature agents |
| `app/dashboard/**` | Feature agents |
| `firestore.rules` | Database agent only |
| `firestore.indexes.json` | Database agent only |
| `scripts/seed-demo/**` | Seeding agent only |
| `e2e/**` | Testing agent only |
| `docs/**` | Main session only |

### Background Agents

For long-running tasks, use `run_in_background: true`:

```typescript
// Example: Run seed script in background
Task({
  subagent_type: "Bash",
  prompt: "cd scripts/seed-demo && npx ts-node seed-tasks.ts",
  run_in_background: true
})
// Returns output_file path - check with Read tool later
```

### Coordination Pattern

```
1. Main session reads sprint docs, identifies parallel tasks
2. Launch sub-agents for independent work (single message, multiple Tasks)
3. Each agent works on its assigned files only
4. Agents return results to main session
5. Main session reviews, integrates, commits
6. Repeat for next batch of tasks
```

### Example: Sprint 40 Parallel Execution

```
PARALLEL BATCH 1:
- Bash agent: Run seed-tasks.ts (background)
- Bash agent: Run seed-rfis.ts (background)
- Explore agent: Research weather API integration

PARALLEL BATCH 2 (after batch 1):
- Feature agent: Build SubcontractorCard component
- Feature agent: Build WeatherWidget component
- Database agent: Add subcontractor indexes

PARALLEL BATCH 3 (after batch 2):
- Feature agent: Build SubcontractorDirectory page
- Feature agent: Integrate WeatherWidget into schedule
```

### Sub-Agent Best Practices

1. **Be specific** — Give exact file paths and clear acceptance criteria
2. **Limit scope** — One feature per agent, not entire modules
3. **Include context** — Reference existing patterns and files to follow
4. **Set constraints** — List files NOT to modify
5. **Request verification** — Ask agent to run tsc or confirm counts
6. **Use background for seeds** — Long-running scripts shouldn't block

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
| Database | Firestore (NoSQL) — **Named database: `contractoros`** |
| Styling | Tailwind CSS + CSS variables |
| Forms | React Hook Form + Zod |
| State | Custom Firestore hooks (no Redux/Zustand) |
| PDF | @react-pdf/renderer |
| Icons | Heroicons (outline) |

---

## ⚠️ CRITICAL: Named Firestore Database

**This project uses a NAMED Firestore database called `contractoros`, NOT the default database.**

### App Configuration (lib/firebase/config.ts)
```typescript
// CORRECT - uses named database
export const db = getFirestore(app, "contractoros");

// WRONG - uses default database (data won't be visible in app!)
export const db = getFirestore(app);
```

### Scripts & Cloud Functions (firebase-admin)
```typescript
// CORRECT - uses named database
import { getFirestore } from 'firebase-admin/firestore';
const db = getFirestore(app, 'contractoros');

// WRONG - uses default database
const db = getFirestore(app);
const db = admin.firestore();
```

### Why This Matters
- Data written to the default database will NOT appear in the app
- Data written to the `contractoros` database will NOT appear in Firebase Console's default view
- Always verify you're using the correct database when writing scripts, seeds, or Cloud Functions

### Firebase Console
To view data in Firebase Console, select the `contractoros` database from the database dropdown (not `(default)`).

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
| Data seeded but not visible in app | Used default database instead of named | Use `getFirestore(app, 'contractoros')` — see "Named Firestore Database" section |
| Data visible in Firebase Console but not app | Viewing wrong database in Console | Select `contractoros` database in Console dropdown |
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
| Node | v22 | `/opt/homebrew/opt/node@22/bin/` |
| npm | v10.x | - |
| Firebase CLI | v15.4.0 | `/opt/homebrew/bin/firebase` |
| Docker | Desktop for Mac | - |
| gcloud | SDK | `/opt/homebrew/bin/gcloud` |

**Note:** Use `.nvmrc` for automatic version switching: `nvm use`

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
| `docs/LAUNCH_CHECKLIST.md` | Pre-deployment verification |
| `docs/STRATEGIC_ROADMAP_NEXT_SPRINTS.md` | Platform analysis & roadmap |

---

## E2E Testing

Location: `apps/web/e2e/`

```bash
# In Claude Code with Chrome MCP:
"Run smoke tests from apps/web/e2e/suites/00-smoke.md at localhost:3000"
"Run mobile tests from apps/web/e2e/suites/22-ui-ux-mobile.md at 375x812"
"Run full regression from apps/web/e2e/suites/27-regression.md"
```

| Suite | File | Duration |
|-------|------|----------|
| Smoke | 00-smoke.md | 10 min |
| Security | 02-rbac.md | 20 min |
| Mobile | 22-ui-ux-mobile.md | 30 min |
| AI Assistant | 24-ai-assistant.md | 15 min |
| Full Regression | 27-regression.md | 2-3 hours |
| Full UAT | 23-uat-checklist.md | 2 hours |

**Test Results:** Store results in `apps/web/e2e/results/` using the template at `sprint-27-regression-template.md`

---

## Demo Seed Scripts

Location: `scripts/seed-demo/`

**IMPORTANT:** All seed scripts use the named `contractoros` database via `db.ts`.
Never use `admin.firestore()` or `getFirestore(app)` directly — always import from `db.ts`.

To seed demo data:

```bash
cd scripts/seed-demo

# Quick seed (recommended for testing)
npx ts-node seed-to-named-db.ts        # Creates user, org, clients, projects, tasks

# Full seed (all data)
npx ts-node index.ts                   # Main seeder - org, users, clients, financials

# Individual seeders
npx ts-node seed-projects.ts           # Projects
npx ts-node seed-tasks.ts              # Tasks
npx ts-node seed-rfis.ts               # RFIs
npx ts-node seed-subcontractors.ts     # Subcontractors & bids
```

Demo org: "Horizon Construction Co." with orgId matching your user's orgId (set in `utils.ts`).

---

## Known Issues / Tech Debt

- No pagination — will break at scale
- No unit tests — E2E tests only
- Mobile UI needs ongoing polish
- AuthProvider architecture needs refactoring
- Some silent error handling

---

## Session Startup Checklist

1. [ ] Read this CLAUDE.md completely
2. [ ] Check `docs/SPRINT_STATUS.md` for current sprint
3. [ ] Check `.claude-coordination/sprint-*-overview.md` for task breakdown
4. [ ] Run `npx tsc --noEmit` to verify build
5. [ ] Identify parallel tasks that can use sub-agents
6. [ ] Launch sub-agents for independent work

---

## Quick Reference: Launching Sub-Agents

### Pattern 1: Parallel Feature Development
```
Launch in single message:
1. Task(general-purpose): "Build ComponentA in components/feature/"
2. Task(general-purpose): "Build ComponentB in components/other/"
3. Task(Bash): "Run seed script X" (background)
```

### Pattern 2: Research Then Implement
```
Step 1: Task(Explore): "Find how similar feature is implemented"
Step 2: Use findings to Task(general-purpose): "Implement feature following pattern"
```

### Pattern 3: Database + Feature Coordination
```
Step 1: Task(general-purpose): "Add Firestore rules for new collection"
Step 2: After rules deployed, Task(general-purpose): "Build UI using new collection"
```

### Current Sprint Quick-Start

Check `.claude-coordination/sprint-40-overview.md` for current tasks, then launch:

```
# Data completeness (can run in parallel)
Task(Bash, background): "cd scripts/seed-demo && npx ts-node seed-tasks.ts"
Task(Bash, background): "cd scripts/seed-demo && npx ts-node seed-rfis.ts"

# Feature development (can run in parallel)
Task(general-purpose): "Build SubcontractorCard component..."
Task(general-purpose): "Build WeatherWidget component..."
```
