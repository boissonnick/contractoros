# ContractorOS Documentation

**Last Updated:** 2026-02-04

This directory contains all documentation for ContractorOS development, organized by read frequency and use case.

---

## 🚀 Quick Start

**New to the project?** Start here:
1. Read [`../CLAUDE.md`](../CLAUDE.md) — Core development instructions
2. Check [`NEXT_SPRINTS_GUIDE.md`](NEXT_SPRINTS_GUIDE.md) — Current sprint priorities
3. Review [`SPRINT_STATUS.md`](SPRINT_STATUS.md) — Active progress

---

## 📅 Daily Reference (Read These Often)

| Document | Purpose | When to Read | Token Cost |
|----------|---------|--------------|------------|
| [NEXT_SPRINTS_GUIDE.md](NEXT_SPRINTS_GUIDE.md) | Sprint quick-start & priorities | Session start (sprint planning) | ~3,000 |
| [SPRINT_STATUS.md](SPRINT_STATUS.md) | Current progress & session handoffs | Daily (session start/end) | ~12,000 |
| [REPRIORITIZED_SPRINT_PLAN.md](REPRIORITIZED_SPRINT_PLAN.md) | Active execution roadmap | Daily (sprint work) | ~18,000 |

**Total daily:** ~33,000 tokens

---

## 📊 Weekly Reference

| Document | Purpose | When to Read | Token Cost |
|----------|---------|--------------|------------|
| [VERSION_AUDIT_FEB_2026.md](VERSION_AUDIT_FEB_2026.md) | Package versions & upgrade tracking | Weekly (dependency work) | ~15,000 |
| [STRATEGIC_PLAN_FEB_2026.md](STRATEGIC_PLAN_FEB_2026.md) | Platform strategy & roadmap | Weekly (planning sessions) | ~10,000 |

**Total weekly:** ~25,000 tokens

---

## 🔧 Technical Reference (As-Needed)

| Document | Purpose | When to Read | Token Cost |
|----------|---------|--------------|------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Technical deep-dive & system design | Architecture decisions | ~10,000 |
| [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) | Development patterns & conventions | Building new features | ~12,000 |
| [COMPONENT_PATTERNS.md](COMPONENT_PATTERNS.md) | UI component patterns | Building UI components | ~8,000 |
| [TESTING_STRATEGY.md](TESTING_STRATEGY.md) | E2E testing approach | Writing/running tests | ~6,000 |
| [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) | Pre-deployment verification | Deployment prep | ~3,000 |

**Total technical:** ~39,000 tokens (only when needed)

---

## 🎯 Quick References (Target Search First)

Instead of reading entire files, use targeted search:

| Reference | Purpose | Search First | Token Cost |
|-----------|---------|--------------|------------|
| [reference/ENVIRONMENT_CONFIG.md](reference/ENVIRONMENT_CONFIG.md) | Environment setup & config | grep for specific tool | ~6,000 |
| [reference/TROUBLESHOOTING.md](reference/TROUBLESHOOTING.md) | Error debugging guide | grep for error message | ~7,000 |
| [reference/PATTERNS_AND_TEMPLATES.md](reference/PATTERNS_AND_TEMPLATES.md) | Code patterns & templates | grep for pattern name | ~5,000 |

**See:** [reference/README.md](reference/README.md) for detailed reference documentation index

**Total references:** ~18,000 tokens (only when needed)

---

## 📚 Research & Strategy (Occasional)

| Document | Purpose | Token Cost |
|----------|---------|------------|
| [research/RESEARCH_SUMMARY.md](research/RESEARCH_SUMMARY.md) | Index of research documents | ~2,000 |
| [STRATEGIC_ROADMAP_NEXT_SPRINTS.md](STRATEGIC_ROADMAP_NEXT_SPRINTS.md) | Platform analysis & strategic roadmap | ~8,000 |

---

## 📦 Archives (Historical Reference)

**Don't read these unless specifically needed — historical context only**

| Archive | Contents | When to Access |
|---------|----------|----------------|
| [archive/planning/](archive/planning/) | Completed sprint plans (Sprints 9-37B) | Researching historical decisions |
| [archive/audit/](archive/audit/) | Historical audit reports | Checking old bug reports |
| [archive/marketing-research/](archive/marketing-research/) | Branding & naming research | Brand strategy questions |
| [archive/business-fundraising/](archive/business-fundraising/) | Business documents | Fundraising context |
| [archive/MASTER_ROADMAP_historical.md](archive/MASTER_ROADMAP_historical.md) | Original roadmap | Complete historical vision |
| [archive/IMPLEMENTATION_ROADMAP_2026.md](archive/IMPLEMENTATION_ROADMAP_2026.md) | Old implementation plan | Historical implementation notes |

**Token savings:** ~60,000-80,000 per session by not reading archives

---

## 🎯 Documentation Strategy by Role

### For AI Development Sessions

**Always read:**
- `../CLAUDE.md`
- `NEXT_SPRINTS_GUIDE.md`
- `SPRINT_STATUS.md`

**Read when starting sprint:**
- `REPRIORITIZED_SPRINT_PLAN.md`

**Read as-needed:**
- Reference docs (grep first!)
- Technical docs for specific tasks
- Archives only when explicitly researching history

### For Human Developers

**Start here:**
- `../CLAUDE.md` — AI assistant instructions (useful for humans too)
- `ARCHITECTURE.md` — System design
- `DEVELOPMENT_GUIDE.md` — Patterns and conventions

**Reference:**
- `reference/` directory for quick lookups
- `TESTING_STRATEGY.md` for writing tests

### For Project Management

**Planning:**
- `REPRIORITIZED_SPRINT_PLAN.md` — Current roadmap
- `STRATEGIC_PLAN_FEB_2026.md` — Strategic direction
- `SPRINT_STATUS.md` — Current progress

**Tracking:**
- `VERSION_AUDIT_FEB_2026.md` — Dependency status
- `NEXT_SPRINTS_GUIDE.md` — Upcoming work

---

## 🔄 Maintenance

### Documentation Lifecycle

**Daily:** Update `SPRINT_STATUS.md` with progress
**After sprint:** Archive old sprints (rolling window - keep 3 most recent)
**Monthly:** Review token budgets, archive completed work
**Quarterly:** Update reference docs, remove stale content

**See:** [DOCUMENTATION_MAINTENANCE.md](DOCUMENTATION_MAINTENANCE.md) for complete maintenance procedures

### Token Budgets

| Category | Target | Max | Current Status |
|----------|--------|-----|----------------|
| Daily docs | 30,000 | 50,000 | ✅ ~33,000 |
| Weekly docs | 20,000 | 30,000 | ✅ ~25,000 |
| Technical docs | As-needed | 40,000 | ✅ On-demand |
| Reference docs | As-needed | 20,000 | ✅ On-demand |
| **Total active** | **50,000** | **80,000** | ✅ **~58,000** |

---

## 📖 Reading Order for New Sessions

### Option 1: Sprint Work (Most Common)

```
1. CLAUDE.md (core instructions)
2. SPRINT_STATUS.md (what's current)
3. REPRIORITIZED_SPRINT_PLAN.md (what's next)
4. [Start coding]
```

**Token cost:** ~40,000

### Option 2: Bug Fixing

```
1. CLAUDE.md (core instructions)
2. SPRINT_STATUS.md (context)
3. reference/TROUBLESHOOTING.md (search for error)
4. [Fix bug]
```

**Token cost:** ~30,000 + targeted reference

### Option 3: New Feature Development

```
1. CLAUDE.md (core instructions)
2. ARCHITECTURE.md (system design)
3. DEVELOPMENT_GUIDE.md (patterns)
4. reference/PATTERNS_AND_TEMPLATES.md (templates)
5. [Build feature]
```

**Token cost:** ~40,000-50,000

### Option 4: Research / Planning

```
1. CLAUDE.md (core instructions)
2. STRATEGIC_PLAN_FEB_2026.md (strategy)
3. REPRIORITIZED_SPRINT_PLAN.md (roadmap)
4. [Research]
```

**Token cost:** ~40,000

---

## 🔍 Search Strategies

### Finding Information Without Reading Entire Files

```bash
# Find specific error
grep -rn "Missing permissions" docs/reference/

# Find pattern example
grep -rn "Form Modal Pattern" docs/

# Find sprint details
grep -rn "Sprint 52" docs/SPRINT_STATUS.md

# Find type definition (DON'T read whole file!)
grep -n "export interface Client" apps/web/types/index.ts
```

**Token savings:** 90%+ when searching instead of reading

---

## 📊 Token Optimization Results

### Before Documentation Cleanup (Pre-2026-02-04)

- Daily docs: ~90,000 tokens
- SPRINT_STATUS.md: 3,142 lines
- 3 overlapping roadmaps
- No reference doc structure

### After Documentation Cleanup (Current)

- Daily docs: ~33,000 tokens (63% reduction!)
- SPRINT_STATUS.md: 483 lines (85% reduction!)
- 1 active roadmap
- Organized reference structure

**Total savings:** ~57,000 tokens per session (30-35% reduction)

---

## 🆘 Getting Help

**Can't find something?**
1. Check this README index
2. Use grep/search (see Search Strategies above)
3. Check `../CLAUDE.md` Documentation Index
4. Look in `archive/` if it's historical

**Documentation seems outdated?**
- See `DOCUMENTATION_MAINTENANCE.md` for update procedures
- Monthly reviews ensure currency

---

## 📝 Contributing to Documentation

### Adding New Documentation

**Before creating new file:**
1. Can existing file be updated instead?
2. Which directory? (active vs reference vs archive)
3. What's the read frequency? (daily, weekly, as-needed)
4. What's the lifecycle? (living doc, temporary, archival)

**File placement:**
- Active sprint work → `docs/` (root level)
- Reference material → `docs/reference/`
- Research → `docs/research/`
- Completed work → `docs/archive/`

**See:** [DOCUMENTATION_MAINTENANCE.md](DOCUMENTATION_MAINTENANCE.md) for complete guidelines

---

*This documentation structure is optimized for token efficiency while maintaining complete context availability.*
