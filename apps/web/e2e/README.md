# E2E Testing with Claude Code + Chrome MCP

## Overview

This directory contains test definitions that can be run using Claude Code with the Chrome MCP extension. The tests use natural language and are executed by Claude interacting with the browser.

## Setup

### 1. Install Claude in Chrome Extension
- Install from Chrome Web Store: "Claude in Chrome"
- Enable the MCP connection in the extension settings

### 2. Start Your Dev Server
```bash
cd apps/web
npm run dev
```

### 3. Run Tests with Claude Code
In Claude Code, say:
```
Run the E2E security tests from apps/web/e2e/test-runner.md against localhost:3000
```

## Test Suites

### Functional Tests
| Suite | Purpose |
|-------|---------|
| 00-smoke.md | Quick sanity checks |
| 01-auth.md | Authentication flows |
| 02-rbac.md | Role-based access control (security) |
| 03-dashboard.md | Dashboard by role |
| 04-projects.md | Project CRUD |
| 05-clients.md | Client CRM |
| 06-team.md | Team management |
| 07-finances.md | Financial features |
| 08-scheduling.md | Calendar/scheduling |
| 09-documents.md | RFIs, Submittals, Change Orders |
| 10-mobile.md | Mobile responsiveness |
| 11-regression.md | Security regression tests |

### UI/UX Testing (NEW)
| Suite | Viewport | Tests |
|-------|----------|-------|
| 20-ui-ux-desktop.md | 1280x800+ | 23 tests |
| 21-ui-ux-tablet.md | 768x1024 | 22 tests |
| 22-ui-ux-mobile.md | 375x812 | 28 tests (CRITICAL) |
| 23-uat-checklist.md | All | Master checklist |

### Example Commands
```
# Run smoke tests
Run the E2E smoke tests from apps/web/e2e/suites/00-smoke.md

# Run security tests
Run the E2E security tests from apps/web/e2e/suites/02-rbac.md

# Run mobile UI/UX tests (CRITICAL)
Run UI/UX mobile tests from apps/web/e2e/suites/22-ui-ux-mobile.md at 375x812

# Run full UAT
Run complete UAT testing using apps/web/e2e/suites/23-uat-checklist.md
```

## Creating Custom Tests

Tests are written in natural language markdown. Example:

```markdown
### Test: User Can Create Project
1. Login as OWNER
2. Click "New Project" button
3. Fill form: Name="Test", Client="Demo"
4. Click Submit
5. VERIFY: Redirected to /dashboard/projects/{id}
6. VERIFY: Success toast appears
```

## Mobile Testing

Use the `resize_window` MCP tool to test different viewports:

| Device | Width | Height |
|--------|-------|--------|
| iPhone SE | 375 | 667 |
| iPhone 12 | 390 | 844 |
| iPhone 12 Pro Max | 428 | 926 |
| Pixel 5 | 393 | 851 |
| iPad Mini | 768 | 1024 |
| iPad Pro 12.9 | 1024 | 1366 |

## Automated Testing Workflow

For CI/CD integration, you can use the Claude API directly:

```typescript
// Example: Programmatic E2E test runner
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

async function runE2ETests() {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    tools: [...mcpTools], // Chrome MCP tools
    messages: [{
      role: 'user',
      content: `
        Run E2E tests:
        1. Navigate to http://localhost:3000
        2. Test client role isolation
        3. Test PM payroll access denied
        4. Report pass/fail for each test
      `
    }]
  });

  return response;
}
```

## Best Practices

1. **Always take screenshots** for visual verification
2. **Test at multiple viewports** for responsive design
3. **Test all user roles** via impersonation
4. **Verify both positive and negative cases** (access granted AND denied)
5. **Clear state between tests** (logout, clear localStorage)

## Troubleshooting

### "Tab not found" error
Run `tabs_context_mcp` first to get available tabs.

### "Element not found"
Use `find` tool with natural language query instead of CSS selectors.

### Mobile viewport not working
Use `resize_window` tool, not browser DevTools.
