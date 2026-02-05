# Next Sprints Guide - Quick Start

**Last Updated:** 2026-02-04
**Current Sprint:** Documentation Cleanup & Restructuring
**Next Sprint:** Sprint 53 - Settings Consolidation

---

## Quick Start

### Option 1: Check Current Status

```bash
# View current sprint progress
cat docs/SPRINT_STATUS.md | head -100

# View sprint execution plan
cat docs/REPRIORITIZED_SPRINT_PLAN.md | head -200
```

### Option 2: Start Next Sprint

```
In Claude Code, say:
"Start Sprint 53 from REPRIORITIZED_SPRINT_PLAN.md
Focus on Settings Consolidation"
```

---

## 🎯 First Time Running a Sprint?

**MODULE_REGISTRY.md is mandatory.**

✅ **What it does:** Eliminates 195k tokens of Explore agent waste per sprint
✅ **How long:** 30 seconds to read vs 15 minutes of exploration
✅ **When:** Check it BEFORE any Explore agents run

**Token savings example:**
- ❌ Explore agents: 200k+ tokens, 15 minutes
- ✅ MODULE_REGISTRY: 5k tokens, 30 seconds

**[→ Read MODULE_REGISTRY.md now](MODULE_REGISTRY.md)**

---

## ⚡ BEFORE Starting Sprint Work

**🚨 CRITICAL: Check MODULE_REGISTRY.md FIRST to avoid wasting 200k+ tokens on Explore agents!**

### The Problem

**Sprint 53 wasted 248.8k tokens** just exploring the codebase before work could begin:
- Explore settings module: 26 tool uses, 100.1k tokens
- Explore schedule module: 26 tool uses, 86.2k tokens
- Explore mobile UI: 24 tool uses, 62.5k tokens

**This repeats every sprint** — Sprints 47-52 all wasted 150-250k tokens on exploration.

### The Solution: MODULE_REGISTRY.md

**Always follow this workflow:**

1. **Identify** what features/modules you need for the sprint
2. **Look them up** in `docs/MODULE_REGISTRY.md` first
3. **If found:** Use those file paths directly (no exploration needed!)
4. **If NOT found:** Run Explore agent, then UPDATE MODULE_REGISTRY.md so next sprint doesn't repeat the waste

### Token Comparison

| Approach | Token Cost | Time |
|----------|-----------|------|
| ❌ Explore from scratch | 200k+ tokens | ~15 minutes |
| ✅ Check registry first | 5k tokens | ~30 seconds |
| **Savings** | **~195k tokens** | **~14 minutes** |

### Example: Settings Sprint

**❌ Old way (Sprint 53 did this):**
```
1. Launch Explore agent: settings module
2. Wait for 26 tool uses, 100.1k tokens
3. Finally discover: useSessionManagement.ts, settings/page.tsx
```

**✅ New way (what Sprint 53 should do):**
```
1. Open docs/MODULE_REGISTRY.md
2. Find "Settings" row → useSessionManagement.ts, settings/page.tsx
3. Start work immediately
```

**DO NOT run Explore agents without checking MODULE_REGISTRY.md first!**

---

## Sprint Priority Overview

### ✅ Phase 1: Infrastructure (COMPLETE)
- Sprint 47: Node.js 22 + Firebase SDKs ✅
- Sprint 48: Next.js 16 + React 19 ✅

### ✅ Phase 2: High-Priority Bugs (COMPLETE)
- Sprint 49: Data Quality & Demo Data ✅
- Sprint 50: UI/UX Bug Fixes ✅
- Sprint 51: Navigation Bugs ✅
- Sprint 52: Reports Bugs ✅

### 🔴 Phase 3: Stability & Functionality (IN PROGRESS)
- **Sprint 53:** Settings Consolidation (1 day) ← NEXT
- **Sprint 54:** Schedule Stability (1-2 days)
- **Sprint 55:** Mobile UX Bugs (1 day)
- **Sprint 56:** Performance Optimization (1-2 days)

### ⏳ Phase 4: Enhancements (Optional)
- Sprint 57: Reporting Enhancements
- Sprint 58: Notification System
- Sprint 59: Minor Package Updates
- Sprint 60: Tailwind CSS 4

---

## Sprint 53: Settings Consolidation

**Priority:** P1 - HIGH
**Estimated Time:** 6-8 hours
**Focus:** Simplify settings navigation, improve UX

### Goals
1. Reduce settings navigation from 13 items → 6-7 items
2. Group related settings (Resources, Account)
3. Improve information architecture
4. Better user management interface

### See
- Full details in `docs/REPRIORITIZED_SPRINT_PLAN.md` → Phase 3
- Bug tracking in `docs/PLATFORM_AUDIT_COMPLETE.md`

---

## Key Documents

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **MODULE_REGISTRY.md** | Codebase navigation (avoids Explore agents) | **EVERY sprint start** |
| **SPRINT_STATUS.md** | Current progress & session handoffs | Every session start |
| **REPRIORITIZED_SPRINT_PLAN.md** | Sprint execution plan | Planning new sprints |
| **VERSION_AUDIT_FEB_2026.md** | Package versions & updates | Dependency work |
| **PLATFORM_AUDIT_COMPLETE.md** | Known issues & bugs | Bug fixing sessions |
| **STRATEGIC_PLAN_FEB_2026.md** | Platform strategy | Strategic planning |

---

## Sprint Status at a Glance

| Phase | Sprints | Status | Remaining |
|-------|---------|--------|-----------|
| **Phase 1** | 47-48 | ✅ Complete | 0 days |
| **Phase 2** | 49-52 | ✅ Complete | 0 days |
| **Phase 3** | 53-56 | 🔴 In Progress | 4-6 days |
| **Phase 4** | 57-60 | ⏳ Optional | 4-6 days |

**Total Critical Path Remaining:** 4-6 days
**Total with Optional:** 8-12 days

---

## After Current Sprint

When starting a new sprint:

1. **Mark current sprint complete** in `SPRINT_STATUS.md`
2. **Archive old sprints** if 3+ sprints completed (see rolling window rules in CLAUDE.md)
3. **Read sprint overview** from `REPRIORITIZED_SPRINT_PLAN.md`
4. **Check for blockers** in `PLATFORM_AUDIT_COMPLETE.md`
5. **Launch sprint** with clear acceptance criteria

---

## Version Update Status

**Critical updates:** ✅ COMPLETE (Sprints 47-48)
- Node.js 22 ✅
- Next.js 16 ✅
- React 19 ✅
- Firebase SDKs updated ✅

**Optional updates:** Deferred to Sprints 59-60
- Tailwind CSS 4 (Sprint 60)
- Zod 4 (Sprint 59)
- ESLint 9 (Sprint 59)

See `docs/VERSION_AUDIT_FEB_2026.md` for complete version matrix.

---

## Rolling Window Maintenance

**Current sprint window:** Keep most recent 3 sprints in SPRINT_STATUS.md
- Sprint 52 (last completed)
- Sprint 51 (2nd last)
- Sprint 50 (3rd last)

**Archive trigger:** When Sprint 53 completes, archive Sprint 50

See `docs/DOCUMENTATION_MAINTENANCE.md` for full rolling window rules.
