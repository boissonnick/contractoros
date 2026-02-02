# Suite 12: Portal Access Tests

## Overview

Tests the alternate portals: Client Portal, Subcontractor Portal, and Field Worker Portal.

**Priority:** P1
**Estimated Time:** 20 minutes
**Prerequisite:** Test users for each portal type exist

---

## Part A: Client Portal

### PORT-001: Client Portal Access
**Priority:** CRITICAL
**Expected:** Client can access their portal

```
STEPS:
1. Login as CLIENT user
2. Observe default landing page

VERIFY:
[ ] Redirected to client portal (not main dashboard)
[ ] Client-specific navigation visible
[ ] No admin features visible
[ ] Company branding shown

CONSOLE CHECK:
[ ] No permission errors
[ ] Client-scoped queries only

RESULT: PASS / FAIL
```

### PORT-002: Client Views Own Projects
**Priority:** BLOCKER (Security)
**Expected:** Client sees ONLY their projects

```
STEPS:
1. As client, view projects list
2. Count visible projects
3. Compare to expected (client's projects only)

VERIFY:
[ ] Only client's projects visible
[ ] Other clients' projects NOT visible
[ ] Cannot access other project URLs

SECURITY CHECK:
[ ] Project list filtered by clientId
[ ] No data leakage

RESULT: PASS / FAIL
```

### PORT-003: Client Project Detail
**Priority:** CRITICAL
**Expected:** Client can view project details

```
STEPS:
1. Click on client's project
2. View detail page

VERIFY:
[ ] Project name visible
[ ] Status visible
[ ] Timeline/milestones visible
[ ] Documents section accessible
[ ] Photos section accessible
[ ] NO internal notes visible
[ ] NO financial details beyond invoices to them

RESULT: PASS / FAIL
```

### PORT-004: Client Document Access
**Priority:** CRITICAL
**Expected:** Client can view/sign documents

```
STEPS:
1. Navigate to documents section
2. View estimates sent to client
3. View signed documents

VERIFY:
[ ] Documents accessible
[ ] Can view estimate/contract
[ ] Can sign pending documents
[ ] Download signed copies

RESULT: PASS / FAIL
```

### PORT-005: Client Selections
**Priority:** MAJOR
**Expected:** Client can make material selections

```
STEPS:
1. Navigate to selections/preferences
2. View available options
3. Make a selection (color, material, etc.)
4. Save

VERIFY:
[ ] Options displayed
[ ] Can select preference
[ ] Selection saved
[ ] Notifies contractor (if applicable)

RESULT: PASS / FAIL
```

### PORT-006: Client Messages
**Priority:** MAJOR
**Expected:** Client can send/receive messages

```
STEPS:
1. Navigate to messages
2. View conversation with contractor
3. Send a message

VERIFY:
[ ] Messages displayed
[ ] Can send new message
[ ] Receives responses

RESULT: PASS / FAIL
```

---

## Part B: Subcontractor Portal

### PORT-007: Sub Portal Access
**Priority:** CRITICAL
**Expected:** Subcontractor can access portal

```
STEPS:
1. Login as CONTRACTOR user
2. Observe landing page

VERIFY:
[ ] Sub-specific portal loads
[ ] Limited navigation
[ ] Assigned work visible
[ ] No admin features

RESULT: PASS / FAIL
```

### PORT-008: Sub Views Assigned Work
**Priority:** CRITICAL
**Expected:** Sub sees only assigned projects/tasks

```
STEPS:
1. View work list
2. Check visible items

VERIFY:
[ ] Only assigned work visible
[ ] Cannot see unassigned projects
[ ] Work details accessible

RESULT: PASS / FAIL
```

### PORT-009: Sub Time Tracking
**Priority:** CRITICAL
**Expected:** Sub can log own time

```
STEPS:
1. Navigate to time tracking
2. Log hours for assigned work
3. Submit

VERIFY:
[ ] Can log time
[ ] Linked to correct project
[ ] Time saved

RESULT: PASS / FAIL
```

### PORT-010: Sub Bid Submission
**Priority:** MAJOR
**Expected:** Sub can submit bids (if applicable)

```
STEPS:
1. View bid requests
2. Submit bid with:
   - Price
   - Timeline
   - Notes
3. Confirm

VERIFY:
[ ] Bid submitted
[ ] Status: pending
[ ] Contractor notified

RESULT: PASS / FAIL / NOT IMPLEMENTED
```

---

## Part C: Field Worker Portal

### PORT-011: Field Portal Access
**Priority:** CRITICAL
**Expected:** Field worker portal loads

```
STEPS:
1. Navigate to /field/ or field portal
2. Login as EMPLOYEE

VERIFY:
[ ] Field-optimized interface
[ ] Mobile-friendly layout
[ ] Daily tasks visible

RESULT: PASS / FAIL
```

### PORT-012: Field Daily Schedule
**Priority:** CRITICAL
**Expected:** Shows today's schedule

```
STEPS:
1. View today's schedule
2. Check assigned tasks/jobs

VERIFY:
[ ] Today's assignments visible
[ ] Job site address shown
[ ] Task details accessible

RESULT: PASS / FAIL
```

### PORT-013: Field Clock In/Out
**Priority:** CRITICAL
**Expected:** Can clock time from field

```
STEPS:
1. Clock in
2. Wait
3. Clock out

VERIFY:
[ ] Clock in recorded with GPS (if implemented)
[ ] Duration tracked
[ ] Clock out saved

RESULT: PASS / FAIL
```

### PORT-014: Field Task Update
**Priority:** CRITICAL
**Expected:** Can update task status from field

```
STEPS:
1. Open assigned task
2. Mark as "In Progress"
3. Later, mark "Complete"

VERIFY:
[ ] Status updates
[ ] Syncs to main system
[ ] Manager can see update

RESULT: PASS / FAIL
```

### PORT-015: Field Photo Capture
**Priority:** MAJOR
**Expected:** Can take/upload project photos

```
STEPS:
1. Open task or project
2. Add photo
3. Add description
4. Upload

VERIFY:
[ ] Photo uploads
[ ] Description saved
[ ] Visible in project

RESULT: PASS / FAIL
```

### PORT-016: Field Daily Log
**Priority:** MAJOR
**Expected:** Can submit daily log

```
STEPS:
1. Navigate to daily log
2. Add entry:
   - Work completed
   - Weather
   - Issues
3. Submit

VERIFY:
[ ] Log saved
[ ] Associated with project/date
[ ] Visible to managers

RESULT: PASS / FAIL
```

---

## Part D: Cross-Portal Security

### PORT-017: Client Cannot Access Admin
**Priority:** BLOCKER
**Expected:** Client portal restricts to client-only routes

```
STEPS:
1. As client, try direct URLs:
   - /dashboard/projects/new
   - /dashboard/clients
   - /dashboard/payroll
   - /dashboard/settings/team

VERIFY:
[ ] All return 403/404 or redirect
[ ] No admin data exposed

RESULT: PASS / FAIL
```

### PORT-018: Sub Cannot Access Financials
**Priority:** BLOCKER
**Expected:** Sub cannot see financial data

```
STEPS:
1. As contractor, try:
   - /dashboard/invoices
   - /dashboard/payroll
   - /dashboard/expenses (others')

VERIFY:
[ ] Access denied
[ ] No financial data visible

RESULT: PASS / FAIL
```

### PORT-019: Portal Session Isolation
**Priority:** MAJOR
**Expected:** Portals have separate sessions

```
STEPS:
1. Login as client in Tab 1
2. Open Tab 2, go to main dashboard
3. Check each tab

VERIFY:
[ ] Sessions are role-appropriate
[ ] No session bleeding between portals

RESULT: PASS / FAIL
```

---

## Portal Test Summary

```
| Test ID | Test Name | Status | Security Issue |
|---------|-----------|--------|----------------|
| PORT-001 | Client Access | | |
| PORT-002 | Client Own Projects | | |
| PORT-003 | Client Detail | | |
| PORT-004 | Client Documents | | |
| PORT-005 | Client Selections | | |
| PORT-006 | Client Messages | | |
| PORT-007 | Sub Access | | |
| PORT-008 | Sub Assigned Work | | |
| PORT-009 | Sub Time | | |
| PORT-010 | Sub Bids | | |
| PORT-011 | Field Access | | |
| PORT-012 | Field Schedule | | |
| PORT-013 | Field Clock | | |
| PORT-014 | Field Task | | |
| PORT-015 | Field Photo | | |
| PORT-016 | Field Log | | |
| PORT-017 | Client No Admin | | |
| PORT-018 | Sub No Finance | | |
| PORT-019 | Session Isolation | | |

TOTAL: 19 tests
PASSED: ___
FAILED: ___
SECURITY ISSUES: ___
```

## End of Test Suites

After all suites complete, proceed to generate final report.
