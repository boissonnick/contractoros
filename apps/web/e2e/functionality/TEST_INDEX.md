# ContractorOS Functionality Test Index

## Quick Reference

**Total Test Cases:** 160+
**Total Test Suites:** 13
**Estimated Full Run:** 2-3 hours

---

## Test Suite Summary

| Suite | Tests | Priority | Time | Focus |
|-------|-------|----------|------|-------|
| **00-Smoke** | 8 | P0 | 5 min | Basic app health |
| **01-Auth** | 11 | P0 | 15 min | Login, logout, sessions |
| **02-RBAC** | 10 | P0 | 25 min | Security, permissions |
| **03-Projects** | 12 | P1 | 25 min | Project CRUD, phases |
| **04-Clients** | 12 | P1 | 20 min | Client CRM |
| **05-Tasks** | 14 | P1 | 25 min | Task management |
| **06-Team** | 14 | P1 | 20 min | Invitations, roles |
| **07-Finances** | 18 | P1 | 30 min | Invoices, expenses, payroll |
| **08-Scheduling** | 18 | P1 | 25 min | Calendar, time tracking |
| **09-Documents** | 18 | P1 | 30 min | Estimates, signatures |
| **10-Materials** | 12 | P2 | 15 min | Inventory, tools |
| **11-Settings** | 16 | P2 | 15 min | Configuration |
| **12-Portals** | 19 | P1 | 20 min | Client/sub/field access |

---

## Security-Critical Tests (Must Pass)

| Test ID | Test Name | Why Critical |
|---------|-----------|--------------|
| RBAC-002 | PM Payroll Denied | Prevents unauthorized payroll access |
| RBAC-006 | Client Isolation | Prevents cross-client data leaks |
| RBAC-007 | Cross-Org Isolation | Prevents cross-org data access |
| RBAC-010 | API Enforcement | Backend validates permissions |
| PORT-002 | Client Own Projects | Client sees only their data |
| PORT-017 | Client No Admin | Client cannot access admin |
| PORT-018 | Sub No Finance | Sub cannot see financials |

---

## Critical Path Tests (13 Tests)

| ID | Test | Time |
|----|------|------|
| CP-01 | Application Health | 2 min |
| CP-02 | User Login | 2 min |
| CP-03 | Dashboard Renders | 2 min |
| CP-04 | Create Project | 3 min |
| CP-05 | View/Edit Project | 2 min |
| CP-06 | Client CRUD | 3 min |
| CP-07a | PM Payroll Denied | 2 min |
| CP-07b | Client Isolation | 2 min |
| CP-07c | Employee Restrictions | 1 min |
| CP-08 | Invoice Creation | 3 min |
| CP-09 | Time Entry | 2 min |
| CP-10 | Logout | 1 min |

---

## Test ID Reference

### Format: `SUITE-NNN`

| Prefix | Suite |
|--------|-------|
| SMOKE | Smoke Tests |
| AUTH | Authentication |
| RBAC | Role-Based Access |
| PROJ | Projects |
| CLIENT | Clients |
| TASK | Tasks |
| TEAM | Team Management |
| FIN | Finances |
| SCHED | Scheduling |
| DOC | Documents/Signatures |
| MAT | Materials/Tools |
| SET | Settings |
| PORT | Portal Access |
| CP | Critical Path |

---

## Module-to-Test Mapping

When changes are made to these files, run these tests:

| Changed Files | Required Tests |
|--------------|----------------|
| `components/auth/**` | AUTH-*, RBAC-* |
| `lib/hooks/useProjects.ts` | PROJ-* |
| `lib/hooks/useClients.ts` | CLIENT-* |
| `lib/hooks/useTasks.ts` | TASK-* |
| `lib/hooks/useInvitations.ts` | TEAM-* |
| `lib/hooks/usePayroll.ts` | FIN-013 to FIN-016 |
| `lib/hooks/useInvoices.ts` | FIN-001 to FIN-007 |
| `lib/hooks/useExpenses.ts` | FIN-008 to FIN-012 |
| `lib/hooks/useTimeEntries.ts` | SCHED-007 to SCHED-015 |
| `lib/hooks/useSchedule*.ts` | SCHED-001 to SCHED-006 |
| `lib/esignature/**` | DOC-006 to DOC-012 |
| `lib/hooks/useEstimates.ts` | DOC-001 to DOC-005 |
| `app/dashboard/settings/**` | SET-* |
| `app/client/**` | PORT-001 to PORT-006, PORT-017 |
| `app/sub/**` | PORT-007 to PORT-010, PORT-018 |
| `app/field/**` | PORT-011 to PORT-016 |
| `firestore.rules` | RBAC-* |
| `types/index.ts` | All affected modules |

---

## Console Error Categories

| Category | Pattern | Severity |
|----------|---------|----------|
| TypeError | "Cannot read property" | CRITICAL |
| ReferenceError | "is not defined" | CRITICAL |
| React Error | Component stack | CRITICAL |
| Firebase Auth | "auth/" errors | MAJOR |
| Firebase Permission | "permission-denied" | CRITICAL |
| Network 4xx | HTTP 400-499 | MAJOR |
| Network 5xx | HTTP 500-599 | CRITICAL |
| Deprecation | "Warning:" | MINOR |

---

## Pass/Fail Criteria

### Full Regression Pass

- All P0 tests pass (Smoke, Auth, RBAC)
- 90%+ of P1 tests pass
- 85%+ of P2 tests pass
- 0 BLOCKER console errors
- 0 security issues

### Sprint Test Pass

- Smoke tests pass
- Critical path passes
- Modified module tests 90%+ pass
- No new BLOCKER errors

### Critical Path Pass

- All 13 tests pass
- 0 console errors during tests
- Total time < 25 minutes

---

## Quick Commands

### Full Regression
```
Run full regression tests from apps/web/e2e/functionality/runners/full-regression.md
```

### Sprint Tests
```
Run sprint tests from apps/web/e2e/functionality/runners/sprint-tests.md for sprint 14
```

### Critical Path
```
Run critical path tests from apps/web/e2e/functionality/runners/critical-path.md
```

### Single Suite
```
Run project tests from apps/web/e2e/functionality/suites/03-projects/project-tests.md
```

### Security Only
```
Run RBAC tests from apps/web/e2e/functionality/suites/02-rbac/rbac-tests.md
```

---

## Related Documentation

- `TESTING_GUIDE.md` - Full usage guide
- `utils/console-monitoring.md` - Error capture protocol
- `utils/report-template.md` - Report format
- `utils/bugfix-sprint-generator.md` - Issue tracking
- `config/test-config.json` - Test settings
- `config/test-accounts.json` - Test credentials
- `logs/sprint-history.json` - Historical data
