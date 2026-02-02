# Suite 04: Client CRM Tests

## Overview

Tests all client management functionality including CRUD operations, notes, communication logs, and client portal access.

**Priority:** P1
**Estimated Time:** 20 minutes
**Prerequisite:** Project tests passed, logged in as OWNER

---

## Test Cases

### CLIENT-001: Create New Client
**Priority:** CRITICAL
**Expected:** Can create client with valid data

```
STEPS:
1. Navigate to /dashboard/clients
2. Click "Add Client" button
3. Fill in form:
   - Name: "Test Client [timestamp]"
   - Email: "testclient[timestamp]@example.com"
   - Phone: "555-0199"
   - Status: Active
   - Source: Referral
4. Save client

VERIFY:
[ ] Form accepts all inputs
[ ] Success toast appears
[ ] Client appears in list
[ ] Client data matches input
[ ] Can click to view client detail

CONSOLE CHECK:
[ ] Firestore write successful
[ ] No validation errors

RESULT: PASS / FAIL
CLIENT ID CREATED: ___
```

### CLIENT-002: Client Validation
**Priority:** MAJOR
**Expected:** Form validates required fields

```
STEPS:
1. Click "Add Client"
2. Leave required fields empty
3. Click Save

VERIFY:
[ ] Name required validation
[ ] Form not submitted with invalid data

TEST EMAIL VALIDATION:
[ ] Invalid email format → Error
[ ] Valid email → Accepted

TEST PHONE:
[ ] Invalid format → Handles appropriately

RESULT: PASS / FAIL
```

### CLIENT-003: View Client List
**Priority:** CRITICAL
**Expected:** Client list renders correctly

```
STEPS:
1. Navigate to /dashboard/clients
2. Wait for data to load

VERIFY:
[ ] Clients list renders
[ ] Each client shows name, email, status
[ ] No infinite loading
[ ] Pagination works (if applicable)
[ ] Empty state if no clients

LIST FEATURES:
[ ] Search by name works
[ ] Filter by status works
[ ] Sort works (if available)

CONSOLE CHECK:
[ ] Query successful
[ ] No errors

RESULT: PASS / FAIL
CLIENT COUNT: ___
```

### CLIENT-004: View Client Detail
**Priority:** CRITICAL
**Expected:** Client detail page shows all info

```
STEPS:
1. Click on a client in the list
2. Wait for detail page to load

VERIFY:
[ ] Client name displayed
[ ] Email displayed (clickable mailto?)
[ ] Phone displayed (clickable tel?)
[ ] Status displayed
[ ] Address displayed (if set)
[ ] Source displayed
[ ] Notes section visible
[ ] Projects section visible
[ ] Communication log visible

RELATED DATA:
[ ] Client's projects listed
[ ] Project count accurate

CONSOLE CHECK:
[ ] Client data fetched
[ ] Related projects fetched

RESULT: PASS / FAIL
```

### CLIENT-005: Edit Client
**Priority:** CRITICAL
**Expected:** Can update client details

```
STEPS:
1. Open client detail page
2. Click Edit button
3. Change client name
4. Change phone number
5. Save changes

VERIFY:
[ ] Edit form pre-fills current data
[ ] Changes saved successfully
[ ] Success toast appears
[ ] Updated data displays
[ ] Changes persist on refresh

CONSOLE CHECK:
[ ] Update successful
[ ] No errors

RESULT: PASS / FAIL
```

### CLIENT-006: Change Client Status
**Priority:** MAJOR
**Expected:** Can change client status

```
STEPS:
1. Open client detail
2. Change status from Active to Inactive
3. Save or confirm

VERIFY:
[ ] Status updated
[ ] Client appears in correct filter
[ ] Status persists

TEST STATUS OPTIONS:
[ ] active
[ ] inactive
[ ] potential
[ ] past

RESULT: PASS / FAIL
```

### CLIENT-007: Add Client Note
**Priority:** MAJOR
**Expected:** Can add notes to clients

```
STEPS:
1. Open client detail
2. Find Notes section
3. Add new note: "Test note [timestamp]"
4. Save note

VERIFY:
[ ] Note added successfully
[ ] Note shows author and timestamp
[ ] Can edit note (if supported)
[ ] Can delete note (if supported)
[ ] Notes persist on refresh

CONSOLE CHECK:
[ ] Note saved to Firestore

RESULT: PASS / FAIL
```

### CLIENT-008: Communication Log
**Priority:** MAJOR
**Expected:** Can log client communications

```
STEPS:
1. Open client detail
2. Find Communication Log section
3. Add new log entry:
   - Type: Phone call
   - Notes: "Discussed project timeline"
4. Save entry

VERIFY:
[ ] Entry added to log
[ ] Date/time recorded
[ ] Author recorded
[ ] Entries display in chronological order

RESULT: PASS / FAIL
```

### CLIENT-009: Client with Projects
**Priority:** MAJOR
**Expected:** Client detail shows linked projects

```
STEPS:
1. Create a project with specific client
2. Go to that client's detail page
3. Check Projects section

VERIFY:
[ ] Project appears in client's project list
[ ] Can click project to navigate to it
[ ] Project status shown
[ ] Multiple projects display correctly

RESULT: PASS / FAIL
```

### CLIENT-010: Delete Client
**Priority:** MAJOR
**Expected:** Can delete clients (with warnings)

```
STEPS:
1. Open a test client (no linked projects)
2. Find Delete option
3. Attempt to delete

VERIFY:
[ ] Confirmation required
[ ] Warns about data loss
[ ] Client removed from list after delete

WITH LINKED PROJECTS:
[ ] Warning about orphaned projects
[ ] OR prevent deletion until projects reassigned

RESULT: PASS / FAIL
```

### CLIENT-011: Search Clients
**Priority:** MAJOR
**Expected:** Can search clients by name/email

```
STEPS:
1. Go to client list
2. Search for existing client name
3. Search for client email
4. Search for non-existent client

VERIFY:
[ ] Search returns matching clients
[ ] Partial match works (if designed)
[ ] Empty results handled gracefully
[ ] Clear search restores full list

RESULT: PASS / FAIL
```

### CLIENT-012: Client Financials
**Priority:** MINOR
**Expected:** Client financial summary (if implemented)

```
STEPS:
1. Open client with invoices
2. Check financial section

VERIFY:
[ ] Total invoiced shown
[ ] Paid amount shown
[ ] Outstanding balance shown
[ ] OR section not yet implemented (note this)

RESULT: PASS / FAIL / NOT IMPLEMENTED
```

---

## Client Test Summary

```
| Test ID | Test Name | Status | Console Errors |
|---------|-----------|--------|----------------|
| CLIENT-001 | Create Client | | |
| CLIENT-002 | Validation | | |
| CLIENT-003 | View List | | |
| CLIENT-004 | View Detail | | |
| CLIENT-005 | Edit Client | | |
| CLIENT-006 | Status Change | | |
| CLIENT-007 | Add Note | | |
| CLIENT-008 | Comm Log | | |
| CLIENT-009 | With Projects | | |
| CLIENT-010 | Delete | | |
| CLIENT-011 | Search | | |
| CLIENT-012 | Financials | | |

TOTAL: 12 tests
PASSED: ___
FAILED: ___
```

## Next Suite

→ Proceed to Suite 05: Task Management Tests
