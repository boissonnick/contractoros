# Bugfix Sprint Generator

## Overview

This document describes how to transform test results into actionable bugfix sprint items.

---

## Process Flow

```
Test Execution
    ↓
Collect Results
    ↓
Categorize Issues
    ↓
Prioritize
    ↓
Generate Sprint Backlog
    ↓
Create Issues/Tickets
```

---

## Step 1: Collect All Issues

After test run, gather from:
- [ ] Failed test list
- [ ] Console error log
- [ ] Network failure log
- [ ] Security issue flags
- [ ] Performance observations

---

## Step 2: Categorize Issues

### Category A: Functional Bugs

Issues where functionality doesn't work as expected.

```markdown
### FUNC-001: [Test ID] - [Brief Description]

**Category:** Functional Bug
**Severity:** CRITICAL / MAJOR / MINOR
**Test:** [Test ID that failed]
**Expected:** [What should happen]
**Actual:** [What actually happened]
**Console Error:** [Copy error if any]
**Steps to Reproduce:**
1.
2.
3.
**Affected Component:** [File/component name]
**Suggested Fix:** [If known]
```

### Category B: Console Errors

JavaScript/React errors in console.

```markdown
### CONSOLE-001: [Error Type] in [File]

**Category:** Console Error
**Severity:** CRITICAL / MAJOR / MINOR
**Error Message:** [Full message]
**Stack Trace:**
[Paste stack]
**Trigger:** [What action causes it]
**Frequency:** [How often]
**Affected Tests:** [List test IDs]
**Suggested Fix:** [If known]
```

### Category C: Security Issues

Permission, access, or data leakage problems.

```markdown
### SEC-001: [Security Issue Description]

**Category:** Security
**Severity:** BLOCKER / CRITICAL
**Test:** [Test ID]
**Issue:** [Describe vulnerability]
**Impact:** [What could go wrong]
**Affected Users:** [Which roles]
**Suggested Fix:** [If known]
**URGENT:** YES/NO
```

### Category D: Performance Issues

Slow operations, timeouts, resource problems.

```markdown
### PERF-001: [Performance Issue]

**Category:** Performance
**Severity:** MAJOR / MINOR
**Page/Action:** [What is slow]
**Measured Time:** [X seconds]
**Expected Time:** [Target]
**Notes:** [Context]
```

### Category E: UX/Logic Issues

Not technically broken, but confusing or illogical.

```markdown
### UX-001: [UX Issue]

**Category:** UX/Logic
**Severity:** MINOR
**Description:** [What's confusing]
**Suggestion:** [How to improve]
```

---

## Step 3: Prioritize

### Priority Matrix

| Severity | Impact | Examples | SLA |
|----------|--------|----------|-----|
| BLOCKER | Stops all work | App crash, security breach, data loss | Fix immediately |
| CRITICAL | Feature broken | Cannot create project, login fails | Same sprint |
| MAJOR | Feature impaired | Slow load, minor calculation error | Same sprint |
| MINOR | Inconvenience | UI glitch, warning message | Next sprint |
| TRIVIAL | Polish | Typo, minor cosmetic | Backlog |

### Priority Assignment Rules

1. **BLOCKER if:**
   - Security vulnerability (data leakage, permission bypass)
   - Application crashes
   - Core feature completely broken (login, dashboard, etc.)
   - Data corruption possible

2. **CRITICAL if:**
   - Major feature not working (create/edit operations)
   - Error affects 50%+ of users
   - No workaround exists

3. **MAJOR if:**
   - Feature degraded but workaround exists
   - Affects specific user role or workflow
   - Console errors that may indicate underlying issue

4. **MINOR if:**
   - Edge case failures
   - Cosmetic issues
   - Performance could be better
   - Deprecation warnings

---

## Step 4: Generate Sprint Backlog

### Bugfix Sprint Template

```markdown
# Bugfix Sprint [NUMBER] - [DATE]

## Overview
- **Test Run:** [Date of test run]
- **Test Type:** [Full/Sprint/Critical]
- **Total Issues:** [Count]
- **Sprint Duration:** [Estimated]

## Sprint Goals
1. Fix all BLOCKER issues
2. Fix all CRITICAL issues
3. Address MAJOR issues if time permits

---

## BLOCKER Issues (Fix Immediately)

### [Issue ID]: [Title]
- **Priority:** P0
- **Estimate:** [Hours/Points]
- **Assignee:** TBD
- **Details:** [Link to issue detail]

---

## CRITICAL Issues (Fix This Sprint)

### [Issue ID]: [Title]
- **Priority:** P1
- **Estimate:** [Hours/Points]
- **Assignee:** TBD
- **Details:** [Link to issue detail]

---

## MAJOR Issues (If Time Permits)

### [Issue ID]: [Title]
- **Priority:** P2
- **Estimate:** [Hours/Points]
- **Details:** [Link to issue detail]

---

## Deferred to Next Sprint

### [Issue ID]: [Title]
- **Priority:** P3
- **Reason:** [Why deferred]

---

## Success Criteria
- [ ] All BLOCKER issues resolved
- [ ] All CRITICAL issues resolved
- [ ] Re-run affected test suites
- [ ] No new BLOCKER/CRITICAL issues introduced

## Definition of Done
- [ ] Code fixed and reviewed
- [ ] Affected tests pass
- [ ] No new console errors
- [ ] Deployed to staging
- [ ] Smoke tests pass on staging
```

---

## Step 5: Create Issue Tickets

### Issue Ticket Template

```markdown
# [Issue ID]: [Descriptive Title]

## Type
- [ ] Bug
- [ ] Security
- [ ] Performance
- [ ] UX

## Priority
- [ ] BLOCKER
- [ ] CRITICAL
- [ ] MAJOR
- [ ] MINOR

## Description
[Clear description of the issue]

## Steps to Reproduce
1.
2.
3.

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Console Output
\`\`\`
[Paste console error if any]
\`\`\`

## Screenshots
[Attach screenshots]

## Affected Test(s)
- [Test ID 1]
- [Test ID 2]

## Environment
- Browser:
- OS:
- URL:

## Suggested Fix
[If known, describe fix approach]

## Acceptance Criteria
- [ ] Bug is fixed
- [ ] Affected tests pass
- [ ] No console errors
- [ ] Reviewed by QA

## Labels
`bug`, `priority-critical`, `sprint-15`
```

---

## Automation Hooks

### Post-Test Script Idea

```javascript
// generateBugfixSprint.js
const testResults = require('./test-results.json');
const consoleErrors = require('./console-errors.json');

function generateSprint(results, errors) {
  const issues = [];

  // Extract failed tests
  results.failed.forEach(test => {
    issues.push({
      type: 'functional',
      testId: test.id,
      name: test.name,
      reason: test.failureReason,
      severity: test.priority
    });
  });

  // Extract console errors
  errors.forEach(error => {
    issues.push({
      type: 'console',
      error: error.message,
      frequency: error.count,
      severity: classifyError(error)
    });
  });

  // Sort by severity
  issues.sort((a, b) => severityRank(a.severity) - severityRank(b.severity));

  return issues;
}
```

---

## Example Bugfix Sprint

```markdown
# Bugfix Sprint 15 - 2026-02-01

## Test Run Summary
- Full Regression on 2026-01-30
- 127/142 tests passed (89.4%)
- 8 console errors captured
- 2 security issues found

---

## BLOCKER (Fix Day 1)

### SEC-001: Client Data Visible to Other Clients
- **Test:** RBAC-006
- **Issue:** Client A can see Client B's project names
- **Root Cause:** Missing clientId filter in Firestore query
- **Estimate:** 2 hours
- **File:** lib/hooks/useProjects.ts

---

## CRITICAL (Fix Day 1-2)

### FUNC-001: Cannot Create Project
- **Test:** PROJ-001
- **Issue:** "Create" button shows error toast
- **Console:** TypeError: Cannot read 'id' of undefined
- **Estimate:** 1 hour
- **File:** components/projects/NewProjectModal.tsx

### CONSOLE-001: Dashboard Crash on Load
- **Tests:** SMOKE-004, PROJ-003
- **Error:** React hook called conditionally
- **Estimate:** 2 hours
- **File:** app/dashboard/page.tsx

---

## MAJOR (Day 2-3)

### FUNC-002: Invoice Total Incorrect
- **Test:** FIN-002
- **Issue:** Tax not added to line item subtotal
- **Estimate:** 1 hour

---

## MINOR (Defer if needed)

### UX-001: Search placeholder unclear
- **Test:** CLIENT-011
- Defer to Sprint 16
```

---

## Verification After Fixes

After bugfix sprint:

1. **Re-run affected test suites**
2. **Verify console clean** - No new errors
3. **Run critical path** - Core features still work
4. **Update test logs** - Mark issues as resolved
5. **Document fixes** - In CHANGELOG or commit messages
