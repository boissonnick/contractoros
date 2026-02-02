# ContractorOS Platform Audit - Issue Tracker

> **Generated:** 2026-02-02
> **Total Issues:** 60
> **Estimated Effort:** 142-212 hours (~3.5-5 weeks for 2-3 developers)

---

## Issue Status Legend

| Status | Description |
|--------|-------------|
| `[ ]` | Not started |
| `[~]` | In progress |
| `[x]` | Complete |
| `[!]` | Blocked |

---

## CRITICAL ISSUES (Must Fix First)

### Issue #11: Category Filter Bug - Projects Disappear
- **Status:** `[ ]`
- **Severity:** CRITICAL
- **Type:** Functional Bug
- **Effort:** 4-6 hours
- **Location:** `app/dashboard/projects/` - category filter
- **Description:** Selecting any project category filter causes all projects to disappear; demo projects lack category assignments
- **Acceptance Criteria:**
  - [ ] Category filter works correctly
  - [ ] Projects with matching categories display
  - [ ] All projects visible with "All Categories" selected
  - [ ] Test with all categories: Residential, Commercial, Industrial, Renovation

### Issue #13: Firebase Permission Errors - Multiple Features
- **Status:** `[ ]`
- **Severity:** CRITICAL
- **Type:** Backend/Permissions
- **Effort:** 6-10 hours
- **Location:** `firestore.rules`
- **Description:** Multiple features showing "Missing or insufficient permissions" Firebase errors
- **Affected Features:**
  - Change Orders (`useChangeOrders`)
  - Sub Assignments (`useSubAssignments`)
  - Bids (`useBids`)
  - Solicitations (`useBidSolicitations`)
  - Submittals
  - Finances
  - Tasks
  - Scopes (`useScopes`)
- **Acceptance Criteria:**
  - [ ] Firebase Firestore security rules reviewed and updated
  - [ ] All affected features load without permission errors
  - [ ] No console errors for permission-related features
  - [ ] All demo data accessible to demo user account

### Issue #53: Profit Margin Calculation Bug
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Calculation Bug
- **Effort:** 2-3 hours
- **Location:** Finance dashboard components
- **Description:** Gross Profit is -$109,369 but Profit Margin shows 0.0% instead of negative percentage
- **Acceptance Criteria:**
  - [ ] Profit Margin calculation correctly reflects negative values
  - [ ] Formula: (Gross Profit / Revenue) * 100, handle edge cases (zero revenue)
  - [ ] Display properly formatted with negative indicator

### Issue #57: Payroll "NaNh total" Display Bug
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Data Display Bug
- **Effort:** 1-2 hours
- **Location:** Payroll components
- **Description:** Payroll details showing "NaNh total" indicating missing/invalid hours field data
- **Acceptance Criteria:**
  - [ ] Display actual hours worked, properly formatted
  - [ ] Validate data before display
  - [ ] Handle null/undefined gracefully

---

## CATEGORY 1: DASHBOARD & UI LAYOUT (5 Issues)

### Issue #1: Search Bar Overlap with CTAs
- **Status:** `[ ]`
- **Severity:** Medium
- **Type:** UI Layout Bug
- **Effort:** 2-3 hours
- **Location:** Dashboard header
- **Description:** Search bar at top right overlaps "New Estimate" and "New Project" buttons
- **Screenshots:** ss_7086n55fa
- **Acceptance Criteria:**
  - [ ] Search bar has proper spacing, no overlap with buttons
  - [ ] All buttons remain fully clickable/visible
  - [ ] Responsive at 1200px+ desktop widths

### Issue #2: Help Menu Location
- **Status:** `[ ]`
- **Severity:** Low
- **Type:** UX Navigation
- **Effort:** 1-2 hours
- **Location:** Top navigation / Side navigation
- **Description:** Help icon floating at top instead of in side navigation
- **Acceptance Criteria:**
  - [ ] Help menu relocated to side navigation (under Settings or dedicated menu item)

### Issue #3: Online Status Indicator Missing
- **Status:** `[ ]`
- **Severity:** Low
- **Type:** UI Component Missing
- **Effort:** 2-3 hours
- **Location:** User profile section (bottom left sidebar)
- **Description:** Green online status indicator previously shown next to username now missing
- **Acceptance Criteria:**
  - [ ] Green status indicator visible
  - [ ] Updates in real-time

### Issue #4: Active Projects Taking Excessive Space
- **Status:** `[ ]`
- **Severity:** Medium
- **Type:** UI Layout
- **Effort:** 3-4 hours
- **Location:** Dashboard main content
- **Description:** Active Projects section dominates dashboard, Material Prices and Recent Activity pushed below fold
- **Acceptance Criteria:**
  - [ ] Active Projects optimized for space
  - [ ] Material Prices and Recent Activity visible above fold
  - [ ] Improved grid/layout distribution

### Issue #5: Project Card Padding Too Large
- **Status:** `[ ]`
- **Severity:** Medium
- **Type:** UI Layout
- **Effort:** 3-4 hours
- **Location:** Project cards component
- **Description:** Excessive padding on project cards, pagination controls not visible without scrolling
- **Acceptance Criteria:**
  - [ ] Reduced padding on cards
  - [ ] Display 9-12 projects per page on desktop
  - [ ] "Show per page" dropdown visible
  - [ ] Pagination controls visible

---

## CATEGORY 2: NAVIGATION SPACING & PATTERNS (5 Issues)

### Issue #6: Dropdown Arrow Positioning
- **Status:** `[ ]`
- **Severity:** Low
- **Type:** UI Spacing
- **Effort:** 1-2 hours
- **Location:** Filter dropdowns (All Status, All Categories)
- **Description:** Dropdown arrows too close to right edge
- **Acceptance Criteria:**
  - [ ] Proper padding around arrows
  - [ ] Consistent spacing across all dropdowns

### Issue #7: Sub-Navigation Spacing
- **Status:** `[ ]`
- **Severity:** Low
- **Type:** UI Spacing
- **Effort:** 2 hours
- **Location:** Tasks page sub-navigation
- **Description:** Board/List/Gantt sub-nav has no breathing room from Tasks tab. Select/Add Task buttons right against nav line
- **Acceptance Criteria:**
  - [ ] Vertical padding between main nav and sub-nav
  - [ ] Vertical padding between sub-nav and action buttons

### Issue #29: Client Preferences Layout Poor
- **Status:** `[ ]`
- **Severity:** Medium
- **Type:** UI Layout
- **Effort:** 3-4 hours
- **Location:** Client Preferences page
- **Description:** Long, thin, single-column layout - poor information density
- **Acceptance Criteria:**
  - [ ] Reorganized into 2-3 column grid on desktop
  - [ ] Finish Preferences in grid layout instead of stacked
  - [ ] Budget & Timeline fields side-by-side
  - [ ] Responsive for mobile (revert to single column)

### Issue #42: Crew Availability Tab Underdeveloped
- **Status:** `[ ]`
- **Severity:** Medium
- **Type:** Feature Incomplete
- **Effort:** 8-12 hours
- **Location:** Team > Crew Availability tab
- **Description:** Tab shows basic availability list but UI is underdeveloped
- **Acceptance Criteria:**
  - [ ] Utilization tracking display (% time allocated)
  - [ ] Workload visualization (current assignments)
  - [ ] Skills/trades filtering
  - [ ] Assignment capability from this view
  - [ ] Date range selection for availability windows

### Issue #44: Empty State Pattern Inconsistency
- **Status:** `[ ]`
- **Severity:** Low
- **Type:** UX Consistency
- **Effort:** 2-3 hours
- **Location:** Time Off Requests, various pages
- **Description:** Time Off Requests empty state doesn't match established pattern (Scope of Work page)
- **Acceptance Criteria:**
  - [ ] Standardized empty state component across platform
  - [ ] Icon, message, CTA button pattern

---

## CATEGORY 3: ANIMATIONS & DISTRACTION (3 Issues)

### Issue #8: Bouncing Pending Estimates Icon
- **Status:** `[ ]`
- **Severity:** HIGH (UX Distraction)
- **Type:** Animation
- **Effort:** 1 hour
- **Location:** Dashboard - Pending Estimates section
- **Description:** Pending Estimates icon constantly bounces
- **Acceptance Criteria:**
  - [ ] Remove bouncing animation
  - [ ] Display as static or minimal subtle animation

### Issue #9: Bouncing Folder Icon Empty State
- **Status:** `[ ]`
- **Severity:** HIGH (UX Distraction)
- **Type:** Animation
- **Effort:** 1 hour
- **Location:** Projects empty state
- **Description:** Folder icon bounces on "No projects found" empty state
- **Acceptance Criteria:**
  - [ ] Remove bouncing animation from all empty states

### Issue #10: Remove All Bouncing Animations Platform-Wide
- **Status:** `[ ]`
- **Severity:** HIGH (UX Polish)
- **Type:** Animation Audit
- **Effort:** 4-6 hours
- **Description:** Multiple bouncing/pulse animations throughout platform are distracting
- **Acceptance Criteria:**
  - [ ] Audit all pages for bounce/pulse animations
  - [ ] Remove constant bouncing animations
  - [ ] Create animation guidelines for future use
  - [ ] Replace with static icons or subtle non-repetitive animations
  - [ ] Consider as part of dedicated microanimation sprint

### Issue #45: Remove Animated Icon from Daily Logs Empty State
- **Status:** `[ ]`
- **Severity:** Medium
- **Type:** Animation
- **Effort:** 1 hour
- **Location:** Daily Logs page
- **Description:** Daily Logs empty state has animated clipboard icon
- **Acceptance Criteria:**
  - [ ] Remove animated icon
  - [ ] Use static icon in established empty state pattern

---

## CATEGORY 4: DEMO DATA QUALITY (25 Issues)

### 4A: Client & Project Data

#### Issue #12: Demo Projects Not Categorized
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Data Quality
- **Effort:** 2-3 hours
- **Description:** All demo projects missing category assignments
- **Acceptance Criteria:**
  - [ ] Historic Home Restoration → Residential + Renovation
  - [ ] Kitchen Renovation Demo → Residential + Renovation
  - [ ] Office Build-Out → Commercial
  - [ ] Multi-Unit Housing → Residential
  - [ ] Bathroom Remodel → Residential
  - [ ] Deck Replacement → Residential + Addition
  - [ ] Basement Finishing → Residential
  - [ ] Sunroom Addition → Residential + Addition
  - [ ] Ashview Drive → Residential
  - [ ] All projects visible when filtered by assigned categories

#### Issue #14: Missing Demo Client Assignment
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Data Quality
- **Effort:** 2-3 hours
- **Description:** Demo projects show "Client: Not assigned" on Overview
- **Acceptance Criteria:**
  - [ ] All demo projects assigned to demo clients
  - [ ] Create demo clients: Heritage Trust, Property Group LLC, TechCorp Inc, Michael Chen, Robert Martinez
  - [ ] Client displays correctly on Overview page

#### Issue #30: Missing Demo Clients
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Data Quality
- **Effort:** 3-4 hours
- **Description:** No clients exist to test client management functionality
- **Acceptance Criteria:**
  - [ ] Create 8-10 demo clients with realistic details
  - [ ] Include different client types (individuals, companies, organizations)
  - [ ] Link to demo projects
  - [ ] Populate with contact info, project history

### 4B: Quote & Scope Data

#### Issue #15: Missing Demo Quotes with Line Items
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Data Quality
- **Effort:** 6-8 hours
- **Description:** Quote tab shows $0 in all sections despite project having quoted total
- **Acceptance Criteria:**
  - [ ] Quote Builder populated with realistic line items for each demo project
  - [ ] Quote totals match project budget shown in overview
  - [ ] Sections populated: Assessment, Structural, Systems, Restoration, Final Touches
  - [ ] 5-15 line items per project
  - [ ] Realistic pricing matching project scope

#### Issue #16: Missing Scope of Work
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Data Quality
- **Effort:** 4-6 hours
- **Description:** Scope page shows "No scope of work created yet"
- **Acceptance Criteria:**
  - [ ] Scope of Work created for each demo project
  - [ ] 3-5 scope sections per project
  - [ ] Realistic scope details matching project type
  - [ ] Scope references tasks/phases

### 4C: Tasks & Project Execution Data

#### Issue #17: No Demo Tasks
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Data Quality
- **Effort:** 8-12 hours
- **Description:** Tasks page shows "0 tasks" - needed to test Gantt view
- **Acceptance Criteria:**
  - [ ] 15-25 demo tasks per project
  - [ ] Tasks distributed across statuses: To Do, In Progress, Review, Done
  - [ ] Dependencies (e.g., "Install drywall" depends on "Framing complete")
  - [ ] Phasing (Pre-Construction, Framing, Systems, Finishes, etc.)
  - [ ] Blockers (marked as blocking other tasks)
  - [ ] Due dates with realistic timeline
  - [ ] Gantt view displays tasks with timeline
  - [ ] Board view shows tasks by status
  - [ ] List view shows all task details

### 4D: Subcontractor & Bid Data

#### Issue #18: No Demo Sub Assignments
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Data Quality
- **Effort:** 4-6 hours
- **Description:** Subs tab shows "Assignments (0)"
- **Acceptance Criteria:**
  - [ ] 3-5 demo sub/contractor assignments per project
  - [ ] Realistic contractors based on project scope
  - [ ] Scope of work and budget per assignment
  - [ ] Status tracking (Not Started, In Progress, Complete)

#### Issue #19: No Demo Bids
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Data Quality
- **Effort:** 4-6 hours
- **Description:** Subs tab shows "Bids (0)"
- **Acceptance Criteria:**
  - [ ] 2-3 demo bids per sub assignment
  - [ ] Each bid includes amount, date, status
  - [ ] Line items breakdown
  - [ ] Multiple bids enable comparison functionality

#### Issue #20: No Demo Bid Solicitations
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Data Quality
- **Effort:** 4-6 hours
- **Description:** Subs tab shows "Solicitations (0)"
- **Acceptance Criteria:**
  - [ ] 2-3 demo solicitations per project
  - [ ] Request date, scope/description, due date, target contractors
  - [ ] Status (Open, Closed, Awarded)
  - [ ] Linked to corresponding bids

### 4E: Documentation & Workflow Data

#### Issue #21: No Demo RFIs
- **Status:** `[ ]`
- **Severity:** Medium
- **Type:** Data Quality
- **Effort:** 3-4 hours
- **Description:** RFIs page shows "No RFIs yet"
- **Acceptance Criteria:**
  - [ ] 5-10 demo RFIs per project
  - [ ] Various statuses: Open (2-3), Answered (2-3), Overdue (1-2)
  - [ ] Question/description, date, answer if applicable

#### Issue #22: No Demo Submittals
- **Status:** `[ ]`
- **Severity:** Medium
- **Type:** Data Quality
- **Effort:** 3-4 hours
- **Description:** Submittals page shows "No submittals found"
- **Acceptance Criteria:**
  - [ ] 5-10 demo submittals per project
  - [ ] Various statuses: Pending, Approved, Needs Revision, Rejected
  - [ ] Item description, vendor/supplier, submittal date

#### Issue #23: No Demo Punch List Items
- **Status:** `[ ]`
- **Severity:** Medium
- **Type:** Data Quality
- **Effort:** 3-4 hours
- **Description:** Punch List page shows "No punch items yet"
- **Acceptance Criteria:**
  - [ ] 8-15 demo punch list items per project
  - [ ] Various statuses: Open, In Progress, Ready for Review, Approved, Rejected
  - [ ] Description, priority, location, assigned to, due date

#### Issue #24: No Demo Change Orders
- **Status:** `[ ]`
- **Severity:** Medium
- **Type:** Data Quality
- **Effort:** 3-4 hours
- **Description:** Change Orders page shows permission error (depends on Issue #13)
- **Acceptance Criteria:**
  - [ ] 2-4 demo change orders per project
  - [ ] Change description, impact (cost/schedule), status, approval date

### 4F: Team & Schedule Data

#### Issue #25: No Demo Client Preferences
- **Status:** `[ ]`
- **Severity:** Medium
- **Type:** Data Quality
- **Effort:** 2-3 hours
- **Description:** Client Preferences section visible but empty
- **Acceptance Criteria:**
  - [ ] Finish preferences (materials, colors, styles)
  - [ ] Budget preferences/constraints
  - [ ] Timeline preferences
  - [ ] Communication preferences

#### Issue #35: Schedule Page Empty - No Demo Data
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Data Quality
- **Effort:** 8-12 hours
- **Description:** Schedule shows no events, needs data tied to real projects
- **Acceptance Criteria:**
  - [ ] Demo events/tasks created linked to real projects
  - [ ] Events tied to task phasing and dependencies
  - [ ] Spans realistic project timelines
  - [ ] Mix of single-day and multi-day events
  - [ ] Various event types (work, inspections, deliveries)

#### Issue #41: Crew Availability Tab Needs Demo Data
- **Status:** `[ ]`
- **Severity:** Medium
- **Type:** Data Quality
- **Effort:** 2-3 hours
- **Description:** Crew Availability tab empty
- **Acceptance Criteria:**
  - [ ] Availability status for each employee by date
  - [ ] Realistic allocation percentages
  - [ ] Time off windows marked

#### Issue #43: Time Off Requests Needs Demo Data
- **Status:** `[ ]`
- **Severity:** Medium
- **Type:** Data Quality
- **Effort:** 2-3 hours
- **Description:** Time Off Requests shows "No time off requests"
- **Acceptance Criteria:**
  - [ ] 5-10 demo time off requests across employees
  - [ ] Various types: vacation, sick days, personal
  - [ ] Different statuses: Pending, Approved, Denied

#### Issue #46: Daily Logs Needs Demo Data
- **Status:** `[ ]`
- **Severity:** Medium
- **Type:** Data Quality
- **Effort:** 4-6 hours
- **Description:** Daily Logs shows "No daily logs yet"
- **Acceptance Criteria:**
  - [ ] 20-30 demo log entries across employees and projects
  - [ ] Tied to real employees, projects, and tasks
  - [ ] Various categories: General, Progress, Issue, Safety, Weather, etc.

### 4G: Financial Data

#### Issue #47: Finances Module Needs Comprehensive Demo Data
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Data Quality
- **Effort:** 8-12 hours
- **Description:** Finances module has minimal data
- **Acceptance Criteria:**
  - [ ] Employee expense entries tied to real team members
  - [ ] Revenue entries tied to real demo clients and projects
  - [ ] Milestone/progress billing tied to project phases
  - [ ] Material purchase orders
  - [ ] Equipment rental costs
  - [ ] Subcontractor invoices
  - [ ] Tax categories and tracking

#### Issue #48: Sales Pipeline "Total Expenses 137" Needs Context
- **Status:** `[ ]`
- **Severity:** Medium
- **Type:** Feature Gap
- **Effort:** 4-6 hours
- **Description:** "Total Expenses 137" metric needs clickability and context
- **Acceptance Criteria:**
  - [ ] Drill-down capability to see expense details
  - [ ] Filter by employee, project, category
  - [ ] Expense approval workflows visible

#### Issue #54: Payroll Data Needs Employee Rate Mapping
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Data Quality
- **Effort:** 4-6 hours
- **Description:** Payroll shows "NaNh total" - missing realistic hourly/salary rates
- **Acceptance Criteria:**
  - [ ] Hourly rates set for hourly employees
  - [ ] Salary amounts set for salaried employees
  - [ ] Realistic rates for their roles
  - [ ] Tax withholding details populated

#### Issue #55: Payroll Needs Comprehensive Demo Data
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Data Quality
- **Effort:** 6-8 hours
- **Description:** Time tracking, deductions, tax details minimal
- **Acceptance Criteria:**
  - [ ] Time entries for each employee
  - [ ] Realistic hours worked per pay period
  - [ ] Accurate tax calculations
  - [ ] Deduction details (benefits, taxes)
  - [ ] Multiple payroll runs showing different scenarios

---

## CATEGORY 5: FEATURE GAPS & ENHANCEMENTS (15 Issues)

### Issue #26: Finances Page Error & Demo Job Costing Data
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Bug + Feature
- **Effort:** 6-8 hours
- **Description:** "Failed to load financial data" error + "No cost data available"
- **Acceptance Criteria:**
  - [ ] Permission issue resolved (Issue #13)
  - [ ] Job costing data created: materials, labor, equipment, subcontractor costs
  - [ ] Cost tracking shows budget vs. actual
  - [ ] Financial summary displays correctly

### Issue #27: Comparison Functionality Testing Support
- **Status:** `[ ]`
- **Severity:** Medium
- **Type:** Feature Support
- **Effort:** 2-3 hours
- **Description:** Subs > Compare tab exists but can't test without demo bids/solicitations
- **Acceptance Criteria:**
  - [ ] With demo bids created, Compare tab functional
  - [ ] Can compare multiple bids, amounts, line items
  - [ ] Comparison displays clearly with visual indicators

### Issue #31: "Add Client" Button Not Using Brand Colors
- **Status:** `[ ]`
- **Severity:** Medium
- **Type:** UI/Branding
- **Effort:** 2-3 hours
- **Description:** "Add Client" button uses default blue instead of custom brand colors
- **Acceptance Criteria:**
  - [ ] Button uses custom brand color from settings
  - [ ] Consistent with other CTA buttons across platform

### Issue #32: Custom Color Contrast Calculation
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Feature Enhancement
- **Effort:** 6-8 hours
- **Description:** Need automatic contrast calculation for custom colors
- **Acceptance Criteria:**
  - [ ] Contrast ratio calculation on color selection
  - [ ] WCAG AA compliance check (4.5:1 minimum)
  - [ ] Auto-adjust text color based on background luminance
  - [ ] Test with edge cases (very light, very dark colors)

### Issue #33: Team Section Needs Separation - Subcontractors vs Employees
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Feature Architecture
- **Effort:** 8-12 hours
- **Description:** Team section mixes employees, project managers, subcontractors, and clients
- **Acceptance Criteria:**
  - [ ] Team section shows only: Employees, Project Managers
  - [ ] Subcontractors removed from Team section
  - [ ] Clients removed from Team section
  - [ ] Clear role-based organization

### Issue #34: Create Dedicated Subcontractors Module (Feature)
- **Status:** `[ ]`
- **Severity:** HIGH (Strategic)
- **Type:** New Module / EPIC
- **Effort:** 20-30 hours
- **Description:** Separate subcontractors into dedicated module with analytics
- **Acceptance Criteria:**
  - [ ] New "Subcontractors" section in sidebar navigation
  - [ ] Subcontractor directory with contact info, trade/specialty, rates
  - [ ] Historical performance metrics
  - [ ] Availability calendar
  - [ ] Project history
  - [ ] Analytics dashboard: utilization, performance, cost comparisons
  - [ ] Comparison tools
  - [ ] Integration with project assignment workflows

### Issue #36: Schedule Weather Integration
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Feature Enhancement
- **Effort:** 12-16 hours
- **Description:** Schedule needs weather data above dates
- **Acceptance Criteria:**
  - [ ] Weather API integration (OpenWeather, Weather.gov)
  - [ ] Display above calendar: High, Low, Precipitation %
  - [ ] Weather icons (sun, clouds, rain)
  - [ ] Alert for outdoor tasks with adverse weather
  - [ ] Location-specific weather for project locations

### Issue #37: Enhanced Schedule Views
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Feature Enhancement
- **Effort:** 8-12 hours
- **Description:** Schedule needs daily view plus conflict detection
- **Acceptance Criteria:**
  - [ ] Day view: hourly granularity, task details, weather
  - [ ] Week view: current implementation
  - [ ] Month view: overview, drill-down capability
  - [ ] Conflict detection: resource, weather, dependency, equipment

### Issue #38: Schedule Team Assignment from Calendar
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Feature Enhancement
- **Effort:** 8-12 hours
- **Description:** Schedule should allow team assignment from calendar view
- **Acceptance Criteria:**
  - [ ] Drag-drop task assignment (or dropdown)
  - [ ] Quick team member selection from calendar
  - [ ] Show crew availability before assignment
  - [ ] Support bulk assignment for phases/groups

### Issue #39: Schedule Context & Detail Dashboard
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Feature Enhancement
- **Effort:** 10-14 hours
- **Description:** Schedule should show context/detail
- **Acceptance Criteria:**
  - [ ] Task detail cards showing weather impact, conflicts, dependencies
  - [ ] Constraint indicators
  - [ ] Project timeline overview with critical path
  - [ ] Risk indicators

### Issue #40: AI-Powered Schedule Briefing
- **Status:** `[ ]`
- **Severity:** Medium
- **Type:** AI Feature
- **Effort:** 12-16 hours
- **Description:** AI-generated daily/weekly briefing
- **Acceptance Criteria:**
  - [ ] Daily briefing: weather, conflicts, dependencies, constraints, overdue
  - [ ] Weekly briefing: forecast, conflicts, resource planning
  - [ ] Push notifications option
  - [ ] Customizable by role

### Issue #49: Reimbursement Tracking Workflow
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Feature Enhancement
- **Effort:** 8-12 hours
- **Description:** Finance module needs reimbursement tracking
- **Acceptance Criteria:**
  - [ ] Employee expense submission (receipts, amount, category, project)
  - [ ] Manager approval workflow
  - [ ] Finance review and reimbursement processing
  - [ ] Status tracking (Pending, Approved, Paid)

### Issue #50: Owner Finance Dashboard
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Feature Enhancement
- **Effort:** 10-14 hours
- **Description:** Finance module should be "home base" for owner
- **Acceptance Criteria:**
  - [ ] Executive summary: Revenue, Expenses, Gross Profit, Profit Margin
  - [ ] Cash flow projection (30/60/90 day)
  - [ ] Profitability by project
  - [ ] Profitability by client
  - [ ] Revenue trending
  - [ ] Margin trends
  - [ ] Budget vs. actual across projects

### Issue #59: Sidebar Navigation Reorganization
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Navigation Architecture
- **Effort:** 8-12 hours
- **Description:** Rethink sidebar organization around "jobs to be done"
- **Acceptance Criteria:**
  - [ ] Define role-based navigation (Owner, Manager, Employee, Subcontractor)
  - [ ] Create new Finances sub-structure: Payroll, Invoicing, Expenses, Reimbursements
  - [ ] Implement contextual navigation
  - [ ] Update information architecture documentation

### Issue #60: Sidebar Navigation Needs Role-Based Structure
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** UX Architecture
- **Effort:** 10-14 hours
- **Description:** Sidebar navigation needs restructuring based on roles
- **Acceptance Criteria:**
  - [ ] Define user personas and their core "jobs to be done"
  - [ ] Design conditional navigation based on user role
  - [ ] Implement with user role assignments
  - [ ] Create admin controls for role customization

---

## CATEGORY 6: FUTURE INTEGRATIONS (4 Issues)

### Issue #28: Microanimations/Microinteractions Sprint Planning
- **Status:** `[ ]`
- **Severity:** Low (Future)
- **Type:** Feature Planning
- **Effort:** Planning Only
- **Description:** Plan dedicated sprint to refine microanimations
- **Acceptance Criteria:**
  - [ ] Create animation design guidelines
  - [ ] Plan replacements for bouncing animations
  - [ ] Schedule as dedicated sprint feature effort

### Issue #51: Bank Integration - Yodlee/Plaid
- **Status:** `[ ]`
- **Severity:** HIGH (Future)
- **Type:** Integration Feature
- **Effort:** 20-30 hours
- **Description:** Enable bank transaction connectivity
- **Acceptance Criteria:**
  - [ ] Research: Yodlee vs Plaid vs alternatives
  - [ ] Bank account connection flow
  - [ ] Transaction import and categorization
  - [ ] Reconciliation against recorded expenses
  - [ ] Security and compliance (PCI, encryption)

### Issue #52: Neobank & Purchasing Card Integrations
- **Status:** `[ ]`
- **Severity:** Medium (Future)
- **Type:** Integration Feature
- **Effort:** Research Phase
- **Description:** Explore neobank integrations (Brex, Ramp, etc.)
- **Acceptance Criteria:**
  - [ ] Research phase: identify compatible neobanks
  - [ ] Document API capabilities
  - [ ] Scope implementation effort

### Issue #58: Payroll Integration Planning
- **Status:** `[ ]`
- **Severity:** HIGH (Future)
- **Type:** Integration Feature
- **Effort:** Research + 25-40 hours (implementation)
- **Description:** Map ContractorOS payroll data to Gusto, ADP, QuickBooks
- **Acceptance Criteria:**
  - [ ] Research: identify target payroll platforms
  - [ ] Document API capabilities and limitations
  - [ ] Design data mapping and sync flow
  - [ ] Plan OAuth/auth strategy

---

## SUMMARY BY PRIORITY

### CRITICAL (Must Fix First - Blocks Testing)
| Issue | Description | Effort |
|-------|-------------|--------|
| #11 | Category Filter Bug | 4-6h |
| #13 | Firebase Permission Errors | 6-10h |
| #53 | Profit Margin Calculation | 2-3h |
| #57 | Payroll NaN Display | 1-2h |

### HIGH PRIORITY
| Issue | Description | Effort |
|-------|-------------|--------|
| #1 | Search Bar Overlap | 2-3h |
| #4 | Active Projects Space | 3-4h |
| #5 | Project Card Padding | 3-4h |
| #8 | Bouncing Estimates Icon | 1h |
| #9 | Bouncing Folder Icon | 1h |
| #10 | Animation Audit | 4-6h |
| #12 | Demo Projects Categories | 2-3h |
| #14 | Demo Client Assignment | 2-3h |
| #15 | Demo Quotes | 6-8h |
| #16 | Demo Scope of Work | 4-6h |
| #17 | Demo Tasks | 8-12h |
| #18 | Demo Sub Assignments | 4-6h |
| #19 | Demo Bids | 4-6h |
| #20 | Demo Solicitations | 4-6h |
| #26 | Finances Error + Job Costing | 6-8h |
| #30 | Demo Clients | 3-4h |
| #32 | Color Contrast Calculation | 6-8h |
| #33 | Team/Sub Separation | 8-12h |
| #34 | Subcontractors Module | 20-30h |
| #35 | Schedule Demo Data | 8-12h |
| #36 | Weather Integration | 12-16h |
| #37 | Enhanced Schedule Views | 8-12h |
| #38 | Schedule Team Assignment | 8-12h |
| #39 | Schedule Context Dashboard | 10-14h |
| #47 | Finances Demo Data | 8-12h |
| #49 | Reimbursement Workflow | 8-12h |
| #50 | Owner Finance Dashboard | 10-14h |
| #54 | Payroll Rate Mapping | 4-6h |
| #55 | Payroll Demo Data | 6-8h |
| #59 | Sidebar Reorganization | 8-12h |
| #60 | Role-Based Navigation | 10-14h |

### MEDIUM PRIORITY
| Issue | Description | Effort |
|-------|-------------|--------|
| #21 | Demo RFIs | 3-4h |
| #22 | Demo Submittals | 3-4h |
| #23 | Demo Punch List | 3-4h |
| #24 | Demo Change Orders | 3-4h |
| #25 | Demo Client Preferences | 2-3h |
| #27 | Comparison Functionality | 2-3h |
| #29 | Client Preferences Layout | 3-4h |
| #31 | Button Brand Colors | 2-3h |
| #40 | AI Schedule Briefing | 12-16h |
| #41 | Crew Availability Data | 2-3h |
| #42 | Crew Availability Tab | 8-12h |
| #43 | Time Off Demo Data | 2-3h |
| #45 | Daily Logs Animation | 1h |
| #46 | Daily Logs Demo Data | 4-6h |
| #48 | Expenses Context | 4-6h |

### LOW PRIORITY
| Issue | Description | Effort |
|-------|-------------|--------|
| #2 | Help Menu Location | 1-2h |
| #3 | Online Status Indicator | 2-3h |
| #6 | Dropdown Arrow Positioning | 1-2h |
| #7 | Sub-Navigation Spacing | 2h |
| #28 | Microanimation Sprint | Planning |
| #44 | Empty State Pattern | 2-3h |

---

## EFFORT TOTALS

| Category | Estimated Hours |
|----------|----------------|
| Critical Bugs | 13-21h |
| UI/UX Layout | 18-26h |
| Animations | 7-10h |
| Demo Data | 85-115h |
| Feature Enhancements | 130-180h |
| Navigation Architecture | 18-26h |
| Future Integrations | 45-70h (research) |
| **TOTAL** | **316-448h** |

---

## RECOMMENDED SPRINT STRUCTURE

### Sprint A (Critical): 1 week
**Focus:** Unblock testing and fix critical bugs
- Issue #11: Category Filter Bug
- Issue #13: Firebase Permission Errors
- Issue #53: Profit Margin Calculation
- Issue #57: Payroll NaN Display
- Issues #8, #9, #10: Animation removal

### Sprint B (UI/Layout): 1 week
**Focus:** Dashboard and layout improvements
- Issue #1: Search Bar Overlap
- Issue #4: Active Projects Space
- Issue #5: Project Card Padding
- Issue #29: Client Preferences Layout
- Issue #7: Sub-Navigation Spacing

### Sprint C (Demo Data - Batch 1): 1-2 weeks
**Focus:** Core demo data for testing
- Issue #12: Project Categories
- Issue #14: Client Assignment
- Issue #30: Demo Clients
- Issue #15: Demo Quotes
- Issue #16: Demo Scope of Work
- Issue #17: Demo Tasks

### Sprint D (Demo Data - Batch 2): 1-2 weeks
**Focus:** Complete demo data
- Issue #18: Demo Sub Assignments
- Issue #19: Demo Bids
- Issue #20: Demo Solicitations
- Issue #21-24: RFIs, Submittals, Punch List, Change Orders
- Issue #35: Schedule Demo Data

### Sprint E (Architecture): 1-2 weeks
**Focus:** Navigation and team structure
- Issue #33: Team/Sub Separation
- Issue #59: Sidebar Reorganization
- Issue #60: Role-Based Navigation

### Sprint F (Finance): 1-2 weeks
**Focus:** Financial module completion
- Issue #26: Job Costing
- Issue #47: Finances Demo Data
- Issue #49: Reimbursement Workflow
- Issue #50: Owner Finance Dashboard
- Issue #54, #55: Payroll Data

### Sprint G (Schedule Enhancement): 2 weeks
**Focus:** Schedule features
- Issue #36: Weather Integration
- Issue #37: Enhanced Schedule Views
- Issue #38: Team Assignment from Calendar
- Issue #39: Context Dashboard
- Issue #42: Crew Availability Tab

### Sprint H (Strategic): 2-3 weeks
**Focus:** New modules
- Issue #34: Subcontractors Module
- Issue #40: AI Schedule Briefing

### Future Sprints
- Issue #51: Bank Integration (Plaid/Yodlee)
- Issue #52: Neobank Integrations
- Issue #58: Payroll Integration
- Issue #28: Microanimation Polish
