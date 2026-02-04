# Sprint 38 - CLI 1: Demo Data Seeding

**Role:** Database / Seed Scripts
**Focus:** Firestore data population for demo environment
**Estimated Hours:** 80-110h
**Priority:** Start after CLI 4 fixes Firebase permissions (#13)

---

## Prerequisites

- CLI 4 must complete Issue #13 (Firebase Permission Errors) first
- Existing seed scripts in `scripts/seed-demo/` for reference
- Use named database `contractoros` (NOT default)

---

## Tasks

### Task 1: Link Demo Clients to Projects (Issue #14)
**File:** `scripts/seed-demo/update-project-clients.ts`
**Effort:** 2-3h

Update existing demo projects to have client assignments:
- Smith Kitchen Remodel → Michael Chen
- Garcia Master Bath → Robert Martinez
- Main St. Retail Storefront → TechCorp Inc
- Downtown Cafe TI → Property Group LLC
- Thompson Deck Build → Heritage Trust
- Office Park Suite 200 → TechCorp Inc
- Garcia Basement Finish → Robert Martinez

**Acceptance Criteria:**
- [ ] All demo projects have `clientId` and `clientName` fields
- [ ] Client displays on project Overview page
- [ ] No "Client: Not assigned" messages

---

### Task 2: Seed Demo Quotes with Line Items (Issue #15)
**File:** `scripts/seed-demo/seed-quotes.ts`
**Effort:** 6-8h

Create quote line items for each demo project:
- 5-15 line items per project
- Sections: Assessment, Structural, Systems, Restoration, Final Touches
- Realistic pricing matching project budgets
- Quote totals should match project budget in overview

**Data Structure:**
```typescript
interface QuoteLineItem {
  id: string;
  quoteId: string;
  projectId: string;
  section: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  sortOrder: number;
}
```

**Acceptance Criteria:**
- [ ] Quote Builder shows line items for each project
- [ ] Quote totals match project budgets
- [ ] All sections populated

---

### Task 3: Seed Scope of Work (Issue #16)
**File:** `scripts/seed-demo/seed-scopes.ts`
**Effort:** 4-6h

Create scope of work entries:
- 3-5 scope sections per project
- Realistic scope details matching project type
- References to tasks/phases

**Acceptance Criteria:**
- [ ] Scope page shows content for each project
- [ ] No "No scope of work created yet" messages

---

### Task 4: Seed Submittals (Issue #22)
**File:** `scripts/seed-demo/seed-submittals.ts`
**Effort:** 3-4h

Create 5-10 submittals per project:
- Statuses: Pending, Approved, Needs Revision, Rejected
- Include: item description, vendor/supplier, submittal date
- Realistic materials: flooring samples, cabinet finishes, paint colors, fixtures

**Acceptance Criteria:**
- [ ] Submittals page shows items for each project
- [ ] Various statuses represented

---

### Task 5: Seed Punch List Items (Issue #23)
**File:** `scripts/seed-demo/seed-punch-list.ts`
**Effort:** 3-4h

Create 8-15 punch list items per project:
- Statuses: Open, In Progress, Ready for Review, Approved, Rejected
- Include: description, priority, location, assigned to, due date

**Acceptance Criteria:**
- [ ] Punch List page shows items
- [ ] Various statuses and priorities

---

### Task 6: Seed Change Orders (Issue #24)
**File:** `scripts/seed-demo/seed-change-orders.ts`
**Effort:** 3-4h

Create 2-4 change orders per project:
- Include: description, cost impact, schedule impact, status, approval date
- Mix of approved, pending, rejected

**Acceptance Criteria:**
- [ ] Change Orders page loads without error
- [ ] Change orders display correctly

---

### Task 7: Seed Client Preferences (Issue #25)
**File:** `scripts/seed-demo/seed-client-preferences.ts`
**Effort:** 2-3h

Populate client preferences for demo projects:
- Finish preferences (materials, colors, styles)
- Budget preferences/constraints
- Timeline preferences
- Communication preferences

**Acceptance Criteria:**
- [ ] Client Preferences section shows data

---

### Task 8: Seed Schedule Events (Issue #35)
**File:** `scripts/seed-demo/seed-schedule-events.ts`
**Effort:** 8-12h

Create calendar events tied to projects:
- Events tied to task phasing and dependencies
- Realistic project timelines (past and future)
- Mix of single-day and multi-day events
- Event types: work, inspections, deliveries, meetings

**Acceptance Criteria:**
- [ ] Schedule calendar shows events
- [ ] Events linked to real projects

---

### Task 9: Seed Crew Availability (Issue #41)
**File:** `scripts/seed-demo/seed-crew-availability.ts`
**Effort:** 2-3h

Create availability data for employees:
- Availability status by date
- Realistic allocation percentages
- Time off windows marked

**Acceptance Criteria:**
- [ ] Crew Availability tab shows data

---

### Task 10: Seed Time Off Requests (Issue #43)
**File:** `scripts/seed-demo/seed-time-off.ts`
**Effort:** 2-3h

Create 5-10 time off requests:
- Types: vacation, sick days, personal
- Statuses: Pending, Approved, Denied
- Spread across employees

**Acceptance Criteria:**
- [ ] Time Off Requests page shows data

---

### Task 11: Seed Daily Logs (Issue #46)
**File:** `scripts/seed-demo/seed-daily-logs.ts`
**Effort:** 4-6h

Create 20-30 daily log entries:
- Tied to real employees, projects, tasks
- Categories: General, Progress, Issue, Safety, Weather
- Backdated entries for history

**Acceptance Criteria:**
- [ ] Daily Logs page shows entries
- [ ] Filters work correctly

---

### Task 12: Seed Comprehensive Finance Data (Issue #47)
**File:** `scripts/seed-demo/seed-finances.ts`
**Effort:** 8-12h

Create comprehensive financial data:
- Employee expense entries tied to team members
- Revenue entries tied to clients and projects
- Milestone/progress billing tied to phases
- Material purchase orders
- Equipment rental costs
- Subcontractor invoices
- Tax categories

**Acceptance Criteria:**
- [ ] Finances module shows comprehensive data
- [ ] All financial tabs populated

---

### Task 13: Seed Payroll Data (Issues #54, #55)
**File:** `scripts/seed-demo/seed-payroll.ts`
**Effort:** 10-14h

Create payroll data:
- Hourly rates for hourly employees
- Salary amounts for salaried employees
- Time entries for each employee
- Realistic hours per pay period
- Tax calculations
- Deductions (benefits, taxes)
- Multiple payroll runs

**Acceptance Criteria:**
- [ ] No "NaNh total" displays
- [ ] Payroll details show correctly
- [ ] Multiple pay periods visible

---

### Task 14: Seed Reports Historical Data (Issues #63, #64, #65, #70, #74, #75)
**File:** `scripts/seed-demo/seed-reports-data.ts` (expand existing)
**Effort:** 25-35h

Expand reports seed data:
- 3-6 months backdated revenue
- Completed projects with full P&L
- Labor costs (20-50% of budget)
- Invoice aging distribution (70% current, 20% 1-30, 5% 31-60, 5% 61-90+)
- Time entries linked to tasks
- Actual vs estimated hours
- Performance metrics

**Acceptance Criteria:**
- [ ] Reports show historical trends
- [ ] Project profitability accurate
- [ ] Team productivity metrics work

---

## File Structure

```
scripts/seed-demo/
├── utils.ts (existing)
├── db.ts (existing)
├── seed-clients.ts (existing)
├── seed-projects.ts (existing)
├── seed-tasks.ts (existing - updated Sprint 37C)
├── seed-subcontractors.ts (existing - Sprint 37C)
├── seed-rfis.ts (existing - Sprint 37C)
├── update-project-categories.ts (existing - Sprint 37C)
├── update-project-clients.ts (NEW - Task 1)
├── seed-quotes.ts (NEW - Task 2)
├── seed-scopes.ts (NEW - Task 3)
├── seed-submittals.ts (NEW - Task 4)
├── seed-punch-list.ts (NEW - Task 5)
├── seed-change-orders.ts (NEW - Task 6)
├── seed-client-preferences.ts (NEW - Task 7)
├── seed-schedule-events.ts (NEW - Task 8)
├── seed-crew-availability.ts (NEW - Task 9)
├── seed-time-off.ts (NEW - Task 10)
├── seed-daily-logs.ts (NEW - Task 11)
├── seed-finances.ts (NEW - Task 12)
├── seed-payroll.ts (NEW - Task 13)
├── seed-reports-data.ts (EXPAND - Task 14)
└── run-all-seeds.ts (master runner)
```

---

## Execution Order

1. Task 1 (client links) - no dependencies
2. Tasks 2-7 (quotes, scopes, submittals, punch, change orders, preferences) - parallel
3. Tasks 8-11 (schedule, availability, time off, logs) - parallel
4. Tasks 12-14 (finances, payroll, reports) - after others complete

---

## Status Updates

Update this file as tasks complete:
```
[ ] Task 1: Link Demo Clients to Projects
[ ] Task 2: Seed Demo Quotes
[ ] Task 3: Seed Scope of Work
[ ] Task 4: Seed Submittals
[ ] Task 5: Seed Punch List Items
[ ] Task 6: Seed Change Orders
[ ] Task 7: Seed Client Preferences
[ ] Task 8: Seed Schedule Events
[ ] Task 9: Seed Crew Availability
[ ] Task 10: Seed Time Off Requests
[ ] Task 11: Seed Daily Logs
[ ] Task 12: Seed Comprehensive Finance Data
[ ] Task 13: Seed Payroll Data
[ ] Task 14: Seed Reports Historical Data
```

---

## Commands

```bash
# Run individual seed
cd scripts/seed-demo
npx ts-node seed-quotes.ts

# Run all seeds
npx ts-node run-all-seeds.ts

# TypeScript check
cd apps/web && npx tsc --noEmit
```
