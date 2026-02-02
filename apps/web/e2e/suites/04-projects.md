# Suite 04: Projects

Tests for project CRUD operations and management features.

---

## TEST: Projects List Page Loads
**Priority:** P0
**Roles:** owner
**Viewports:** desktop

### Steps
1. Navigate to /dashboard/projects
2. Observe page load

### Expected Results
- ✓ Page title "Projects" visible
- ✓ Project cards/list displayed
- ✓ "New Project" button visible
- ✓ Filter/sort options available

---

## TEST: Create New Project
**Priority:** P0
**Roles:** owner, project_manager
**Viewports:** desktop

### Steps
1. Click "New Project" button
2. Fill required fields:
   - Name: "E2E Test Project"
   - Client: Select existing
   - Address: "123 Test St"
3. Submit form

### Expected Results
- ✓ Form submits successfully
- ✓ Redirected to new project detail page
- ✓ Success toast appears
- ✓ Project appears in projects list

### Cleanup
Delete test project after verification.

---

## TEST: Project Detail Page
**Priority:** P0
**Roles:** owner
**Viewports:** desktop

### Steps
1. Navigate to any project detail page
2. Examine available tabs/sections

### Expected Results
- ✓ Project name in header
- ✓ Client info visible
- ✓ Status badge visible
- ✓ Tabs available: Overview, Tasks, Documents, Photos, etc.

---

## TEST: Edit Project
**Priority:** P1
**Roles:** owner, project_manager
**Viewports:** desktop

### Steps
1. Open existing project
2. Click edit/settings
3. Modify project name
4. Save changes

### Expected Results
- ✓ Edit form pre-populated
- ✓ Changes save successfully
- ✓ Updated name visible

---

## TEST: Project Status Change
**Priority:** P1
**Roles:** owner, project_manager
**Viewports:** desktop

### Steps
1. Open project in "active" status
2. Change status to "on_hold"
3. Save

### Expected Results
- ✓ Status dropdown works
- ✓ New status saved
- ✓ Status badge updates

---

## TEST: Archive Project
**Priority:** P2
**Roles:** owner
**Viewports:** desktop

### Steps
1. Open project
2. Archive project

### Expected Results
- ✓ Project marked as archived
- ✓ Hidden from main list (or filtered)
- ✓ Can be found in archived view

---

## TEST: Project Filtering
**Priority:** P1
**Roles:** owner
**Viewports:** desktop

### Steps
1. Go to projects list
2. Filter by status "active"
3. Filter by client

### Expected Results
- ✓ Filters apply correctly
- ✓ List updates immediately
- ✓ Can combine filters
- ✓ Can clear filters

---

## TEST: Project Search
**Priority:** P1
**Roles:** owner
**Viewports:** desktop

### Steps
1. Go to projects list
2. Search for project by name

### Expected Results
- ✓ Search results appear
- ✓ Partial matches work
- ✓ No results shows empty state

---

## TEST: Project Phases
**Priority:** P2
**Roles:** owner
**Viewports:** desktop

### Steps
1. Open project detail
2. View phases section
3. Change current phase

### Expected Results
- ✓ Phases displayed
- ✓ Current phase highlighted
- ✓ Can advance to next phase

---

## TEST: Project Budget Display
**Priority:** P1
**Roles:** owner, project_manager, finance
**Viewports:** desktop

### Steps
1. Open project with budget set
2. Examine budget section

### Expected Results
- ✓ Budget amount visible
- ✓ Spent amount visible
- ✓ Progress bar/percentage visible
- ✓ Budget status indicator (on track, over, etc.)

---

## Projects Test Summary

```
PROJECTS TEST RESULTS
=====================
List Page Loads:    [PASS/FAIL]
Create Project:     [PASS/FAIL]
Detail Page:        [PASS/FAIL]
Edit Project:       [PASS/FAIL]
Status Change:      [PASS/FAIL]
Archive Project:    [PASS/FAIL]
Filtering:          [PASS/FAIL]
Search:             [PASS/FAIL]
Phases:             [PASS/FAIL]
Budget Display:     [PASS/FAIL]

Overall: [X/10 PASSED]
```
