# Reference Documentation Index

**Last Updated:** 2026-02-04

This directory contains quick-reference guides that are read **as-needed** rather than every session.

---

## Quick Reference Files

| File | Use When | Token Cost |
|------|----------|------------|
| [ENVIRONMENT_CONFIG.md](ENVIRONMENT_CONFIG.md) | Setting up development environment | ~6,000 |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Debugging errors | ~7,000 |
| [PATTERNS_AND_TEMPLATES.md](PATTERNS_AND_TEMPLATES.md) | Building new features | ~5,000 |

**Total:** ~18,000 tokens (only read when needed)

---

## When to Read Each File

### ENVIRONMENT_CONFIG.md

**Read when:**
- Setting up new development machine
- Node.js or Firebase CLI issues
- Docker configuration problems
- Environment variable errors
- Deployment configuration needed

**Don't read when:**
- Already have working environment
- Just doing feature development
- Environment is stable

### TROUBLESHOOTING.md

**Read when:**
- Encountering specific error
- Firestore permission denied
- TypeScript type errors
- Docker build failures
- Named database confusion
- Performance debugging needed

**Don't read when:**
- Everything working smoothly
- Proactive exploration (use search instead)

### PATTERNS_AND_TEMPLATES.md

**Read when:**
- Building new feature
- Need component pattern reference
- Unsure of hook structure
- Need Tailwind class examples
- Creating CRUD operations

**Don't read when:**
- Following existing patterns in codebase
- Simple component modifications

---

## Alternative: Targeted Search

Instead of reading entire reference files, use targeted search:

```bash
# Find specific error
grep -n "Missing permissions" docs/reference/TROUBLESHOOTING.md

# Find pattern example
grep -n "Form Modal Pattern" docs/reference/PATTERNS_AND_TEMPLATES.md

# Find environment variable
grep -n "FIREBASE_API_KEY" docs/reference/ENVIRONMENT_CONFIG.md
```

**Token savings:** ~90% (read 50 lines instead of 500)

---

## Reference vs Active Documentation

### Active Documentation (Read Every Session)
- `CLAUDE.md` — Core instructions
- `docs/SPRINT_STATUS.md` — Current progress
- `docs/REPRIORITIZED_SPRINT_PLAN.md` — Execution plan
- `docs/NEXT_SPRINTS_GUIDE.md` — Sprint quick-start

**Token cost:** ~40,000-50,000

### Reference Documentation (Read As-Needed)
- `docs/reference/*.md` — This directory
- `docs/ARCHITECTURE.md` — Technical deep-dive
- `docs/DEVELOPMENT_GUIDE.md` — Feature patterns
- `docs/VERSION_AUDIT_FEB_2026.md` — Package versions

**Token cost:** ~50,000-70,000 (only when needed)

---

## Maintenance

**Monthly:**
- Review for outdated information
- Add new patterns as they emerge
- Update environment requirements

**Quarterly:**
- Major updates to match tech stack changes
- Consolidate duplicate troubleshooting entries
- Archive obsolete patterns

---

*These files are designed to be searchable. Use grep/search before reading entire files.*
