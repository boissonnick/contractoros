# CLI 1 Worker Prompt: Demo Data Completion

**Copy this entire prompt into a new Claude Code session.**

---

## Context

You are CLI 1 working on ContractorOS Sprint 39. Your role is to complete demo data seeding for the Horizon Construction Co. demo account.

**Project:** `/Users/nickbodkins/contractoros`
**Scripts:** `scripts/seed-demo/`
**Organization ID:** `u8hwVPLEv4YL9D71ymBwCOrmKta2`

**CRITICAL:** Always use the named database `contractoros`, NOT the default database.
```typescript
import { getDb } from './db';
const db = getDb(); // Uses named database automatically
```

---

## Completed (Sprint 38)

- [x] Job Costing Data - 87 items
- [x] Punch List Items - 13 items
- [x] Quotes with Line Items - 4 quotes, 26 items
- [x] db.ts shared module

---

## Your Tasks

Execute these seed scripts in order. Create new scripts as needed.

### Task 1: Seed Scopes of Work
**File:** `scripts/seed-demo/seed-scopes.ts`
**Collection:** `organizations/{orgId}/scopes`

Create scope of work for each demo project:
- 3-5 scope sections per project
- Include: inclusions, exclusions, assumptions
- Realistic construction scope items

```typescript
const SCOPE_SECTIONS = [
  { title: 'Demolition & Site Prep', items: ['Remove existing fixtures', 'Protect adjacent areas', 'Dispose of debris'] },
  { title: 'Rough Construction', items: ['Framing modifications', 'Electrical rough-in', 'Plumbing rough-in'] },
  { title: 'Finishes', items: ['Drywall installation', 'Paint preparation', 'Flooring installation'] },
  { title: 'Final', items: ['Fixture installation', 'Final connections', 'Cleanup and walkthrough'] },
];
```

---

### Task 2: Seed Submittals
**File:** `scripts/seed-demo/seed-submittals.ts`
**Collection:** `organizations/{orgId}/submittals`

Create 5-10 submittals per project:
- Statuses: pending, approved, needs_revision, rejected
- Types: flooring samples, cabinet finishes, paint colors, fixtures, countertops

```typescript
const SUBMITTAL_ITEMS = [
  { item: 'Hardwood flooring sample - White Oak', vendor: 'Lumber Liquidators' },
  { item: 'Cabinet door style - Shaker White', vendor: 'KraftMaid' },
  { item: 'Countertop slab - Calacatta Gold', vendor: 'MSI Surfaces' },
  { item: 'Faucet selection - Delta Trinsic', vendor: 'Ferguson' },
  { item: 'Light fixture - Pendant cluster', vendor: 'Restoration Hardware' },
];
```

---

### Task 3: Seed Change Orders
**File:** `scripts/seed-demo/seed-change-orders.ts`
**Collection:** `organizations/{orgId}/changeOrders`

Create 2-4 change orders per project:
- Statuses: draft, pending, approved, rejected
- Include cost impact (+/-) and schedule impact (days)

```typescript
const CHANGE_ORDER_REASONS = [
  { description: 'Client requested upgraded appliance package', costImpact: 4500, scheduleImpact: 0 },
  { description: 'Unforeseen plumbing issue behind wall', costImpact: 2200, scheduleImpact: 3 },
  { description: 'Upgrade to quartz countertops from laminate', costImpact: 3800, scheduleImpact: 5 },
  { description: 'Add under-cabinet lighting', costImpact: 1200, scheduleImpact: 1 },
];
```

---

### Task 4: Seed Schedule Events
**File:** `scripts/seed-demo/seed-schedule-events.ts`
**Collection:** `organizations/{orgId}/scheduleEvents`

Create calendar events for each project:
- Event types: work, inspection, delivery, meeting, milestone
- Span past 30 days and future 60 days
- Link to real project phases

```typescript
const EVENT_TEMPLATES = [
  { title: 'Rough Inspection', type: 'inspection', duration: 2 },
  { title: 'Cabinet Delivery', type: 'delivery', duration: 1 },
  { title: 'Client Walkthrough', type: 'meeting', duration: 2 },
  { title: 'Framing Complete', type: 'milestone', duration: 1 },
  { title: 'Electrical Rough-in', type: 'work', duration: 3 },
];
```

---

### Task 5: Seed Daily Logs
**File:** `scripts/seed-demo/seed-daily-logs.ts`
**Collection:** `organizations/{orgId}/dailyLogs`

Create 20-30 daily log entries:
- Categories: general, progress, issue, safety, weather
- Backdate over last 30 days
- Link to real employees and projects

```typescript
const LOG_ENTRIES = [
  { category: 'progress', text: 'Completed framing for kitchen island. Ready for electrical.' },
  { category: 'issue', text: 'Discovered water damage behind shower wall. Need to assess.' },
  { category: 'weather', text: 'Rain delay - exterior work postponed to tomorrow.' },
  { category: 'safety', text: 'Safety meeting held. Reviewed ladder safety protocols.' },
];
```

---

### Task 6: Seed Time Off Requests
**File:** `scripts/seed-demo/seed-time-off.ts`
**Collection:** `organizations/{orgId}/timeOffRequests`

Create 5-10 time off requests:
- Types: vacation, sick, personal, family
- Statuses: pending, approved, denied
- Spread across demo employees

---

### Task 7: Seed Payroll Data
**File:** `scripts/seed-demo/seed-payroll.ts`
**Collection:** `organizations/{orgId}/payrollRuns`, `organizations/{orgId}/payrollEntries`

Create 4 payroll runs (bi-weekly, last 2 months):
- Link to demo employees
- Include: regular hours, overtime, deductions
- Calculate totals correctly

---

### Task 8: Seed Client Preferences
**File:** `scripts/seed-demo/seed-client-preferences.ts`
**Collection:** Update existing client documents

Add preferences to demo clients:
- Finish preferences (modern, traditional, transitional)
- Color preferences
- Budget flexibility
- Communication preferences

---

## Demo Projects Reference

```typescript
const DEMO_PROJECTS = [
  { id: 'demo-proj-smith-kitchen', name: 'Smith Kitchen Remodel' },
  { id: 'demo-proj-garcia-bath', name: 'Garcia Master Bath' },
  { id: 'demo-proj-mainst-retail', name: 'Main St. Retail Storefront' },
  { id: 'demo-proj-cafe-ti', name: 'Downtown Cafe TI' },
  { id: 'demo-proj-thompson-deck', name: 'Thompson Deck Build' },
];
```

## Demo Employees Reference

```typescript
const DEMO_EMPLOYEES = [
  { id: 'demo-mike-owner', name: 'Mike Johnson', role: 'OWNER' },
  { id: 'demo-sarah-pm', name: 'Sarah Chen', role: 'PM' },
  { id: 'demo-carlos-field', name: 'Carlos Rodriguez', role: 'FIELD' },
  { id: 'demo-james-field', name: 'James Wilson', role: 'FIELD' },
];
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

async function seed() {
  console.log('='.repeat(50));
  console.log('Seeding [Feature] Data');
  console.log('='.repeat(50));

  const now = Timestamp.now();
  const ref = db.collection('organizations').doc(orgId).collection('collectionName');

  let count = 0;

  // Seed logic here...

  console.log(`  ✓ ${count} items created`);
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

---

## Execution

```bash
cd /Users/nickbodkins/contractoros/scripts/seed-demo

# Run each seed script
npx ts-node seed-scopes.ts
npx ts-node seed-submittals.ts
npx ts-node seed-change-orders.ts
npx ts-node seed-schedule-events.ts
npx ts-node seed-daily-logs.ts
npx ts-node seed-time-off.ts
npx ts-node seed-payroll.ts
npx ts-node seed-client-preferences.ts

# Commit after each
cd /Users/nickbodkins/contractoros
git add scripts/seed-demo/seed-*.ts
git commit -m "feat(seeds): Add [feature] seed script for Sprint 39"
```

---

## Success Criteria

- [ ] Each seed script runs without errors
- [ ] Data appears in Firestore console under `contractoros` database
- [ ] No "No data" messages in app for seeded features
- [ ] All scripts committed to git
