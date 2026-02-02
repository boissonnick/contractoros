# Full Regression Test Runner

## Overview

This runner executes ALL functionality tests across every module. Use this before major releases or after significant code changes.

**Estimated Duration:** 2-3 hours
**Priority:** All tests (P0, P1, P2)

---

## Pre-Test Setup

### 1. Environment Verification
```
Before starting tests, verify:
1. Navigate to http://localhost:3000
2. VERIFY: Page loads without errors
3. Check browser console - should be empty or minimal warnings only
4. VERIFY: Login page or dashboard appears
```

### 2. Console Monitoring Initialization
```
Initialize console monitoring:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Clear all messages
4. Enable all log levels (Errors, Warnings, Info)
5. Set "Preserve log" to ON
```

### 3. Network Monitoring
```
Enable network monitoring:
1. Go to Network tab
2. Clear requests
3. Set "Preserve log" to ON
4. Note: Watch for failed requests (red entries)
```

---

## Test Execution Order

Execute suites in this order. Each suite must pass before proceeding.

### Phase 1: Critical Foundation (P0)

#### Suite 00: Smoke Tests
```
Run smoke tests from apps/web/e2e/functionality/suites/00-smoke/smoke-tests.md

These tests verify basic application health:
- App loads successfully
- Login page accessible
- Dashboard renders
- Navigation works
- No critical console errors
```

#### Suite 01: Authentication
```
Run auth tests from apps/web/e2e/functionality/suites/01-auth/auth-tests.md

These tests verify authentication:
- Login with valid credentials
- Login failure with invalid credentials
- Session persistence
- Logout functionality
- Password reset flow (if testable)
```

#### Suite 02: RBAC (Role-Based Access Control)
```
Run RBAC tests from apps/web/e2e/functionality/suites/02-rbac/rbac-tests.md

CRITICAL security tests:
- Owner can access all features
- PM cannot access payroll
- Employee sees only assigned work
- Contractor has minimal access
- Client sees only their projects
- Cross-org data isolation
```

### Phase 2: Core Features (P1)

#### Suite 03: Projects
```
Run project tests from apps/web/e2e/functionality/suites/03-projects/project-tests.md

Test all project operations:
- Create new project
- Edit project details
- View project list with filters
- Project phases management
- Scope of work
- Archive/unarchive project
```

#### Suite 04: Clients
```
Run client tests from apps/web/e2e/functionality/suites/04-clients/client-tests.md

Test client CRM:
- Create new client
- Edit client details
- View client list with filters
- Client notes
- Communication logs
- Client status changes
```

#### Suite 05: Tasks
```
Run task tests from apps/web/e2e/functionality/suites/05-tasks/task-tests.md

Test task management:
- Create task
- Assign task to user
- Update task status
- Add comments
- Complete/archive task
- Task views (list, kanban, gantt)
```

#### Suite 06: Team Management
```
Run team tests from apps/web/e2e/functionality/suites/06-team/team-tests.md

Test team operations:
- Send invitation
- View team members
- Change member role
- Deactivate member
- Permission verification per role
```

#### Suite 07: Financial Operations
```
Run finance tests from apps/web/e2e/functionality/suites/07-finances/finance-tests.md

Test financial features:
- Create invoice
- Edit invoice
- Send invoice
- Submit expense
- Approve/reject expense
- Payroll run creation
- Payment tracking
```

#### Suite 08: Scheduling
```
Run scheduling tests from apps/web/e2e/functionality/suites/08-scheduling/scheduling-tests.md

Test calendar and time:
- Create schedule event
- Assign crew to event
- Clock in/out (time entry)
- Submit timesheet
- Approve timesheet
- Availability management
```

#### Suite 09: Documents
```
Run document tests from apps/web/e2e/functionality/suites/09-documents/document-tests.md

Test document management:
- Create estimate
- Add line items
- Send for signature
- Sign document
- Create change order
- Manage SOW templates
```

#### Suite 12: Portal Access
```
Run portal tests from apps/web/e2e/functionality/suites/12-portals/portal-tests.md

Test alternate portals:
- Client portal access
- Client can view their projects
- Subcontractor portal
- Field worker portal
- Portal-specific features
```

### Phase 3: Secondary Features (P2)

#### Suite 10: Materials & Tools
```
Run materials tests from apps/web/e2e/functionality/suites/10-materials/materials-tests.md

Test inventory:
- Add material
- Track inventory
- Create purchase order
- Tool checkout/return
```

#### Suite 11: Settings
```
Run settings tests from apps/web/e2e/functionality/suites/11-settings/settings-tests.md

Test configuration:
- Update profile
- Organization settings
- Notification preferences
- Template management
```

---

## Post-Test Analysis

### 1. Collect Console Errors
```
After all tests complete:
1. Review Console tab for all errors
2. Copy/export console log
3. Categorize errors:
   - JavaScript exceptions
   - React errors
   - Network failures
   - Firebase errors
   - Warning messages
```

### 2. Collect Network Failures
```
Review Network tab:
1. Filter by failed requests (status 4xx, 5xx)
2. Note:
   - Request URL
   - HTTP status
   - Response body (if error message)
   - Request payload
```

### 3. Generate Report
```
Create regression report with:
1. Total tests run
2. Tests passed
3. Tests failed
4. Tests skipped
5. Console errors found
6. Network errors found
7. Screenshots of failures
8. Recommended bug fixes
```

---

## Result Recording Template

### Summary
```
Date: [YYYY-MM-DD]
Tester: [Name]
Environment: [localhost:3000 / staging / production]
Duration: [X hours Y minutes]

Results:
- Total Tests: ___
- Passed: ___
- Failed: ___
- Skipped: ___
- Error Rate: ___%

Console Errors: ___
Network Failures: ___
```

### Failed Tests
```
| Test ID | Test Name | Failure Reason | Severity | Screenshot |
|---------|-----------|----------------|----------|------------|
| | | | | |
```

### Console Errors
```
| Error Type | Message | Frequency | Trigger | Severity |
|------------|---------|-----------|---------|----------|
| | | | | |
```

### Recommended Actions
```
Priority 1 (Fix Immediately):
1.

Priority 2 (Fix Before Release):
1.

Priority 3 (Fix Next Sprint):
1.
```

---

## Regression Tracking

After running full regression, update the sprint tracking log:

```json
{
  "run": {
    "date": "2026-01-30",
    "type": "full-regression",
    "sprint": 14,
    "environment": "localhost",
    "results": {
      "total": 150,
      "passed": 142,
      "failed": 8,
      "skipped": 0
    },
    "errors": {
      "console": 5,
      "network": 2
    },
    "issues": ["PROJ-001", "AUTH-003", "PAY-001"]
  }
}
```

---

## Abort Criteria

Stop testing and escalate if:
- 3+ consecutive suite failures
- Critical console errors (TypeError, ReferenceError) in core flows
- Authentication completely broken
- Database connection failures
- More than 20% of P0 tests failing
