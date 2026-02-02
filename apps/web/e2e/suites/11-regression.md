# Suite 11: Regression Tests

Tests to verify previously fixed bugs remain fixed. Run after every deployment.

---

## BUG FIXES FROM SPRINT 2026-01-30

These tests verify the security fixes from the critical bugfix sprint.

---

### TEST: BUG-001 - Client Data Isolation
**Priority:** P0 (Security Critical)
**Original Bug:** Clients could see ALL projects from all clients
**Fixed In:** Sprint 2026-01-30

### Steps
1. Login as Owner
2. Note total project count (should be 5-6 projects)
3. Impersonate Client role
4. Count projects visible on dashboard

### Expected Results
- ✓ Client sees FEWER projects than Owner
- ✓ Only projects where clientId matches user's UID
- ✓ No budget data from other clients visible
- ✓ No client names from other projects visible

### Verification Query
Check that projects query includes: `where('clientId', '==', user.uid)`

---

### TEST: BUG-002 - Client Portal Data Exposure
**Priority:** P0 (Security Critical)
**Original Bug:** Client dashboard showed org-wide team count, budget metrics
**Fixed In:** Sprint 2026-01-30

### Steps
1. Impersonate Client role
2. Examine dashboard stats

### Expected Results
- ✓ Only 2 stats visible: "My Projects", "Project Progress"
- ✓ NO "Outstanding" (financial) stat
- ✓ NO "Overdue Tasks" stat
- ✓ NO "Pending Estimates" stat
- ✓ NO "Budget Used" stat
- ✓ NO "Team" stat (team count)

### Screenshot Required
Capture client dashboard showing limited stats.

---

### TEST: BUG-003 - PM Payroll Access
**Priority:** P0 (Security Critical)
**Original Bug:** Project Managers could view payroll/salary data
**Fixed In:** Sprint 2026-01-30

### Steps
1. Impersonate Project Manager role
2. Navigate to /dashboard/payroll

### Expected Results
- ✓ Access Denied page displayed
- ✓ Message: "Payroll data is restricted to Owner and Finance Manager roles only"
- ✓ Current role displayed: "PROJECT MANAGER"
- ✓ No payroll data visible in any form

### Screenshot Required
Capture access denied screen for PM.

---

### TEST: BUG-004 - PM Settings Access
**Priority:** P1
**Original Bug:** PM could modify organization settings
**Fixed In:** Sprint 2026-01-30

### Steps
1. Impersonate Project Manager
2. Navigate to /dashboard/settings
3. Check available tabs

### Expected Results
- ✓ Settings loads (PM has canViewSettings)
- ✓ Organization settings restricted
- ✓ Cannot modify billing
- ✓ Cannot modify roles/permissions

---

### TEST: BUG-005 - Employee Admin Buttons Hidden
**Priority:** P1 (UI Security)
**Original Bug:** Employees saw "New Project", "New Estimate", "Create Invoice" buttons
**Fixed In:** Sprint 2026-01-30

### Steps
1. Impersonate Employee role
2. Navigate to /dashboard
3. Examine header and Quick Actions area

### Expected Results
- ✓ NO "New Project" button in header
- ✓ NO "New Estimate" button in header
- ✓ NO Quick Actions card visible
- ✓ NO "Create Invoice" anywhere

### Screenshot Required
Capture employee dashboard showing no admin buttons.

---

### TEST: BUG-006 - Contractor Admin Buttons Hidden
**Priority:** P1 (UI Security)
**Original Bug:** Same as BUG-005 for Contractor role
**Fixed In:** Sprint 2026-01-30

### Steps
1. Impersonate Contractor role
2. Navigate to /dashboard
3. Examine header and Quick Actions area

### Expected Results
- ✓ Same as Employee: no admin buttons visible

---

### TEST: BUG-007 - Wrong Role in Error Messages
**Priority:** P2
**Original Bug:** Access denied showed "OWNER" when impersonating Employee
**Fixed In:** Sprint 2026-01-30

### Steps
1. Impersonate Employee
2. Navigate to /dashboard/settings (to trigger access denied)
3. Check role displayed in error message

### Expected Results
- ✓ Shows "Your current role: EMPLOYEE"
- ✓ NOT "Your current role: OWNER"
- ✓ "(Demo Mode)" indicator visible

---

### TEST: BUG-008 - Firebase Permission Errors
**Priority:** P1
**Original Bug:** Console showed permission-denied errors for valid queries
**Fixed In:** Sprint 2026-01-30

### Steps
1. Login as Owner
2. Open browser console
3. Navigate through app (dashboard, projects, clients)
4. Check for permission errors

### Expected Results
- ✓ No "permission-denied" errors in console
- ✓ No "Missing or insufficient permissions" errors
- ✓ No "requires an index" errors
- ✓ All Firestore queries succeed

---

## HISTORICAL BUG REGRESSIONS

Add tests here for any bugs that resurface.

---

### TEST: REG-001 - [Template]
**Priority:** P[X]
**Original Bug:** [Description]
**Originally Fixed:** [Date]
**Regressed:** [Date if applicable]

### Steps
1. [Step]
2. [Step]

### Expected Results
- ✓ [Result]

---

## Regression Test Summary

```
REGRESSION TEST RESULTS
=======================
BUG-001 Client Isolation:     [PASS/FAIL] ⚠️ CRITICAL
BUG-002 Client Data Exposure: [PASS/FAIL] ⚠️ CRITICAL
BUG-003 PM Payroll:           [PASS/FAIL] ⚠️ CRITICAL
BUG-004 PM Settings:          [PASS/FAIL]
BUG-005 Employee Buttons:     [PASS/FAIL]
BUG-006 Contractor Buttons:   [PASS/FAIL]
BUG-007 Role in Errors:       [PASS/FAIL]
BUG-008 Firebase Permissions: [PASS/FAIL]

Overall: [X/8 PASSED]
Critical: [X/3 PASSED]
```

## Automated Regression Check

For CI/CD, run this quick command:
```
"Run regression tests from e2e/suites/11-regression.md.
Report any failures immediately.
Take screenshots of all critical test results."
```

## When to Run Regression Suite

- ✅ After every deployment to production
- ✅ After any security-related code changes
- ✅ After changes to authentication/authorization
- ✅ After changes to Firestore rules
- ✅ Before any major release
- ✅ Weekly scheduled run (catch any sneaky regressions)
