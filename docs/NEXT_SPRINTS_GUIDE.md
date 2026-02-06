# Next Sprints Guide - Quick Start

**Last Updated:** 2026-02-06
**Current Sprint:** Sprint 106 - Estimates Hook & Estimate-to-Invoice Pipeline ✅ COMPLETE
**Next Sprint:** Sprint 107 - Invoice PDF & Email Delivery

---

## Quick Start

### Option 1: Check Current Status

```bash
# View current sprint progress
cat docs/SPRINT_STATUS.md | head -100

# View sprint plan (Sprints 106-120)
cat docs/REPRIORITIZED_SPRINT_PLAN.md | tail -300
```

### Option 2: Start Sprint 107

```
In Claude Code, say:
"Start Sprint 107 — Invoice PDF & Email Delivery.
Wire InvoicePdf template, add download/email actions, recurring invoice support."
```

---

## First Time Running a Sprint?

**MODULE_REGISTRY.md is mandatory.**

- **What it does:** Eliminates 195k tokens of Explore agent waste per sprint
- **How long:** 30 seconds to read vs 15 minutes of exploration
- **When:** Check it BEFORE any Explore agents run

**[Read MODULE_REGISTRY.md now](MODULE_REGISTRY.md)**

---

## Sprint Priority Overview

### Phases 1-13: ALL COMPLETE (Sprints 47-95)
### Phase 14: Deployment — Sprint 96 COMPLETE
### Sprints 97-105: DEFERRED (deploy/testing — building first)

### Phase 17: Development Build Phase (CURRENT)

**Financial Pipeline (P0):**
- **Sprint 106:** Estimates Hook & Estimate-to-Invoice Pipeline ✅ COMPLETE
- **Sprint 107:** Invoice PDF & Email Delivery (P0) 📋 NEXT
- **Sprint 108:** Client Portal — Full Experience Build (P0)

**Integration (P1):**
- **Sprint 109:** QuickBooks Online — OAuth & Account Mapping (P1)
- **Sprint 110:** QuickBooks Online — Invoice & Expense Sync (P1)

**Field & Reports (P1):**
- **Sprint 111:** Field Portal Hardening (P1)
- **Sprint 112:** Advanced Reporting — Financial Statements & Exports (P1)

**Code Quality & Internal Ops (P1-P2):**
- **Sprint 113:** Console Cleanup & Structured Logging (P2)
- **Sprint 114:** Payroll & Team Management Polish (P1)
- **Sprint 115:** Messaging & Communication Overhaul (P2)

**Portal & Polish (P2):**
- **Sprint 116:** Subcontractor Portal & Workflow Enhancement (P2)
- **Sprint 117:** Error Handling, Boundaries & Loading States (P2)
- **Sprint 118:** Project Detail Page Polish (P1)
- **Sprint 119:** Dashboard & Navigation Refresh (P2)
- **Sprint 120:** Refactoring & Tech Debt Cleanup (P2)

---

## Sprint Quick Reference (106-120)

| Sprint | Focus | Priority | Hours |
|--------|-------|----------|-------|
| **106** | Estimates hook + estimate→invoice pipeline | P0 | 8-10 |
| **107** | Invoice PDF generation + email delivery | P0 | 6-8 |
| **108** | Client portal comprehensive build | P0 | 10-14 |
| **109** | QBO OAuth + account mapping | P1 | 10-14 |
| **110** | QBO invoice/expense sync + webhooks | P1 | 8-10 |
| **111** | Field portal: issues, safety, materials | P1 | 8-10 |
| **112** | P&L, balance sheet, cash flow + PDF export | P1 | 10-12 |
| **113** | Console cleanup (1041→<100) + logger | P2 | 6-8 |
| **114** | Payroll OT, PTO, certifications | P1 | 8-10 |
| **115** | Unified inbox, read receipts, templates | P2 | 8-10 |
| **116** | Sub portal bid/invoice/compliance | P2 | 8-10 |
| **117** | Error boundaries + skeleton loading | P2 | 6-8 |
| **118** | Project detail: activity, health, Gantt | P1 | 8-10 |
| **119** | Dashboard widgets + global search | P2 | 6-8 |
| **120** | TODO cleanup, dead code, hook consistency | P2 | 8-10 |

**Total: ~120-150 hours across 15 sprints**

---

## Dependency Graph

```
Sprint 106 (Estimates) ──> Sprint 107 (Invoice PDF) ──> Sprint 108 (Client Portal)

Sprint 109 (QBO OAuth) ──> Sprint 110 (QBO Sync)

Sprints 111-119: Independent (any order)
Sprint 120: LAST (cleanup after all building)
```

---

## Key Documents

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **MODULE_REGISTRY.md** | Codebase navigation (avoids Explore agents) | **EVERY sprint start** |
| **SPRINT_STATUS.md** | Current progress & session handoffs | Every session start |
| **REPRIORITIZED_SPRINT_PLAN.md** | Sprint execution plan (106-120) | Planning new sprints |

---

## After Current Sprint

When starting a new sprint:

1. **Mark current sprint complete** in `SPRINT_STATUS.md`
2. **Archive old sprints** if 3+ sprints completed (see rolling window rules in CLAUDE.md)
3. **Check MODULE_REGISTRY.md** for file paths
4. **Launch sprint** — check for implementation brief first

---

## Version Update Status

**All major upgrades COMPLETE:**
- Node.js 22 (Sprint 47)
- Next.js 16 (Sprint 48)
- React 19 (Sprint 48)
- Firebase 12 (Sprint 64)
- ESLint 9 (Sprint 62)
- Tailwind 4
- Zod 4
