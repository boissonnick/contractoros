# Sprint 38 - CLI 3: Feature Development

**Role:** Feature Development / New Modules
**Focus:** New modules, navigation architecture, major enhancements
**Estimated Hours:** 140-200h
**Priority:** Start after CLI 1 has demo data for testing

---

## Prerequisites

- Demo data populated (CLI 1)
- Firebase permissions fixed (CLI 4)
- Existing component patterns in `components/ui/`

---

## Tasks

### Phase 1: Navigation & Architecture (Issues #33, #59, #60)

#### Task 1: Separate Team from Subcontractors (Issue #33)
**Effort:** 8-12h

Team section currently mixes employees, project managers, subcontractors, and clients.

**Changes:**
- Team section shows only: Employees, Project Managers
- Remove subcontractors from Team section
- Remove clients from Team section

**Acceptance Criteria:**
- [ ] Team section shows only employees/PMs
- [ ] Clear role-based organization

---

#### Task 2: Sidebar Navigation Reorganization (Issue #59)
**Effort:** 8-12h

Rethink sidebar organization around "jobs to be done".

**Proposed Structure:**
```
Dashboard
Projects
Schedule
Team
  └─ Directory
  └─ Availability
  └─ Time Off
Subcontractors (NEW)
Clients
Finances
  └─ Overview
  └─ Invoicing
  └─ Expenses
  └─ Payroll
  └─ Reimbursements
Reports
Settings
```

**Acceptance Criteria:**
- [ ] New sidebar structure implemented
- [ ] Finances sub-navigation created
- [ ] Information architecture documented

---

#### Task 3: Role-Based Navigation (Issue #60)
**Effort:** 10-14h

Sidebar navigation needs restructuring based on roles.

**Acceptance Criteria:**
- [ ] Define user personas and core "jobs to be done"
- [ ] Design conditional navigation based on user role
- [ ] Implement with user role assignments
- [ ] Admin controls for role customization

---

### Phase 2: Subcontractors Module (Issue #34)

#### Task 4: Create Dedicated Subcontractors Module
**Effort:** 20-30h

New "Subcontractors" section in sidebar navigation.

**Features:**
- Subcontractor directory with contact info, trade/specialty, rates
- Historical performance metrics
- Availability calendar
- Project history
- Analytics dashboard: utilization, performance, cost comparisons
- Comparison tools
- Integration with project assignment workflows

**Files to create:**
- `app/dashboard/subcontractors/page.tsx` - Directory
- `app/dashboard/subcontractors/[id]/page.tsx` - Detail view
- `app/dashboard/subcontractors/analytics/page.tsx` - Analytics
- `components/subcontractors/SubcontractorCard.tsx`
- `components/subcontractors/PerformanceMetrics.tsx`
- `lib/hooks/useSubcontractorAnalytics.ts`

**Acceptance Criteria:**
- [ ] New sidebar item "Subcontractors"
- [ ] Directory view with search/filter
- [ ] Individual sub detail pages
- [ ] Performance metrics dashboard
- [ ] Comparison tools working

---

### Phase 3: Schedule Enhancements (Issues #36, #37, #38, #39, #40, #42)

#### Task 5: Weather Integration (Issue #36)
**Effort:** 12-16h

Add weather data to schedule.

**Implementation:**
- Weather API integration (OpenWeather or Weather.gov)
- Display above calendar: High, Low, Precipitation %
- Weather icons (sun, clouds, rain)
- Alert for outdoor tasks with adverse weather
- Location-specific weather for project locations

**Acceptance Criteria:**
- [ ] Weather displays on schedule
- [ ] Alerts for outdoor tasks
- [ ] Location-based forecasts

---

#### Task 6: Enhanced Schedule Views (Issue #37)
**Effort:** 8-12h

Add Day view and improve existing views.

**Views:**
- Day view: hourly granularity, task details, weather
- Week view: current implementation (enhance)
- Month view: overview, drill-down capability

**Acceptance Criteria:**
- [ ] Day/Week/Month view toggle
- [ ] Conflict detection visible
- [ ] Smooth transitions between views

---

#### Task 7: Schedule Team Assignment (Issue #38)
**Effort:** 8-12h

Allow team assignment from calendar view.

**Features:**
- Drag-drop task assignment (or dropdown)
- Quick team member selection from calendar
- Show crew availability before assignment
- Support bulk assignment for phases/groups

**Acceptance Criteria:**
- [ ] Can assign team from calendar
- [ ] Availability visible before assignment

---

#### Task 8: Schedule Context Dashboard (Issue #39)
**Effort:** 10-14h

Show context and detail on schedule.

**Features:**
- Task detail cards showing weather impact, conflicts, dependencies
- Constraint indicators
- Project timeline overview with critical path
- Risk indicators

**Acceptance Criteria:**
- [ ] Task cards show full context
- [ ] Critical path visible
- [ ] Risk indicators working

---

#### Task 9: AI-Powered Schedule Briefing (Issue #40)
**Effort:** 12-16h

AI-generated daily/weekly briefing.

**Features:**
- Daily briefing: weather, conflicts, dependencies, constraints, overdue
- Weekly briefing: forecast, conflicts, resource planning
- Push notifications option
- Customizable by role

**Acceptance Criteria:**
- [ ] Daily briefing generated
- [ ] Briefing includes weather and conflicts
- [ ] Can be customized per user

---

#### Task 10: Crew Availability Tab Enhancement (Issue #42)
**Effort:** 8-12h

Enhance the Crew Availability tab.

**Features:**
- Utilization tracking display (% time allocated)
- Workload visualization (current assignments)
- Skills/trades filtering
- Assignment capability from this view
- Date range selection for availability windows

**Acceptance Criteria:**
- [ ] Utilization percentages shown
- [ ] Can assign from availability view
- [ ] Date range filtering works

---

### Phase 4: Finance Enhancements (Issues #48, #49, #50)

#### Task 11: Sales Pipeline Expenses Context (Issue #48)
**Effort:** 4-6h

"Total Expenses 137" metric needs clickability and context.

**Acceptance Criteria:**
- [ ] Drill-down capability to see expense details
- [ ] Filter by employee, project, category
- [ ] Expense approval workflows visible

---

#### Task 12: Reimbursement Tracking Workflow (Issue #49)
**Effort:** 8-12h

Finance module needs reimbursement tracking.

**Workflow:**
1. Employee expense submission (receipts, amount, category, project)
2. Manager approval workflow
3. Finance review and reimbursement processing
4. Status tracking (Pending, Approved, Paid)

**Files to create:**
- `app/dashboard/finances/reimbursements/page.tsx`
- `components/finances/ReimbursementForm.tsx`
- `components/finances/ReimbursementList.tsx`
- `lib/hooks/useReimbursements.ts`

**Acceptance Criteria:**
- [ ] Employees can submit expenses
- [ ] Approval workflow functional
- [ ] Status tracking visible

---

#### Task 13: Owner Finance Dashboard (Issue #50)
**Effort:** 10-14h

Finance module should be "home base" for owner.

**Features:**
- Executive summary: Revenue, Expenses, Gross Profit, Profit Margin
- Cash flow projection (30/60/90 day)
- Profitability by project
- Profitability by client
- Revenue trending
- Margin trends
- Budget vs. actual across projects

**Acceptance Criteria:**
- [ ] Executive dashboard created
- [ ] Cash flow projections working
- [ ] Drill-down to project level

---

### Phase 5: Settings & Reporting (Issues #32, #66, #68, #71, #72, #82, #84, #85, #87, #89)

#### Task 14: Color Contrast Calculation (Issue #32)
**Effort:** 6-8h

Automatic contrast calculation for custom colors.

**Acceptance Criteria:**
- [ ] Contrast ratio calculation on color selection
- [ ] WCAG AA compliance check (4.5:1 minimum)
- [ ] Auto-adjust text color based on background luminance

---

#### Task 15: Financial Reporting Customization (Issue #66)
**Effort:** 6-8h

Owner should customize which metrics they see.

**Acceptance Criteria:**
- [ ] Add/remove/reorder metric cards
- [ ] Favorite reports feature
- [ ] Save report configurations

---

#### Task 16: Reports as Owner's Source of Truth (Issue #68)
**Effort:** 8-12h

Reports should be owner's primary dashboard with drill-down.

**Acceptance Criteria:**
- [ ] Executive summary dashboard
- [ ] Drill-down capability (project → task level)
- [ ] Real-time data / configurable refresh
- [ ] Alert system for at-risk metrics

---

#### Task 17: Profitability Analysis (Issue #71)
**Effort:** 4-6h

Add profitability percentages and margins.

**Acceptance Criteria:**
- [ ] Gross profit margin % by project
- [ ] Net profit margin % by project
- [ ] Cost variance %
- [ ] Labor efficiency %

---

#### Task 18: Benchmarking & Comparative Analysis (Issue #72)
**Effort:** 8-12h

Project-to-project comparisons, trends.

**Acceptance Criteria:**
- [ ] Project comparison view
- [ ] Trend analysis
- [ ] Best/worst performers highlighted
- [ ] Budget accuracy trending

---

#### Task 19: Template Management Consolidation (Issue #82)
**Effort:** 3-4h

Consolidate ALL templates into dedicated section.

**Acceptance Criteria:**
- [ ] Dedicated Templates section
- [ ] All template types: SMS, Email, Estimate, Invoice, Report, Document
- [ ] Searchable list

---

#### Task 20: Corporate Structure Settings (Issue #84)
**Effort:** 2-3h

Corporate structure info with integration capability.

**Acceptance Criteria:**
- [ ] Legal name, DBA, EIN
- [ ] Business address, type
- [ ] Pull from QuickBooks if available

---

#### Task 21: Workers Comp & Insurance Settings (Issue #85)
**Effort:** 2-3h

Payroll tax and insurance configuration.

**Acceptance Criteria:**
- [ ] State unemployment rates
- [ ] FUTA rates
- [ ] Workers comp rates

---

#### Task 22: Move AI Intelligence to Org Preferences (Issue #87)
**Effort:** 2-3h

"Contribute anonymized data" setting should be in Org Preferences.

**Acceptance Criteria:**
- [ ] Move setting to Organization Preferences
- [ ] Enabled by default (opt-out)

---

#### Task 23: Settings Consolidation (Issue #89)
**Effort:** 4-6h

Consolidate settings into logical groups.

**Acceptance Criteria:**
- [ ] Audit all settings pages
- [ ] Reorganize: User, Organization, Team, Integrations, Templates
- [ ] Remove redundant settings

---

## Status Updates

```
Phase 1: Navigation & Architecture
[ ] Task 1: Separate Team from Subcontractors
[ ] Task 2: Sidebar Navigation Reorganization
[ ] Task 3: Role-Based Navigation

Phase 2: Subcontractors Module
[ ] Task 4: Create Dedicated Subcontractors Module

Phase 3: Schedule Enhancements
[ ] Task 5: Weather Integration
[ ] Task 6: Enhanced Schedule Views
[ ] Task 7: Schedule Team Assignment
[ ] Task 8: Schedule Context Dashboard
[ ] Task 9: AI-Powered Schedule Briefing
[ ] Task 10: Crew Availability Tab Enhancement

Phase 4: Finance Enhancements
[ ] Task 11: Sales Pipeline Expenses Context
[ ] Task 12: Reimbursement Tracking Workflow
[ ] Task 13: Owner Finance Dashboard

Phase 5: Settings & Reporting
[ ] Task 14: Color Contrast Calculation
[ ] Task 15: Financial Reporting Customization
[ ] Task 16: Reports as Owner's Source of Truth
[ ] Task 17: Profitability Analysis
[ ] Task 18: Benchmarking & Comparative Analysis
[ ] Task 19: Template Management Consolidation
[ ] Task 20: Corporate Structure Settings
[ ] Task 21: Workers Comp & Insurance Settings
[ ] Task 22: Move AI Intelligence to Org Preferences
[ ] Task 23: Settings Consolidation
```

---

## Commands

```bash
# Dev server
cd apps/web && npm run dev

# TypeScript check
npx tsc --noEmit
```
