# Sprint 51 - Navigation Bugs & Structure

**Start Date:** 2026-02-04
**Focus:** Navigation architecture and sidebar reorganization
**Estimated Effort:** 12-16 hours (1-2 days)
**Priority:** P1 - HIGH
**Status:** 🔴 IN PROGRESS

---

## Why This Sprint?

**Problem:** Navigation confusion blocks user flow
**Root Cause:** Team and Subcontractors mixed together, sidebar needs reorganization
**Solution:** Separate concerns, add subcontractor directory, fix reports nav
**Impact:** Clearer navigation, better user experience

---

## Sprint Objectives

### Issues to Fix
| ID | Issue | Effort | Status |
|----|-------|--------|--------|
| #33 | Separate Team from Subcontractors | 8-12h | [ ] |
| #59 | Sidebar navigation reorganization | 8-12h | [ ] |
| #34 | Subcontractor directory | 12-16h | [ ] |
| #62 | Reports top nav → sidebar | 2-3h | [ ] |

### Success Criteria
- [ ] "Team" and "Subcontractors" are separate sidebar items
- [ ] Sidebar reorganized for logical flow
- [ ] Subcontractor directory functional
- [ ] Reports use sidebar nav (not top nav)
- [ ] All navigation patterns consistent

---

## Files Affected

```
apps/web/
├── components/layout/Sidebar.tsx          # Main sidebar navigation
├── components/ui/AppShell.tsx             # Navigation structure
├── app/dashboard/layout.tsx               # Dashboard nav config
├── app/dashboard/team/page.tsx            # Team management
├── app/dashboard/subcontractors/          # Subcontractor pages
│   ├── page.tsx                           # Directory listing
│   └── [id]/page.tsx                      # Individual sub detail
└── app/dashboard/reports/
    └── layout.tsx                         # Reports navigation
```

---

## Current Navigation Analysis

### Current Structure (from layout.tsx)
Team and Subcontractors are likely grouped together or mixed.
Reports may use top-nav tabs instead of sidebar.

### Target Structure
```
Dashboard
├── Projects
├── Schedule
├── Clients
├── Team (internal employees only)
│   ├── Members
│   ├── Time Tracking
│   └── Payroll
├── Subcontractors (external contractors)
│   ├── Directory
│   ├── Bids
│   └── Assignments
├── Finances
│   ├── Invoices
│   ├── Expenses
│   └── Reports (move from top-nav)
├── Materials
└── Settings
```

---

## Parallel Execution Plan

### Batch 1: Assessment (Parallel)
- Agent 1: Analyze current sidebar/navigation structure
- Agent 2: Review team and subcontractor pages
- Agent 3: Review reports navigation

### Batch 2: Implementation (Parallel)
- Agent 1: Reorganize sidebar navigation (#59)
- Agent 2: Separate Team from Subcontractors (#33)
- Agent 3: Build/enhance Subcontractor directory (#34)
- Agent 4: Move Reports to sidebar nav (#62)

### Batch 3: Verification
- TypeScript check
- Navigation testing
- Commit changes

---

## Technical Notes

### Separating Team from Subcontractors (#33)
- Team = internal employees (W-2, payroll)
- Subcontractors = external (1099, invoices)
- Different data models, different workflows
- Should have separate top-level nav items

### Sidebar Reorganization (#59)
- Group related items logically
- Use collapsible sections for sub-items
- Ensure mobile nav consistency

### Subcontractor Directory (#34)
- List all subcontractors with search/filter
- Show trade, contact info, rating
- Link to bids, assignments, payments

### Reports Navigation (#62)
- Currently may use tabs at top of reports section
- Should use sidebar consistent with other modules
- Finance Reports, Operational Reports, etc.

---

**Sprint Owner:** Development Team
**Sprint Status:** 🔴 IN PROGRESS
**Previous Sprint:** Sprint 50 - UI/UX Bug Fixes ✅ COMPLETE
