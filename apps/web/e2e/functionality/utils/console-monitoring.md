# Console Error Monitoring Protocol

## Overview

This document describes how to capture, categorize, and report console errors during test execution.

---

## Setup: Before Testing

### 1. Open DevTools Console

```
1. Press F12 (or Cmd+Option+I on Mac)
2. Go to Console tab
3. Right-click → Clear console
4. Check "Preserve log" option
5. Ensure all log levels enabled (Errors, Warnings, Info)
```

### 2. Configure Console Filters

**Enable these log types:**
- [x] Errors (red)
- [x] Warnings (yellow)
- [ ] Info (blue) - optional
- [ ] Debug - usually not needed

### 3. Open Network Tab

```
1. Switch to Network tab
2. Clear existing requests
3. Check "Preserve log"
4. Note: Red entries = failed requests
```

---

## During Testing: What to Capture

### Error Categories

| Category | Console Appearance | Example |
|----------|-------------------|---------|
| **TypeError** | Red, starts with "Uncaught TypeError" | Cannot read property 'x' of undefined |
| **ReferenceError** | Red, starts with "Uncaught ReferenceError" | x is not defined |
| **SyntaxError** | Red, module load failed | Unexpected token |
| **React Error** | Red, React component stack | Error boundary, hook errors |
| **Firebase Error** | Red/Yellow, FirebaseError | Permission denied, auth errors |
| **Network Error** | Red in Network tab | 4xx, 5xx status codes |
| **Console.error()** | Red, from app code | Custom error logging |
| **Warnings** | Yellow | Deprecation, performance |

### What to Record for Each Error

1. **Error Type** (TypeError, FirebaseError, etc.)
2. **Full Message** (copy complete text)
3. **Stack Trace** (expand and copy)
4. **Timestamp** (note approximate time)
5. **Trigger Action** (what user action caused it)
6. **Current URL** (what page were you on)
7. **Test ID** (which test was running)

---

## Error Recording Template

```markdown
### Console Error

**Type:** TypeError
**Message:** Cannot read property 'name' of undefined
**Stack Trace:**
    at ProjectList (ProjectList.tsx:45)
    at renderWithHooks (react-dom.development.js:14985)
    at mountIndeterminateComponent (react-dom.development.js:17811)
**Timestamp:** 10:15:32 AM
**Trigger:** Clicked "Projects" in navigation
**URL:** /dashboard/projects
**Test ID:** PROJ-003
**Frequency:** 1 (first occurrence)
```

---

## Ignore List

These console messages are expected and should NOT be reported as issues:

### Development Noise
```
- "Download the React DevTools for a better development experience"
- "[HMR] connected"
- "Fast Refresh rebuilding"
- "Warning: ReactDOM.render is deprecated"
- Any message containing "hot-update"
```

### Expected Firebase Messages
```
- "[Firebase] Auth state changed" (info)
- Token refresh messages
```

### Expected Network
```
- Requests to *.hot-update.json
- Requests to _next/webpack-hmr
- Favicon.ico 404 (usually harmless)
```

---

## Error Severity Classification

### BLOCKER (Fix Immediately)
- Application crashes (white screen)
- Uncaught exceptions that prevent user actions
- Security-related errors
- Data corruption errors

### CRITICAL (Fix Before Release)
- Errors that break specific features
- Errors that occur on every page load
- React component unmount/mount errors causing UI issues

### MAJOR (Current Sprint)
- Errors on specific user flows
- Errors that occur intermittently
- Performance warnings affecting UX

### MINOR (Next Sprint)
- Cosmetic console warnings
- Deprecation notices
- Low-frequency edge case errors

---

## Common ContractorOS Error Patterns

### Pattern 1: Undefined Property Access

```javascript
// Error: Cannot read property 'name' of undefined
// Common in: Lists loading before data arrives

// Look for: Missing loading states, missing null checks
// Fix: Add optional chaining (?.) or loading guards
```

### Pattern 2: Firebase Permission Denied

```javascript
// Error: FirebaseError: Missing or insufficient permissions
// Common in: Role-restricted pages, cross-org access

// Look for: Firestore rules mismatch, user not in correct org
// Fix: Update firestore.rules, check user authentication
```

### Pattern 3: React Hook Dependency Warning

```javascript
// Warning: React Hook useEffect has a missing dependency
// Common in: All components with hooks

// Usually safe to ignore unless causing infinite loops
// Fix: Add dependencies or use eslint-disable-next-line
```

### Pattern 4: Timestamp Conversion Error

```javascript
// Error: Cannot read property 'toDate' of undefined
// Common in: Firestore data display

// Cause: Timestamp field is null/undefined
// Fix: Use optional chaining: timestamp?.toDate()
```

---

## End of Test: Export Console

### Method 1: Manual Copy

1. Right-click in console
2. Select "Save as..." to save console.log file
3. Or select all (Cmd+A) and copy

### Method 2: Console API

```javascript
// In console, run:
copy(console.log)  // Copies recent logs

// Or filter errors only:
console.error  // Shows error-level only
```

### Method 3: Screenshot

1. Take screenshot of console with errors expanded
2. Save to reports/[date]/screenshots/

---

## Aggregating Console Errors

After test run, aggregate errors:

```markdown
## Console Error Summary

### By Type
- TypeError: 5 occurrences (3 unique)
- FirebaseError: 2 occurrences (2 unique)
- React Warning: 8 occurrences (2 unique)

### By Frequency
1. "Cannot read property 'name' of undefined" - 3 times
2. "Permission denied on /projects" - 2 times

### By Trigger
- Navigation: 3 errors
- Form submission: 2 errors
- Page load: 5 errors

### Unique Errors (Deduplicated)
1. TypeError: Cannot read property 'name' of undefined
   - Files: ProjectList.tsx:45, ClientCard.tsx:28
   - Frequency: 3

2. FirebaseError: Permission denied
   - Collection: organizations/{orgId}/projects
   - Frequency: 2
```

---

## Network Error Monitoring

### Filter Failed Requests

1. In Network tab, type `status-code:4` or `status-code:5` in filter
2. Or click the "XHR" filter to focus on API calls

### Record Network Failures

| Request | Status | Method | Size | Time | Response |
|---------|--------|--------|------|------|----------|
| /api/projects | 403 | GET | 0B | 45ms | Permission denied |
| /api/users | 500 | POST | 0B | 120ms | Server error |

---

## Automated Console Capture (Future Enhancement)

For CI/CD integration, consider:

```javascript
// Puppeteer/Playwright can capture console:
page.on('console', msg => {
  if (msg.type() === 'error') {
    console.log('Console Error:', msg.text());
  }
});

page.on('pageerror', error => {
  console.log('Page Error:', error.message);
});
```

---

## Best Practices

1. **Clear console before each test** - Easier to attribute errors to specific tests
2. **Preserve log enabled** - Don't lose errors on navigation
3. **Expand stack traces** - More context for debugging
4. **Note the trigger** - What action caused the error
5. **Check Network tab too** - API failures may not show in console
6. **Deduplicate before reporting** - Same error 10 times = 1 issue
7. **Include reproduction steps** - How to trigger the error again
