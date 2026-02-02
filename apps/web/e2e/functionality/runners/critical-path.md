# Critical Path Test Runner

## Overview

This runner tests the MOST IMPORTANT functionality paths in the application. These are the flows that absolutely MUST work for the application to be usable. Use this for quick verification or as a gate before deployments.

**Estimated Duration:** 15-20 minutes
**Priority:** P0 Critical Only

---

## Critical Path Definition

A critical path is a user flow that:
1. Is used by 80%+ of users
2. Cannot have a workaround if broken
3. Involves security or financial operations
4. Blocks other functionality if broken

---

## Critical Path Tests

### CP-01: Application Health Check
**Priority:** BLOCKER
**Estimated Time:** 2 minutes

```
CRITICAL PATH: Application Loads

1. Navigate to http://localhost:3000
2. VERIFY: Page loads within 5 seconds
3. VERIFY: No blank white screen
4. VERIFY: No JavaScript errors in console
5. Take screenshot

Expected: Login page or dashboard appears with no errors

CONSOLE CHECK:
- [ ] No TypeError
- [ ] No ReferenceError
- [ ] No React errors
- [ ] No Network failures

If this fails: STOP ALL TESTING - critical infrastructure issue
```

### CP-02: User Login
**Priority:** BLOCKER
**Estimated Time:** 2 minutes

```
CRITICAL PATH: User Can Login

1. Navigate to login page
2. Enter valid credentials (owner@test.contractoros.com)
3. Click Login button
4. WAIT: Up to 10 seconds for redirect
5. VERIFY: Redirected to /dashboard
6. VERIFY: User name appears in header/sidebar
7. VERIFY: No error toasts

Expected: User logged in and viewing dashboard

CONSOLE CHECK:
- [ ] No authentication errors
- [ ] No Firebase errors
- [ ] No permission denied errors

If this fails: STOP - cannot test any authenticated features
```

### CP-03: Dashboard Renders Correctly
**Priority:** CRITICAL
**Estimated Time:** 2 minutes

```
CRITICAL PATH: Dashboard Shows Data

1. Login as OWNER
2. Navigate to /dashboard
3. VERIFY: Stats cards load (not showing skeleton/loading forever)
4. VERIFY: Project list loads (or "no projects" message)
5. VERIFY: Activity feed loads
6. VERIFY: Navigation sidebar/header is functional
7. Take screenshot

Expected: Dashboard fully rendered with data

CONSOLE CHECK:
- [ ] No Firestore permission errors
- [ ] No "undefined" property access errors
- [ ] No infinite loading states
```

### CP-04: Create Project Flow
**Priority:** CRITICAL
**Estimated Time:** 3 minutes

```
CRITICAL PATH: Create New Project

1. Login as OWNER
2. Click "New Project" button
3. VERIFY: Modal/form opens
4. Fill in required fields:
   - Name: "Critical Path Test Project"
   - Client: Select existing or create
   - Address: "123 Test St"
5. Click Create/Save
6. VERIFY: Success toast appears
7. VERIFY: Redirected to project detail OR project appears in list
8. Navigate to /dashboard/projects
9. VERIFY: New project appears in list

Expected: Project created and visible

CONSOLE CHECK:
- [ ] No Firestore write errors
- [ ] No validation errors in console
```

### CP-05: View and Edit Project
**Priority:** CRITICAL
**Estimated Time:** 2 minutes

```
CRITICAL PATH: View and Edit Existing Project

1. Navigate to /dashboard/projects
2. Click on a project to view details
3. VERIFY: Project detail page loads
4. VERIFY: Project name, client, status visible
5. Click Edit button
6. VERIFY: Edit form opens with existing data
7. Change project name to "[Original] - Edited"
8. Save changes
9. VERIFY: Success toast appears
10. VERIFY: Name updated on page

Expected: Project editable and changes persist

CONSOLE CHECK:
- [ ] No Firestore update errors
- [ ] No state management errors
```

### CP-06: Create and Manage Client
**Priority:** CRITICAL
**Estimated Time:** 3 minutes

```
CRITICAL PATH: Client CRUD

1. Navigate to /dashboard/clients
2. VERIFY: Client list loads
3. Click "Add Client" button
4. Fill in:
   - Name: "Critical Path Test Client"
   - Email: "cptest@example.com"
   - Phone: "555-0199"
5. Save client
6. VERIFY: Success toast
7. VERIFY: Client appears in list
8. Click client to view details
9. VERIFY: Detail page shows correct info
10. Edit client (change phone)
11. VERIFY: Changes saved

Expected: Client created, viewable, and editable

CONSOLE CHECK:
- [ ] No CRM-related errors
```

### CP-07: User Role Access Control
**Priority:** BLOCKER (Security Critical)
**Estimated Time:** 5 minutes

```
CRITICAL PATH: RBAC Enforcement

Test 1: PM Cannot Access Payroll
1. Login as PM user
2. Navigate to /dashboard/payroll
3. VERIFY: Access denied OR redirect to dashboard
4. VERIFY: Payroll link NOT visible in navigation

Test 2: Client Only Sees Own Projects
1. Login as CLIENT user
2. Navigate to /dashboard/projects
3. VERIFY: Only projects with matching clientId visible
4. VERIFY: Cannot see other clients' data
5. Try navigating to another client's project URL
6. VERIFY: Access denied or 404

Test 3: Employee Hidden Admin Features
1. Login as EMPLOYEE
2. Navigate to /dashboard
3. VERIFY: "New Project" button NOT visible
4. VERIFY: "Create Estimate" button NOT visible
5. VERIFY: Settings has limited options

Expected: Each role sees only permitted content

CONSOLE CHECK:
- [ ] No permission bypass attempts logged
- [ ] Proper Firestore rule enforcement

If this fails: SECURITY ISSUE - escalate immediately
```

### CP-08: Invoice Creation
**Priority:** CRITICAL
**Estimated Time:** 3 minutes

```
CRITICAL PATH: Create Invoice

1. Login as OWNER or FINANCE
2. Navigate to /dashboard/invoices
3. Click "New Invoice" button
4. Fill in:
   - Select project
   - Add line item
   - Set amount
5. Save as draft
6. VERIFY: Invoice appears in list with "draft" status
7. Open invoice
8. Click "Send"
9. VERIFY: Status changes to "sent"

Expected: Invoice created and sendable

CONSOLE CHECK:
- [ ] No calculation errors
- [ ] No PDF generation errors
```

### CP-09: Time Entry and Tracking
**Priority:** CRITICAL
**Estimated Time:** 2 minutes

```
CRITICAL PATH: Log Time

1. Login as EMPLOYEE
2. Navigate to time tracking page
3. Select project
4. Enter hours worked
5. Add description
6. Submit time entry
7. VERIFY: Entry appears in list
8. VERIFY: Total hours calculated correctly

Expected: Time trackable and saved

CONSOLE CHECK:
- [ ] No calculation errors
- [ ] No date/time parsing errors
```

### CP-10: Logout Functionality
**Priority:** CRITICAL
**Estimated Time:** 1 minute

```
CRITICAL PATH: User Can Logout

1. From any authenticated page
2. Click user menu/profile
3. Click Logout
4. VERIFY: Redirected to login page
5. VERIFY: Session cleared
6. Try navigating to /dashboard
7. VERIFY: Redirected back to login

Expected: Complete session termination

CONSOLE CHECK:
- [ ] No Firebase session errors
- [ ] No auth state errors
```

---

## Critical Path Summary Checklist

Run and check off each:

```
[ ] CP-01: Application Health Check
[ ] CP-02: User Login
[ ] CP-03: Dashboard Renders
[ ] CP-04: Create Project
[ ] CP-05: View/Edit Project
[ ] CP-06: Client CRUD
[ ] CP-07: RBAC Enforcement (3 tests)
[ ] CP-08: Invoice Creation
[ ] CP-09: Time Entry
[ ] CP-10: Logout
```

**Total Tests:** 13
**All Must Pass:** Yes

---

## Pass/Fail Criteria

### PASS
- All 13 critical path tests pass
- Zero BLOCKER console errors
- Zero security-related failures

### CONDITIONAL PASS
- 12/13 tests pass
- Failed test is P1 not P0
- Clear workaround exists
- Issue logged for immediate fix

### FAIL
- Any BLOCKER (CP-01, CP-02, CP-07) fails
- More than 1 test fails
- Security violation detected
- Console shows unhandled exceptions

---

## Quick Command

```
Run critical path tests from apps/web/e2e/functionality/runners/critical-path.md

Execute all 13 tests in order. Stop immediately if CP-01, CP-02, or CP-07 fails.
Report pass/fail for each test with console error summary.
```

---

## Result Recording

```
# Critical Path Test Results

Date: ___
Time: ___
Tester: ___
Environment: ___

## Results
| Test | Status | Console Errors | Notes |
|------|--------|----------------|-------|
| CP-01 | PASS/FAIL | 0 | |
| CP-02 | PASS/FAIL | 0 | |
| CP-03 | PASS/FAIL | 0 | |
| CP-04 | PASS/FAIL | 0 | |
| CP-05 | PASS/FAIL | 0 | |
| CP-06 | PASS/FAIL | 0 | |
| CP-07a | PASS/FAIL | 0 | |
| CP-07b | PASS/FAIL | 0 | |
| CP-07c | PASS/FAIL | 0 | |
| CP-08 | PASS/FAIL | 0 | |
| CP-09 | PASS/FAIL | 0 | |
| CP-10 | PASS/FAIL | 0 | |

## Overall: PASS / CONDITIONAL / FAIL

## Console Errors Found:
-

## Blockers for Release:
-
```
