# ContractorOS E2E Testing Suite

## Quick Start

```bash
# In Claude Code, run:
"Execute the E2E test suite from apps/web/e2e/. Start with the smoke tests."
```

## Test Suite Structure

```
e2e/
├── config.json              # Global test configuration
├── TESTING_GUIDE.md         # This file
├── suites/
│   ├── 00-smoke.md          # Quick sanity checks (run first)
│   ├── 01-auth.md           # Authentication & authorization
│   ├── 02-rbac.md           # Role-based access control
│   ├── 03-dashboard.md      # Dashboard functionality
│   ├── 04-projects.md       # Project CRUD & management
│   ├── 05-clients.md        # Client CRM
│   ├── 06-team.md           # Team management
│   ├── 07-finances.md       # Invoices, expenses, payroll
│   ├── 08-scheduling.md     # Calendar & scheduling
│   ├── 09-documents.md      # RFIs, submittals, change orders
│   ├── 10-mobile.md         # Mobile responsiveness
│   └── 11-regression.md     # Regression tests for bug fixes
├── fixtures/
│   └── test-data.json       # Test data for seeding
└── reports/
    └── (generated test reports)
```

## How to Run Tests

### Run All Tests
```
"Run the complete E2E test suite for ContractorOS at localhost:3000.
Execute suites in order (00 through 11). Take screenshots for failures."
```

### Run Specific Suite
```
"Run E2E test suite 02-rbac.md against localhost:3000"
```

### Run Specific Test
```
"Run test 'PM Cannot Access Payroll' from suite 02-rbac.md"
```

### Run Mobile Tests Only
```
"Run suite 10-mobile.md at viewport 375x812 (iPhone)"
```

### Run Regression Tests After Bug Fix
```
"Run suite 11-regression.md to verify all bug fixes are still working"
```

## Test Naming Convention

```
[SUITE-NUMBER]-[FEATURE]: [TEST-NAME]
Example: 02-RBAC: PM Cannot Access Payroll
```

## Test Status Codes

| Code | Meaning |
|------|---------|
| ✅ PASS | Test passed |
| ❌ FAIL | Test failed |
| ⏭️ SKIP | Test skipped (dependency failed) |
| ⚠️ WARN | Test passed with warnings |
| 🔄 RETRY | Test being retried |

## Viewport Testing

Every UI test should be run at multiple viewports:

| Viewport | Size | Priority |
|----------|------|----------|
| Mobile | 375x812 | HIGH |
| Tablet | 768x1024 | MEDIUM |
| Desktop | 1280x800 | HIGH |
| Desktop Large | 1920x1080 | LOW |

## Role Matrix

| Role | Dashboard | Projects | Clients | Team | Finances | Payroll | Settings |
|------|-----------|----------|---------|------|----------|---------|----------|
| Owner | Full | Full | Full | Full | Full | Full | Full |
| PM | Full | Full | Full | View | View | ❌ | Limited |
| Finance | View | View | View | View | Full | Full | ❌ |
| Employee | Limited | Assigned | ❌ | View | ❌ | ❌ | ❌ |
| Contractor | Limited | Assigned | ❌ | ❌ | ❌ | ❌ | ❌ |
| Client | Own Only | Own Only | ❌ | ❌ | ❌ | ❌ | ❌ |
| Assistant | Limited | Edit | Edit | View | ❌ | ❌ | Templates |

## Creating New Tests

### Test Template
```markdown
### TEST: [Descriptive Name]
**Suite:** [Suite Name]
**Priority:** [P0/P1/P2/P3]
**Roles:** [Which roles to test]
**Viewports:** [desktop/mobile/all]

#### Preconditions
- [Required state before test]

#### Steps
1. [Action to take]
2. [Action to take]
3. [Action to take]

#### Expected Results
- ✓ [What should happen]
- ✓ [What should be visible]
- ✓ [What should NOT be visible]

#### Cleanup
- [Actions to reset state]
```

### Priority Levels
- **P0**: Critical path, blocks release
- **P1**: Important functionality, should fix before release
- **P2**: Nice to have, can ship with known issues
- **P3**: Edge cases, low impact

## Reporting

After each test run, Claude should output:

```
## Test Report: [Suite Name]
Date: [ISO timestamp]
Duration: [time]
Viewport: [size]

### Summary
- Total: X tests
- Passed: X (X%)
- Failed: X
- Skipped: X

### Failed Tests
| Test | Error | Screenshot |
|------|-------|------------|
| [name] | [error] | [ss_id] |

### Recommendations
- [Any suggested fixes]
```

## CI/CD Integration

For automated runs, use:

```bash
# GitHub Actions example
- name: Run E2E Tests
  run: |
    npx claude-code --command "Run E2E smoke tests at ${{ env.PREVIEW_URL }}"
```
