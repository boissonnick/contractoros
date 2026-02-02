# Suite 02: Role-Based Access Control (RBAC) Tests

## Overview

**SECURITY CRITICAL** - Tests verify that role-based permissions are enforced correctly. These tests protect against unauthorized access and data leakage.

**Priority:** P0 (BLOCKER - Security)
**Estimated Time:** 25 minutes
**Prerequisite:** Auth tests passed

---

## Role Permission Matrix

| Feature | OWNER | PM | FINANCE | EMPLOYEE | CONTRACTOR | CLIENT |
|---------|-------|-----|---------|----------|------------|--------|
| All Projects | YES | YES | view | assigned | assigned | own |
| Create Project | YES | YES | NO | NO | NO | NO |
| Client Data | YES | YES | NO | NO | NO | own |
| Payroll | YES | NO | YES | NO | NO | NO |
| Invoices | YES | YES | YES | NO | NO | own |
| Team Management | YES | YES | NO | NO | NO | NO |
| Settings/Org | YES | NO | NO | NO | NO | NO |

---

## Test Cases

### RBAC-001: Owner Full Access Verification
**Priority:** CRITICAL
**Expected:** Owner can access all features

```
STEPS:
1. Login as OWNER
2. Navigate to each section and verify access

VERIFY ACCESS TO:
[ ] /dashboard
[ ] /dashboard/projects
[ ] /dashboard/projects/new
[ ] /dashboard/clients
[ ] /dashboard/team (or /dashboard/settings/team)
[ ] /dashboard/payroll
[ ] /dashboard/invoices
[ ] /dashboard/expenses
[ ] /dashboard/settings
[ ] /dashboard/settings/organization
[ ] /dashboard/settings/roles

ALL UI ELEMENTS:
[ ] "New Project" button visible
[ ] "Add Client" button visible
[ ] "Create Invoice" visible
[ ] Team/Invite buttons visible
[ ] Payroll section accessible

CONSOLE CHECK:
[ ] No permission denied errors
[ ] No unauthorized access attempts logged

RESULT: PASS / FAIL
INACCESSIBLE AREAS: ___
```

### RBAC-002: PM Payroll Restriction
**Priority:** BLOCKER (Security)
**Expected:** PM cannot access payroll

```
STEPS:
1. Login as PM user
2. Check navigation for payroll link
3. Try direct navigation to /dashboard/payroll
4. Observe behavior

VERIFY:
[ ] Payroll link NOT visible in navigation
[ ] Direct URL access shows "Access Denied" or redirects
[ ] No payroll data visible in any form
[ ] Cannot access /dashboard/settings/payroll

UI CHECK:
[ ] No payroll stats on dashboard
[ ] No payroll-related buttons/actions

CONSOLE CHECK:
[ ] No payroll data fetched
[ ] Permission check logged (if applicable)

RESULT: PASS / FAIL
SECURITY ISSUE IF FAIL: YES
```

### RBAC-003: PM Project Access
**Priority:** CRITICAL
**Expected:** PM can manage projects

```
STEPS:
1. Login as PM
2. Navigate to /dashboard/projects

VERIFY PM CAN:
[ ] View all projects
[ ] Create new project
[ ] Edit existing project
[ ] Assign tasks
[ ] Manage project team
[ ] Create estimates

VERIFY PM CANNOT:
[ ] Access payroll (confirmed in RBAC-002)
[ ] Modify organization settings
[ ] Change user roles

CONSOLE CHECK:
[ ] No unauthorized access errors

RESULT: PASS / FAIL
```

### RBAC-004: Employee Limited Access
**Priority:** BLOCKER (Security)
**Expected:** Employee sees only assigned work

```
STEPS:
1. Login as EMPLOYEE
2. Navigate to /dashboard

VERIFY HIDDEN UI ELEMENTS:
[ ] "New Project" button NOT visible
[ ] "Create Estimate" NOT visible
[ ] "Add Client" NOT visible
[ ] Team management NOT accessible
[ ] Settings limited (only personal settings)

VERIFY VISIBLE:
[ ] Own assigned tasks
[ ] Time tracking for own work
[ ] Own profile settings

TRY DIRECT URL ACCESS:
[ ] /dashboard/projects/new → Access denied or redirect
[ ] /dashboard/clients → Limited or denied
[ ] /dashboard/payroll → Access denied
[ ] /dashboard/settings/team → Access denied

CONSOLE CHECK:
[ ] No admin data fetched
[ ] Permission checks working

RESULT: PASS / FAIL
SECURITY ISSUES: ___
```

### RBAC-005: Contractor Minimal Access
**Priority:** BLOCKER (Security)
**Expected:** Contractor has minimal permissions

```
STEPS:
1. Login as CONTRACTOR
2. Navigate to dashboard

VERIFY ACCESS:
[ ] Can see assigned projects/work only
[ ] Can submit own time entries
[ ] Can view own bids

VERIFY RESTRICTED:
[ ] NO access to client data
[ ] NO access to financial data
[ ] NO admin buttons visible
[ ] NO team management
[ ] NO project creation
[ ] NO estimate creation

TRY URL ACCESS:
[ ] /dashboard/clients → Denied
[ ] /dashboard/invoices → Denied
[ ] /dashboard/payroll → Denied
[ ] /dashboard/settings/team → Denied

CONSOLE CHECK:
[ ] No unauthorized data visible
[ ] Clean permission denials

RESULT: PASS / FAIL
```

### RBAC-006: Client Portal Isolation (CRITICAL SECURITY)
**Priority:** BLOCKER (Security Critical)
**Expected:** Client sees ONLY their own projects

```
STEPS:
1. Login as CLIENT user (client@test.contractoros.com)
2. Note the client's clientId

VERIFY DATA ISOLATION:
[ ] Can only see projects where clientId matches
[ ] Cannot see other clients' projects
[ ] Cannot see other clients' names
[ ] Cannot see team member details
[ ] Cannot see financial summaries

ATTEMPT DATA ACCESS:
[ ] Navigate to /dashboard/projects
[ ] Count visible projects - should ONLY be client's own
[ ] Try accessing another project's URL directly
[ ] Should get 404 or Access Denied

VERIFY HIDDEN:
[ ] Other client data
[ ] Team salary/payroll info
[ ] Business financials
[ ] Internal notes

CONSOLE CHECK:
[ ] Firestore queries filtered by clientId
[ ] No other client data in responses

RESULT: PASS / FAIL
SECURITY VULNERABILITY IF FAIL: CRITICAL
```

### RBAC-007: Cross-Organization Isolation
**Priority:** BLOCKER (Security Critical)
**Expected:** Users cannot access other organization's data

```
STEPS:
1. Login as user from Organization 1
2. Note all visible project IDs
3. Try accessing a project from Organization 2 directly

IF TEST DATA AVAILABLE:
1. Get project ID from Org 2 (from test data or DB)
2. Try navigating to /dashboard/projects/[org2-project-id]
3. Observe behavior

VERIFY:
[ ] Cannot see any data from other organization
[ ] Direct URL access returns 404 or Access Denied
[ ] No org 2 data in API responses
[ ] Firestore queries filtered by orgId

CONSOLE CHECK:
[ ] Queries include orgId filter
[ ] No cross-org data fetched

RESULT: PASS / FAIL
SECURITY VULNERABILITY IF FAIL: CRITICAL
```

### RBAC-008: Finance Role Access
**Priority:** CRITICAL
**Expected:** Finance can access financial features only

```
STEPS:
1. Login as FINANCE user

VERIFY CAN ACCESS:
[ ] /dashboard (with financial view)
[ ] /dashboard/invoices
[ ] /dashboard/expenses
[ ] /dashboard/payroll
[ ] Financial reports

VERIFY CANNOT ACCESS:
[ ] /dashboard/projects/new (create)
[ ] /dashboard/settings/team
[ ] /dashboard/settings/roles
[ ] Role assignment features

CONSOLE CHECK:
[ ] Only financial data fetched
[ ] No project/team management permissions

RESULT: PASS / FAIL
```

### RBAC-009: Role Switch During Session
**Priority:** MAJOR
**Expected:** Role changes take effect immediately

```
STEPS:
1. Login as OWNER
2. Have admin change user's role (if testable)
3. OR use impersonation feature if available
4. Verify permissions update

IF IMPERSONATION AVAILABLE:
1. As Owner, switch to PM role view
2. VERIFY: Payroll no longer accessible
3. Switch to Employee role
4. VERIFY: Admin buttons hidden
5. Switch back to Owner
6. VERIFY: Full access restored

CONSOLE CHECK:
[ ] Clean role transitions
[ ] No stale permissions cached

RESULT: PASS / FAIL
```

### RBAC-010: API Permission Enforcement
**Priority:** BLOCKER (Security)
**Expected:** Backend enforces permissions (not just UI hiding)

```
This test verifies Firestore rules enforce permissions, not just UI.

STEPS:
1. Login as EMPLOYEE
2. Open browser DevTools → Console
3. Attempt to access restricted data via console

IF POSSIBLE:
- Check Network tab for Firestore queries
- Verify queries return only permitted data
- No "other user" or "other client" data in responses

FIRESTORE RULE CHECK:
[ ] Queries filtered by orgId
[ ] Client queries filtered by clientId
[ ] Write operations check user role

RESULT: PASS / FAIL
BACKEND SECURITY: ___
```

---

## RBAC Test Summary

```
| Test ID | Test Name | Status | Security Issue |
|---------|-----------|--------|----------------|
| RBAC-001 | Owner Full Access | | |
| RBAC-002 | PM Payroll Denied | | |
| RBAC-003 | PM Project Access | | |
| RBAC-004 | Employee Limited | | |
| RBAC-005 | Contractor Minimal | | |
| RBAC-006 | Client Isolation | | |
| RBAC-007 | Cross-Org Isolation | | |
| RBAC-008 | Finance Role | | |
| RBAC-009 | Role Switch | | |
| RBAC-010 | API Enforcement | | |

TOTAL: 10 tests
PASSED: ___
FAILED: ___
SECURITY ISSUES: ___
```

## Security Issue Severity

| Issue | Severity | Description |
|-------|----------|-------------|
| Client data leak | CRITICAL | Clients can see other clients' data |
| Cross-org access | CRITICAL | Users can access other org data |
| Payroll leak | HIGH | Non-finance roles see payroll data |
| Admin button visible | MEDIUM | UI shows buttons but action blocked |
| Stale permissions | MEDIUM | Role change not reflected |

## Pass Criteria

- **PASS:** All tests pass, especially RBAC-002, 006, 007, 010
- **FAIL:** Any security-critical test fails
- **STOP RELEASE:** If RBAC-006 or RBAC-007 fails

## Next Suite

If RBAC tests pass:
→ Proceed to Suite 03: Projects

If failed (security issue):
→ STOP ALL TESTING
→ Escalate to security team
→ Fix before any deployment
