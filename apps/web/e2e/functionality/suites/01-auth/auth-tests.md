# Suite 01: Authentication Tests

## Overview

Tests all authentication flows including login, logout, session management, and error handling.

**Priority:** P0 (BLOCKER)
**Estimated Time:** 15 minutes
**Prerequisite:** Smoke tests passed

---

## Test Accounts

| Role | Email | Notes |
|------|-------|-------|
| Owner | owner@test.contractoros.com | Full access |
| PM | pm@test.contractoros.com | No payroll |
| Employee | employee@test.contractoros.com | Limited access |
| Client | client@test.contractoros.com | Own projects only |

---

## Test Cases

### AUTH-001: Login with Valid Credentials
**Priority:** BLOCKER
**Expected:** Successful login and redirect

```
STEPS:
1. Navigate to login page (logout if needed)
2. Enter email: owner@test.contractoros.com
3. Enter valid password
4. Click Login button
5. Wait for response

VERIFY:
[ ] No error message displayed
[ ] Loading state shown during request
[ ] Redirect to /dashboard occurs
[ ] User info visible (name in header/sidebar)
[ ] Success toast or confirmation (if applicable)

CONSOLE CHECK:
[ ] No Firebase auth errors
[ ] No permission errors
[ ] Auth token received (check network tab)

TIMING:
- Login request time: ___ ms
- Redirect time: ___ ms

RESULT: PASS / FAIL
NOTES: ___
```

### AUTH-002: Login with Invalid Password
**Priority:** CRITICAL
**Expected:** Appropriate error message, no crash

```
STEPS:
1. Navigate to login page
2. Enter email: owner@test.contractoros.com
3. Enter WRONG password: "wrongpassword123"
4. Click Login button

VERIFY:
[ ] Error message displayed (not generic "error")
[ ] Error is user-friendly (not stack trace)
[ ] Form remains functional
[ ] Can retry with correct password
[ ] No redirect occurred

CONSOLE CHECK:
[ ] Auth error logged (expected)
[ ] No unhandled exceptions
[ ] Error is caught and displayed

RESULT: PASS / FAIL
ERROR MESSAGE SHOWN: ___
```

### AUTH-003: Login with Invalid Email
**Priority:** CRITICAL
**Expected:** Appropriate error message

```
STEPS:
1. Navigate to login page
2. Enter email: nonexistent@test.com
3. Enter any password
4. Click Login button

VERIFY:
[ ] Error message displayed
[ ] Message indicates user not found (or generic for security)
[ ] No crash or blank screen
[ ] Form still functional

CONSOLE CHECK:
[ ] Expected auth error only
[ ] No sensitive info leaked

RESULT: PASS / FAIL
ERROR MESSAGE SHOWN: ___
```

### AUTH-004: Login with Empty Fields
**Priority:** MAJOR
**Expected:** Form validation prevents submission

```
STEPS:
1. Navigate to login page
2. Leave email empty
3. Leave password empty
4. Click Login button

VERIFY:
[ ] Form validation triggers
[ ] Validation message shown
[ ] No API request made (check network)
[ ] Required fields highlighted

REPEAT WITH:
- Email only (no password): [ ] Validation works
- Password only (no email): [ ] Validation works

RESULT: PASS / FAIL
VALIDATION MESSAGES: ___
```

### AUTH-005: Logout Functionality
**Priority:** CRITICAL
**Expected:** Complete session termination

```
STEPS:
1. Login as any user
2. Confirm on dashboard
3. Find logout button/link
4. Click logout
5. Wait for redirect

VERIFY:
[ ] Redirected to login page
[ ] Session token cleared
[ ] Cannot navigate to /dashboard (redirects to login)
[ ] Browser back button doesn't restore session

CONSOLE CHECK:
[ ] Clean logout (no errors)
[ ] Auth state properly cleared

RESULT: PASS / FAIL
```

### AUTH-006: Session Persistence (Page Refresh)
**Priority:** CRITICAL
**Expected:** Session survives page refresh

```
STEPS:
1. Login as owner
2. Navigate to /dashboard
3. Refresh browser (F5 or Cmd+R)
4. Wait for page load

VERIFY:
[ ] Still logged in after refresh
[ ] Dashboard loads with user data
[ ] No re-login required
[ ] User identity still visible

CONSOLE CHECK:
[ ] Session token reused
[ ] No auth errors on refresh

RESULT: PASS / FAIL
```

### AUTH-007: Session Persistence (New Tab)
**Priority:** MAJOR
**Expected:** Session shared across tabs

```
STEPS:
1. Login in Tab 1
2. Open new tab (Tab 2)
3. Navigate to http://localhost:3000/dashboard in Tab 2

VERIFY:
[ ] Tab 2 is authenticated
[ ] No login required in Tab 2
[ ] Same user identity in both tabs

RESULT: PASS / FAIL
```

### AUTH-008: Protected Route Guard (Unauthenticated)
**Priority:** CRITICAL
**Expected:** Cannot access protected routes without auth

```
STEPS:
1. Logout completely
2. Clear any session storage (optional but recommended)
3. Navigate directly to: http://localhost:3000/dashboard
4. Observe behavior

VERIFY:
[ ] Redirected to login page
[ ] No dashboard content flashes
[ ] No protected data visible

REPEAT FOR:
[ ] /dashboard/projects
[ ] /dashboard/clients
[ ] /dashboard/settings

CONSOLE CHECK:
[ ] No unauthorized data fetches
[ ] Clean redirect (no errors)

RESULT: PASS / FAIL
ROUTES TESTED: ___
```

### AUTH-009: Login from Different Routes
**Priority:** MAJOR
**Expected:** Login redirects to intended page

```
STEPS:
1. Logout
2. Try to access /dashboard/projects (will redirect to login)
3. Login
4. Check redirect destination

VERIFY:
[ ] After login, redirected to /dashboard/projects (or dashboard)
[ ] Not stuck on login page
[ ] Smooth transition

CONSOLE CHECK:
[ ] No redirect loops
[ ] Single redirect (not multiple)

RESULT: PASS / FAIL
```

### AUTH-010: Login for Each Role
**Priority:** CRITICAL
**Expected:** All roles can authenticate

```
Test each role can login successfully:

OWNER:
[ ] Login successful
[ ] Dashboard accessible
[ ] Console errors: ___

PM:
[ ] Login successful
[ ] Dashboard accessible
[ ] Console errors: ___

FINANCE:
[ ] Login successful
[ ] Dashboard accessible
[ ] Console errors: ___

EMPLOYEE:
[ ] Login successful
[ ] Dashboard accessible
[ ] Console errors: ___

CLIENT:
[ ] Login successful
[ ] Client portal accessible
[ ] Console errors: ___

RESULT: PASS / FAIL
ROLES FAILED: ___
```

### AUTH-011: Concurrent Session Behavior
**Priority:** MINOR
**Expected:** Defined behavior for multiple sessions

```
STEPS:
1. Login in Browser 1
2. Login in Browser 2 (same account)
3. Perform action in Browser 1

VERIFY:
[ ] Both sessions work
[ ] OR Browser 1 logged out (single-session policy)
[ ] Defined, consistent behavior
[ ] No data corruption

CONSOLE CHECK:
[ ] No session conflicts
[ ] No auth race conditions

RESULT: PASS / FAIL
BEHAVIOR: ___
```

---

## Authentication Test Summary

```
| Test ID | Test Name | Status | Errors |
|---------|-----------|--------|--------|
| AUTH-001 | Valid Login | | |
| AUTH-002 | Invalid Password | | |
| AUTH-003 | Invalid Email | | |
| AUTH-004 | Empty Fields | | |
| AUTH-005 | Logout | | |
| AUTH-006 | Session Refresh | | |
| AUTH-007 | Session New Tab | | |
| AUTH-008 | Route Guard | | |
| AUTH-009 | Login Redirect | | |
| AUTH-010 | All Roles Login | | |
| AUTH-011 | Concurrent Sessions | | |

TOTAL: 11 tests
PASSED: ___
FAILED: ___
```

## Console Error Summary

```
Unique Errors:
1.
2.

By Category:
- Firebase Auth: ___
- Network: ___
- React: ___
- Other: ___
```

## Pass Criteria

- **PASS:** AUTH-001 through AUTH-008 all pass, AUTH-010 all roles work
- **FAIL:** Any BLOCKER test fails
- **CONDITIONAL:** Minor tests (009, 011) have issues

## Next Suite

If authentication tests pass:
→ Proceed to Suite 02: RBAC Tests

If failed:
→ Fix authentication issues before continuing
→ Log bugs with reproduction steps
