# CLI 4 SPRINT 37B INSTRUCTIONS - E2E Testing & Verification

> **Role:** E2E Testing
> **Sprint:** 37B
> **Focus:** Verify fixes from CLI 2-3, regression testing
> **Coordinator:** CLI 1
> **Tools:** Chrome MCP, localhost:3000

---

## YOUR TASKS

### Task 1: Critical Bug Verification (Do First)
**Effort:** 2 hours
**Tool:** Chrome MCP at localhost:3000

Verify all 6 critical bugs that were fixed remain working:

#### Test 1.1: Category Filter (FEB-011)
```
1. Navigate to /dashboard/projects
2. Click category filter dropdown
3. Select "Residential"
4. EXPECTED: Projects with Residential category show
5. Select "Commercial"
6. EXPECTED: Projects with Commercial category show
7. Select "All Categories"
8. EXPECTED: All 12 demo projects visible
```
**Result:** `[ ] PASS` / `[ ] FAIL` - Notes: ___

#### Test 1.2: Firebase Permissions (FEB-013)
```
1. Navigate to /dashboard/projects/[any-project]/change-orders
   EXPECTED: Page loads, no permission error
2. Navigate to /dashboard/tasks
   EXPECTED: Tasks load, 283 tasks visible
3. Navigate to /dashboard/estimates
   EXPECTED: Estimates load, 18 estimates visible
4. Navigate to /dashboard/projects/[any-project]/scope
   EXPECTED: Scope loads without error
```
**Result:** `[ ] PASS` / `[ ] FAIL` - Notes: ___

#### Test 1.3: Profit Margin Calculation (FEB-053)
```
1. Navigate to /dashboard/finances
2. Look at Profit Margin percentage
3. EXPECTED: Shows actual percentage (can be negative)
4. Should NOT show 0.0% if there are expenses
```
**Result:** `[ ] PASS` / `[ ] FAIL` - Notes: ___

#### Test 1.4: Payroll NaN Display (FEB-057)
```
1. Navigate to /dashboard/payroll
2. If payroll runs exist, click to view details
3. EXPECTED: Hours show as numbers (e.g., "40h total")
4. Should NOT show "NaNh total"
```
**Result:** `[ ] PASS` / `[ ] FAIL` - Notes: ___

#### Test 1.5: Operational Reports (#69)
```
1. Navigate to /dashboard/reports/operational
2. EXPECTED: Page loads with data
3. Should NOT show "Failed to load operational data"
4. Verify charts and metrics display
```
**Result:** `[ ] PASS` / `[ ] FAIL` - Notes: ___

#### Test 1.6: Payroll Reports (#76)
```
1. Navigate to /dashboard/reports
2. Find payroll section or detailed reports
3. EXPECTED: Payroll data loads
4. Should NOT show "Failed to load payroll data"
```
**Result:** `[ ] PASS` / `[ ] FAIL` - Notes: ___

---

### Task 2: UI/Layout Verification (After CLI 2 completes)
**Effort:** 2 hours
**Dependency:** Wait for CLI 2 status update

#### Test 2.1: Search Bar Overlap (FEB-001)
```
Test at viewports: 320px, 768px, 1024px, 1440px

1. Open DevTools, set viewport to 320px width
2. Navigate to /dashboard
3. EXPECTED: Search bar and CTA buttons don't overlap
4. Repeat for 768px, 1024px, 1440px
```
**Results:**
- 320px: `[ ] PASS` / `[ ] FAIL`
- 768px: `[ ] PASS` / `[ ] FAIL`
- 1024px: `[ ] PASS` / `[ ] FAIL`
- 1440px: `[ ] PASS` / `[ ] FAIL`

#### Test 2.2: Dashboard Balance (FEB-004, FEB-005)
```
1. Navigate to /dashboard
2. EXPECTED: Active Projects section doesn't dominate
3. EXPECTED: All sections visible without excessive scroll
4. EXPECTED: Card padding is consistent (not too large)
5. Check for "View All" links on truncated lists
```
**Result:** `[ ] PASS` / `[ ] FAIL` - Notes: ___

#### Test 2.3: Sub-Navigation Spacing (FEB-007)
```
1. Check sidebar navigation
2. EXPECTED: Consistent spacing between items
3. EXPECTED: Sub-items clearly indented
4. EXPECTED: Active states consistent
```
**Result:** `[ ] PASS` / `[ ] FAIL` - Notes: ___

#### Test 2.4: Animation Audit (FEB-008, 009, 010, 045)
```
1. Navigate through entire app
2. Check for bouncing icons:
   - Pending Estimates
   - Empty states (folder icons)
   - Daily Logs
3. EXPECTED: No bouncing animations anywhere
4. EXPECTED: Only subtle pulse or spin animations for loading
```
**Result:** `[ ] PASS` / `[ ] FAIL` - Notes: ___

#### Test 2.5: Client Preferences (FEB-029)
```
1. Navigate to /dashboard/projects/[id]/client-preferences
2. EXPECTED: Clean, organized layout
3. EXPECTED: Sections grouped in cards
4. Test on mobile viewport (375px)
5. EXPECTED: Mobile responsive
```
**Result:** `[ ] PASS` / `[ ] FAIL` - Notes: ___

---

### Task 3: Reports & Settings Verification (After CLI 3 completes)
**Effort:** 2 hours
**Dependency:** Wait for CLI 3 status update

#### Test 3.1: Reports Sidebar Navigation (#62)
```
1. Navigate to /dashboard/reports
2. EXPECTED: Sidebar shows report sub-sections
3. Click each section: Overview, Financial, Operational, Detailed
4. EXPECTED: Each section loads correctly
5. EXPECTED: Active state shows current section
```
**Result:** `[ ] PASS` / `[ ] FAIL` - Notes: ___

#### Test 3.2: Fiscal Year Configuration (#79)
```
1. Navigate to /dashboard/settings/organization
2. Find Fiscal Year setting
3. EXPECTED: Can select fiscal year start month
4. Change setting and save
5. Refresh page
6. EXPECTED: Setting persists
```
**Result:** `[ ] PASS` / `[ ] FAIL` - Notes: ___

#### Test 3.3: Payroll Period Configuration (#80)
```
1. Navigate to /dashboard/settings/organization
2. Find Payroll Period settings
3. EXPECTED: Can select frequency (Weekly, Bi-weekly, etc.)
4. EXPECTED: Can set period start day
5. Save and refresh
6. EXPECTED: Settings persist
```
**Result:** `[ ] PASS` / `[ ] FAIL` - Notes: ___

#### Test 3.4: Tax Configuration (#83)
```
1. Navigate to /dashboard/settings/organization
2. Find Tax Configuration section
3. EXPECTED: Can select entity type
4. EXPECTED: Can enter tax rates
5. Save and refresh
6. EXPECTED: Settings persist
```
**Result:** `[ ] PASS` / `[ ] FAIL` - Notes: ___

#### Test 3.5: Reports Demo Data (#63, #64, #65)
```
1. Navigate to /dashboard/reports/financial
2. EXPECTED: Historical data visible (multiple months)
3. Navigate to project profitability section
4. EXPECTED: Labor costs > $0 for active projects
5. Check invoice aging
6. EXPECTED: Mix of current and past-due invoices
```
**Result:** `[ ] PASS` / `[ ] FAIL` - Notes: ___

---

### Task 4: Regression Test Suite
**Effort:** 3 hours

Run complete user journey tests:

#### Test 4.1: Authentication
```
1. If logged out, log in as mike@horizonconstruction.demo
2. EXPECTED: Login succeeds
3. EXPECTED: Redirects to dashboard
```
**Result:** `[ ] PASS` / `[ ] FAIL`

#### Test 4.2: Dashboard
```
1. Navigate to /dashboard
2. EXPECTED: No errors in console
3. EXPECTED: All widgets load
4. EXPECTED: Stats show data
```
**Result:** `[ ] PASS` / `[ ] FAIL`

#### Test 4.3: Projects
```
1. Navigate to /dashboard/projects
2. EXPECTED: 12 demo projects visible
3. Click on a project
4. EXPECTED: Project detail page loads
5. Check each tab: Overview, Finances, Tasks, etc.
6. EXPECTED: All tabs load without error
```
**Result:** `[ ] PASS` / `[ ] FAIL`

#### Test 4.4: Estimates
```
1. Navigate to /dashboard/estimates
2. EXPECTED: 18 estimates visible
3. Click "New Estimate"
4. EXPECTED: Form loads with auto-generated number
5. Fill minimal data and save
6. EXPECTED: Estimate created successfully
```
**Result:** `[ ] PASS` / `[ ] FAIL`

#### Test 4.5: Invoices
```
1. Navigate to /dashboard/invoices
2. EXPECTED: Invoices load
3. Check for variety of statuses (paid, pending, overdue)
```
**Result:** `[ ] PASS` / `[ ] FAIL`

#### Test 4.6: Schedule
```
1. Navigate to /dashboard/schedule
2. EXPECTED: Calendar loads
3. EXPECTED: Events display if seeded
```
**Result:** `[ ] PASS` / `[ ] FAIL`

#### Test 4.7: Time Tracking
```
1. Navigate to /dashboard/time
2. EXPECTED: Time entries visible
3. Check for employee names and hours
```
**Result:** `[ ] PASS` / `[ ] FAIL`

#### Test 4.8: Reports (All Sections)
```
1. /dashboard/reports - Overview loads
2. /dashboard/reports/financial - Financial data loads
3. /dashboard/reports/operational - Operational data loads
4. /dashboard/reports/detailed - Detailed reports load
```
**Result:** `[ ] PASS` / `[ ] FAIL`

---

### Task 5: Mobile Regression (375x812 viewport)
**Effort:** 1 hour

Set DevTools to iPhone viewport (375x812):

```
Test each page:
[ ] Dashboard - loads, no horizontal scroll
[ ] Projects list - cards stack properly
[ ] Project detail - tabs accessible
[ ] Estimates - list readable
[ ] Schedule - calendar usable
[ ] Settings - forms usable
[ ] Bottom navigation works throughout
```

---

## STATUS UPDATES

After each verification phase:
```bash
echo "$(date '+%H:%M') - [Test Name]: [PASS/FAIL] - [notes]" >> .claude-coordination/cli-4-status.txt
```

Example:
```bash
echo "$(date '+%H:%M') - Critical Bug Verification: 6/6 PASS" >> .claude-coordination/cli-4-status.txt
echo "$(date '+%H:%M') - UI Verification: 5/5 PASS" >> .claude-coordination/cli-4-status.txt
```

---

## VERIFICATION COMMANDS

```bash
# Check docker is running
docker ps | grep contractoros

# Check for console errors (view in browser DevTools)
# Open localhost:3000, press F12, check Console tab

# Check docker logs for server errors
docker logs contractoros-web --tail 50
```

---

## FINAL REPORT TEMPLATE

When all testing complete, create summary:

```markdown
# Sprint 37B Test Report

## Critical Bug Verification: X/6 PASS
- FEB-011 Category Filter: PASS/FAIL
- FEB-013 Firebase Permissions: PASS/FAIL
- FEB-053 Profit Margin: PASS/FAIL
- FEB-057 Payroll NaN: PASS/FAIL
- #69 Operational Reports: PASS/FAIL
- #76 Payroll Reports: PASS/FAIL

## UI/Layout Verification: X/5 PASS
- Search Bar Overlap: PASS/FAIL
- Dashboard Balance: PASS/FAIL
- Sub-Nav Spacing: PASS/FAIL
- Animation Audit: PASS/FAIL
- Client Preferences: PASS/FAIL

## Reports/Settings Verification: X/5 PASS
- Reports Sidebar: PASS/FAIL
- Fiscal Year Config: PASS/FAIL
- Payroll Period Config: PASS/FAIL
- Tax Config: PASS/FAIL
- Reports Demo Data: PASS/FAIL

## Regression Tests: X/8 PASS
## Mobile Tests: X/7 PASS

## Issues Found:
1. [Issue description]
2. [Issue description]

## Recommendation: READY FOR MERGE / NEEDS FIXES
```

---

## COMPLETION CHECKLIST

- [ ] Task 1: Critical bugs verified (6/6)
- [ ] Task 2: UI/Layout verified (5/5)
- [ ] Task 3: Reports/Settings verified (5/5)
- [ ] Task 4: Regression complete (8/8)
- [ ] Task 5: Mobile tested (7/7)
- [ ] Final report created
- [ ] Status file updated
- [ ] Notified CLI 1 of results
