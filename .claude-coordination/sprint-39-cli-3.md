# Sprint 39 - CLI 3: Feature Development

**Role:** Feature Development / New Modules
**Focus:** Navigation architecture, subcontractors module, schedule enhancements
**Estimated Hours:** 100-140h
**Priority:** MEDIUM - Start after CLI 1 has demo data

---

## Prerequisites

- Demo data populated (CLI 1 seed scripts)
- Firebase permissions working (CLI 4 completed Sprint 38)
- Dev server running

---

## Phase 1: Navigation Architecture

### Task 1: Separate Team from Subcontractors (Issue #33)
**Effort:** 8-12h

Team section currently mixes employees, project managers, subcontractors, and clients.

**Changes Required:**
1. Team section shows ONLY: Employees, Project Managers
2. Remove subcontractors from Team section
3. Subcontractors get their own section (Task 4)
4. Clients remain in separate Clients section

**Files to Modify:**
- `app/dashboard/team/page.tsx`
- `components/team/TeamMemberList.tsx`
- Side navigation

**Acceptance Criteria:**
- [ ] Team section shows only employees/PMs
- [ ] No subcontractors in Team list
- [ ] Clear role-based organization

---

### Task 2: Sidebar Navigation Reorganization (Issue #59)
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
  └─ Directory
  └─ Bids
  └─ Analytics
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

**Files to Modify:**
- `components/layout/Sidebar.tsx`
- `app/dashboard/layout.tsx`
- Navigation configuration

**Acceptance Criteria:**
- [ ] New sidebar structure implemented
- [ ] Sub-navigation for Finances, Team, Subcontractors
- [ ] Collapsible menu sections

---

### Task 3: Role-Based Navigation (Issue #60)
**Effort:** 10-14h

Different users see different navigation based on role.

**Role Visibility:**
| Section | Owner | PM | Field | Sub |
|---------|-------|-----|-------|-----|
| Dashboard | ✓ | ✓ | ✓ | ✓ |
| Projects | ✓ | ✓ | ✓ | Limited |
| Schedule | ✓ | ✓ | ✓ | Own only |
| Team | ✓ | ✓ | - | - |
| Subcontractors | ✓ | ✓ | - | - |
| Clients | ✓ | ✓ | - | - |
| Finances | ✓ | Limited | - | - |
| Reports | ✓ | ✓ | - | - |
| Settings | ✓ | Limited | Limited | Limited |

**Implementation:**
```typescript
const getNavigationForRole = (role: UserRole) => {
  const baseNav = [{ name: 'Dashboard', href: '/dashboard' }];

  if (role === 'OWNER' || role === 'PM') {
    return [...baseNav, ...fullNav];
  }

  if (role === 'FIELD') {
    return [...baseNav, ...fieldNav];
  }

  return baseNav;
};
```

**Acceptance Criteria:**
- [ ] Navigation adapts to user role
- [ ] Unauthorized routes redirect appropriately
- [ ] Admin can customize role permissions

---

## Phase 2: Subcontractors Module

### Task 4: Create Dedicated Subcontractors Module (Issue #34)
**Effort:** 20-30h

New "Subcontractors" section in sidebar navigation.

**Files to Create:**
```
app/dashboard/subcontractors/
├── page.tsx                    # Directory listing
├── [id]/
│   └── page.tsx               # Sub detail view
├── bids/
│   └── page.tsx               # Bid management
├── analytics/
│   └── page.tsx               # Performance analytics
└── compare/
    └── page.tsx               # Comparison tools

components/subcontractors/
├── SubcontractorCard.tsx
├── SubcontractorDetail.tsx
├── PerformanceMetrics.tsx
├── BidComparison.tsx
└── AvailabilityCalendar.tsx

lib/hooks/
├── useSubcontractorAnalytics.ts
└── useSubcontractorComparison.ts
```

**Features:**
1. **Directory View**
   - Search/filter by trade, location, rating
   - Contact info, certifications, insurance
   - Quick actions: Assign to project, Request bid

2. **Detail View**
   - Full profile with certifications
   - Project history
   - Performance metrics
   - Availability calendar

3. **Analytics Dashboard**
   - Utilization rates
   - Cost comparisons
   - Performance scores
   - Response times

4. **Comparison Tools**
   - Side-by-side bid comparison
   - Rate comparisons
   - Availability overlay

**Acceptance Criteria:**
- [ ] New sidebar item "Subcontractors"
- [ ] Directory view with search/filter
- [ ] Individual sub detail pages
- [ ] Performance metrics dashboard
- [ ] Comparison tools working

---

## Phase 3: Schedule Enhancements

### Task 5: Weather Integration (Issue #36)
**Effort:** 12-16h

Add weather data to schedule.

**Implementation:**
1. Weather API integration (OpenWeather or Weather.gov)
2. Weather component above calendar
3. Alerts for outdoor tasks with adverse weather

**Files to Create:**
```
lib/services/weather.ts
components/schedule/WeatherWidget.tsx
components/schedule/WeatherAlert.tsx
```

**API Example:**
```typescript
interface WeatherData {
  date: string;
  high: number;
  low: number;
  precipitation: number;
  conditions: 'sunny' | 'cloudy' | 'rain' | 'snow';
  icon: string;
}

export async function getWeatherForecast(
  location: string,
  days: number = 7
): Promise<WeatherData[]> {
  // Implementation
}
```

**Acceptance Criteria:**
- [ ] Weather displays on schedule
- [ ] 7-day forecast visible
- [ ] Alerts for outdoor tasks in bad weather
- [ ] Location-based forecasts

---

### Task 6: Enhanced Schedule Views (Issue #37)
**Effort:** 8-12h

Add Day view, improve existing views.

**Views:**
- **Day View:** Hourly granularity, detailed task info
- **Week View:** Current (enhance with better task cards)
- **Month View:** Overview with drill-down

**Acceptance Criteria:**
- [ ] Day/Week/Month view toggle
- [ ] Smooth transitions between views
- [ ] Conflict indicators visible in all views

---

### Task 7: Schedule Team Assignment (Issue #38)
**Effort:** 8-12h

Allow team assignment from calendar view.

**Features:**
- Drag-drop task assignment (or dropdown on click)
- Show crew availability before assignment
- Bulk assignment for phases/groups

**Acceptance Criteria:**
- [ ] Can assign team from calendar
- [ ] Availability shown before assignment
- [ ] Conflict warnings displayed

---

### Task 8: Schedule Context Dashboard (Issue #39)
**Effort:** 10-14h

Show context and detail on schedule.

**Features:**
- Task detail cards showing: dependencies, conflicts, weather impact
- Project timeline overview with critical path
- Risk indicators for at-risk tasks

**Acceptance Criteria:**
- [ ] Task cards show full context
- [ ] Critical path visible
- [ ] Risk indicators working

---

### Task 9: AI-Powered Schedule Briefing (Issue #40)
**Effort:** 12-16h

AI-generated daily/weekly briefing.

**Features:**
- Daily briefing: weather, conflicts, dependencies, constraints
- Weekly briefing: forecast, resource planning, risks
- Push notification option

**Files to Create:**
```
lib/ai/schedule-briefing.ts
components/schedule/DailyBriefing.tsx
components/schedule/WeeklyBriefing.tsx
```

**Acceptance Criteria:**
- [ ] Daily briefing generated
- [ ] Includes weather and conflicts
- [ ] Customizable by user role

---

### Task 10: Crew Availability Enhancement (Issue #42)
**Effort:** 8-12h

Enhance Crew Availability tab.

**Features:**
- Utilization tracking (% time allocated)
- Workload visualization
- Skills/trades filtering
- Assignment capability from this view
- Date range selection

**Acceptance Criteria:**
- [ ] Utilization percentages shown
- [ ] Can assign from availability view
- [ ] Date range filtering works

---

## Phase 4: Finance Enhancements

### Task 11: Sales Pipeline Expenses Context (Issue #48)
**Effort:** 4-6h

"Total Expenses 137" needs clickability and context.

**Acceptance Criteria:**
- [ ] Click on metric opens expense list
- [ ] Filter by employee, project, category
- [ ] Approval workflows visible

---

### Task 12: Reimbursement Tracking Workflow (Issue #49)
**Effort:** 8-12h

Full reimbursement tracking system.

**Files to Create:**
```
app/dashboard/finances/reimbursements/page.tsx
components/finances/ReimbursementForm.tsx
components/finances/ReimbursementList.tsx
lib/hooks/useReimbursements.ts
```

**Workflow:**
1. Employee submits expense (receipt, amount, category, project)
2. Manager approval
3. Finance review
4. Mark as paid/reimbursed

**Acceptance Criteria:**
- [ ] Employees can submit expenses
- [ ] Approval workflow functional
- [ ] Status tracking (Pending → Approved → Paid)

---

### Task 13: Owner Finance Dashboard (Issue #50)
**Effort:** 10-14h

Finance module as owner's "home base".

**Features:**
- Executive summary: Revenue, Expenses, Gross Profit, Margin
- Cash flow projection (30/60/90 day)
- Profitability by project and client
- Budget vs. actual across all projects

**Files to Create:**
```
app/dashboard/finances/executive/page.tsx
components/finances/ExecutiveSummary.tsx
components/finances/CashFlowChart.tsx
components/finances/ProfitabilityTable.tsx
```

**Acceptance Criteria:**
- [ ] Executive dashboard created
- [ ] Cash flow projections work
- [ ] Drill-down to project level

---

## Phase 5: Settings (Lower Priority)

### Task 14: Template Management Consolidation (Issue #82)
**Effort:** 3-4h

Consolidate ALL templates into dedicated section.

**Acceptance Criteria:**
- [ ] Dedicated Templates section in Settings
- [ ] All types: SMS, Email, Estimate, Invoice, Report
- [ ] Searchable list

---

### Task 15: Settings Consolidation (Issue #89)
**Effort:** 4-6h

Consolidate settings into logical groups.

**Structure:**
```
Settings/
├── User Preferences
├── Organization
├── Team Management
├── Integrations
├── Templates
└── Security
```

**Acceptance Criteria:**
- [ ] Settings reorganized
- [ ] No redundant settings
- [ ] Clear navigation

---

## Status Updates

```
Phase 1: Navigation
[ ] Task 1: Separate Team from Subcontractors
[ ] Task 2: Sidebar Navigation Reorganization
[ ] Task 3: Role-Based Navigation

Phase 2: Subcontractors Module
[ ] Task 4: Create Dedicated Subcontractors Module

Phase 3: Schedule
[ ] Task 5: Weather Integration
[ ] Task 6: Enhanced Schedule Views
[ ] Task 7: Schedule Team Assignment
[ ] Task 8: Schedule Context Dashboard
[ ] Task 9: AI-Powered Schedule Briefing
[ ] Task 10: Crew Availability Enhancement

Phase 4: Finance
[ ] Task 11: Sales Pipeline Expenses Context
[ ] Task 12: Reimbursement Tracking Workflow
[ ] Task 13: Owner Finance Dashboard

Phase 5: Settings
[ ] Task 14: Template Management Consolidation
[ ] Task 15: Settings Consolidation
```

---

## Commands

```bash
# Dev server
cd apps/web && npm run dev

# TypeScript check
npx tsc --noEmit

# Create new page
mkdir -p app/dashboard/subcontractors/[id]
touch app/dashboard/subcontractors/page.tsx
```

---

## File Ownership

CLI 3 owns:
- `app/dashboard/*/page.tsx` (page logic, not styling)
- `lib/hooks/` (new feature hooks)
- New feature routes and components

**Coordinate with:**
- CLI 2 for component styling
- CLI 1 for demo data requirements
- CLI 4 for Firestore rules/indexes
