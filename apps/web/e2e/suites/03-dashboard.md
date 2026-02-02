# Suite 03: Dashboard Functionality

Tests for the main dashboard page features, stats, and interactions.

---

## TEST: Dashboard Stats Accuracy
**Priority:** P1
**Roles:** owner
**Viewports:** desktop

### Steps
1. Navigate to /dashboard
2. Note the stats displayed
3. Navigate to /dashboard/projects and count active projects
4. Compare counts

### Expected Results
- ✓ "Active Projects" count matches actual active projects
- ✓ "Pipeline" count matches lead/bidding/planning projects
- ✓ Stats update after creating/modifying projects

---

## TEST: Dashboard Stats Cards Clickable
**Priority:** P2
**Roles:** owner
**Viewports:** desktop

### Steps
1. Click on "Active Projects" stat card
2. Click on "Outstanding" stat card
3. Click on "Team" stat card

### Expected Results
- ✓ Active Projects navigates to /dashboard/projects
- ✓ Outstanding navigates to /dashboard/invoices
- ✓ Team navigates to /dashboard/team

---

## TEST: Active Projects List
**Priority:** P1
**Roles:** owner
**Viewports:** desktop

### Steps
1. View Active Projects section on dashboard
2. Click on a project row

### Expected Results
- ✓ Projects display name, client, location, phase
- ✓ Budget and % spent visible
- ✓ Clicking navigates to project detail page
- ✓ "View all" link navigates to projects list

---

## TEST: Overdue Tasks Section
**Priority:** P1
**Roles:** owner
**Viewports:** desktop

### Preconditions
- At least one overdue task exists

### Steps
1. View Overdue Tasks section (red card on right)
2. Click on an overdue task

### Expected Results
- ✓ Red background indicates urgency
- ✓ Shows count of overdue tasks
- ✓ Lists task names and days overdue
- ✓ Clicking navigates to project tasks

---

## TEST: Pending Estimates Section
**Priority:** P2
**Roles:** owner
**Viewports:** desktop

### Steps
1. View Pending Estimates section
2. Click "View all"
3. Click "New Estimate" button

### Expected Results
- ✓ Shows estimates with status "sent" or "viewed"
- ✓ Displays client name and amount
- ✓ "View all" goes to /dashboard/estimates
- ✓ "New Estimate" goes to estimate creation

---

## TEST: Quick Actions Functionality
**Priority:** P1
**Roles:** owner
**Viewports:** desktop

### Steps
1. Click "Create Invoice" in Quick Actions
2. Go back, click "Invite Team Member"
3. Go back, click "New Estimate"

### Expected Results
- ✓ Create Invoice → /dashboard/invoices/new
- ✓ Invite Team Member → /dashboard/team/invite
- ✓ New Estimate → /dashboard/estimates/new
- ✓ All links work correctly

---

## TEST: Recent Activity Feed
**Priority:** P2
**Roles:** owner
**Viewports:** desktop

### Steps
1. Scroll to Recent Activity section
2. Examine activity items
3. Click "View all"

### Expected Results
- ✓ Shows recent actions (created, updated, etc.)
- ✓ Shows user name and timestamp
- ✓ "View all" navigates to activity page

---

## TEST: Dashboard New User State
**Priority:** P2
**Roles:** owner (new org)
**Viewports:** desktop

### Preconditions
- Organization with 0 projects

### Steps
1. View dashboard with no projects

### Expected Results
- ✓ Empty state shown for Active Projects
- ✓ Setup guide banner visible
- ✓ "Create Your First Project" CTA visible
- ✓ "Configure Settings" CTA visible

---

## TEST: Dashboard Loading State
**Priority:** P2
**Roles:** owner
**Viewports:** desktop

### Steps
1. Refresh dashboard page
2. Observe loading state

### Expected Results
- ✓ Skeleton loaders shown while loading
- ✓ No flash of empty content
- ✓ Data appears smoothly after load

---

## TEST: Dashboard Error State
**Priority:** P2
**Roles:** owner
**Viewports:** desktop

### Steps
1. Simulate network error (if possible)
2. Observe error handling

### Expected Results
- ✓ Error message displayed
- ✓ "Retry" button available
- ✓ App doesn't crash
- ✓ Console shows helpful error

---

## TEST: Dashboard Mobile Layout
**Priority:** P1
**Roles:** owner
**Viewports:** mobile (375x812)

### Steps
1. Resize to mobile viewport
2. Navigate to /dashboard
3. Scroll through entire page

### Expected Results
- ✓ Stats cards stack in 2-column grid
- ✓ No horizontal scroll
- ✓ All content accessible via scroll
- ✓ Quick Actions accessible
- ✓ Text readable without zoom
- ✓ Touch targets min 44px

---

## TEST: Dashboard Tablet Layout
**Priority:** P2
**Roles:** owner
**Viewports:** tablet (768x1024)

### Steps
1. Resize to tablet viewport
2. Navigate to /dashboard

### Expected Results
- ✓ Stats cards in 3-column grid
- ✓ Main content in reasonable layout
- ✓ Sidebar may be collapsed or visible

---

## TEST: Dashboard Real-time Updates
**Priority:** P3
**Roles:** owner
**Viewports:** desktop

### Steps
1. Open dashboard in two browser tabs
2. In tab 2, create a new project
3. Observe tab 1

### Expected Results
- ✓ Tab 1 updates automatically OR
- ✓ Refresh shows new data

---

## Dashboard Test Summary

```
DASHBOARD TEST RESULTS
======================
Stats Accuracy:         [PASS/FAIL]
Stats Clickable:        [PASS/FAIL]
Active Projects List:   [PASS/FAIL]
Overdue Tasks:          [PASS/FAIL]
Pending Estimates:      [PASS/FAIL]
Quick Actions:          [PASS/FAIL]
Activity Feed:          [PASS/FAIL]
New User State:         [PASS/FAIL]
Loading State:          [PASS/FAIL]
Error State:            [PASS/FAIL]
Mobile Layout:          [PASS/FAIL]
Tablet Layout:          [PASS/FAIL]
Real-time Updates:      [PASS/FAIL]

Overall: [X/13 PASSED]
```
