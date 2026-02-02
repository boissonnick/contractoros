# Suite 01: Authentication & Authorization

Tests for login, logout, session management, and basic auth flows.

---

## TEST: Login Page Elements
**Priority:** P1
**Roles:** unauthenticated
**Viewports:** desktop, mobile

### Steps
1. Navigate to {baseUrl}/login (or be redirected there)
2. Examine page elements

### Expected Results
- ✓ Email input field is visible
- ✓ Password input field is visible
- ✓ "Sign In" button is visible
- ✓ "Forgot Password" link is visible (if implemented)
- ✓ ContractorOS branding is visible

---

## TEST: Login Form Validation
**Priority:** P1
**Roles:** unauthenticated
**Viewports:** desktop

### Steps
1. Navigate to login page
2. Click "Sign In" without entering credentials
3. Enter invalid email format, click Sign In
4. Enter valid email, leave password empty, click Sign In

### Expected Results
- ✓ Empty form shows validation error
- ✓ Invalid email shows format error
- ✓ Missing password shows error
- ✓ Form does not submit with invalid data

---

## TEST: Successful Login
**Priority:** P0
**Roles:** owner (test account)
**Viewports:** desktop

### Steps
1. Navigate to login page
2. Enter valid test credentials
3. Click Sign In
4. Wait for redirect

### Expected Results
- ✓ Loading indicator appears during auth
- ✓ Redirected to /dashboard on success
- ✓ User name appears in UI
- ✓ Session is established (can navigate to protected routes)

---

## TEST: Login Error Handling
**Priority:** P1
**Roles:** unauthenticated
**Viewports:** desktop

### Steps
1. Navigate to login page
2. Enter valid email with wrong password
3. Click Sign In

### Expected Results
- ✓ Error message is displayed
- ✓ Message does not reveal if email exists (security)
- ✓ Form remains usable (can retry)
- ✓ Password field is cleared

---

## TEST: Logout Flow
**Priority:** P0
**Roles:** owner
**Viewports:** desktop

### Steps
1. Login as Owner
2. Find and click "Sign Out" button
3. Observe redirect

### Expected Results
- ✓ User is logged out
- ✓ Redirected to login page
- ✓ Cannot access /dashboard without re-authenticating
- ✓ Session is cleared (localStorage check)

---

## TEST: Session Persistence
**Priority:** P1
**Roles:** owner
**Viewports:** desktop

### Steps
1. Login as Owner
2. Navigate to dashboard
3. Refresh the page (F5)
4. Navigate to a different route
5. Refresh again

### Expected Results
- ✓ Session persists across page refreshes
- ✓ User remains logged in
- ✓ No re-authentication required

---

## TEST: Protected Route Access (Unauthenticated)
**Priority:** P0
**Roles:** unauthenticated
**Viewports:** desktop

### Steps
1. Clear session/logout
2. Directly navigate to {baseUrl}/dashboard/projects
3. Observe behavior

### Expected Results
- ✓ Redirected to login page
- ✓ Dashboard content is NOT visible
- ✓ No sensitive data exposed

---

## TEST: Deep Link After Login
**Priority:** P2
**Roles:** unauthenticated → owner
**Viewports:** desktop

### Steps
1. While logged out, navigate to {baseUrl}/dashboard/projects/new
2. Login with valid credentials
3. Observe redirect after login

### Expected Results
- ✓ After login, redirected to originally requested URL
- ✓ OR redirected to dashboard (acceptable)

---

## TEST: Mobile Login
**Priority:** P1
**Roles:** unauthenticated
**Viewports:** mobile (375x812)

### Steps
1. Resize to mobile viewport
2. Navigate to login page
3. Complete login flow

### Expected Results
- ✓ Form is fully visible without scrolling
- ✓ Input fields are touch-friendly (min 44px height)
- ✓ Keyboard doesn't obscure submit button
- ✓ Login completes successfully

---

## Auth Test Summary

```
AUTH TEST RESULTS
=================
Login Page Elements:    [PASS/FAIL]
Form Validation:        [PASS/FAIL]
Successful Login:       [PASS/FAIL]
Error Handling:         [PASS/FAIL]
Logout Flow:            [PASS/FAIL]
Session Persistence:    [PASS/FAIL]
Protected Routes:       [PASS/FAIL]
Deep Link:              [PASS/FAIL]
Mobile Login:           [PASS/FAIL]

Overall: [X/9 PASSED]
```
