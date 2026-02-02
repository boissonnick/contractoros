# Suite 00: Smoke Tests

Quick sanity checks to verify the application is functional. Run these first before any other tests.

---

## TEST: App Loads Successfully
**Priority:** P0
**Roles:** any
**Viewports:** desktop

### Steps
1. Navigate to {baseUrl}
2. Wait for page to fully load (no loading spinners)

### Expected Results
- ✓ Page loads without errors
- ✓ No console errors (check with read_console_messages)
- ✓ ContractorOS logo is visible
- ✓ Either login page OR dashboard is displayed

### On Failure
- Check if dev server is running (`npm run dev`)
- Check browser console for errors

---

## TEST: Authentication Redirect
**Priority:** P0
**Roles:** unauthenticated
**Viewports:** desktop

### Steps
1. Navigate to {baseUrl}/dashboard
2. Observe redirect behavior

### Expected Results
- ✓ Redirected to login page OR
- ✓ Dashboard loads if already authenticated

---

## TEST: Dashboard Loads for Owner
**Priority:** P0
**Roles:** owner
**Viewports:** desktop

### Steps
1. Navigate to {baseUrl}/dashboard
2. Ensure logged in as Owner
3. Wait for dashboard to fully load

### Expected Results
- ✓ "Welcome back" message is visible
- ✓ Stats cards are visible (Active Projects, Outstanding, etc.)
- ✓ Active Projects list is visible
- ✓ Quick Actions card is visible
- ✓ Navigation sidebar is visible
- ✓ No error messages displayed

---

## TEST: Navigation Works
**Priority:** P0
**Roles:** owner
**Viewports:** desktop

### Steps
1. From dashboard, click "Projects" in sidebar
2. Wait for page load
3. Click "Clients" in sidebar
4. Wait for page load
5. Click "Dashboard" in sidebar

### Expected Results
- ✓ Each page loads without error
- ✓ URL changes correctly (/dashboard/projects, /dashboard/clients, /dashboard)
- ✓ Page content changes appropriately
- ✓ No console errors during navigation

---

## TEST: Mobile Viewport Renders
**Priority:** P0
**Roles:** owner
**Viewports:** mobile (375x812)

### Steps
1. Resize browser to 375x812
2. Navigate to {baseUrl}/dashboard
3. Take screenshot

### Expected Results
- ✓ Page renders without horizontal scroll
- ✓ Mobile navigation (hamburger menu) is visible
- ✓ Content is readable
- ✓ No elements overflow the viewport

---

## TEST: API Health Check
**Priority:** P0
**Roles:** owner
**Viewports:** desktop

### Steps
1. Navigate to dashboard
2. Open Network tab / check network requests
3. Verify Firestore queries complete

### Expected Results
- ✓ No 500 errors in network requests
- ✓ No "permission-denied" errors
- ✓ No "requires an index" errors
- ✓ Data loads within 5 seconds

---

## Smoke Test Summary

After running all smoke tests, output:

```
SMOKE TEST RESULTS
==================
App Loads:        [PASS/FAIL]
Auth Redirect:    [PASS/FAIL]
Dashboard Loads:  [PASS/FAIL]
Navigation:       [PASS/FAIL]
Mobile Viewport:  [PASS/FAIL]
API Health:       [PASS/FAIL]

Overall: [X/6 PASSED]
```

If any smoke test fails, STOP and report the failure before running other suites.
