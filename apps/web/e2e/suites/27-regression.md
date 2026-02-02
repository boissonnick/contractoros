# Suite 27: Full Regression Test Checklist

> **Purpose:** Comprehensive regression testing covering all platform features
> **Duration:** 2-3 hours
> **Run Before:** Every major deployment, beta release, or after significant changes
> **Last Updated:** 2026-02-02

---

## Test Environment Setup

Before running tests, verify:
- [ ] Local server running at `localhost:3000`
- [ ] Docker container: `docker ps` shows `contractoros-web`
- [ ] TypeScript clean: `npx tsc --noEmit` passes
- [ ] Demo account seeded: Horizon Construction Co. available
- [ ] Chrome browser available for testing

---

## Section 1: Authentication

### TEST: AUTH-001 - Login with Email/Password
**Priority:** P0

**Steps:**
1. Navigate to `/login`
2. Enter valid credentials (demo@contractoros.com)
3. Click "Sign In"
4. Verify redirect to dashboard

**Expected:**
- [ ] Login form accepts input
- [ ] Loading state shows during auth
- [ ] Successful redirect to `/dashboard`
- [ ] User name displayed in header

---

### TEST: AUTH-002 - Logout
**Priority:** P0

**Steps:**
1. Click user menu in header
2. Click "Sign Out"
3. Verify redirect to login page

**Expected:**
- [ ] User menu opens
- [ ] Sign out option visible
- [ ] Redirect to `/login`
- [ ] Cannot access protected pages without re-auth

---

### TEST: AUTH-003 - Password Reset Flow
**Priority:** P1

**Steps:**
1. Navigate to `/login`
2. Click "Forgot Password"
3. Enter email address
4. Submit form

**Expected:**
- [ ] Reset form displays
- [ ] Email field validates
- [ ] Success message shows
- [ ] (Email delivery tested separately)

---

### TEST: AUTH-004 - Protected Route Redirect
**Priority:** P0

**Steps:**
1. Log out
2. Navigate directly to `/dashboard/projects`
3. Verify redirect to login

**Expected:**
- [ ] Redirected to login page
- [ ] No flash of protected content
- [ ] Return URL preserved (optional)

---

## Section 2: Dashboard

### TEST: DASH-001 - Dashboard Loads with Stats
**Priority:** P0

**Steps:**
1. Login and navigate to `/dashboard`
2. Verify stats cards display
3. Check for loading states

**Expected:**
- [ ] Page loads without error
- [ ] Active Projects count shows
- [ ] Revenue/financial stats display (for admins)
- [ ] Quick Actions visible
- [ ] Recent activity loads

---

### TEST: DASH-002 - Navigation Works (All Sidebar Links)
**Priority:** P0

**Steps:**
1. Click each sidebar link sequentially:
   - Dashboard
   - Projects
   - Clients
   - Estimates
   - Invoices
   - Schedule
   - Time
   - Team
   - Materials
   - Reports
   - Settings

**Expected:**
- [ ] Each link navigates to correct page
- [ ] No 404 errors
- [ ] Active state shows on current page
- [ ] Page content loads appropriately

---

### TEST: DASH-003 - Search Bar Functions
**Priority:** P1

**Steps:**
1. Click search bar or press Cmd+K
2. Type "project"
3. Verify search results appear
4. Click a result

**Expected:**
- [ ] Search modal opens
- [ ] Results appear as you type
- [ ] Results grouped by type (Projects, Clients, etc.)
- [ ] Clicking result navigates to detail page

---

### TEST: DASH-004 - AI Assistant Opens and Responds
**Priority:** P1

**Steps:**
1. Click AI Assistant button (bottom right) or press Cmd+J
2. Type "What can you help me with?"
3. Press Enter
4. Wait for response

**Expected:**
- [ ] AI panel slides open
- [ ] Message appears in chat
- [ ] Loading indicator shows
- [ ] AI response displays
- [ ] Markdown formatting works

---

## Section 3: Projects

### TEST: PROJ-001 - List Projects with Filters
**Priority:** P0

**Steps:**
1. Navigate to `/dashboard/projects`
2. Verify project list loads
3. Apply status filter (Active)
4. Apply search filter
5. Clear filters

**Expected:**
- [ ] Projects display in grid/list
- [ ] Status filter works
- [ ] Search filters results
- [ ] Clear restores full list
- [ ] Project count updates

---

### TEST: PROJ-002 - Create New Project
**Priority:** P0

**Steps:**
1. Click "New Project" button
2. Fill in required fields:
   - Project name
   - Client selection
   - Address
   - Start date
3. Click Create

**Expected:**
- [ ] Modal/form opens
- [ ] Client dropdown works
- [ ] Address autocomplete works (if Maps configured)
- [ ] Project created successfully
- [ ] Redirect to project detail

---

### TEST: PROJ-003 - View Project Detail
**Priority:** P0

**Steps:**
1. Click on a project from list
2. Verify detail page loads
3. Check all tabs load

**Expected:**
- [ ] Project header displays (name, status, client)
- [ ] Overview tab shows summary
- [ ] Tasks tab loads
- [ ] Finances tab loads
- [ ] Documents tab loads
- [ ] Activity tab loads

---

### TEST: PROJ-004 - Edit Project
**Priority:** P0

**Steps:**
1. Open project detail
2. Click Edit button
3. Change project name
4. Save changes

**Expected:**
- [ ] Edit form opens with current values
- [ ] Fields are editable
- [ ] Save succeeds
- [ ] Updated values display

---

### TEST: PROJ-005 - Delete Project (with Confirmation)
**Priority:** P1

**Steps:**
1. Open project detail
2. Click Delete or menu > Delete
3. Confirm deletion dialog
4. Confirm delete

**Expected:**
- [ ] Confirmation dialog appears
- [ ] Warns about permanent deletion
- [ ] Cancel returns to project
- [ ] Confirm deletes and redirects to list

---

## Section 4: Clients

### TEST: CLIENT-001 - List Clients
**Priority:** P0

**Steps:**
1. Navigate to `/dashboard/clients`
2. Verify client list loads
3. Test search/filter

**Expected:**
- [ ] Clients display in table/cards
- [ ] Search filters by name
- [ ] Status filter works
- [ ] Contact info visible

---

### TEST: CLIENT-002 - Create Client
**Priority:** P0

**Steps:**
1. Click "New Client" button
2. Fill required fields:
   - First name, Last name
   - Email
   - Phone
3. Save

**Expected:**
- [ ] Form opens
- [ ] Validation works (email format)
- [ ] Client created successfully
- [ ] Appears in client list

---

### TEST: CLIENT-003 - View Client Detail
**Priority:** P0

**Steps:**
1. Click on a client
2. Verify detail page loads

**Expected:**
- [ ] Client info displays
- [ ] Projects associated shown
- [ ] Contact info visible
- [ ] Notes/history loads

---

### TEST: CLIENT-004 - Edit Client
**Priority:** P0

**Steps:**
1. Open client detail
2. Click Edit
3. Change phone number
4. Save

**Expected:**
- [ ] Edit form opens
- [ ] Changes save successfully
- [ ] Updated info displays

---

## Section 5: Estimates

### TEST: EST-001 - Create Estimate with Line Items
**Priority:** P0

**Steps:**
1. Navigate to `/dashboard/estimates`
2. Click "New Estimate"
3. Select client
4. Add line items (at least 2)
5. Save estimate

**Expected:**
- [ ] Estimate form opens
- [ ] Line item picker works
- [ ] Quantities and prices calculate
- [ ] Subtotal/total updates
- [ ] Estimate saves successfully

---

### TEST: EST-002 - Auto-numbering Works
**Priority:** P1

**Steps:**
1. Create a new estimate
2. Observe estimate number assignment

**Expected:**
- [ ] Estimate number auto-assigned
- [ ] Format matches settings (e.g., EST-2026-0001)
- [ ] Sequential from last estimate

---

### TEST: EST-003 - Send Estimate (Email)
**Priority:** P1

**Steps:**
1. Open a draft estimate
2. Click "Send" or "Send to Client"
3. Verify send dialog
4. Confirm send

**Expected:**
- [ ] Send dialog shows
- [ ] Client email pre-filled
- [ ] Preview available (optional)
- [ ] Send succeeds
- [ ] Status updates to "Sent"

---

### TEST: EST-004 - Convert to Project
**Priority:** P1

**Steps:**
1. Open an approved estimate
2. Click "Convert to Project"
3. Confirm conversion

**Expected:**
- [ ] Convert option available
- [ ] Project created from estimate
- [ ] Estimate linked to project
- [ ] Redirect to new project

---

## Section 6: Invoices

### TEST: INV-001 - Create Invoice
**Priority:** P0

**Steps:**
1. Navigate to `/dashboard/invoices`
2. Click "New Invoice"
3. Select client/project
4. Add line items
5. Save

**Expected:**
- [ ] Invoice form opens
- [ ] Line items add correctly
- [ ] Totals calculate
- [ ] Invoice saves successfully

---

### TEST: INV-002 - Auto-numbering Works
**Priority:** P1

**Steps:**
1. Create a new invoice
2. Observe invoice number

**Expected:**
- [ ] Invoice number auto-assigned
- [ ] Format matches settings (e.g., INV-2026-0001)
- [ ] Sequential numbering

---

### TEST: INV-003 - Send Invoice
**Priority:** P1

**Steps:**
1. Open a draft invoice
2. Click "Send"
3. Confirm send

**Expected:**
- [ ] Send dialog shows
- [ ] Client email shown
- [ ] Send succeeds
- [ ] Status updates to "Sent"

---

### TEST: INV-004 - Record Payment
**Priority:** P0

**Steps:**
1. Open a sent invoice
2. Click "Record Payment"
3. Enter payment amount
4. Save payment

**Expected:**
- [ ] Payment form opens
- [ ] Amount field works
- [ ] Payment records successfully
- [ ] Balance updates
- [ ] Status updates if fully paid

---

## Section 7: Time Tracking

### TEST: TIME-001 - Log Time Entry
**Priority:** P0

**Steps:**
1. Navigate to `/dashboard/time`
2. Click "Log Time" or "+"
3. Select project
4. Enter hours and description
5. Save

**Expected:**
- [ ] Time entry form opens
- [ ] Project dropdown works
- [ ] Hours field validates
- [ ] Entry saves successfully

---

### TEST: TIME-002 - View Timesheet
**Priority:** P0

**Steps:**
1. Navigate to `/dashboard/time`
2. View weekly timesheet
3. Change date range

**Expected:**
- [ ] Timesheet displays entries
- [ ] Week navigation works
- [ ] Hours totals calculate
- [ ] Entries grouped by day

---

### TEST: TIME-003 - Edit/Delete Entries
**Priority:** P1

**Steps:**
1. Click on a time entry
2. Edit hours
3. Save changes
4. Delete entry

**Expected:**
- [ ] Edit form opens with data
- [ ] Changes save
- [ ] Delete confirmation shows
- [ ] Entry removed

---

## Section 8: Schedule

### TEST: SCHED-001 - View Calendar
**Priority:** P0

**Steps:**
1. Navigate to `/dashboard/schedule`
2. Verify calendar displays
3. Navigate months

**Expected:**
- [ ] Calendar renders
- [ ] Events display
- [ ] Month navigation works
- [ ] Today highlighted

---

### TEST: SCHED-002 - Create Event
**Priority:** P1

**Steps:**
1. Click on a date or "New Event"
2. Fill event details
3. Save

**Expected:**
- [ ] Event form opens
- [ ] Date/time picker works
- [ ] Event saves
- [ ] Appears on calendar

---

### TEST: SCHED-003 - Edit Event
**Priority:** P1

**Steps:**
1. Click on an event
2. Edit details
3. Save changes

**Expected:**
- [ ] Event detail opens
- [ ] Edit mode available
- [ ] Changes save
- [ ] Calendar updates

---

## Section 9: Settings

### TEST: SET-001 - Update Organization Settings
**Priority:** P0

**Steps:**
1. Navigate to `/dashboard/settings`
2. Update organization name
3. Save changes

**Expected:**
- [ ] Settings page loads
- [ ] Organization fields editable
- [ ] Save succeeds
- [ ] Changes reflect across app

---

### TEST: SET-002 - AI Assistant Settings
**Priority:** P1

**Steps:**
1. Navigate to `/dashboard/settings/assistant`
2. Change model selection
3. Toggle settings
4. Save

**Expected:**
- [ ] AI settings page loads
- [ ] Model dropdown works
- [ ] Toggles function
- [ ] Settings persist

---

### TEST: SET-003 - Numbering Settings
**Priority:** P1

**Steps:**
1. Navigate to `/dashboard/settings`
2. Find numbering/preferences section
3. Change format or prefix
4. Save

**Expected:**
- [ ] Numbering settings visible
- [ ] Format fields editable
- [ ] Changes save
- [ ] New documents use updated format

---

## Section 10: Mobile Responsiveness

### TEST: MOB-001 - Responsive Layout Works
**Priority:** P0
**Viewport:** 375x812 (iPhone)

**Steps:**
1. Open browser at mobile viewport
2. Navigate to dashboard
3. Test navigation drawer
4. Test several pages

**Expected:**
- [ ] Mobile header displays
- [ ] Hamburger menu works
- [ ] Content fits viewport
- [ ] No horizontal scroll
- [ ] Cards stack vertically

---

### TEST: MOB-002 - Touch Interactions Work
**Priority:** P0
**Viewport:** 375x812

**Steps:**
1. Test tapping buttons
2. Test form inputs
3. Test dropdown menus

**Expected:**
- [ ] Touch targets 44px minimum
- [ ] Tap feedback visible
- [ ] Forms accept input
- [ ] Dropdowns work

---

### TEST: MOB-003 - Navigation Drawer Works
**Priority:** P0
**Viewport:** 375x812

**Steps:**
1. Tap hamburger menu
2. Verify drawer opens
3. Navigate to different page
4. Close drawer

**Expected:**
- [ ] Drawer slides in
- [ ] All nav items visible
- [ ] Navigation works
- [ ] Drawer closes properly

---

## Section 11: Security Regression

### TEST: SEC-001 - Role-Based Access (Client)
**Priority:** P0 (Critical)

**Steps:**
1. Login as Client role
2. Navigate to /dashboard
3. Verify limited access

**Expected:**
- [ ] Only sees their projects
- [ ] No admin buttons visible
- [ ] No financial details from other clients
- [ ] Cannot access team page

---

### TEST: SEC-002 - Role-Based Access (PM)
**Priority:** P0 (Critical)

**Steps:**
1. Login or impersonate PM role
2. Attempt to access /dashboard/payroll

**Expected:**
- [ ] Access denied message
- [ ] No payroll data visible
- [ ] Correct role shown in error

---

### TEST: SEC-003 - Firebase Permissions
**Priority:** P1

**Steps:**
1. Open browser console
2. Navigate through app
3. Check for permission errors

**Expected:**
- [ ] No "permission-denied" in console
- [ ] No "Missing permissions" errors
- [ ] Queries succeed

---

## Section 12: API & Integration

### TEST: API-001 - Health Check
**Priority:** P0

**Steps:**
1. Navigate to `/api/health` (if exists)
2. Or check for console errors on page load

**Expected:**
- [ ] API responds
- [ ] No 500 errors on page load
- [ ] Firebase connection working

---

### TEST: API-002 - Document Generation
**Priority:** P1

**Steps:**
1. Open an estimate
2. Click "Preview PDF" or "Download PDF"
3. Verify PDF generates

**Expected:**
- [ ] PDF preview loads
- [ ] Contains estimate data
- [ ] Download works

---

## Test Results Summary

```
REGRESSION TEST RESULTS - Sprint 27
===================================
Date: ___________
Tester: ___________
Environment: localhost:3000 / staging / production

SECTION 1: AUTHENTICATION
AUTH-001 Login:              [ ] PASS  [ ] FAIL
AUTH-002 Logout:             [ ] PASS  [ ] FAIL
AUTH-003 Password Reset:     [ ] PASS  [ ] FAIL
AUTH-004 Protected Routes:   [ ] PASS  [ ] FAIL

SECTION 2: DASHBOARD
DASH-001 Stats:              [ ] PASS  [ ] FAIL
DASH-002 Navigation:         [ ] PASS  [ ] FAIL
DASH-003 Search:             [ ] PASS  [ ] FAIL
DASH-004 AI Assistant:       [ ] PASS  [ ] FAIL

SECTION 3: PROJECTS
PROJ-001 List/Filter:        [ ] PASS  [ ] FAIL
PROJ-002 Create:             [ ] PASS  [ ] FAIL
PROJ-003 View Detail:        [ ] PASS  [ ] FAIL
PROJ-004 Edit:               [ ] PASS  [ ] FAIL
PROJ-005 Delete:             [ ] PASS  [ ] FAIL

SECTION 4: CLIENTS
CLIENT-001 List:             [ ] PASS  [ ] FAIL
CLIENT-002 Create:           [ ] PASS  [ ] FAIL
CLIENT-003 View Detail:      [ ] PASS  [ ] FAIL
CLIENT-004 Edit:             [ ] PASS  [ ] FAIL

SECTION 5: ESTIMATES
EST-001 Create/Line Items:   [ ] PASS  [ ] FAIL
EST-002 Auto-numbering:      [ ] PASS  [ ] FAIL
EST-003 Send:                [ ] PASS  [ ] FAIL
EST-004 Convert to Project:  [ ] PASS  [ ] FAIL

SECTION 6: INVOICES
INV-001 Create:              [ ] PASS  [ ] FAIL
INV-002 Auto-numbering:      [ ] PASS  [ ] FAIL
INV-003 Send:                [ ] PASS  [ ] FAIL
INV-004 Record Payment:      [ ] PASS  [ ] FAIL

SECTION 7: TIME TRACKING
TIME-001 Log Entry:          [ ] PASS  [ ] FAIL
TIME-002 View Timesheet:     [ ] PASS  [ ] FAIL
TIME-003 Edit/Delete:        [ ] PASS  [ ] FAIL

SECTION 8: SCHEDULE
SCHED-001 View Calendar:     [ ] PASS  [ ] FAIL
SCHED-002 Create Event:      [ ] PASS  [ ] FAIL
SCHED-003 Edit Event:        [ ] PASS  [ ] FAIL

SECTION 9: SETTINGS
SET-001 Org Settings:        [ ] PASS  [ ] FAIL
SET-002 AI Settings:         [ ] PASS  [ ] FAIL
SET-003 Numbering:           [ ] PASS  [ ] FAIL

SECTION 10: MOBILE
MOB-001 Responsive:          [ ] PASS  [ ] FAIL
MOB-002 Touch:               [ ] PASS  [ ] FAIL
MOB-003 Navigation:          [ ] PASS  [ ] FAIL

SECTION 11: SECURITY
SEC-001 Client Access:       [ ] PASS  [ ] FAIL  (CRITICAL)
SEC-002 PM Payroll:          [ ] PASS  [ ] FAIL  (CRITICAL)
SEC-003 Firebase Perms:      [ ] PASS  [ ] FAIL

SECTION 12: API
API-001 Health:              [ ] PASS  [ ] FAIL
API-002 PDF Generation:      [ ] PASS  [ ] FAIL

==========================================
TOTAL: ___/40 PASSED
CRITICAL: ___/2 PASSED
==========================================
```

---

## Issue Tracking

| Test ID | Issue Description | Severity | Ticket |
|---------|-------------------|----------|--------|
| | | | |
| | | | |
| | | | |

---

## Notes

_Record any observations, workarounds, or environment-specific issues here._

---

## When to Run This Suite

- [ ] Before every production deployment
- [ ] After completing a sprint
- [ ] After any security-related changes
- [ ] After database schema changes
- [ ] Weekly scheduled regression
- [ ] Before beta/GA releases
