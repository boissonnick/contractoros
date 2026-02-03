# Sprint 39 - CLI 1: Demo Data Completion

**Role:** Database / Seed Scripts
**Focus:** Complete Firestore demo data for all features
**Estimated Hours:** 60-85h
**Priority:** HIGH - Enables testing for all other CLIs

---

## Prerequisites

- Use named database `contractoros` via `import { getDb } from './db'`
- Reference existing seed scripts in `scripts/seed-demo/`
- Run TypeScript check after creating scripts

---

## Completed (Sprint 38)

- [x] Job Costing Data - 87 cost items, 5 finance summaries
- [x] Punch List Items - 13 items seeded
- [x] Quotes with Line Items - 4 quotes, 26 line items
- [x] db.ts module - Shared database connection

---

## Tasks

### Task 1: Seed Scopes of Work (Issue #16)
**File:** `scripts/seed-demo/seed-scopes.ts`
**Effort:** 4-6h

Create scope of work entries for each project:
- 3-5 scope sections per project
- Realistic scope details matching project type
- Include: inclusions, exclusions, assumptions

**Data Structure:**
```typescript
interface ScopeOfWork {
  id: string;
  orgId: string;
  projectId: string;
  sections: {
    title: string;
    items: string[];
    sortOrder: number;
  }[];
  inclusions: string[];
  exclusions: string[];
  assumptions: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Acceptance Criteria:**
- [ ] Scope page shows content for each project
- [ ] Sections have realistic construction items
- [ ] No "No scope of work created yet" messages

---

### Task 2: Seed Submittals (Issue #22)
**File:** `scripts/seed-demo/seed-submittals.ts`
**Effort:** 3-4h

Create 5-10 submittals per project:
- Statuses: Pending, Approved, Needs Revision, Rejected
- Include: item description, vendor/supplier, submittal date
- Realistic materials: flooring samples, cabinet finishes, paint colors

**Acceptance Criteria:**
- [ ] Submittals page shows items for each project
- [ ] Various statuses represented
- [ ] Linked to real vendors/suppliers

---

### Task 3: Seed Change Orders (Issue #24)
**File:** `scripts/seed-demo/seed-change-orders.ts`
**Effort:** 3-4h

Create 2-4 change orders per project:
- Include: description, cost impact, schedule impact, status
- Mix of: approved, pending, rejected
- Realistic change reasons: client upgrades, unforeseen conditions

**Acceptance Criteria:**
- [ ] Change Orders page loads without error
- [ ] Change orders display cost/schedule impact
- [ ] Various approval statuses shown

---

### Task 4: Seed Schedule Events (Issue #35)
**File:** `scripts/seed-demo/seed-schedule-events.ts`
**Effort:** 8-12h

Create calendar events tied to projects:
- Events tied to task phasing and dependencies
- Realistic project timelines (past and future)
- Event types: work, inspections, deliveries, meetings
- Include: assigned crew, location, duration

**Data Structure:**
```typescript
interface ScheduleEvent {
  id: string;
  orgId: string;
  projectId: string;
  title: string;
  type: 'work' | 'inspection' | 'delivery' | 'meeting' | 'milestone';
  startDate: Timestamp;
  endDate: Timestamp;
  allDay: boolean;
  assignedTo: string[];
  location?: string;
  notes?: string;
  createdAt: Timestamp;
}
```

**Acceptance Criteria:**
- [ ] Schedule calendar shows events
- [ ] Events linked to real projects
- [ ] Various event types displayed

---

### Task 5: Seed Crew Availability (Issue #41)
**File:** `scripts/seed-demo/seed-crew-availability.ts`
**Effort:** 2-3h

Create availability data for employees:
- Availability status by date range
- Realistic allocation percentages (0-100%)
- Time off windows marked

**Acceptance Criteria:**
- [ ] Crew Availability tab shows data
- [ ] Utilization percentages visible

---

### Task 6: Seed Time Off Requests (Issue #43)
**File:** `scripts/seed-demo/seed-time-off.ts`
**Effort:** 2-3h

Create 5-10 time off requests:
- Types: vacation, sick, personal, family
- Statuses: Pending, Approved, Denied
- Spread across demo employees

**Acceptance Criteria:**
- [ ] Time Off Requests page shows data
- [ ] Various statuses represented

---

### Task 7: Seed Daily Logs (Issue #46)
**File:** `scripts/seed-demo/seed-daily-logs.ts`
**Effort:** 4-6h

Create 20-30 daily log entries:
- Tied to real employees, projects, tasks
- Categories: General, Progress, Issue, Safety, Weather
- Backdated entries for history (last 30 days)

**Acceptance Criteria:**
- [ ] Daily Logs page shows entries
- [ ] Filters work correctly
- [ ] Weather and safety logs included

---

### Task 8: Expand Finance Data (Issue #47)
**File:** `scripts/seed-demo/seed-finances-expanded.ts`
**Effort:** 6-8h

Expand on existing finance seed:
- Employee expense entries with receipts
- Material purchase orders
- Equipment rental costs
- Subcontractor invoices
- Tax categories properly assigned

**Acceptance Criteria:**
- [ ] Finances module shows comprehensive data
- [ ] All expense categories populated
- [ ] Reimbursement queue has items

---

### Task 9: Seed Payroll Data (Issues #54, #55)
**File:** `scripts/seed-demo/seed-payroll.ts`
**Effort:** 10-14h

Create comprehensive payroll data:
- Hourly rates for hourly employees
- Salary amounts for salaried employees
- Time entries for each employee (last 4 pay periods)
- Tax calculations (federal, state, FICA)
- Deductions (401k, health insurance)
- Multiple payroll runs (weekly/bi-weekly)

**Data Structure:**
```typescript
interface PayrollRun {
  id: string;
  orgId: string;
  periodStart: Timestamp;
  periodEnd: Timestamp;
  payDate: Timestamp;
  status: 'draft' | 'processing' | 'completed';
  totalGross: number;
  totalNet: number;
  totalTaxes: number;
  entries: PayrollEntry[];
}
```

**Acceptance Criteria:**
- [ ] No "NaNh total" displays
- [ ] Payroll details show correctly
- [ ] Multiple pay periods visible
- [ ] Tax withholdings calculated

---

### Task 10: Seed Client Preferences (Issue #25)
**File:** `scripts/seed-demo/seed-client-preferences.ts`
**Effort:** 2-3h

Populate client preferences:
- Finish preferences (materials, colors, styles)
- Budget constraints
- Communication preferences
- Timeline flexibility

**Acceptance Criteria:**
- [ ] Client Preferences section shows data
- [ ] Realistic selections for each project type

---

### Task 11: Link Remaining Clients to Projects (Issue #14)
**File:** `scripts/seed-demo/update-project-clients.ts`
**Effort:** 1-2h

Verify all projects have client assignments:
- Check each demo project has `clientId` and `clientName`
- Update any missing assignments

**Acceptance Criteria:**
- [ ] All demo projects have client assigned
- [ ] No "Client: Not assigned" messages

---

### Task 12: Seed Reports Historical Data (Issues #63-65, #70, #74-75)
**File:** `scripts/seed-demo/seed-reports-data.ts`
**Effort:** 15-20h

Comprehensive historical data for reports:
- 3-6 months backdated revenue
- Completed projects with full P&L
- Labor costs (20-50% of budget)
- Invoice aging: 70% current, 20% 1-30, 5% 31-60, 5% 61-90+
- Time entries linked to tasks
- Performance metrics history

**Acceptance Criteria:**
- [ ] Reports show historical trends
- [ ] Project profitability reports work
- [ ] Team productivity metrics accurate

---

## Execution Order

```
1. Task 11 (client links) - quick fix
2. Tasks 1-3 (scopes, submittals, change orders) - parallel
3. Tasks 4-7 (schedule, availability, time off, logs) - parallel
4. Tasks 8-10 (finances, payroll, preferences) - sequential
5. Task 12 (reports data) - after all others complete
```

---

## Status Updates

```
[ ] Task 1: Seed Scopes of Work
[ ] Task 2: Seed Submittals
[ ] Task 3: Seed Change Orders
[ ] Task 4: Seed Schedule Events
[ ] Task 5: Seed Crew Availability
[ ] Task 6: Seed Time Off Requests
[ ] Task 7: Seed Daily Logs
[ ] Task 8: Expand Finance Data
[ ] Task 9: Seed Payroll Data
[ ] Task 10: Seed Client Preferences
[ ] Task 11: Link Remaining Clients
[ ] Task 12: Seed Reports Historical Data
```

---

## Commands

```bash
# Navigate to seed scripts
cd /Users/nickbodkins/contractoros/scripts/seed-demo

# Run individual seed
npx ts-node seed-scopes.ts

# Run all seeds (create master runner)
npx ts-node run-all-seeds.ts

# TypeScript check
cd /Users/nickbodkins/contractoros/apps/web && npx tsc --noEmit
```

---

## Seed Script Template

```typescript
/**
 * Seed [Feature] Data for Sprint 39
 */

import { getDb } from './db';
import { Timestamp } from 'firebase-admin/firestore';

const db = getDb();
const orgId = 'u8hwVPLEv4YL9D71ymBwCOrmKta2';

const DEMO_PROJECTS = [
  { id: 'demo-proj-smith-kitchen', name: 'Smith Kitchen Remodel' },
  { id: 'demo-proj-garcia-bath', name: 'Garcia Master Bath' },
  { id: 'demo-proj-mainst-retail', name: 'Main St. Retail Storefront' },
  { id: 'demo-proj-cafe-ti', name: 'Downtown Cafe TI' },
  { id: 'demo-proj-thompson-deck', name: 'Thompson Deck Build' },
];

async function seed() {
  console.log('='.repeat(50));
  console.log('Seeding [Feature] Data');
  console.log('='.repeat(50));

  const now = Timestamp.now();
  const collectionRef = db.collection('organizations').doc(orgId).collection('collectionName');

  // Seed logic here...

  console.log('\\n' + '='.repeat(50));
  console.log('Seed Complete');
  console.log('='.repeat(50));
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  });
```
