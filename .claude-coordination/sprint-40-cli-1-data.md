# Sprint 40 - CLI 1: Demo Data Completeness

**Copy this entire prompt into a new Claude Code session.**

---

## Context

You are CLI 1 working on ContractorOS Sprint 40. Your role is to complete demo data gaps that are blocking feature testing - particularly tasks (for Gantt view), project categories, and client assignments.

**Project:** `/Users/nickbodkins/contractoros`
**Scripts:** `scripts/seed-demo/`
**Organization ID:** `u8hwVPLEv4YL9D71ymBwCOrmKta2`

**CRITICAL:** Always use the named database `contractoros`, NOT the default database.
```typescript
import { getDb } from './db';
const db = getDb(); // Uses named database automatically
```

---

## Sprint 39 Completed

- [x] seed-scopes.ts: 7 scopes
- [x] seed-submittals.ts: 54 submittals
- [x] seed-change-orders.ts: 8 change orders
- [x] seed-schedule-events.ts: 93 events
- [x] seed-daily-logs.ts: 256 entries
- [x] seed-time-off.ts: 18 requests
- [x] seed-payroll.ts: 6 runs
- [x] seed-client-preferences.ts: 8 records

---

## Your Tasks

### Task 1: Add Project Categories (Issue #12)
**Effort:** 2-3h

Demo projects are missing category assignments, breaking category filter.

**Script:** `scripts/seed-demo/fix-project-categories.ts`

```typescript
const PROJECT_CATEGORIES = {
  'demo-proj-smith-kitchen': ['residential', 'renovation'],
  'demo-proj-garcia-bath': ['residential', 'renovation'],
  'demo-proj-mainst-retail': ['commercial'],
  'demo-proj-cafe-ti': ['commercial', 'tenant_improvement'],
  'demo-proj-thompson-deck': ['residential', 'addition'],
  'demo-proj-office-200': ['commercial', 'tenant_improvement'],
  'demo-proj-garcia-basement': ['residential', 'renovation'],
};
```

**Acceptance Criteria:**
- [ ] All demo projects have category field populated
- [ ] Category filter shows projects correctly
- [ ] "All Categories" shows all projects

---

### Task 2: Assign Clients to Projects (Issue #14)
**Effort:** 2-3h

Projects show "Client: Not assigned" on Overview.

**Script:** `scripts/seed-demo/fix-project-clients.ts`

**Map projects to existing demo clients:**
```typescript
const PROJECT_CLIENTS = {
  'demo-proj-smith-kitchen': 'demo-client-smith',
  'demo-proj-garcia-bath': 'demo-client-garcia',
  'demo-proj-mainst-retail': 'demo-client-mainst-retail',
  'demo-proj-cafe-ti': 'demo-client-cafe-llc',
  'demo-proj-thompson-deck': 'demo-client-thompson',
  'demo-proj-office-200': 'demo-client-office-llc',
  'demo-proj-garcia-basement': 'demo-client-garcia',
};
```

**Acceptance Criteria:**
- [ ] All projects show client name on Overview
- [ ] Client link works

---

### Task 3: Seed Demo Tasks (Issue #17) - HIGH PRIORITY
**Effort:** 8-12h

No tasks exist - needed to test Gantt view, Board view, List view.

**Script:** `scripts/seed-demo/seed-tasks.ts`

**Requirements:**
- 15-25 tasks per project
- Statuses: todo, in_progress, review, done
- Dependencies between tasks
- Due dates spanning 60 days
- Assignments to demo team members

**Task Template:**
```typescript
interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  phaseId?: string;
  assigneeId?: string;
  dueDate: Timestamp;
  startDate?: Timestamp;
  estimatedHours?: number;
  actualHours?: number;
  dependencies?: string[]; // Task IDs
  blockedBy?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Sample Tasks for Kitchen Remodel:**
```typescript
const KITCHEN_TASKS = [
  { title: 'Demo existing cabinets', status: 'done', phase: 'demolition', days: -30 },
  { title: 'Remove countertops', status: 'done', phase: 'demolition', days: -28 },
  { title: 'Rough plumbing', status: 'done', phase: 'rough', days: -21 },
  { title: 'Rough electrical', status: 'done', phase: 'rough', days: -18 },
  { title: 'Drywall repair', status: 'done', phase: 'framing', days: -14 },
  { title: 'Install base cabinets', status: 'in_progress', phase: 'finishes', days: -3 },
  { title: 'Install wall cabinets', status: 'in_progress', phase: 'finishes', days: 0 },
  { title: 'Countertop template', status: 'todo', phase: 'finishes', days: 3 },
  { title: 'Countertop install', status: 'todo', phase: 'finishes', days: 10, blockedBy: ['Countertop template'] },
  { title: 'Backsplash tile', status: 'todo', phase: 'finishes', days: 14 },
  { title: 'Plumbing trim', status: 'todo', phase: 'finishes', days: 17 },
  { title: 'Electrical trim', status: 'todo', phase: 'finishes', days: 17 },
  { title: 'Appliance installation', status: 'todo', phase: 'finishes', days: 21 },
  { title: 'Final inspection', status: 'todo', phase: 'closeout', days: 25 },
  { title: 'Client walkthrough', status: 'todo', phase: 'closeout', days: 28 },
];
```

**Acceptance Criteria:**
- [ ] Each project has 15-25 tasks
- [ ] Gantt view displays tasks with timeline
- [ ] Board view shows task columns
- [ ] Dependencies show correctly
- [ ] Tasks have due dates

---

### Task 4: Seed Demo RFIs (Issue #21)
**Effort:** 3-4h

**Script:** `scripts/seed-demo/seed-rfis.ts`

**Requirements:**
- 5-10 RFIs per project
- Statuses: open, answered, closed, overdue
- Include question and answer (for answered ones)

```typescript
const RFI_TEMPLATES = [
  { question: 'Confirm outlet locations behind island', status: 'answered', answer: 'Approved per revised drawing A2.1' },
  { question: 'Verify paint color for accent wall', status: 'open' },
  { question: 'Clarify tile pattern at shower niche', status: 'answered', answer: 'Herringbone pattern per selection sheet' },
  { question: 'Confirm cabinet hardware finish', status: 'overdue' },
  { question: 'Verify countertop edge profile', status: 'closed', answer: 'Eased edge confirmed' },
];
```

---

### Task 5: Seed Demo Photos (Issue #24)
**Effort:** 2-3h

**Script:** `scripts/seed-demo/seed-photos.ts`

Use placeholder image URLs or generate references:

```typescript
const PHOTO_TEMPLATES = [
  { caption: 'Demo complete - kitchen cleared', category: 'progress', daysAgo: 30 },
  { caption: 'Rough plumbing inspection passed', category: 'inspection', daysAgo: 21 },
  { caption: 'Electrical rough-in complete', category: 'progress', daysAgo: 18 },
  { caption: 'Cabinet delivery received', category: 'delivery', daysAgo: 5 },
  { caption: 'Base cabinet installation in progress', category: 'progress', daysAgo: 2 },
];
```

---

### Task 6: Historical Reports Data
**Effort:** 4-6h

Seed historical data for reports dashboard:
- Monthly revenue/expense summaries (6 months back)
- Project completion data
- Labor utilization data

**Script:** `scripts/seed-demo/seed-reports-data.ts`

---

### Task 7: Verify Finances Page (Issue #26)
**Effort:** 1-2h

Verify finances page works with all seeded data.

**Steps:**
1. Load http://localhost:3000/dashboard/finances
2. Verify job costing data displays
3. Verify budget vs actual works
4. Check profit margin calculations

---

### Task 8: Audit Data Completeness
**Effort:** 2-3h

Run through all seeded data and verify:
- No "No data" messages in app
- All filters work with demo data
- Relationships are correct (projects → clients → tasks)

---

## Demo References

```typescript
const DEMO_PROJECTS = [
  { id: 'demo-proj-smith-kitchen', name: 'Smith Kitchen Remodel' },
  { id: 'demo-proj-garcia-bath', name: 'Garcia Master Bath' },
  { id: 'demo-proj-mainst-retail', name: 'Main St. Retail Storefront' },
  { id: 'demo-proj-cafe-ti', name: 'Downtown Cafe TI' },
  { id: 'demo-proj-thompson-deck', name: 'Thompson Deck Build' },
  { id: 'demo-proj-office-200', name: 'Office Park Suite 200' },
  { id: 'demo-proj-garcia-basement', name: 'Garcia Basement Finish' },
];

const DEMO_EMPLOYEES = [
  { id: 'demo-mike-owner', name: 'Mike Johnson', role: 'OWNER' },
  { id: 'demo-sarah-pm', name: 'Sarah Chen', role: 'PM' },
  { id: 'demo-carlos-field', name: 'Carlos Rodriguez', role: 'FIELD' },
  { id: 'demo-james-field', name: 'James Wilson', role: 'FIELD' },
  { id: 'demo-maria-field', name: 'Maria Santos', role: 'FIELD' },
  { id: 'demo-jake-field', name: 'Jake Thompson', role: 'FIELD' },
];

const DEMO_CLIENTS = [
  { id: 'demo-client-smith', name: 'Robert Smith' },
  { id: 'demo-client-garcia', name: 'Maria Garcia' },
  { id: 'demo-client-thompson', name: 'James Thompson' },
  { id: 'demo-client-mainst-retail', name: 'Main Street Retail Group' },
  { id: 'demo-client-cafe-llc', name: 'Downtown Cafe LLC' },
  { id: 'demo-client-office-llc', name: 'Office Park LLC' },
];
```

---

## Execution

```bash
cd /Users/nickbodkins/contractoros/scripts/seed-demo

# Run each seed script
npx ts-node fix-project-categories.ts
npx ts-node fix-project-clients.ts
npx ts-node seed-tasks.ts
npx ts-node seed-rfis.ts
npx ts-node seed-photos.ts
npx ts-node seed-reports-data.ts

# Commit after each
cd /Users/nickbodkins/contractoros
git add scripts/seed-demo/
git commit -m "feat(seeds): Add [feature] seed script

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Success Criteria

- [ ] Category filter works
- [ ] Projects show assigned clients
- [ ] Gantt view has tasks with timeline
- [ ] RFIs page has demo data
- [ ] Photos page has demo data
- [ ] Reports dashboard shows historical data
- [ ] Finances page loads without errors
- [ ] All scripts committed
