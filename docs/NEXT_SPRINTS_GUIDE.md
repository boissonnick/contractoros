# Next Sprints Guide - Quick Start

**Last Updated:** 2026-02-06
**Current Sprint:** Sprint 114 - Payroll & Team Management Polish ✅ COMPLETE
**Next Sprint:** Sprint 115 (see REPRIORITIZED_SPRINT_PLAN.md)

---

## Quick Start

### Option 1: Check Current Status

```bash
# View current sprint progress
cat docs/SPRINT_STATUS.md | head -100

# View sprint plan (Sprints 106-140)
cat docs/REPRIORITIZED_SPRINT_PLAN.md | tail -500
```

### Option 2: Start Next Sprint

```
In Claude Code, say:
"Start Sprint 115 — [next sprint name from REPRIORITIZED_SPRINT_PLAN.md]"
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
### Phase 14: Deployment — Sprints 96-97 COMPLETE
- Sprint 96: Firebase deploy + seed execution ✅
- Sprint 97: Cloud Build + Cloud Run deploy ✅ → https://contractoros-alpha-cajchtshqa-uw.a.run.app
### Sprints 98-105: DEFERRED (testing/hardening — folded into Phase 18)

### Phase 17: Development Build Phase (CURRENT)

**Financial Pipeline (P0):**
- **Sprint 106:** Estimates Hook & Estimate-to-Invoice Pipeline ✅ COMPLETE
- **Sprint 107:** Invoice PDF & Email Delivery ✅ COMPLETE
- **Sprint 108:** Client Portal — Full Experience Build ✅ COMPLETE

**Integration (P1):**
- **Sprint 109:** QuickBooks Online — OAuth & Account Mapping (P1) ✅ COMPLETE
- **Sprint 110:** QuickBooks Online — Invoice & Expense Sync (P1) ✅ COMPLETE

**Field & Reports (P1):**
- **Sprint 111:** Field Portal Hardening (P1) ✅ COMPLETE
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

### Phase 18: Production Hardening (POST Phase 17)

- **Sprint 121:** E2E Regression & Smoke Testing (P0)
- **Sprint 122:** ESLint + Console Cleanup Mega-Sprint (P1)
- **Sprint 123:** Unit Tests (1,502 → 2,000+) (P1)
- **Sprint 124:** Error Boundaries & Loading States (P1)

### Phase 19: Integrations & Ecosystem

- **Sprint 125:** Stripe Connect — Online Client Payments (P0)
- **Sprint 126:** Google Calendar & Apple Calendar Sync (P1)
- **Sprint 127:** Xero Accounting Integration (P2)
- **Sprint 128:** Zapier / Make.com Webhooks (P2)

### Phase 20: AI & Intelligence

- **Sprint 129:** AI Estimate Builder (P0)
- **Sprint 130:** AI Schedule Optimizer (P1)
- **Sprint 131:** Smart Notifications & Auto-Categorization (P1)
- **Sprint 132:** AI Assistant Chat Enhancement (P2)

### Phase 21: Native Mobile Foundation

- **Sprint 133:** React Native Setup & Shared Types (P0)
- **Sprint 134:** Mobile Dashboard & Projects (P0)
- **Sprint 135:** Mobile Time Tracking & Schedule (P0)
- **Sprint 136:** Mobile Messages & App Store Prep (P1)

### Phase 22: Client Experience & Residential GC Polish

- **Sprint 137:** Client Selection Board & Allowance Tracking (P0)
- **Sprint 138:** Project Timeline & Progress Sharing (P0)
- **Sprint 139:** Warranty & Maintenance Tracking (P1)
- **Sprint 140:** Performance Audit & Optimization Mega-Sprint (P1)

---

## Sprint Quick Reference (106-140)

### Phase 17: Development Build (106-120)

| Sprint | Focus | Priority | Hours | Status |
|--------|-------|----------|-------|--------|
| **106** | Estimates hook + estimate→invoice pipeline | P0 | 8-10 | ✅ |
| **107** | Invoice PDF generation + email delivery | P0 | 6-8 | ✅ |
| **108** | Client portal comprehensive build | P0 | 10-14 | ✅ |
| **109** | QBO OAuth + account mapping | P1 | 10-14 | ✅ |
| **110** | QBO invoice/expense sync + webhooks | P1 | 8-10 | ✅ |
| **111** | Field portal: issues, safety, materials | P1 | 8-10 | |
| **112** | P&L, balance sheet, cash flow + PDF export | P1 | 10-12 | |
| **113** | Console cleanup (1041→<100) + logger | P2 | 6-8 | |
| **114** | Payroll OT, PTO, certifications | P1 | 8-10 | |
| **115** | Unified inbox, read receipts, templates | P2 | 8-10 | |
| **116** | Sub portal bid/invoice/compliance | P2 | 8-10 | |
| **117** | Error boundaries + skeleton loading | P2 | 6-8 | |
| **118** | Project detail: activity, health, Gantt | P1 | 8-10 | |
| **119** | Dashboard widgets + global search | P2 | 6-8 | |
| **120** | TODO cleanup, dead code, hook consistency | P2 | 8-10 | |

### Phase 18: Production Hardening (121-124)

| Sprint | Focus | Priority | Hours | Type |
|--------|-------|----------|-------|------|
| **121** | E2E Regression & Smoke Testing | P0 | 8-12 | Polish |
| **122** | ESLint + Console Cleanup Mega-Sprint | P1 | 10-14 | Polish |
| **123** | Unit Tests (1,502 → 2,000+) | P1 | 10-14 | Polish |
| **124** | Error Boundaries & Loading States | P1 | 8-10 | Polish |

### Phase 19: Integrations & Ecosystem (125-128)

| Sprint | Focus | Priority | Hours | Type |
|--------|-------|----------|-------|------|
| **125** | Stripe Connect — Online Client Payments | P0 | 10-14 | Feature |
| **126** | Google Calendar & Apple Calendar Sync | P1 | 8-10 | Feature |
| **127** | Xero Accounting Integration | P2 | 10-14 | Feature |
| **128** | Zapier / Make.com Webhooks | P2 | 6-8 | Feature |

### Phase 20: AI & Intelligence (129-132)

| Sprint | Focus | Priority | Hours | Type |
|--------|-------|----------|-------|------|
| **129** | AI Estimate Builder | P0 | 10-14 | Feature |
| **130** | AI Schedule Optimizer | P1 | 8-10 | Feature |
| **131** | Smart Notifications & Auto-Categorization | P1 | 6-8 | Feature |
| **132** | AI Assistant Chat Enhancement | P2 | 8-10 | Feature |

### Phase 21: Native Mobile Foundation (133-136)

| Sprint | Focus | Priority | Hours | Type |
|--------|-------|----------|-------|------|
| **133** | React Native Setup & Shared Types | P0 | 10-14 | Feature |
| **134** | Mobile Dashboard & Projects | P0 | 10-14 | Feature |
| **135** | Mobile Time Tracking & Schedule | P0 | 8-10 | Feature |
| **136** | Mobile Messages & App Store Prep | P1 | 10-14 | Feature |

### Phase 22: Client Experience & Residential GC Polish (137-140)

| Sprint | Focus | Priority | Hours | Type |
|--------|-------|----------|-------|------|
| **137** | Client Selection Board & Allowance Tracking | P0 | 8-10 | Feature |
| **138** | Project Timeline & Progress Sharing | P0 | 8-10 | Feature |
| **139** | Warranty & Maintenance Tracking | P1 | 8-10 | Feature |
| **140** | Performance Audit & Optimization | P1 | 10-14 | Polish |

**Phase 17 Total: ~120-150 hours (15 sprints)**
**Phases 18-22 Total: ~168-224 hours (20 sprints)**
**Grand Total (106-140): ~288-374 hours (35 sprints)**

---

## Dependency Graph

### Phase 17
```
Sprint 106 (Estimates) ──> Sprint 107 (Invoice PDF) ──> Sprint 108 (Client Portal)
Sprint 109 (QBO OAuth) ──> Sprint 110 (QBO Sync)
Sprints 111-119: Independent (any order)
Sprint 120: LAST (cleanup after all building)
```

### Phases 18-22
```
Phase 18 (Hardening) ── Sequential: 121 -> 122 -> 123 -> 124
                                                            |
                         ┌──────────────────────────────────┘
                         v
Phase 19 (Integrations) ── 125, 126, 127, 128 all independent
Phase 20 (AI)           ── 129, 130, 131 independent; 132 after 129-131
Phase 21 (Mobile)       ── Sequential: 133 -> 134 -> 135 -> 136
Phase 22 (Client UX)    ── 137, 138, 139 independent; 140 LAST

Phases 19, 20, 21 can run in PARALLEL after Phase 18.
Sprint 140 runs absolutely last.
```

---

## Key Documents

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **MODULE_REGISTRY.md** | Codebase navigation (avoids Explore agents) | **EVERY sprint start** |
| **SPRINT_STATUS.md** | Current progress & session handoffs | Every session start |
| **REPRIORITIZED_SPRINT_PLAN.md** | Sprint execution plan (106-140) | Planning new sprints |

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
