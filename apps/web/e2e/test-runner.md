# ContractorOS E2E Test Runner

## How to Run Tests with Claude

Use Claude Code with the Chrome MCP to run these tests. Start each test session with:

```
Run the E2E tests for ContractorOS. The app is running at http://localhost:3000
```

---

## Test Suites

### 1. Authentication & Role Tests

#### Test: Client Data Isolation (BUG #1 Fix Verification)
```
1. Navigate to http://localhost:3000
2. Login as a CLIENT user (use demo mode if available)
3. Go to /dashboard
4. VERIFY: Only see projects where clientId matches user
5. VERIFY: Cannot see other clients' project names, budgets, or data
6. VERIFY: No team count, no financial stats visible
7. Take a screenshot for evidence
```

#### Test: PM Payroll Access Denied (BUG #3 Fix Verification)
```
1. Login as OWNER, then switch to Project Manager role via impersonation
2. Navigate to /dashboard/payroll
3. VERIFY: Access Denied page appears
4. VERIFY: Message shows "Your current role: PROJECT MANAGER"
5. VERIFY: "(Demo Mode)" indicator is visible
```

#### Test: Employee/Contractor Hidden Buttons (BUG #5 & #6 Fix Verification)
```
1. Login and impersonate as EMPLOYEE role
2. Navigate to /dashboard
3. VERIFY: "New Project" button is NOT visible
4. VERIFY: "New Estimate" button is NOT visible
5. VERIFY: Quick Actions card is NOT visible
6. VERIFY: "Create Invoice" is NOT visible
7. Repeat for CONTRACTOR role
```

---

### 2. Mobile Responsiveness Tests

#### Test: Dashboard Mobile Layout
```
1. Resize browser to 375x812 (iPhone X)
2. Navigate to /dashboard
3. VERIFY: Stats cards stack vertically (not 6-column grid)
4. VERIFY: Navigation hamburger menu appears
5. VERIFY: Quick Actions are accessible
6. VERIFY: No horizontal scroll
7. Take screenshot
```

#### Test: Project List Mobile
```
1. Resize to 375x812
2. Navigate to /dashboard/projects
3. VERIFY: Project cards are full-width
4. VERIFY: Action buttons are touch-friendly (min 44px)
5. VERIFY: Text is readable without zooming
```

#### Test: Forms on Mobile
```
1. Resize to 375x812
2. Navigate to /dashboard/projects/new
3. VERIFY: Form fields are full-width
4. VERIFY: Labels are visible
5. VERIFY: Submit button is accessible
6. VERIFY: Keyboard doesn't obscure inputs
```

---

### 3. Functional Tests

#### Test: Create Project Flow
```
1. Login as OWNER
2. Click "New Project"
3. Fill in: Name="Test Project", Client="Demo Client"
4. Submit form
5. VERIFY: Redirected to project detail page
6. VERIFY: Project appears in project list
7. VERIFY: Activity log shows "created project"
```

#### Test: Impersonation Mode
```
1. Login as OWNER
2. Find impersonation selector
3. Switch to CLIENT role
4. VERIFY: Amber "Demo Mode" banner appears
5. VERIFY: Dashboard shows client-limited view
6. Click "Exit Demo Mode"
7. VERIFY: Full dashboard restored
```

---

## Running Tests

### Desktop Testing
```bash
# Start the app
cd apps/web && npm run dev

# In Claude Code, say:
"Run the Authentication & Role Tests suite against localhost:3000"
```

### Mobile Testing
```bash
# In Claude Code, say:
"Run the Mobile Responsiveness Tests suite.
Resize the browser to 375x812 before each test."
```

---

## Viewport Sizes for Testing

| Device | Width | Height |
|--------|-------|--------|
| iPhone SE | 375 | 667 |
| iPhone X/11/12 | 375 | 812 |
| iPhone 12 Pro Max | 428 | 926 |
| iPad | 768 | 1024 |
| iPad Pro | 1024 | 1366 |
| Desktop | 1280 | 800 |
| Desktop Large | 1920 | 1080 |

