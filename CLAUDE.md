# ContractorOS — Claude Code Instructions

> **For AI Assistants:** Read this file completely on session start. It contains critical context.

---

## Current Sprint

**Sprint 107 — Invoice PDF & Email Delivery**
- **Phase:** 17 - Development Build Phase
- **Priority:** P0
- **What:** Wire InvoicePdf template, add PDF download/email actions, recurring invoice support
- **Sprint 106 DONE:** useEstimates hook created, wired into 3 pages, estimate→invoice conversion built

**Next Sprints (108-120):** See `docs/REPRIORITIZED_SPRINT_PLAN.md` (Phase 17)
**Sprints 97-105:** DEFERRED (deploy/testing — building features first)

---

## Session Quick Start

```bash
# 0. Check current status + next sprint
cat docs/SPRINT_STATUS.md | head -30

# 1. Check module locations (eliminates 200k+ token Explore waste!)
cat docs/MODULE_REGISTRY.md | head -100

# 2. Check sprint plan
cat docs/NEXT_SPRINTS_GUIDE.md | head -80

# 3. Verify environment
cd apps/web && npx tsc --noEmit

# 4. Check what's running
docker ps
```

**⚠️ CRITICAL: Sprint Start Decision Tree:**
1. **Brief exists?** (`docs/specs/sprint-{N}-brief.md`) → Read it, skip plan mode, start coding immediately
2. **No brief?** → Check MODULE_REGISTRY.md → Enter plan mode only if needed
3. **Never run Explore agents** without checking both the brief AND the registry first

**🚨 FOR PLAN MODE:** If entering Plan mode, MODULE_REGISTRY check is MANDATORY before Phase 1 Explore agents. See "Plan Mode: MODULE_REGISTRY Requirement" section below.

---

## Plan Mode: MODULE_REGISTRY Requirement

**CRITICAL:** When entering Plan mode for sprint work, MODULE_REGISTRY.md check is **MANDATORY** before launching Explore agents.

### Phase 1 Module Check (MANDATORY)

**BEFORE launching ANY Explore agents in Plan Mode:**

1. **Read MODULE_REGISTRY.md completely** (~5k tokens)
   ```bash
   cat docs/MODULE_REGISTRY.md | head -200
   ```

2. **Search for required modules:**
   ```bash
   cat docs/MODULE_REGISTRY.md | grep -i "clients\|expenses\|reports"
   ```

3. **Decision tree:**
   - ✅ **Module in registry** → Skip Explore agents, read files directly from registry, proceed to Phase 2
   - ❌ **Module NOT in registry** → Launch Explore agent, note registry needs update after exploration

### Example: Pagination Sprint

**User request:** "Add pagination to Clients and Expenses pages"

**❌ WRONG (55.9k tokens wasted):**
```
Phase 1: Launch Explore agent for expenses page structure
→ Wastes 55.9k tokens discovering what's in MODULE_REGISTRY.md line 38
```

**✅ CORRECT (5k tokens):**
```
Phase 1:
1. Read MODULE_REGISTRY.md
2. Find Clients → useClients, clients/page.tsx, ClientCard
3. Find Expenses → useExpenses, expenses/page.tsx, ExpenseCard
4. Read those 4 specific files directly
5. Proceed to Phase 2 design
→ Saves 50.9k tokens by using registry
```

### When to Explore vs When to Use Registry

| Scenario | Action | Token Cost |
|----------|--------|------------|
| Working with existing pages/features | Check registry → Read specific files | ~5k |
| Implementing NEW feature not in registry | Explore → Update registry after | 50-100k |
| Fixing bug in existing feature | Check registry → Read specific files | ~5k |
| Adding component to existing feature | Check registry → Read similar components | ~5k |
| Understanding existing page structure | Check registry → Read page files | ~5k |

**Rule:** Only launch Explore agents if module truly doesn't exist in MODULE_REGISTRY.md

### Token Waste History

| Sprint | What Was Explored | Tokens Wasted | Already in Registry? |
|--------|-------------------|---------------|---------------------|
| 53 | Settings, schedule, mobile nav | 248.8k | ✅ Yes (lines 51, 49, navigation/) |
| 54 | Reports, notifications, packages | 197.6k | ✅ Yes (lines 46, 100) |
| 60 | Expenses page structure | 55.9k | ✅ Yes (line 38) |
| **Total** | **All modules documented** | **502.3k** | **100% avoidable** |

**Every single exploration was unnecessary** - all information was already in MODULE_REGISTRY.md.

---

## Implementation Briefs (Skip Plan Mode)

**Implementation briefs** are pre-generated files that contain everything needed to start coding a sprint immediately — no plan mode, no Explore agents.

### What's in a Brief?
- Existing files (types, hooks, pages, components) with line numbers
- What exists vs what's missing
- Files to create and modify
- Patterns to follow (with references)
- Parallel work plan with sub-agent assignments
- Firestore rules/indexes needed

### Sprint Start with Brief (PREFERRED)
```
1. Check: ls docs/specs/sprint-{N}-brief.md
2. Read the brief (~5k tokens)
3. Launch parallel sub-agents per the brief's work plan
4. Start coding immediately — NO plan mode needed
```

### Sprint Start without Brief (FALLBACK)
```
1. Check MODULE_REGISTRY.md for module locations
2. Enter plan mode only if truly needed
3. After exploration: GENERATE a brief for this sprint AND the next 2
4. This prevents the same waste for future sprints
```

### Generating Briefs (Scoping Sprints)
- **Template:** `docs/specs/SPRINT_BRIEF_TEMPLATE.md`
- **Process:** `docs/specs/SPRINT-65-SCOPING.md`
- **When:** Dedicated scoping sprint, or end-of-sprint as background agent

### End-of-Sprint Brief Generation
After completing sprint N, generate a brief for sprint N+3 as a background agent:
```
Task(Explore, background): "Read spec for Sprint {N+3}.
Cross-reference with MODULE_REGISTRY.md and codebase.
Write implementation brief to docs/specs/sprint-{N+3}-brief.md
using template at docs/specs/SPRINT_BRIEF_TEMPLATE.md"
```
This keeps a rolling 2-sprint buffer of pre-generated briefs.

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

BEFORE STARTING:
☑️ CHECK docs/MODULE_REGISTRY.md for [FEATURE] location first
☑️ Do NOT run Explore agents if module is in the registry
☑️ Start work immediately if paths are found

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

BEFORE STARTING:
☑️ CHECK docs/MODULE_REGISTRY.md for seed script patterns
☑️ Follow existing seed script structure if available

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

BEFORE STARTING:
☑️ CHECK docs/MODULE_REGISTRY.md for similar component patterns
☑️ Find existing components in the same feature area
☑️ Do NOT explore if component directory is in the registry

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

BEFORE STARTING:
☑️ CHECK docs/MODULE_REGISTRY.md Firestore Collections table
☑️ Verify collection structure before adding rules/indexes
☑️ Follow existing org-scoped patterns

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

**Top 3 Issues:**

| Error | Fix |
|-------|-----|
| `FirebaseError: Missing permissions` | Add rule to `firestore.rules`, deploy |
| `requires an index` | Add to `firestore.indexes.json`, deploy |
| Data seeded but not in app | Use `getFirestore(app, 'contractoros')` not default DB |

See `docs/reference/TROUBLESHOOTING.md` for complete error reference including:
- Named database issues
- TypeScript/module errors
- Docker build failures
- Performance debugging
- Testing timeouts

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

| Tool | Version | Status |
|------|---------|--------|
| Node | v22 | ✅ Required |
| Firebase CLI | v15.4.0+ | ✅ Required |
| Docker Desktop | Latest | ✅ Required |

**Note:** Use `.nvmrc` for automatic version switching: `nvm use`

See `docs/reference/ENVIRONMENT_CONFIG.md` for complete setup instructions, paths, and configuration.

---

## Secrets

All in **GCP Secret Manager** (project: `contractoros-483812`):

- `NEXT_PUBLIC_FIREBASE_*` — Firebase config (6 keys)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — Maps
- `MAILGUN_API_KEY`, `MAILGUN_DOMAIN` — Email
- `QUICKBOOKS_CLIENT_ID`, `QUICKBOOKS_CLIENT_SECRET` — QBO (if configured)

---

## Documentation Index

| Document | Purpose | When to Read | Token Cost |
|----------|---------|--------------|------------|
| **`docs/MODULE_REGISTRY.md`** | **Codebase navigation (eliminates Explore agents)** | **Every sprint start** | **~5,000** |
| `docs/NEXT_SPRINTS_GUIDE.md` | Sprint quick-start & priorities | Session start (sprint planning) | ~3,000 |
| `docs/SPRINT_STATUS.md` | Current progress & handoffs | Daily (session start/end) | ~12,000 |
| `docs/REPRIORITIZED_SPRINT_PLAN.md` | Active execution roadmap | Daily (sprint work) | ~18,000 |
| `docs/VERSION_AUDIT_FEB_2026.md` | Package versions & upgrades | Weekly (dependency work) | ~15,000 |
| `docs/PLATFORM_AUDIT_COMPLETE.md` | Known issues & bug tracking | As-needed (bug fixing) | ~10,000 |
| `docs/STRATEGIC_PLAN_FEB_2026.md` | Platform strategy | As-needed (strategic planning) | ~8,000 |
| `docs/DEVELOPMENT_GUIDE.md` | Feature patterns | As-needed (new features) | ~6,000 |
| `docs/ARCHITECTURE.md` | Technical deep-dive | As-needed (architecture) | ~18,000 |
| `docs/TESTING_STRATEGY.md` | E2E testing approach | As-needed (testing) | ~8,000 |
| `docs/LAUNCH_CHECKLIST.md` | Pre-deployment verification | As-needed (deployment) | ~5,000 |

---

## Documentation Maintenance (Rolling Window)

**Purpose:** Keep documentation lean by automatically archiving completed work while preserving all historical context.

### Sprint Archival Rules

**Keep in SPRINT_STATUS.md:**
- Current sprint (in progress)
- Last 2 completed sprints
- **Maximum:** 3 sprints total

**Archive trigger:**
When sprint N+3 completes, archive sprint N to `.claude-coordination/archive/`

**Example:**
- Sprint 53 (current) → Keep in SPRINT_STATUS.md
- Sprint 52 (last completed) → Keep in SPRINT_STATUS.md
- Sprint 51 (2nd last completed) → Keep in SPRINT_STATUS.md
- Sprint 50 (3rd last completed) → Archive to `sprints-47-52-history.md`

### Archive Process (5 minutes per sprint)

When a sprint completes:

1. **Mark complete** in SPRINT_STATUS.md with completion date
2. **Check sprint count** — If 3+ completed sprints exist, trigger archive
3. **Extract oldest sprint** to `.claude-coordination/archive/sprints-{start}-{end}-history.md`
4. **Update header** in SPRINT_STATUS.md pointing to archive location
5. **Verify token budget** — SPRINT_STATUS.md should stay <1,000 lines

### Token Budgets (Per File)

| File | Target Lines | Max Lines | Estimated Tokens |
|------|--------------|-----------|------------------|
| `SPRINT_STATUS.md` | 300-500 | 1,000 | <15,000 |
| `REPRIORITIZED_SPRINT_PLAN.md` | 600-800 | 1,200 | <20,000 |
| `NEXT_SPRINTS_GUIDE.md` | 100-150 | 200 | <3,000 |
| `CLAUDE.md` | 400-500 | 600 | <10,000 |
| **Total Daily Docs** | **~1,500** | **~3,000** | **<50,000** |

### Maintenance Schedule

**After Every Sprint:**
- [ ] Mark sprint complete in SPRINT_STATUS.md
- [ ] Update REPRIORITIZED_SPRINT_PLAN.md with next sprint
- [ ] Check if archival triggered (3+ completed sprints)
- [ ] Archive if needed

**Monthly Review:**
- [ ] Check token budgets (run line counts)
- [ ] Archive sprints completed >30 days ago
- [ ] Review for duplicate content
- [ ] Update NEXT_SPRINTS_GUIDE.md if priorities changed

**Quarterly Review:**
- [ ] Review reference docs for currency
- [ ] Archive superseded research
- [ ] Update CLAUDE.md if major pattern changes

See `docs/DOCUMENTATION_MAINTENANCE.md` for detailed procedures.

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

- Pagination only on Clients + Expenses — other lists may need it at scale
- Unit tests at 1,502 (42 suites) — Sprint 101 targets 1,800+
- ESLint: 1,050 warnings — Sprint 100 targets <400
- Some silent error handling — Sprint 102 addresses this
- Not yet deployed to production — Sprint 96-97 handles deploy

---

## Session Startup Checklist

1. [ ] Read this CLAUDE.md completely
2. [ ] **CHECK `docs/SPRINT_STATUS.md`** for current sprint and next actions
3. [ ] **CHECK `docs/MODULE_REGISTRY.md`** for module locations (avoids 200k+ token Explore agents!)
4. [ ] **CHECK `docs/NEXT_SPRINTS_GUIDE.md`** for sprint plan and subagent assignments
5. [ ] Run `npx tsc --noEmit` to verify build
6. [ ] If brief exists: `ls docs/specs/sprint-{N}-brief.md` — skip plan mode, start coding
7. [ ] Identify parallel tasks from sprint plan
8. [ ] Launch sub-agents for independent work

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

### Current Sprint Quick-Start (Sprint 107)

**Sprint 107 — Invoice PDF & Email Delivery**

```bash
# 1. Verify build
cd apps/web && npx tsc --noEmit

# 2. Check existing PDF service
cat apps/web/lib/esignature/pdf-service.ts | head -50

# 3. Check useInvoices hook
cat apps/web/lib/hooks/useInvoices.ts | head -50

# 4. Check email templates
ls apps/web/lib/email/ functions/src/email/
```

**Sprint 107 Parallel Work:**
```
# Agent 1 (general-purpose): Wire InvoicePdf into useInvoices + download button
# Agent 2 (general-purpose): Build invoice email template + Cloud Function
# Agent 3 (general-purpose): Add recurring invoice schedule support
```

**Full sprint plan (106-120):** Check `docs/NEXT_SPRINTS_GUIDE.md` and `docs/REPRIORITIZED_SPRINT_PLAN.md`
