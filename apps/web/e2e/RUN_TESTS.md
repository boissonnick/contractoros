# ContractorOS E2E Test Runner

## Quick Start Commands

Copy and paste these commands into Claude Code to run tests.

---

## Run All Tests (Full Suite)

```
Execute the complete ContractorOS E2E test suite.

Configuration:
- Base URL: http://localhost:3000
- Start with smoke tests (00-smoke.md)
- If smoke tests pass, continue with remaining suites in order
- Take screenshots for any failures
- Generate summary report at the end

Test Order:
1. 00-smoke.md (stop if fails)
2. 01-auth.md
3. 02-rbac.md (critical security)
4. 03-dashboard.md
5. 04-projects.md
6. 05-clients.md
7. 06-team.md
8. 07-finances.md
9. 08-scheduling.md
10. 09-documents.md
11. 10-mobile.md
12. 11-regression.md

Output a final summary with pass/fail counts per suite.
```

---

## Run Smoke Tests Only

```
Run E2E smoke tests for ContractorOS at http://localhost:3000.

Execute all tests in e2e/suites/00-smoke.md.
Report pass/fail for each test.
Stop immediately if any test fails.
```

---

## Run Security Tests Only

```
Run security-critical E2E tests for ContractorOS.

Focus on:
1. e2e/suites/02-rbac.md - All role-based access tests
2. e2e/suites/11-regression.md - BUG-001, BUG-002, BUG-003 (security bugs)

Test each user role:
- Owner (full access)
- Project Manager (no payroll)
- Finance Manager (payroll access)
- Employee (limited)
- Contractor (minimal)
- Client (isolated - CRITICAL)

Take screenshots of all access denied screens.
Report any security failures immediately.
```

---

## Run Mobile Tests Only

```
Run mobile responsiveness tests for ContractorOS.

Execute e2e/suites/10-mobile.md at these viewports:
1. iPhone SE: 375x667
2. iPhone X: 375x812
3. iPad: 768x1024

For each viewport:
- Resize browser first
- Run all P0 and P1 tests
- Take screenshot of any layout issues
- Check for horizontal scroll

Report issues grouped by viewport.
```

---

## Run Regression Tests Only

```
Run regression tests to verify bug fixes.

Execute e2e/suites/11-regression.md.

Critical tests to verify:
- BUG-001: Client data isolation
- BUG-002: Client portal data exposure
- BUG-003: PM payroll access denied
- BUG-005/006: Employee/Contractor admin buttons hidden
- BUG-007: Correct role in error messages

Take screenshots as evidence for each test.
Mark any regressions as CRITICAL.
```

---

## Run Specific Suite

```
Run E2E test suite [SUITE_NAME] for ContractorOS at http://localhost:3000.

Execute all tests in e2e/suites/[SUITE_NAME].md.
Report results for each test.
Take screenshots on failure.
```

Replace [SUITE_NAME] with:
- 00-smoke
- 01-auth
- 02-rbac
- 03-dashboard
- 04-projects
- 05-clients
- 06-team
- 07-finances
- 08-scheduling
- 09-documents
- 10-mobile
- 11-regression

---

## Run Single Test

```
Run single E2E test "[TEST_NAME]" from suite [SUITE_NAME].

Steps:
1. Navigate to http://localhost:3000
2. Execute the specific test steps
3. Verify all expected results
4. Take screenshot of final state
5. Report pass/fail with details
```

---

## Pre-Deployment Check

```
Run pre-deployment E2E checks for ContractorOS.

Quick verification before deploying:
1. Run 00-smoke.md (all must pass)
2. Run 02-rbac.md critical tests only
3. Run 11-regression.md (all security bugs)

If ALL pass: "✅ READY FOR DEPLOYMENT"
If ANY fail: "❌ DEPLOYMENT BLOCKED - [failure details]"
```

---

## Post-Deployment Verification

```
Run post-deployment verification for ContractorOS.

URL: [PRODUCTION_URL]

Execute:
1. Smoke tests (00-smoke.md)
2. Auth flow test
3. Dashboard loads correctly
4. RBAC spot check (test one role)

Confirm production is functioning correctly.
```

---

## Generate Test Report

```
Generate E2E test report for ContractorOS.

After running tests, output:

## E2E Test Report
**Date:** [current date]
**Environment:** [localhost/staging/production]
**Duration:** [total time]

### Summary
| Suite | Passed | Failed | Skipped |
|-------|--------|--------|---------|
| Smoke | X | X | X |
| Auth | X | X | X |
| RBAC | X | X | X |
| ... | ... | ... | ... |

### Failed Tests
[List each failed test with error details]

### Screenshots
[Reference screenshot IDs for failures]

### Recommendations
[Any suggested fixes or follow-ups]
```

---

## Continuous Testing Loop

```
Run continuous E2E testing for ContractorOS.

Every 5 minutes:
1. Run smoke tests
2. If pass, run random sample of 3 other tests
3. Report any failures immediately

Continue until stopped.
Useful for catching intermittent issues.
```
