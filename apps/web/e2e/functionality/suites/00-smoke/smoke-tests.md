# Suite 00: Smoke Tests

## Overview

Smoke tests verify that the application is fundamentally operational. These are the first tests to run and must ALL pass before proceeding to other test suites.

**Priority:** P0 (BLOCKER)
**Estimated Time:** 5 minutes
**Prerequisite:** Dev server running at localhost:3000

---

## Console Monitoring Setup

Before starting, initialize console capture:

```
SETUP:
1. Open browser DevTools (F12)
2. Console tab -> Clear
3. Enable "Preserve log"
4. Network tab -> Clear
5. Enable "Preserve log"
6. Note start time: ___
```

---

## Test Cases

### SMOKE-001: Application Loads
**Priority:** BLOCKER
**Expected:** Application renders without crash

```
STEPS:
1. Navigate to http://localhost:3000
2. Wait up to 10 seconds for page load

VERIFY:
[ ] Page loads (not blank white screen)
[ ] No browser error page (500, connection refused)
[ ] Some content visible

CONSOLE CHECK:
[ ] No uncaught TypeError
[ ] No uncaught ReferenceError
[ ] No "chunk load failed" errors
[ ] No Firebase initialization errors

RESULT: PASS / FAIL
CONSOLE ERRORS: ___
NOTES: ___
```

### SMOKE-002: Login Page Accessible
**Priority:** BLOCKER
**Expected:** Login page renders correctly

```
STEPS:
1. Navigate to http://localhost:3000 (should redirect to login if not authenticated)
2. If on dashboard, logout first
3. Observe login page

VERIFY:
[ ] Login form visible
[ ] Email input present
[ ] Password input present
[ ] Login button present
[ ] No layout breaking

CONSOLE CHECK:
[ ] No React rendering errors
[ ] No form component errors

RESULT: PASS / FAIL
CONSOLE ERRORS: ___
NOTES: ___
```

### SMOKE-003: Basic Authentication Works
**Priority:** BLOCKER
**Expected:** Can log in with valid credentials

```
STEPS:
1. On login page
2. Enter: owner@test.contractoros.com
3. Enter password
4. Click Login
5. Wait up to 15 seconds

VERIFY:
[ ] No error toast appears
[ ] Page transitions (loading state, then redirect)
[ ] Arrives at /dashboard
[ ] User identity shown somewhere (header/sidebar)

CONSOLE CHECK:
[ ] No Firebase auth errors
[ ] No permission denied errors
[ ] No network failures on login

RESULT: PASS / FAIL
CONSOLE ERRORS: ___
NOTES: ___
```

### SMOKE-004: Dashboard Renders
**Priority:** BLOCKER
**Expected:** Dashboard loads with core components

```
STEPS:
1. After login, observe /dashboard
2. Wait for data to load (loading spinners resolve)

VERIFY:
[ ] Page header visible
[ ] Navigation visible (sidebar or top nav)
[ ] Some stats/cards/content area visible
[ ] Not stuck in infinite loading

CONSOLE CHECK:
[ ] No Firestore query errors
[ ] No undefined property access
[ ] No state management errors

RESULT: PASS / FAIL
CONSOLE ERRORS: ___
NOTES: ___
```

### SMOKE-005: Navigation Works
**Priority:** CRITICAL
**Expected:** Can navigate between main pages

```
STEPS:
1. From dashboard, click "Projects" in nav
2. Wait for page load
3. Click "Clients" in nav
4. Wait for page load
5. Click back to "Dashboard"

VERIFY:
[ ] Each page loads successfully
[ ] URL updates correctly
[ ] No blank pages
[ ] Navigation remains functional

CONSOLE CHECK:
[ ] No route transition errors
[ ] No "page not found" errors in console

RESULT: PASS / FAIL
PAGES FAILED: ___
CONSOLE ERRORS: ___
```

### SMOKE-006: Logout Works
**Priority:** CRITICAL
**Expected:** Can log out successfully

```
STEPS:
1. From any authenticated page
2. Find logout option (user menu, sidebar, etc.)
3. Click Logout
4. Wait for redirect

VERIFY:
[ ] Redirects to login page
[ ] Cannot access /dashboard without re-login
[ ] No error messages

CONSOLE CHECK:
[ ] No auth state errors
[ ] Clean session termination

RESULT: PASS / FAIL
CONSOLE ERRORS: ___
NOTES: ___
```

### SMOKE-007: No Critical Console Errors at Rest
**Priority:** CRITICAL
**Expected:** Idle page has no errors

```
STEPS:
1. Login and go to dashboard
2. Wait 30 seconds without doing anything
3. Observe console

VERIFY:
[ ] No new errors appearing
[ ] No infinite loops detected
[ ] No memory leak warnings
[ ] No repeated failed requests

CONSOLE OUTPUT:
(Copy any errors/warnings here)

RESULT: PASS / FAIL
```

### SMOKE-008: Mobile Viewport Loads
**Priority:** MAJOR
**Expected:** Application works on mobile viewport

```
STEPS:
1. Resize browser to 375x812 (or use device emulation)
2. Navigate to /dashboard
3. Observe layout

VERIFY:
[ ] Page renders (not blank)
[ ] Content is accessible (may need scroll)
[ ] No horizontal scrollbar
[ ] Navigation accessible (hamburger or similar)

CONSOLE CHECK:
[ ] No viewport-specific errors
[ ] No responsive breakpoint errors

RESULT: PASS / FAIL
CONSOLE ERRORS: ___
```

---

## Smoke Test Summary

```
| Test ID | Test Name | Status | Console Errors |
|---------|-----------|--------|----------------|
| SMOKE-001 | App Loads | | |
| SMOKE-002 | Login Page | | |
| SMOKE-003 | Authentication | | |
| SMOKE-004 | Dashboard Renders | | |
| SMOKE-005 | Navigation | | |
| SMOKE-006 | Logout | | |
| SMOKE-007 | No Idle Errors | | |
| SMOKE-008 | Mobile Viewport | | |
```

## Pass Criteria

- **PASS:** All 8 tests pass, 0 BLOCKER/CRITICAL console errors
- **FAIL:** Any SMOKE-001, 002, 003, or 004 fails
- **CONDITIONAL:** SMOKE-005-008 minor issues, but core works

## Console Error Summary

```
Total Errors: ___
Total Warnings: ___

Unique Errors:
1.
2.
3.

Categorized:
- JavaScript Exceptions: ___
- React Errors: ___
- Network Failures: ___
- Firebase Errors: ___
- Other Warnings: ___
```

## Proceed?

If smoke tests PASS or CONDITIONAL:
→ Proceed to Suite 01: Authentication

If smoke tests FAIL:
→ STOP. Fix critical issues before continuing.
→ Log blocker bugs immediately.
