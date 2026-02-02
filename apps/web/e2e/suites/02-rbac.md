# Suite 02: Role-Based Access Control (RBAC)

Tests for permission enforcement across all user roles. Uses impersonation feature to test each role.

---

## SETUP: Enable Impersonation Mode

Before running RBAC tests:
1. Login as Owner
2. Verify impersonation selector is visible in bottom-right
3. Confirm you can switch between roles

---

## TEST: Owner Has Full Access
**Priority:** P0
**Roles:** owner
**Viewports:** desktop

### Steps
1. Login as Owner (or impersonate Owner)
2. Check navigation sidebar
3. Visit each major section

### Expected Results
- ✓ All nav items visible: Dashboard, Projects, Clients, Team, Schedule, Daily Logs, Finances, Payroll, Messaging, Reports, Settings
- ✓ Can access /dashboard/payroll
- ✓ Can access /dashboard/settings
- ✓ "New Project" and "New Estimate" buttons visible
- ✓ Quick Actions card visible with all actions

---

## TEST: Project Manager - Dashboard View
**Priority:** P0
**Roles:** project_manager
**Viewports:** desktop

### Steps
1. Impersonate Project Manager role
2. Navigate to /dashboard
3. Examine visible elements

### Expected Results
- ✓ Stats cards visible (Active Projects, Outstanding, Tasks, etc.)
- ✓ "New Project" button IS visible
- ✓ "New Estimate" button IS visible
- ✓ Quick Actions card visible
- ✓ Payroll link IS in navigation (but access denied on click)

---

## TEST: Project Manager - Payroll Access Denied
**Priority:** P0 (Security Critical)
**Roles:** project_manager
**Viewports:** desktop

### Steps
1. Impersonate Project Manager role
2. Click Payroll in navigation OR navigate to /dashboard/payroll
3. Observe result

### Expected Results
- ✓ "Access Denied" message displayed
- ✓ Message states: "Payroll data is restricted to Owner and Finance Manager roles only"
- ✓ Shows "Your current role: PROJECT MANAGER"
- ✓ "Return to Dashboard" button visible
- ✓ No payroll data is visible

### Screenshot Required
Take screenshot of access denied page for evidence.

---

## TEST: Project Manager - Settings Access
**Priority:** P1
**Roles:** project_manager
**Viewports:** desktop

### Steps
1. Impersonate Project Manager
2. Navigate to /dashboard/settings
3. Check available settings tabs

### Expected Results
- ✓ Settings page loads (PM has canViewSettings)
- ✓ Templates tab accessible
- ✓ Organization tab may be restricted
- ✓ Roles & Permissions restricted

---

## TEST: Finance Manager - Dashboard View
**Priority:** P1
**Roles:** finance
**Viewports:** desktop

### Steps
1. Impersonate Finance Manager
2. Navigate to /dashboard
3. Examine visible elements

### Expected Results
- ✓ Financial stats visible (Outstanding, Budget)
- ✓ "New Project" button NOT visible
- ✓ Payroll link in navigation
- ✓ Finances link in navigation

---

## TEST: Finance Manager - Payroll Access Granted
**Priority:** P0
**Roles:** finance
**Viewports:** desktop

### Steps
1. Impersonate Finance Manager
2. Navigate to /dashboard/payroll

### Expected Results
- ✓ Payroll page loads successfully
- ✓ Payroll data is visible
- ✓ Can view payroll runs
- ✓ No access denied message

---

## TEST: Employee - Limited Dashboard
**Priority:** P0
**Roles:** employee
**Viewports:** desktop

### Steps
1. Impersonate Employee role
2. Navigate to /dashboard
3. Examine visible elements

### Expected Results
- ✓ "Welcome back" message visible
- ✓ Only 2 stats cards: Active Projects, Team
- ✓ NO "New Project" button
- ✓ NO "New Estimate" button
- ✓ NO Quick Actions card
- ✓ NO Outstanding/Budget/Overdue stats
- ✓ Navigation limited: Dashboard, Projects, Team, Schedule, Time Tracking, Daily Logs, Messaging

### Screenshot Required
Take screenshot showing limited employee view.

---

## TEST: Employee - No Admin Navigation
**Priority:** P1
**Roles:** employee
**Viewports:** desktop

### Steps
1. Impersonate Employee
2. Check navigation sidebar

### Expected Results
- ✓ NO Clients link
- ✓ NO Finances link
- ✓ NO Payroll link
- ✓ NO Reports link
- ✓ NO Settings link

---

## TEST: Contractor - Minimal Access
**Priority:** P1
**Roles:** contractor
**Viewports:** desktop

### Steps
1. Impersonate Contractor role
2. Navigate to /dashboard
3. Examine visible elements

### Expected Results
- ✓ Similar to Employee view
- ✓ NO Team link in navigation
- ✓ Time Tracking available
- ✓ Assigned projects only visible

---

## TEST: Client - Isolated View (Critical Security)
**Priority:** P0 (Security Critical)
**Roles:** client
**Viewports:** desktop

### Steps
1. Impersonate Client role
2. Navigate to /dashboard
3. Count visible projects
4. Examine navigation

### Expected Results
- ✓ Welcome message: "Here's the status of your projects." (different text)
- ✓ Only "My Projects" and "Project Progress" stats visible
- ✓ ONLY client's own projects visible (not all org projects)
- ✓ NO financial data visible
- ✓ NO team count visible
- ✓ Navigation: My Projects, Photos, Messages, Documents ONLY
- ✓ NO admin buttons anywhere

### Screenshot Required
Take screenshot showing client isolation.

---

## TEST: Client - Cannot See Other Projects
**Priority:** P0 (Security Critical)
**Roles:** client
**Viewports:** desktop

### Steps
1. Impersonate Client
2. Note the number of projects visible
3. Compare to Owner view project count

### Expected Results
- ✓ Client sees FEWER projects than Owner
- ✓ Only projects where clientId matches user
- ✓ No budget/financial details of other clients visible

---

## TEST: Client - No Admin Routes
**Priority:** P0 (Security Critical)
**Roles:** client
**Viewports:** desktop

### Steps
1. Impersonate Client
2. Manually navigate to /dashboard/settings
3. Manually navigate to /dashboard/payroll
4. Manually navigate to /dashboard/team

### Expected Results
- ✓ /dashboard/settings shows Access Denied
- ✓ /dashboard/payroll shows Access Denied
- ✓ /dashboard/team shows Access Denied OR redirects

---

## TEST: Assistant - Limited Admin
**Priority:** P2
**Roles:** assistant
**Viewports:** desktop

### Steps
1. Impersonate Assistant role
2. Check permissions

### Expected Results
- ✓ Can view all projects
- ✓ Can edit projects
- ✓ Cannot delete projects
- ✓ Cannot access payroll
- ✓ Cannot manage roles
- ✓ Can manage templates

---

## TEST: Impersonation Banner Visible
**Priority:** P1
**Roles:** any (while impersonating)
**Viewports:** desktop

### Steps
1. Impersonate any non-owner role
2. Check for visual indicator

### Expected Results
- ✓ Amber banner at top: "Viewing as: [Role]"
- ✓ "Exit" button visible
- ✓ "DEMO" badge on role selector
- ✓ Banner disappears after exit

---

## TEST: Exit Impersonation Mode
**Priority:** P1
**Roles:** any → owner
**Viewports:** desktop

### Steps
1. While impersonating, click "Exit" or "Exit Impersonation Mode"
2. Observe changes

### Expected Results
- ✓ Returns to Owner view
- ✓ All permissions restored
- ✓ Amber banner removed
- ✓ Full navigation visible

---

## RBAC Test Summary

```
RBAC TEST RESULTS
=================
Owner Full Access:          [PASS/FAIL]
PM Dashboard:               [PASS/FAIL]
PM Payroll Denied:          [PASS/FAIL] ⚠️ CRITICAL
PM Settings:                [PASS/FAIL]
Finance Dashboard:          [PASS/FAIL]
Finance Payroll Granted:    [PASS/FAIL]
Employee Limited:           [PASS/FAIL]
Employee No Admin Nav:      [PASS/FAIL]
Contractor Minimal:         [PASS/FAIL]
Client Isolated:            [PASS/FAIL] ⚠️ CRITICAL
Client No Other Projects:   [PASS/FAIL] ⚠️ CRITICAL
Client No Admin Routes:     [PASS/FAIL] ⚠️ CRITICAL
Assistant Limited:          [PASS/FAIL]
Impersonation Banner:       [PASS/FAIL]
Exit Impersonation:         [PASS/FAIL]

Overall: [X/15 PASSED]
Critical Security Tests: [X/4 PASSED]
```

⚠️ If ANY critical security test fails, this is a BLOCKER for release.
