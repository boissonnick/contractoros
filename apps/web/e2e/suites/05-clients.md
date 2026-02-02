# Suite 05: Client CRM

Tests for client management functionality.

---

## TEST: Clients List Page
**Priority:** P0
**Roles:** owner, project_manager
**Viewports:** desktop

### Steps
1. Navigate to /dashboard/clients
2. Observe page layout

### Expected Results
- ✓ "Clients" page title
- ✓ Client cards/list displayed
- ✓ "Add Client" button visible
- ✓ Search/filter available
- ✓ Client stats visible (total, active, etc.)

---

## TEST: Add New Client
**Priority:** P0
**Roles:** owner, project_manager
**Viewports:** desktop

### Steps
1. Click "Add Client" button
2. Fill client form:
   - Name: "E2E Test Client"
   - Email: "test@example.com"
   - Phone: "555-0100"
3. Submit

### Expected Results
- ✓ Modal/form appears
- ✓ Form validates required fields
- ✓ Client created successfully
- ✓ Appears in client list
- ✓ Success toast shown

### Cleanup
Delete test client after verification.

---

## TEST: Client Detail View
**Priority:** P1
**Roles:** owner, project_manager
**Viewports:** desktop

### Steps
1. Click on existing client
2. Examine detail view

### Expected Results
- ✓ Client name prominent
- ✓ Contact info visible
- ✓ Associated projects listed
- ✓ Communication history (if implemented)
- ✓ Notes section visible

---

## TEST: Edit Client
**Priority:** P1
**Roles:** owner, project_manager
**Viewports:** desktop

### Steps
1. Open client detail
2. Click edit
3. Modify phone number
4. Save

### Expected Results
- ✓ Edit form pre-populated
- ✓ Changes save successfully
- ✓ Updated info visible

---

## TEST: Client Status
**Priority:** P2
**Roles:** owner
**Viewports:** desktop

### Steps
1. View client
2. Change status (active/inactive/potential)

### Expected Results
- ✓ Status can be changed
- ✓ Status badge updates
- ✓ Filters respect status

---

## TEST: Client Filtering
**Priority:** P1
**Roles:** owner
**Viewports:** desktop

### Steps
1. Filter by status "active"
2. Filter by source (if available)
3. Search by name

### Expected Results
- ✓ Filters work correctly
- ✓ Combined filters work
- ✓ Search returns matches

---

## TEST: Client-Project Association
**Priority:** P1
**Roles:** owner
**Viewports:** desktop

### Steps
1. View client with projects
2. Click on associated project

### Expected Results
- ✓ Projects listed under client
- ✓ Click navigates to project
- ✓ Project count accurate

---

## TEST: Delete Client
**Priority:** P2
**Roles:** owner
**Viewports:** desktop

### Preconditions
- Client has no associated projects

### Steps
1. Open client with no projects
2. Attempt to delete

### Expected Results
- ✓ Confirmation dialog shown
- ✓ Client deleted on confirm
- ✓ Removed from list

---

## TEST: Client with Projects - Delete Prevention
**Priority:** P1
**Roles:** owner
**Viewports:** desktop

### Preconditions
- Client has associated projects

### Steps
1. Open client with projects
2. Attempt to delete

### Expected Results
- ✓ Warning about associated projects
- ✓ Delete prevented OR
- ✓ Projects must be reassigned first

---

## Clients Test Summary

```
CLIENTS TEST RESULTS
====================
List Page:          [PASS/FAIL]
Add Client:         [PASS/FAIL]
Detail View:        [PASS/FAIL]
Edit Client:        [PASS/FAIL]
Client Status:      [PASS/FAIL]
Filtering:          [PASS/FAIL]
Project Association:[PASS/FAIL]
Delete Client:      [PASS/FAIL]
Delete Prevention:  [PASS/FAIL]

Overall: [X/9 PASSED]
```
