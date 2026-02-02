# ContractorOS E2E Test Inventory

## Test Suite Summary

| Suite | File | Tests | Priority | Est. Duration |
|-------|------|-------|----------|---------------|
| Smoke | 00-smoke.md | 6 | P0 | 5 min |
| Authentication | 01-auth.md | 9 | P0 | 10 min |
| RBAC (Security) | 02-rbac.md | 15 | P0 | 15 min |
| Dashboard | 03-dashboard.md | 13 | P0 | 12 min |
| Projects | 04-projects.md | 10 | P0 | 15 min |
| Clients | 05-clients.md | 9 | P1 | 12 min |
| Team | 06-team.md | 12 | P1 | 20 min |
| Finances | 07-finances.md | 15 | P1 | 20 min |
| Scheduling | 08-scheduling.md | 15 | P2 | 25 min |
| Documents | 09-documents.md | 20 | P1 | 30 min |
| Mobile | 10-mobile.md | 20 | P0 | 30 min |
| Regression | 11-regression.md | 8 | P0 | 15 min |
| **UI/UX Desktop** | **20-ui-ux-desktop.md** | **23** | **P1** | **45 min** |
| **UI/UX Tablet** | **21-ui-ux-tablet.md** | **22** | **P1** | **30 min** |
| **UI/UX Mobile** | **22-ui-ux-mobile.md** | **28** | **P0** | **45 min** |
| **UAT Checklist** | **23-uat-checklist.md** | **Master** | **P0** | **2 hours** |

**Total: 225 tests | ~5.5 hours for full suite (including UAT)**

---

## UAT / UI Testing Summary (NEW)

| Suite | Viewport | Focus Area | Tests |
|-------|----------|------------|-------|
| 20-ui-ux-desktop | 1280x800+ | Layout, Typography, Interactions | 23 |
| 21-ui-ux-tablet | 768x1024 | Hybrid layouts, Touch, Orientation | 22 |
| 22-ui-ux-mobile | 375x812 | **CRITICAL** Mobile usability | 28 |
| 23-uat-checklist | All | Master checklist, Sign-off | — |

### UAT Testing Schedule
> **RULE: Run full UAT testing after every 5-10 sprints**

| Sprint | UAT Type | Duration |
|--------|----------|----------|
| Every 5 sprints | Mobile quick check | 30 min |
| Every 10 sprints | Full UAT (all viewports) | 2 hours |

---

## Test Coverage by Feature

### Core Features (Must Pass for Release)
- ✅ User Authentication (9 tests)
- ✅ Role-Based Access Control (15 tests)
- ✅ Dashboard Views by Role (13 tests)
- ✅ Project CRUD (10 tests)
- ✅ Mobile Responsiveness (20 tests)

### Business Features
- ✅ Client CRM (9 tests)
- ✅ Team Management (12 tests)
- ✅ Financial Tracking (15 tests)
- ✅ Scheduling/Calendar (15 tests)
- ✅ Documents (RFIs, Submittals, Change Orders) (20 tests)

### Quality Assurance
- ✅ Smoke Tests (6 tests)
- ✅ Regression Tests (8 tests)

---

## Test Coverage by User Role

### Owner (7 roles × avg 15 tests each)
- Full access to all features
- Can impersonate other roles
- Tests: All suites

### Project Manager
- Full project access
- No payroll access (verified)
- Tests: 02-rbac, 04-projects, 06-team, 09-documents

### Finance Manager
- Financial data access
- Payroll access (verified)
- Tests: 02-rbac, 07-finances

### Employee
- Limited dashboard
- Assigned projects only
- No admin buttons (verified)
- Tests: 02-rbac, 03-dashboard, 08-scheduling

### Contractor
- Minimal access
- Own work only
- No admin buttons (verified)
- Tests: 02-rbac, 09-documents

### Client
- Own projects only (verified - security critical)
- No team/finance visibility (verified)
- Tests: 02-rbac, 03-dashboard, 09-documents

---

## Security-Critical Tests

These tests verify security bug fixes and must ALWAYS pass:

| Test ID | Description | Bug Reference |
|---------|-------------|---------------|
| 02-005 | Client Data Isolation | BUG-001 |
| 02-006 | Client Portal Isolation | BUG-002 |
| 02-007 | PM Payroll Access Denied | BUG-003 |
| 02-008 | Employee Admin Buttons Hidden | BUG-005 |
| 02-009 | Contractor Admin Buttons Hidden | BUG-006 |
| 11-001 | Client Isolation Regression | BUG-001 |
| 11-002 | PM Payroll Regression | BUG-003 |
| 11-003 | Employee Buttons Regression | BUG-005/006 |

---

## Viewport Coverage

| Viewport | Tests | Suites |
|----------|-------|--------|
| Desktop (1280x800) | All 152 | All |
| Mobile iPhone (375x812) | 20 | 10-mobile |
| Tablet iPad (768x1024) | 10 | 10-mobile |
| Desktop Large (1920x1080) | 5 | 10-mobile |

---

## Test Dependencies

Some tests have prerequisites:

1. **00-smoke** must pass before any other suite
2. **01-auth** must pass before tests requiring login
3. **04-projects** - needs at least 1 project to exist
4. **09-documents** - needs active project with documents enabled

---

## Quick Reference: Test Priorities

### P0 (Critical Path - Must Pass)
- All smoke tests
- All RBAC security tests
- Core dashboard functionality
- Mobile basic functionality

### P1 (Important - Fix Before Release)
- Full CRUD operations
- All role impersonation flows
- Financial reporting
- Document management

### P2 (Nice to Have)
- Edge cases
- Advanced calendar features
- Bulk operations
- Performance under load

### P3 (Low Impact)
- Visual polish
- Animation timing
- Tooltips/help text

---

## Running the Tests

See `RUN_TESTS.md` for complete execution commands.

### Recommended Test Order for CI/CD:

```
1. Smoke Tests (gate - stop if fail)
2. Security Tests (02-rbac + 11-regression security)
3. Core Feature Tests (03, 04, 05)
4. Extended Feature Tests (06, 07, 08, 09)
5. Mobile Tests (10)
```

### Time Estimates:

| Scope | Duration |
|-------|----------|
| Smoke only | 5 min |
| Smoke + Security | 30 min |
| Pre-deployment | 45 min |
| Full suite | 3.5 hours |

---

## Maintenance

### Adding New Tests

1. Identify the appropriate suite file
2. Follow the test template in TESTING_GUIDE.md
3. Update this inventory with new test count
4. Add to regression suite if fixing a bug

### Updating Test Data

Edit `fixtures/test-data.json` for:
- Test account credentials
- Test project names
- Viewport definitions
- Common selectors

### Reporting Issues

When a test fails:
1. Note the test ID (e.g., 02-005)
2. Take screenshot
3. Record the error message
4. File bug with test reference
