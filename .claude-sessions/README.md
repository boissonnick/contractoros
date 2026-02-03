# ContractorOS Development Sessions

> **Purpose:** Orchestrated development sessions for AI-assisted development
> **Created:** 2026-02-03
> **Total Sessions:** 5
> **Estimated Total Time:** 25-40 hours

---

## Quick Start

Run any session by giving Claude this command:

```bash
claude "Execute session [A/B/C/D/E] from .claude-sessions/SESSION-[X]-[name].md"
```

Example:
```bash
claude "Execute session A from .claude-sessions/SESSION-A-critical-fixes-refactoring.md"
```

---

## Session Overview

| Session | File | Duration | Focus | Prerequisites |
|---------|------|----------|-------|---------------|
| **A** | `SESSION-A-critical-fixes-refactoring.md` | 5-8h | Critical fixes + Refactoring | None |
| **B** | `SESSION-B-testing-pagination.md` | 4-6h | Testing + Pagination | Session A |
| **C** | `SESSION-C-coming-soon-features.md` | 6-10h | Coming Soon Features | Sessions A, B |
| **D** | `SESSION-D-integrations-security.md` | 4-6h | Integrations + Security | Sessions A, B, C |
| **E** | `SESSION-E-launch-prep-deploy.md` | 4-6h | Launch Prep + Deploy | Sessions A, B, C, D |

---

## Session Details

### Session A: Critical Fixes + Refactoring
**Priority:** 🔴 P0 - START HERE

Key deliverables:
- Fix Cloud Functions database bug (CRITICAL)
- Consolidate duplicate weather services
- Split 8,986-line types file into domains
- Standardize hook patterns
- Performance optimizations

Parallel agents: 22 tasks across 8 batches

### Session B: Testing + Pagination
**Priority:** 🔴 P0 - CRITICAL FOR SCALE

Key deliverables:
- Jest + React Testing Library setup
- 100% coverage on security helpers
- 80% coverage on critical hooks
- Pagination on 7 collections
- Bundle optimization

Parallel agents: 18 tasks across 4 batches

### Session C: Coming Soon Features
**Priority:** 🟠 P2 - FEATURE COMPLETION

Key deliverables:
- Client portal: Projects, Messages, Photos
- Field portal: Calendar, Offline downloads
- Sub portal: Invoices, Photos, Bids
- Dashboard: Schedule, Crew, Time, Inbox, Messages

Parallel agents: 18 tasks across 6 batches

### Session D: Integrations + Security
**Priority:** 🔴 P0 (Security) + 🟠 P2 (Integrations)

Key deliverables:
- Twilio SMS fully functional
- QBO scheduled sync
- PII field encryption
- Rate limiting on all APIs
- Comprehensive audit logging
- Session management

Parallel agents: 15 tasks across 6 batches

### Session E: Launch Prep + Deploy
**Priority:** 🔴 P0 - LAUNCH CRITICAL

Key deliverables:
- Production secrets verified
- Monitoring + alerts configured
- Sentry error tracking
- Full E2E regression
- Cross-browser testing
- Production deployment
- Launch documentation

Parallel agents: 11 tasks across 6 batches

---

## Self-Improvement Loop

Each session includes a **retrospective agent** at the end that:

1. **Analyzes errors encountered** during the session
2. **Identifies patterns** in mistakes or successful approaches
3. **Updates CLAUDE.md** with new conventions and gotchas
4. **Updates documentation** (COMPONENT_PATTERNS.md, DEVELOPMENT_GUIDE.md, etc.)
5. **Creates session learnings** file for future reference
6. **Updates SPRINT_STATUS.md** with completion status

This ensures each session makes the codebase AND the development process better.

---

## Running Sessions

### Recommended Approach

1. **Run sessions sequentially** (A → B → C → D → E)
2. **Verify completion** before moving to next session
3. **Don't skip sessions** - they build on each other

### Session Commands

```bash
# Session A (start here)
claude "Execute session A from .claude-sessions/SESSION-A-critical-fixes-refactoring.md"

# Session B (after A completes)
claude "Execute session B from .claude-sessions/SESSION-B-testing-pagination.md"

# Session C (after B completes)
claude "Execute session C from .claude-sessions/SESSION-C-coming-soon-features.md"

# Session D (after C completes)
claude "Execute session D from .claude-sessions/SESSION-D-integrations-security.md"

# Session E (after D completes)
claude "Execute session E from .claude-sessions/SESSION-E-launch-prep-deploy.md"
```

### Partial Sessions

If a session is interrupted, you can resume by:
1. Checking what was completed (look for checkboxes in session file)
2. Starting from the next incomplete batch
3. Tell Claude: "Resume session X from batch Y.Z"

---

## Files in This Directory

```
.claude-sessions/
├── README.md                              # This file
├── SESSION-A-critical-fixes-refactoring.md
├── SESSION-B-testing-pagination.md
├── SESSION-C-coming-soon-features.md
├── SESSION-D-integrations-security.md
├── SESSION-E-launch-prep-deploy.md
└── (learnings files created after each session)
    ├── SESSION-A-learnings.md
    ├── SESSION-B-learnings.md
    ├── SESSION-C-learnings.md
    ├── SESSION-D-learnings.md
    └── LAUNCH_RETROSPECTIVE.md
```

---

## Completion Tracking

After each session, the retrospective agent updates:
- `docs/SPRINT_STATUS.md` - Overall progress
- `CLAUDE.md` - Development conventions
- Session-specific learnings file

You can track overall progress by checking these files.

---

## Troubleshooting

### Session fails to start
- Verify prerequisites from previous session
- Run `npx tsc --noEmit` to check for TypeScript errors
- Check that required files exist

### Agent tasks fail
- Read the error message carefully
- Check file paths are correct
- Verify imports/exports
- Run tsc to find type errors

### Tests fail
- Check test output for specific failures
- May need to update mocks
- Verify test utilities are properly configured

### Deployment fails
- Check Cloud Build logs
- Verify secrets are configured
- Check Docker build locally first

---

## Support

If you encounter issues:
1. Check the session file for troubleshooting hints
2. Review learnings files from previous sessions
3. Check docs/DEVELOPMENT_GUIDE.md for patterns
4. Ask Claude for help with specific errors
