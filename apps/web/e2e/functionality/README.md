# ContractorOS Functionality Testing Framework

## Overview

This framework provides comprehensive end-to-end functionality testing for ContractorOS. Unlike UI/UX testing (which tests visual appearance), this framework tests **actual functionality**: CRUD operations, business logic, data integrity, error handling, and console errors.

## Architecture

```
e2e/functionality/
├── README.md                    # This file
├── config/
│   ├── test-config.ts          # Central test configuration
│   ├── test-accounts.ts        # Test user credentials
│   └── firestore-rules.ts      # Expected Firestore behavior
├── utils/
│   ├── test-runner.ts          # Core test execution engine
│   ├── console-monitor.ts      # Console error capture
│   ├── api-interceptor.ts      # Network request monitoring
│   ├── firestore-helper.ts     # Firestore CRUD verification
│   ├── assertion-helpers.ts    # Custom assertions
│   └── report-generator.ts     # Test report generation
├── suites/
│   ├── 00-smoke/               # Basic smoke tests
│   ├── 01-auth/                # Authentication flows
│   ├── 02-rbac/                # Role-based access control
│   ├── 03-projects/            # Project CRUD & workflows
│   ├── 04-clients/             # Client CRM operations
│   ├── 05-tasks/               # Task management
│   ├── 06-team/                # Team & invitation management
│   ├── 07-finances/            # Invoices, expenses, payroll
│   ├── 08-scheduling/          # Calendar & time tracking
│   ├── 09-documents/           # Signatures, estimates, SOW
│   ├── 10-materials/           # Material & tool inventory
│   ├── 11-settings/            # User & org settings
│   ├── 12-portals/             # Client, sub, field portals
│   └── 99-regression/          # Full regression suite
├── runners/
│   ├── full-regression.md      # Complete test run
│   ├── sprint-tests.md         # Sprint-isolated tests
│   └── critical-path.md        # Critical functionality only
├── logs/
│   └── [timestamp]/            # Test execution logs
└── reports/
    └── [timestamp]/            # Generated test reports
```

## Test Types

### 1. Full Regression Testing
Runs ALL functionality tests across every module. Use after major releases or before deployments.

```bash
# In Claude Code:
Run full regression tests from apps/web/e2e/functionality/runners/full-regression.md
```

### 2. Sprint-Isolated Testing
Tests only modules modified in the current sprint. Tracks what was tested and when.

```bash
# In Claude Code:
Run sprint tests from apps/web/e2e/functionality/runners/sprint-tests.md for sprint 14
```

### 3. Critical Path Testing
Tests core functionality that must always work. Fast subset for quick verification.

```bash
# In Claude Code:
Run critical path tests from apps/web/e2e/functionality/runners/critical-path.md
```

## What This Framework Tests

### Functionality Categories

| Category | What We Test | Example Tests |
|----------|--------------|---------------|
| CRUD Operations | Create, Read, Update, Delete | Create project, edit client, delete task |
| Business Logic | Calculations, workflows, rules | Payroll calculations, approval flows |
| Data Integrity | Correct data storage/retrieval | Timestamps saved correctly, relations valid |
| Error Handling | Graceful error responses | Invalid form submission, network failures |
| Console Errors | JavaScript errors in browser | Uncaught exceptions, React errors |
| Permission Enforcement | RBAC rules work correctly | PM can't access payroll, client isolation |
| API/Network | Correct Firestore operations | Query filters work, real-time updates |
| State Management | UI reflects data changes | Create item appears in list, delete removes |

### Console Error Monitoring

Every test captures and categorizes console output:
- **ERROR**: JavaScript exceptions, React errors, network failures
- **WARNING**: Deprecation warnings, performance issues
- **INFO**: Debug information (optional capture)

Errors are logged with:
- Timestamp
- Error message
- Stack trace (if available)
- Current page URL
- User action that triggered error

## Test Execution Protocol

### Before Each Test
1. Clear browser console
2. Start console monitoring
3. Start network request logging
4. Set viewport to desktop (1280x800) unless specified

### During Each Test
1. Execute test steps
2. Capture all console output
3. Log all network requests
4. Take screenshots at key points
5. Verify expected outcomes

### After Each Test
1. Collect console errors
2. Generate test result
3. Log to test report
4. Clear state for next test

## Test Result Format

```json
{
  "testId": "03-projects-001",
  "testName": "Create new project with valid data",
  "suite": "projects",
  "status": "PASS" | "FAIL" | "ERROR" | "SKIP",
  "duration": 5230,
  "timestamp": "2026-01-30T10:15:00Z",
  "consoleErrors": [],
  "networkErrors": [],
  "assertions": [
    { "assertion": "Project appears in list", "passed": true }
  ],
  "screenshots": ["03-projects-001-step3.png"],
  "notes": "Optional notes about test execution"
}
```

## Bugfix Sprint Preparation

After test runs, the framework generates:

1. **Error Summary**: All console errors grouped by type and frequency
2. **Failed Tests**: List of failing tests with reproduction steps
3. **Regression Issues**: Tests that previously passed but now fail
4. **Performance Concerns**: Slow operations or resource issues
5. **Recommended Fixes**: Prioritized list of issues to address

### Output Format

```markdown
# Bugfix Sprint: [Date]

## Critical Issues (P0)
1. [CONSOLE-ERROR] TypeError in ProjectList.tsx:145
   - Frequency: 12 occurrences
   - Trigger: Clicking "New Project" with no clients
   - Affected tests: 03-001, 03-002, 03-005

## Major Issues (P1)
...

## Minor Issues (P2)
...
```

## Sprint Tracking

The framework maintains a sprint log:

```json
{
  "sprints": {
    "14": {
      "startDate": "2026-01-25",
      "completedDate": "2026-01-30",
      "modulesModified": ["projects", "payroll", "scheduling"],
      "testsRun": 45,
      "testsPassed": 42,
      "testsFailed": 3,
      "consoleErrors": 7,
      "issues": ["PROJ-001", "PAY-002"]
    }
  }
}
```

## Integration with Existing E2E

This functionality framework complements the existing UI/UX testing:

| Framework | Purpose | When to Use |
|-----------|---------|-------------|
| UI/UX Tests (suites 20-23) | Visual appearance, responsiveness | After CSS/layout changes |
| Functionality Tests (this) | Business logic, data operations | After any code changes |

Run both for complete coverage before releases.

## Best Practices

1. **Run in order**: Smoke → Auth → RBAC → Feature tests
2. **Capture everything**: Console, network, screenshots
3. **Isolate tests**: Each test should be independent
4. **Clean state**: Reset between tests when needed
5. **Document failures**: Include reproduction steps
6. **Prioritize fixes**: Use severity ratings
