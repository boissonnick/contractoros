# Active Documentation Inventory

**Last Updated:** 2026-02-04
**Purpose:** Master registry of all documentation with maintenance schedules

---

## Overview

This inventory tracks all active documentation, update schedules, and ownership. Use this to:
- Know when each doc should be updated
- Track documentation health
- Prevent documentation drift
- Plan quarterly reviews

---

## Core Development Docs (Read Daily/Weekly)

| Document | Lines | Last Updated | Update Schedule | Next Update | Owner |
|----------|-------|--------------|-----------------|-------------|-------|
| **CLAUDE.md** | 650 | Feb 4, 2026 | After major changes | When needed | System |
| **docs/NEXT_SPRINTS_GUIDE.md** | 139 | Feb 4, 2026 | Weekly (phase changes) | Sprint 54+ | Planning |
| **docs/SPRINT_STATUS.md** | 483 | Feb 4, 2026 | Daily (session updates) | Every session | Development |
| **docs/REPRIORITIZED_SPRINT_PLAN.md** | 850 | Feb 4, 2026 | After each sprint | Sprint 53 starts | Planning |
| **docs/STRATEGIC_PLAN_FEB_2026.md** | - | Jan 31, 2026 | Monthly | March 2026 | Strategy |
| **docs/VERSION_AUDIT_FEB_2026.md** | 798 | Feb 4, 2026 | After version upgrades | Next upgrade cycle | DevOps |

**Combined:** ~3,000 lines, ~40,000 tokens (daily reading)

---

## Technical Reference (As-Needed, Read When Relevant)

| Document | Lines | Last Updated | Update Schedule | Next Update | Owner |
|----------|-------|--------------|-----------------|-------------|-------|
| **docs/ARCHITECTURE.md** | 1,109 | Feb 4, 2026 | Every 10 sprints or major upgrade | Sprint 60 or next upgrade | Architecture |
| **docs/DEVELOPMENT_GUIDE.md** | 384 | Jan 28, 2026 | Quarterly or when practices change | May 2026 | Development |
| **docs/COMPONENT_PATTERNS.md** | 1,544 | Feb 3, 2026 | Every 20 sprints or new patterns | Sprint 70 or new pattern | UI/UX |
| **docs/TESTING_STRATEGY.md** | 428 | Jan 28, 2026 | Quarterly or framework changes | May 2026 | QA |
| **docs/LAUNCH_CHECKLIST.md** | - | Feb 2, 2026 | Before each major release | Pre-release | DevOps |

**Combined:** ~3,500 lines, ~40,000 tokens (on-demand only)

---

## Quick References (Search First, Don't Read Whole File)

| Document | Lines | Last Updated | Update Schedule | Next Update | Owner |
|----------|-------|--------------|-----------------|-------------|-------|
| **docs/reference/ENVIRONMENT_CONFIG.md** | ~400 | Feb 4, 2026 | When tools upgrade | Next tool upgrade | DevOps |
| **docs/reference/TROUBLESHOOTING.md** | ~500 | Feb 4, 2026 | When new errors discovered | As-needed | Development |
| **docs/reference/PATTERNS_AND_TEMPLATES.md** | ~400 | Feb 4, 2026 | When patterns added | As-needed | Development |
| **docs/reference/ANIMATION_GUIDELINES.md** | - | (Historical) | Rarely | As-needed | UI/UX |
| **docs/reference/FEATURE_TEMPLATE.md** | - | (Historical) | Rarely | As-needed | Development |
| **docs/reference/HELP_DOCUMENTATION_PLAN.md** | - | (Historical) | Rarely | As-needed | Documentation |
| **docs/reference/MULTI_SESSION_SETUP.md** | - | (Historical) | Rarely | As-needed | Development |
| **docs/reference/README.md** | - | Feb 4, 2026 | When structure changes | As-needed | System |

**Combined:** ~1,500 lines, ~18,000 tokens (search-first, read specific sections)

---

## System Documentation (Maintenance & Process)

| Document | Lines | Last Updated | Update Schedule | Next Update | Owner |
|----------|-------|--------------|-----------------|-------------|-------|
| **docs/README.md** | 286 | Feb 4, 2026 | When structure changes | When docs reorganized | System |
| **docs/DOCUMENTATION_MAINTENANCE.md** | 515 | Feb 4, 2026 | Quarterly | May 2026 | System |
| **docs/DOCUMENTATION_AUDIT_PLAN.md** | - | Feb 4, 2026 | Annually or when issues | Feb 2027 | System |
| **docs/ACTIVE_DOCS_INVENTORY.md** | (This file) | Feb 4, 2026 | Monthly | March 2026 | System |

**Combined:** ~800 lines, ~10,000 tokens (maintenance reference)

---

## Special Categories

### User Documentation (Separate System)

| Directory | Purpose | Last Updated | Maintenance |
|-----------|---------|--------------|-------------|
| **docs/help/** | End-user help documentation | Jan 30, 2026 | Updated with feature releases |

**Note:** User help docs are maintained separately from development documentation. They are:
- Updated when features release to users
- Not part of daily dev doc reading
- Serve different audience (end users vs developers)
- ~20+ folders with feature-specific guides

### E2E Test Suites (Living Documentation)

| Location | Purpose | Maintenance |
|----------|---------|-------------|
| **apps/web/e2e/** | Automated test suites (markdown + execution) | Updated with each feature |

**Note:** E2E tests serve as executable documentation:
- Tests verify features work
- Markdown files document test scenarios
- Updated during feature development
- See apps/web/e2e/README.md for structure

---

## Update Schedules Explained

### Daily
- **SPRINT_STATUS.md** — Updated every session with progress

### Weekly
- **NEXT_SPRINTS_GUIDE.md** — Updated when sprint phases change
- **REPRIORITIZED_SPRINT_PLAN.md** — Updated after sprint completion

### Monthly
- **STRATEGIC_PLAN_FEB_2026.md** — Strategic planning updates
- **This inventory (ACTIVE_DOCS_INVENTORY.md)** — Review and update

### Quarterly (Every ~30 Sprints)
- **DEVELOPMENT_GUIDE.md** — Review coding practices
- **TESTING_STRATEGY.md** — Review test approach
- **DOCUMENTATION_MAINTENANCE.md** — Review processes

### Every 10 Sprints
- **ARCHITECTURE.md** — After significant development milestones

### Event-Driven (When X Happens)
- **ARCHITECTURE.md** — Major tech stack upgrade (Node, React, Next.js)
- **VERSION_AUDIT_FEB_2026.md** — After any version upgrade
- **ENVIRONMENT_CONFIG.md** — When dev tools change
- **TROUBLESHOOTING.md** — New error patterns discovered
- **PATTERNS_AND_TEMPLATES.md** — New code patterns added
- **COMPONENT_PATTERNS.md** — New UI components created

---

## Maintenance Triggers

### Automatic (Rolling Window)
**Trigger:** Sprint completion
**Action:** Archive old sprints from SPRINT_STATUS.md when 3+ completed
**Frequency:** Every sprint (automatic)
**See:** DOCUMENTATION_MAINTENANCE.md for process

### Tech Stack Upgrade
**Trigger:** Node.js, React, Next.js, or Firebase SDK upgrade
**Action:** Update version references in:
- CLAUDE.md (quick reference)
- ARCHITECTURE.md (detailed)
- VERSION_AUDIT_FEB_2026.md (tracking)
**Frequency:** Every 10-20 sprints (as-needed)

### New Code Pattern
**Trigger:** Shared component or pattern created
**Action:** Document in:
- reference/PATTERNS_AND_TEMPLATES.md (quick reference)
- COMPONENT_PATTERNS.md (detailed examples)
**Frequency:** As-needed (every 5-10 sprints)

### Workflow Change
**Trigger:** Git workflow, code review, or dev practice changes
**Action:** Update DEVELOPMENT_GUIDE.md
**Frequency:** Rarely (as-needed)

---

## Health Metrics

### Token Budget Status

| Category | Target Tokens | Max Tokens | Current | Status |
|----------|---------------|------------|---------|--------|
| Daily docs | 30,000 | 50,000 | ~40,000 | ✅ On target |
| Technical reference | As-needed | 40,000 | ~40,000 | ✅ On-demand only |
| Quick references | As-needed | 20,000 | ~18,000 | ✅ Search-first |
| **Total active** | **50,000** | **90,000** | **~58,000** | ✅ Healthy |

### File Count Status

| Location | Target | Current | Status |
|----------|--------|---------|--------|
| Root .md files | 3 | 3 | ✅ Clean |
| docs/ active .md files | 10-15 | 13 | ✅ Good |
| docs/reference/ | 5-10 | 8 | ✅ Good |
| docs/archive/ categories | - | 9 | ✅ Organized |

### Update Currency Status

| Document | Last Updated | Age (Days) | Status |
|----------|--------------|------------|--------|
| CLAUDE.md | Feb 4 | 0 | ✅ Current |
| SPRINT_STATUS.md | Feb 4 | 0 | ✅ Current |
| ARCHITECTURE.md | Feb 4 | 0 | ✅ Current |
| DEVELOPMENT_GUIDE.md | Jan 28 | 7 | ⚠️ Review needed |
| TESTING_STRATEGY.md | Jan 28 | 7 | ⚠️ Review needed |

**Warning threshold:** 30 days for technical docs, 7 days for sprint docs

---

## Quarterly Review Checklist

**Run every ~30 sprints (or every 3 months):**

### Documentation Currency
- [ ] Review all docs with ⚠️ warnings (>30 days old)
- [ ] Update version references if tech stack changed
- [ ] Remove deprecated patterns/examples
- [ ] Update code examples to match current codebase

### Token Budget
- [ ] Count lines in daily docs (should be <3,000 lines total)
- [ ] Estimate tokens (~2.5 tokens per line)
- [ ] Archive if over budget

### Structure
- [ ] Check for duplicate content across files
- [ ] Consolidate if overlap >20%
- [ ] Update docs/README.md if structure changed

### Archives
- [ ] Verify archive READMEs are current
- [ ] Check no active docs accidentally in archive/
- [ ] Verify git history preserved

---

## Annual Review Checklist

**Run every February (or after major platform changes):**

### Major Audit
- [ ] Full read-through of all active docs
- [ ] Compare docs to actual codebase
- [ ] Identify stale/outdated sections
- [ ] Plan comprehensive update sprints

### Reorganization
- [ ] Evaluate if current structure still works
- [ ] Consider new archive categories
- [ ] Update maintenance schedules if needed

### Token Optimization
- [ ] Identify new opportunities for consolidation
- [ ] Consider new reference doc extractions
- [ ] Update token budgets based on patterns

---

## Contact / Ownership

**System Documentation:** @claude / project maintainer
**Technical Docs:** Development team
**Strategic Docs:** Product/project management
**User Docs:** Documentation team

**Questions about this inventory:** See DOCUMENTATION_MAINTENANCE.md

---

*This inventory created during Feb 2026 documentation cleanup. Keep it updated monthly!*
