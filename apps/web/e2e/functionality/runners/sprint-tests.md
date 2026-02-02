# Sprint-Isolated Test Runner

## Overview

This runner executes tests ONLY for modules modified in the current or specified sprint. It tracks what was tested and when, allowing incremental testing between full regressions.

**Estimated Duration:** 30-60 minutes (depends on sprint scope)
**Priority:** P0 + P1 tests for modified modules

---

## Sprint Tracking System

### How It Works

1. Before running, identify which modules were modified in the sprint
2. Run tests only for those modules
3. Also run smoke tests (always) and critical path tests
4. Log results with sprint number for historical tracking

### Module-to-Sprint Mapping

When changes are made to these areas, run corresponding test suites:

| File/Directory Modified | Test Suite(s) to Run |
|------------------------|---------------------|
| `app/dashboard/page.tsx` | 00-smoke, 03-dashboard |
| `app/dashboard/projects/**` | 00-smoke, 03-projects |
| `app/dashboard/clients/**` | 00-smoke, 04-clients |
| `components/tasks/**` | 00-smoke, 05-tasks |
| `lib/hooks/useTasks.ts` | 05-tasks |
| `app/dashboard/settings/team/**` | 00-smoke, 06-team |
| `lib/hooks/useInvitations.ts` | 06-team |
| `app/dashboard/invoices/**` | 00-smoke, 07-finances |
| `app/dashboard/expenses/**` | 00-smoke, 07-finances |
| `app/dashboard/payroll/**` | 00-smoke, 07-finances, 02-rbac |
| `lib/hooks/usePayroll.ts` | 07-finances |
| `app/dashboard/schedule/**` | 00-smoke, 08-scheduling |
| `lib/hooks/useTimeEntries.ts` | 08-scheduling |
| `app/dashboard/estimates/**` | 00-smoke, 09-documents |
| `app/dashboard/signatures/**` | 00-smoke, 09-documents |
| `lib/esignature/**` | 09-documents |
| `app/dashboard/materials/**` | 00-smoke, 10-materials |
| `app/dashboard/tools/**` | 00-smoke, 10-materials |
| `app/dashboard/settings/**` | 00-smoke, 11-settings |
| `app/client/**` | 00-smoke, 12-portals |
| `app/sub/**` | 00-smoke, 12-portals |
| `app/field/**` | 00-smoke, 12-portals |
| `components/auth/**` | 00-smoke, 01-auth, 02-rbac |
| `firestore.rules` | 02-rbac |
| `types/index.ts` | Run affected module tests |

---

## Sprint Test Execution

### Step 1: Identify Sprint Scope

```
Before starting tests:

1. Review git changes since last test run:
   git log --oneline --since="[last-test-date]" --name-only

2. Or review sprint ticket list to identify changed modules

3. List affected modules:
   - [ ] auth
   - [ ] rbac
   - [ ] projects
   - [ ] clients
   - [ ] tasks
   - [ ] team
   - [ ] finances
   - [ ] scheduling
   - [ ] documents
   - [ ] materials
   - [ ] settings
   - [ ] portals
```

### Step 2: Always Run (Mandatory)

These tests run for EVERY sprint, regardless of changes:

```
MANDATORY TESTS (Always Run):

1. Smoke Tests (Suite 00)
   Run apps/web/e2e/functionality/suites/00-smoke/smoke-tests.md
   - Verifies basic app health
   - Must pass before continuing

2. Critical Path Tests
   Run apps/web/e2e/functionality/runners/critical-path.md
   - Core user flows
   - Security-critical paths
```

### Step 3: Run Affected Module Tests

Based on Step 1, run tests for each affected module:

```
For each modified module, run its test suite:

PROJECTS modified:
  Run apps/web/e2e/functionality/suites/03-projects/project-tests.md

CLIENTS modified:
  Run apps/web/e2e/functionality/suites/04-clients/client-tests.md

TASKS modified:
  Run apps/web/e2e/functionality/suites/05-tasks/task-tests.md

TEAM modified:
  Run apps/web/e2e/functionality/suites/06-team/team-tests.md

FINANCES modified:
  Run apps/web/e2e/functionality/suites/07-finances/finance-tests.md

SCHEDULING modified:
  Run apps/web/e2e/functionality/suites/08-scheduling/scheduling-tests.md

DOCUMENTS modified:
  Run apps/web/e2e/functionality/suites/09-documents/document-tests.md

MATERIALS modified:
  Run apps/web/e2e/functionality/suites/10-materials/materials-tests.md

SETTINGS modified:
  Run apps/web/e2e/functionality/suites/11-settings/settings-tests.md

PORTALS modified:
  Run apps/web/e2e/functionality/suites/12-portals/portal-tests.md

AUTH or RBAC modified (security-critical):
  Run BOTH:
  - apps/web/e2e/functionality/suites/01-auth/auth-tests.md
  - apps/web/e2e/functionality/suites/02-rbac/rbac-tests.md
```

### Step 4: Regression Check

If any test fails, also run tests for dependent modules:

```
Dependencies (if module A changes, also test B):

projects -> tasks (tasks belong to projects)
projects -> documents (estimates, SOW linked to projects)
projects -> scheduling (schedule events linked to projects)
projects -> finances (invoices linked to projects)

clients -> projects (projects have clients)
clients -> documents (signatures sent to clients)

team -> rbac (role changes affect permissions)
team -> tasks (task assignments)

auth -> rbac (login affects role access)
auth -> ALL modules (session affects everything)
```

---

## Sprint Test Log Template

After running sprint tests, record results:

```markdown
# Sprint [NUMBER] Test Results

## Sprint Info
- Sprint Number: ___
- Start Date: ___
- Test Date: ___
- Modules Modified: ___

## Modules Tested
- [x] 00-smoke (mandatory)
- [x] critical-path (mandatory)
- [ ] 01-auth
- [ ] 02-rbac
- [ ] 03-projects
- [ ] 04-clients
- [ ] 05-tasks
- [ ] 06-team
- [ ] 07-finances
- [ ] 08-scheduling
- [ ] 09-documents
- [ ] 10-materials
- [ ] 11-settings
- [ ] 12-portals

## Results Summary
| Suite | Tests | Passed | Failed | Skipped |
|-------|-------|--------|--------|---------|
| smoke | | | | |
| critical-path | | | | |
| [modules] | | | | |
| **TOTAL** | | | | |

## Console Errors
| Error | Module | Frequency | Severity |
|-------|--------|-----------|----------|
| | | | |

## Network Errors
| Request | Status | Module | Severity |
|---------|--------|--------|----------|
| | | | |

## Issues Created
| Issue ID | Description | Severity | Assignee |
|----------|-------------|----------|----------|
| | | | |

## Sign-off
- Tester: ___
- Date: ___
- Status: PASS / FAIL / CONDITIONAL
```

---

## Sprint History Tracking

Maintain a sprint history log at:
`apps/web/e2e/functionality/logs/sprint-history.json`

```json
{
  "history": [
    {
      "sprint": 13,
      "testDate": "2026-01-25",
      "modulesModified": ["projects", "scheduling", "payroll"],
      "modulesTested": ["smoke", "critical-path", "projects", "scheduling", "finances"],
      "results": {
        "total": 65,
        "passed": 62,
        "failed": 3,
        "skipped": 0
      },
      "consoleErrors": 2,
      "networkErrors": 0,
      "issues": ["PROJ-015", "SCHED-003"]
    },
    {
      "sprint": 14,
      "testDate": "2026-01-30",
      "modulesModified": ["clients", "invoices"],
      "modulesTested": ["smoke", "critical-path", "clients", "finances"],
      "results": {
        "total": 45,
        "passed": 44,
        "failed": 1,
        "skipped": 0
      },
      "consoleErrors": 0,
      "networkErrors": 1,
      "issues": ["FIN-007"]
    }
  ],
  "lastFullRegression": "2026-01-20",
  "nextFullRegressionDue": "2026-02-03"
}
```

---

## Quick Start Commands

### Run Sprint Tests for Specific Sprint

```
Run sprint 14 tests from apps/web/e2e/functionality/runners/sprint-tests.md

Modules modified in Sprint 14:
- payroll (new feature)
- scheduling (bug fixes)
- dashboard (UI updates)

Run: smoke, critical-path, finances, scheduling, and verify dashboard
```

### Run Tests for Files Changed Today

```
Run sprint tests for changes made today.

Check git diff for changed files:
git diff --name-only HEAD~5

Then run corresponding test suites.
```

### Verify Single Module After Fix

```
After fixing bug in clients module:

1. Run smoke tests (verify no regression)
2. Run apps/web/e2e/functionality/suites/04-clients/client-tests.md
3. Run critical path tests (verify core flows)
4. Check console for new errors
```

---

## When to Escalate to Full Regression

Run full regression instead of sprint tests when:

1. More than 5 modules were modified
2. Authentication or RBAC rules changed
3. Type definitions (`types/index.ts`) changed significantly
4. Firestore rules changed
5. Core utilities (`lib/firebase`, `lib/hooks/useFirestore*`) changed
6. Sprint tests have >10% failure rate
7. 5+ sprints since last full regression
