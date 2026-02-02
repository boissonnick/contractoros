# ContractorOS Functionality Testing Guide

## Quick Start

### Run Full Regression (Before Releases)

```
In Claude Code, say:

"Run full regression tests from apps/web/e2e/functionality/runners/full-regression.md
against http://localhost:3000. Capture all console errors and generate a bugfix sprint report."
```

### Run Sprint Tests (After Each Sprint)

```
In Claude Code, say:

"Run sprint 14 tests from apps/web/e2e/functionality/runners/sprint-tests.md.
The following modules were modified: payroll, scheduling, dashboard.
Check console for errors and log results."
```

### Run Critical Path Only (Quick Verification)

```
In Claude Code, say:

"Run critical path tests from apps/web/e2e/functionality/runners/critical-path.md.
Stop immediately if any BLOCKER test fails. Report pass/fail status."
```

---

## Test Framework Overview

### What This Tests

| Aspect | What We Verify |
|--------|----------------|
| **CRUD Operations** | Create, Read, Update, Delete work correctly |
| **Business Logic** | Calculations, workflows, rules function properly |
| **Data Integrity** | Data saves and retrieves accurately |
| **Console Errors** | No JavaScript exceptions or React errors |
| **Permission Enforcement** | RBAC rules properly restrict access |
| **API/Network** | Firestore operations succeed |

### Test Suite Structure

```
e2e/functionality/
├── runners/
│   ├── full-regression.md    ← Complete test run (2-3 hours)
│   ├── sprint-tests.md       ← Sprint-specific (30-60 min)
│   └── critical-path.md      ← Quick verify (15-20 min)
├── suites/
│   ├── 00-smoke/             ← Basic health checks (P0)
│   ├── 01-auth/              ← Authentication (P0)
│   ├── 02-rbac/              ← Security permissions (P0)
│   ├── 03-projects/          ← Project CRUD (P1)
│   ├── 04-clients/           ← Client CRM (P1)
│   ├── 05-tasks/             ← Task management (P1)
│   ├── 06-team/              ← Team/invitations (P1)
│   ├── 07-finances/          ← Invoices, expenses, payroll (P1)
│   ├── 08-scheduling/        ← Calendar, time tracking (P1)
│   ├── 09-documents/         ← Estimates, signatures (P1)
│   ├── 10-materials/         ← Inventory (P2)
│   ├── 11-settings/          ← Configuration (P2)
│   └── 12-portals/           ← Client/sub/field portals (P1)
├── utils/
│   ├── console-monitoring.md ← How to capture errors
│   ├── report-template.md    ← Test report format
│   └── bugfix-sprint-generator.md ← Create bug tickets
├── logs/
│   └── sprint-history.json   ← Historical test data
└── config/
    ├── test-config.json      ← Test settings
    └── test-accounts.json    ← Test user credentials
```

---

## Running Tests

### Prerequisites

1. **Dev server running:**
   ```bash
   cd apps/web && npm run dev
   ```

2. **Chrome with Claude in Chrome extension installed**

3. **Test accounts exist** (check `config/test-accounts.json`)

### Test Execution Commands

#### Full Regression

```
Run the complete functionality test suite:
1. Start with smoke tests
2. Continue through each suite in order
3. Capture ALL console errors
4. Take screenshots of failures
5. Generate final report

Stop if 3+ consecutive smoke tests fail.
```

#### Sprint-Isolated Tests

```
Run tests for Sprint [N]:
1. Check which modules were modified
2. Always run: smoke tests, critical path
3. Run suites for modified modules only
4. Log results to sprint history

Modules modified in Sprint 14: payroll, scheduling, dashboard
```

#### Critical Path Only

```
Run the 13 critical path tests:
1. CP-01: Application Health
2. CP-02: User Login
3. CP-03: Dashboard Renders
4. CP-04: Create Project
5. CP-05: View/Edit Project
6. CP-06: Client CRUD
7. CP-07: RBAC Enforcement (3 tests)
8. CP-08: Invoice Creation
9. CP-09: Time Entry
10. CP-10: Logout

All must pass for release approval.
```

---

## Console Error Capture Protocol

### Setup

1. Open DevTools (F12)
2. Console tab → Clear
3. Enable "Preserve log"
4. Network tab → Clear, enable "Preserve log"

### During Tests

- Note any red error messages
- Record the test that triggered each error
- Copy full error message and stack trace

### After Tests

Aggregate errors into report:

```markdown
## Console Error Summary

| Error Type | Count | Severity | Affected Tests |
|------------|-------|----------|----------------|
| TypeError | 3 | CRITICAL | PROJ-003, PROJ-005 |
| FirebaseError | 1 | MAJOR | RBAC-007 |
```

---

## Test Results Recording

### Per-Test Recording

For each test, record:

```
Test ID: PROJ-001
Test Name: Create New Project
Status: PASS / FAIL
Console Errors: 0
Duration: 45 seconds
Notes: Created successfully, redirected to detail
Screenshot: (if failed)
```

### Suite Summary

After each suite:

```
Suite: 03-Projects
Tests Run: 12
Passed: 11
Failed: 1
Pass Rate: 91.7%
Console Errors: 2
```

### Final Report

Use template: `utils/report-template.md`

---

## Bugfix Sprint Generation

After test run with failures:

1. **Collect all issues:**
   - Failed tests
   - Console errors
   - Security issues

2. **Categorize by severity:**
   - BLOCKER: Fix immediately
   - CRITICAL: Fix this sprint
   - MAJOR: Fix if time
   - MINOR: Defer

3. **Generate sprint backlog:**
   - Use `utils/bugfix-sprint-generator.md`
   - Create tickets for each issue

4. **Track in sprint history:**
   - Update `logs/sprint-history.json`

---

## When to Run Each Test Type

| Scenario | Test Type | Duration |
|----------|-----------|----------|
| Before production deploy | Full Regression | 2-3 hours |
| After sprint completion | Sprint Tests | 30-60 min |
| After hotfix | Critical Path + affected suite | 30 min |
| Daily development check | Critical Path | 15-20 min |
| After security-related changes | RBAC suite | 25 min |
| Before demo/presentation | Smoke + Critical Path | 20 min |

---

## Test Accounts

See `config/test-accounts.json` for full details.

| Role | Email | Use For |
|------|-------|---------|
| Owner | owner@test.contractoros.com | Full access tests |
| PM | pm@test.contractoros.com | PM-specific tests |
| Finance | finance@test.contractoros.com | Financial tests |
| Employee | employee@test.contractoros.com | Limited access |
| Contractor | contractor@test.contractoros.com | Sub portal |
| Client | client@test.contractoros.com | Client portal |

---

## Troubleshooting

### "Tab not found" error

Run `tabs_context_mcp` first to get available tabs.

### "Element not found"

Use `find` tool with natural language instead of CSS selectors.

### Test hangs on loading

Check:
1. Is dev server running?
2. Are there console errors?
3. Is there a network failure?

### Different results each run

Could indicate:
- Race conditions
- Timing issues
- Data-dependent tests

---

## Best Practices

1. **Run in order:** Smoke → Auth → RBAC → Features
2. **Clear state:** Logout between role tests
3. **Capture everything:** Console, network, screenshots
4. **Document failures:** Include reproduction steps
5. **Update history:** Log all test runs
6. **Verify fixes:** Re-run failed tests after bugfix

---

## Integration with UI/UX Tests

This functionality framework complements existing UI/UX tests:

| Framework | Focus | Location |
|-----------|-------|----------|
| UI/UX (20-23) | Visual, responsive | `e2e/suites/` |
| Functionality | Logic, data, errors | `e2e/functionality/` |

**Run both before releases for complete coverage.**

---

## Support

For questions about this testing framework:
1. Check this guide first
2. Review the specific test suite documentation
3. Check console-monitoring.md for error capture
4. Review bugfix-sprint-generator.md for issue tracking
