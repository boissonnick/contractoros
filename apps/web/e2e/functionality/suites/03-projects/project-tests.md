# Suite 03: Project Management Tests

## Overview

Tests all project CRUD operations, phases, scope, and project lifecycle management.

**Priority:** P1
**Estimated Time:** 25 minutes
**Prerequisite:** RBAC tests passed, logged in as OWNER

---

## Test Cases

### PROJ-001: Create New Project
**Priority:** CRITICAL
**Expected:** Can create project with valid data

```
STEPS:
1. Login as OWNER
2. Navigate to /dashboard/projects
3. Click "New Project" button
4. Fill in form:
   - Name: "Test Project [timestamp]"
   - Client: Select or create
   - Address: "123 Test Street"
   - Budget: 50000
   - Status: Active
5. Click Save/Create
6. Wait for response

VERIFY:
[ ] Form accepts all inputs
[ ] No validation errors for valid data
[ ] Success toast appears
[ ] Redirected to project detail OR list updated
[ ] Project visible in project list
[ ] Project data matches input

CONSOLE CHECK:
[ ] Firestore write successful
[ ] No errors during creation
[ ] Activity log entry created (if applicable)

DATA VERIFICATION:
- Created project ID: ___
- Firestore document created: YES/NO

RESULT: PASS / FAIL
```

### PROJ-002: Create Project Validation
**Priority:** MAJOR
**Expected:** Form validates required fields

```
STEPS:
1. Click "New Project"
2. Leave all fields empty
3. Click Save

VERIFY:
[ ] Form validation triggers
[ ] Required field errors shown
[ ] Form not submitted
[ ] No Firestore write attempted

TEST EACH REQUIRED FIELD:
[ ] Name empty → Error shown
[ ] Client empty → Error shown (if required)
[ ] Address empty → Handles appropriately

RESULT: PASS / FAIL
VALIDATION MESSAGES: ___
```

### PROJ-003: View Project List
**Priority:** CRITICAL
**Expected:** Project list renders correctly

```
STEPS:
1. Navigate to /dashboard/projects
2. Wait for data to load

VERIFY:
[ ] Projects list renders
[ ] Each project shows name, status, client
[ ] Pagination works (if applicable)
[ ] No infinite loading
[ ] Empty state shown if no projects

LIST FEATURES:
[ ] Sort by name/date works
[ ] Filter by status works
[ ] Search by name works

CONSOLE CHECK:
[ ] Firestore query successful
[ ] No query errors
[ ] Reasonable query time (<2s)

RESULT: PASS / FAIL
PROJECT COUNT: ___
```

### PROJ-004: View Project Detail
**Priority:** CRITICAL
**Expected:** Project detail page loads correctly

```
STEPS:
1. From project list, click on a project
2. Wait for detail page to load

VERIFY:
[ ] Project name displayed
[ ] Client info displayed
[ ] Address displayed
[ ] Status displayed
[ ] Budget displayed
[ ] Created date shown
[ ] Tabs/sections for phases, tasks, etc.

VERIFY SECTIONS ACCESSIBLE:
[ ] Overview/Details
[ ] Phases (if applicable)
[ ] Tasks
[ ] Documents
[ ] Activity log

CONSOLE CHECK:
[ ] Single project fetched
[ ] Related data (phases, tasks) fetched
[ ] No permission errors

RESULT: PASS / FAIL
```

### PROJ-005: Edit Project
**Priority:** CRITICAL
**Expected:** Can update project details

```
STEPS:
1. Open project detail page
2. Click Edit button
3. Change project name to "[Original] - Edited"
4. Change budget to different value
5. Save changes

VERIFY:
[ ] Edit form pre-fills current data
[ ] Can modify fields
[ ] Save shows loading state
[ ] Success toast on save
[ ] Updated data displays correctly
[ ] Changes persist on page refresh

CONSOLE CHECK:
[ ] Firestore update successful
[ ] Activity log updated

RESULT: PASS / FAIL
```

### PROJ-006: Project Status Changes
**Priority:** CRITICAL
**Expected:** Can change project status

```
STEPS:
1. Open a project with status "active"
2. Find status change control
3. Change to "on_hold"
4. Confirm change

VERIFY:
[ ] Status updated in UI
[ ] Status persists on refresh
[ ] Project appears in correct filter view

TEST STATUS TRANSITIONS:
[ ] active → on_hold: Works
[ ] on_hold → active: Works
[ ] active → completed: Works
[ ] completed → archived: Works

CONSOLE CHECK:
[ ] Status update saved
[ ] No validation errors

RESULT: PASS / FAIL
```

### PROJ-007: Archive Project
**Priority:** MAJOR
**Expected:** Can archive projects

```
STEPS:
1. Open an active or completed project
2. Find Archive option
3. Archive the project
4. Confirm action

VERIFY:
[ ] Confirmation prompt appears
[ ] Project archived successfully
[ ] Project removed from active list (or marked)
[ ] Can view archived projects separately
[ ] Can unarchive if needed

CONSOLE CHECK:
[ ] Archive status saved
[ ] No errors

RESULT: PASS / FAIL
```

### PROJ-008: Delete Project
**Priority:** MAJOR
**Expected:** Can delete projects (with proper warnings)

```
STEPS:
1. Open a test project (preferably one created for testing)
2. Find Delete option
3. Attempt to delete

VERIFY:
[ ] Delete requires confirmation
[ ] Confirmation warns about data loss
[ ] After delete, project removed from list
[ ] Cannot access deleted project by URL

SOFT DELETE CHECK (if applicable):
[ ] Project marked as deleted (not hard deleted)
[ ] Admin can recover if needed

CONSOLE CHECK:
[ ] Delete operation logged
[ ] Related data handled (tasks, etc.)

RESULT: PASS / FAIL
```

### PROJ-009: Project Phases
**Priority:** MAJOR
**Expected:** Can manage project phases

```
STEPS:
1. Open project detail
2. Navigate to Phases section
3. Add new phase: "Foundation Work"
4. Save phase

VERIFY:
[ ] Phase added to list
[ ] Can edit phase name
[ ] Can reorder phases (if supported)
[ ] Can delete phase
[ ] Phases appear in correct order

CONSOLE CHECK:
[ ] Phases saved to subcollection
[ ] No errors

RESULT: PASS / FAIL
```

### PROJ-010: Project with No Client
**Priority:** MINOR
**Expected:** Handles projects without assigned client

```
STEPS:
1. Create project without selecting client
2. Or edit project to remove client

VERIFY:
[ ] Project can be saved
[ ] No crashes or errors
[ ] UI handles "no client" state gracefully
[ ] Can assign client later

RESULT: PASS / FAIL
```

### PROJ-011: Project Search
**Priority:** MAJOR
**Expected:** Can search projects by name

```
STEPS:
1. Go to project list
2. Find search input
3. Search for existing project name
4. Search for non-existent project

VERIFY:
[ ] Search returns matching projects
[ ] Search is case-insensitive (if designed so)
[ ] Empty results show appropriate message
[ ] Clear search shows all projects again

CONSOLE CHECK:
[ ] Search queries are efficient
[ ] No unnecessary re-fetches

RESULT: PASS / FAIL
```

### PROJ-012: Project Filter by Status
**Priority:** MAJOR
**Expected:** Can filter projects by status

```
STEPS:
1. Go to project list
2. Find status filter
3. Filter by "Active"
4. Filter by "Completed"
5. Filter by "All"

VERIFY:
[ ] Filters return correct projects
[ ] Active shows only active
[ ] Completed shows only completed
[ ] All shows everything
[ ] Counts match visible items

RESULT: PASS / FAIL
```

---

## Project Test Summary

```
| Test ID | Test Name | Status | Console Errors |
|---------|-----------|--------|----------------|
| PROJ-001 | Create Project | | |
| PROJ-002 | Validation | | |
| PROJ-003 | View List | | |
| PROJ-004 | View Detail | | |
| PROJ-005 | Edit Project | | |
| PROJ-006 | Status Change | | |
| PROJ-007 | Archive | | |
| PROJ-008 | Delete | | |
| PROJ-009 | Phases | | |
| PROJ-010 | No Client | | |
| PROJ-011 | Search | | |
| PROJ-012 | Filter | | |

TOTAL: 12 tests
PASSED: ___
FAILED: ___
```

## Console Error Summary

```
Unique Errors Found:
1.
2.

By Test:
- PROJ-001: ___
- PROJ-003: ___
- etc.
```

## Next Suite

→ Proceed to Suite 04: Client CRM Tests
