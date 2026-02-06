# Demo Data Audit — Full Platform Gap Analysis

> **Date:** February 5, 2026
> **Auditor:** Claude (automated browser audit)
> **Method:** Page-by-page Chrome inspection at localhost:3000
> **Purpose:** Identify all demo data gaps to plan a comprehensive seeding sprint

---

## Executive Summary

The platform has **23 projects**, **13 clients**, **6 team members**, **36 daily logs**, and **31 payroll runs** — but the vast majority of features show empty states or broken data relationships. The #1 systemic issue is **zero invoices/revenue data**, which cascades into broken financials across the entire platform. Of ~40 audited pages/features, **~28 are completely empty or severely under-seeded**.

### Severity Legend
- **CRITICAL** — Feature appears broken/empty, makes platform look non-functional
- **HIGH** — Key feature missing data, poor demo impression
- **MEDIUM** — Feature exists but data is sparse or unrealistic
- **LOW** — Minor gap, nice-to-have for realism

---

## Gap Summary by Category

### 1. FINANCIAL DATA (CRITICAL — Cascading Impact)

| Feature | Current State | Severity | What's Needed |
|---------|--------------|----------|---------------|
| **Invoices** | 0 invoices, $0 across all stats | CRITICAL | 20-30 invoices across projects (draft, sent, paid, overdue) |
| **Revenue** | $0 everywhere (Dashboard, Finance, Intelligence, Reports) | CRITICAL | Invoices + payments = revenue. Fix invoices first. |
| **Estimates** | 0 estimates, $0 won value, 0% win rate | CRITICAL | 8-12 estimates (draft, sent, accepted, declined) |
| **AP Invoicing** | 0 sub invoices | HIGH | 10-15 sub invoices (submitted, approved, paid) |
| **Payments** | $0 received, $0 outstanding | CRITICAL | Payment records tied to invoices |
| **Job Costing** | "No job costing data available" | HIGH | Cost codes, labor hours, material costs per project |
| **Accounts Receivable** | $0 across all aging buckets | CRITICAL | AR aging data (current, 30, 60, 90+ days) |
| **Cash Flow Forecast** | $0 inflow, -$2.3M outflow (wildly unrealistic) | CRITICAL | Realistic projected inflows from invoices |
| **Profit Margins** | -100% across all views | CRITICAL | Fixed by adding revenue data |
| **Budget vs Actual** | Only expenses, no revenue comparison | HIGH | Invoice/revenue data per project |
| **Expense Breakdown** | Only 9 expenses ($2,548 total) | MEDIUM | 50-100 expenses across categories and projects |

### 2. PROJECT DATA (HIGH — Per-Project Detail)

| Feature | Current State | Severity | What's Needed |
|---------|--------------|----------|---------------|
| **Project Scopes** | "Created scope v1 with 0 items" for all projects | CRITICAL | Scope items with line items for at least 5-8 projects |
| **Quote Builder** | Sections exist but all have 0 items, $0 | CRITICAL | Line items in quote sections (labor + materials) |
| **Project Tasks** | Tasks exist (36 pending) but 0/0 complete on project pages | HIGH | Tasks with mixed completion states, assignees |
| **Project Activity/Notes** | 0 notes, 0 activity on all projects | HIGH | 20-30 activity entries, 5-10 notes per active project |
| **Change Orders** | "Unable to Load" — missing Firestore index | CRITICAL (BUG) | Deploy index + seed 5-10 change orders |
| **Project Selections** | Loading spinner, never loads | CRITICAL (BUG) | Fix loading + seed selections data |
| **Project Finances** | "Failed to load financial data" toast | HIGH (BUG) | Fix error + seed project-level invoices/payments |
| **Client Assignment** | Many projects show "Not assigned" | HIGH | Link existing clients to projects |
| **Project Phases** | Not visible on most projects | MEDIUM | Phase data with dates and progress |
| **Project Preferences** | Empty client preferences | LOW | Preference data for 3-5 projects |

### 3. SCHEDULE & TIME (HIGH)

| Feature | Current State | Severity | What's Needed |
|---------|--------------|----------|---------------|
| **Schedule/Calendar** | Completely empty, 0 events | CRITICAL | 30-50 scheduled events (jobs, inspections, meetings) spanning 2-3 months |
| **Time Tracking** | 0 hours logged for entire org | CRITICAL | 200+ time entries across team members and projects |
| **Timesheets** | 0 timesheets to review | HIGH | Weekly timesheets for team members |
| **Crew Availability** | Empty | MEDIUM | Availability data for team members |
| **Time Off Requests** | Empty | LOW | 2-3 sample time off requests |
| **Field Schedule** | 0 items scheduled | HIGH | User-assigned schedule events |

### 4. TEAM & SUBCONTRACTORS (HIGH)

| Feature | Current State | Severity | What's Needed |
|---------|--------------|----------|---------------|
| **Subcontractors** | Only 1 sub (C+C Drywall), 0 projects, $0 paid | CRITICAL | 8-12 subs across trades (plumbing, electrical, HVAC, concrete, framing, roofing) |
| **Sub Bids** | No bids data | HIGH | 10-15 bids in various states (pending, accepted, declined) |
| **Sub Performance** | No ratings, no metrics | HIGH | Rating data, on-time %, completed projects |
| **Team Cost Rates** | All show "Set Cost Rate" | MEDIUM | Hourly/daily rates for all team members |
| **Team Trades** | Some team members missing trade | LOW | Assign trades to all team members |

### 5. COMMUNICATION (HIGH)

| Feature | Current State | Severity | What's Needed |
|---------|--------------|----------|---------------|
| **Messages/Channels** | "No channels yet" | HIGH | 3-5 project channels with message threads |
| **SMS Messaging** | "No messages yet" | HIGH | 10-20 SMS conversations with clients/subs |
| **Notifications** | "No notifications yet" | MEDIUM | 15-20 notifications (task assignments, approvals, messages) |

### 6. DOCUMENTS & PHOTOS (HIGH)

| Feature | Current State | Severity | What's Needed |
|---------|--------------|----------|---------------|
| **Project Photos** | "No photos yet" across entire org | CRITICAL | 50-100 demo photos across projects (progress, before/after) |
| **Documents** | "No documents yet" | HIGH | Contracts, permits, insurance certs, lien waivers |
| **E-Signatures** | 0 across all statuses | HIGH | 5-10 signature requests (pending, signed, declined) |

### 7. COMPLIANCE & SAFETY (MEDIUM)

| Feature | Current State | Severity | What's Needed |
|---------|--------------|----------|---------------|
| **Safety Inspections** | 0 inspections, 0 passed | MEDIUM | 10-15 inspections (passed, failed, pending) |
| **Safety Incidents** | 0 incidents | MEDIUM | 2-3 incidents (reported, resolved) |
| **Toolbox Talks** | 0 talks | MEDIUM | 5-8 toolbox talk records |
| **RFIs** | 0 total across all projects | HIGH | 8-12 RFIs (open, responded, closed) |
| **Submittals** | 0 total across all projects | HIGH | 8-12 submittals (pending review, approved, needs revision) |

### 8. SALES & CRM (HIGH)

| Feature | Current State | Severity | What's Needed |
|---------|--------------|----------|---------------|
| **Lead Pipeline** | 0 leads, $0 pipeline | HIGH | 10-15 leads across pipeline stages (new, contacted, qualified, proposal sent, won, lost) |
| **Reviews** | "No reviews yet" | MEDIUM | 8-12 reviews with ratings and text (Google, manual) |
| **Service Tickets** | 0 tickets | MEDIUM | 5-8 service tickets (open, scheduled, completed) |

### 9. EQUIPMENT & MATERIALS (MEDIUM)

| Feature | Current State | Severity | What's Needed |
|---------|--------------|----------|---------------|
| **Equipment** | 0 equipment items | HIGH | 10-15 equipment items (excavator, truck, tools, scaffolding) |
| **Purchase Orders** | 0 orders | HIGH | 5-10 POs (pending, received, partial) |
| **Suppliers** | 0 suppliers | HIGH | 5-8 suppliers (lumber yards, plumbing supply, electrical supply) |
| **Material Alerts** | 0 alerts | LOW | Low-stock alerts for some materials |
| **Material Availability** | Shows "0 ea Available" for items with stock | LOW (BUG) | Fix available calculation |

### 10. ANALYTICS & REPORTING (CASCADING)

| Feature | Current State | Severity | What's Needed |
|---------|--------------|----------|---------------|
| **Business Health Score** | 65/100 but all financials are $0 | CRITICAL | Score is misleading without real data |
| **Revenue & Expenses Chart** | Expenses only, revenue flat at $0 | CRITICAL | Revenue data from invoices |
| **Profit Margin Trend** | Flat at 0% | CRITICAL | Fixed by adding revenue |
| **Material Prices** | "No price data available" | MEDIUM | FRED API integration or static demo prices |
| **Operational Reports** | Likely empty | HIGH | Depends on underlying data |
| **Cash Flow Runway** | Shows -$2.3M net outflow | CRITICAL | Unrealistic without revenue |

### 11. PORTAL-SPECIFIC GAPS

| Portal | Current State | What's Needed |
|--------|--------------|---------------|
| **Client Portal** | Redirects to dashboard (no client users) | Demo client user account + client-visible data |
| **Sub Portal** | Redirects to dashboard (no sub users) | Demo sub user account + assigned projects/bids |
| **Field Portal** | Clock stuck at 174hrs, no tasks, no schedule | Clock reset, assigned tasks, schedule events |

### 12. DATA QUALITY ISSUES (BUGS)

| Issue | Location | Severity |
|-------|----------|----------|
| Change Orders index missing | Project > Change Orders tab | CRITICAL |
| Selections page infinite loading | Project > Selections tab (under Docs) | CRITICAL |
| "Failed to load financial data" toast | Project > Finances tab | HIGH |
| Clock running 174+ hours | Field Portal | HIGH |
| All payroll runs share same Run ID #202606 | Payroll page | MEDIUM |
| Material "Available" shows 0 for items with stock | Materials inventory | LOW |
| 99 overdue tasks (all past due dates) | Reports/Business Command Center | MEDIUM |

---

## Recommended Seeding Sprint Plan

### Phase 1: Fix Blocking Bugs (Day 1)
1. Deploy missing Firestore indexes (change orders)
2. Fix selections page loading issue
3. Fix project finances data loading error
4. Reset stuck field clock
5. Fix material availability calculation

### Phase 2: Financial Foundation (Day 1-2)
Priority order matters — later data depends on earlier:
1. **Invoices** (20-30) — Various statuses, tied to projects and clients
2. **Payments** (15-20) — Tied to invoices, creates revenue
3. **Estimates** (8-12) — Various statuses, builds pipeline
4. **AP/Sub Invoices** (10-15) — Creates AP data

### Phase 3: Project Detail Hydration (Day 2-3)
1. **Scope items** for 5-8 projects (line items with quantities)
2. **Quote line items** for 5-8 projects (tied to scope)
3. **Tasks with mixed statuses** (reset overdue dates to future)
4. **Activity log entries** (20-30 per project)
5. **Notes** (5-10 per active project)
6. **Change orders** (after index fix)
7. **Project phases** with dates and progress
8. **Client-to-project assignments** (link existing clients)

### Phase 4: Schedule & Time (Day 3)
1. **Schedule events** (30-50) spanning Jan-Mar 2026
2. **Time entries** (200+) across team members
3. **Timesheets** tied to time entries

### Phase 5: Team & Subs (Day 3-4)
1. **Subcontractors** (8-12) with trades, insurance, ratings
2. **Sub bids** (10-15) in various states
3. **Team cost rates** for all members
4. **Lead pipeline** (10-15 leads)

### Phase 6: Documents & Communication (Day 4)
1. **Message channels** with threaded conversations
2. **SMS conversations** (10-20)
3. **Notifications** (15-20)
4. **E-signature requests** (5-10)
5. **Documents** (contracts, permits)

### Phase 7: Compliance & Misc (Day 4-5)
1. **RFIs** (8-12) across projects
2. **Submittals** (8-12) across projects
3. **Safety inspections** (10-15)
4. **Equipment** (10-15 items)
5. **Purchase orders** (5-10)
6. **Suppliers** (5-8)
7. **Reviews** (8-12)
8. **Service tickets** (5-8)

### Phase 8: Portal Users & Photos (Day 5)
1. **Demo client user** for client portal testing
2. **Demo sub user** for sub portal testing
3. **Project photos** (requires file storage — placeholder URLs or sample images)

---

## Existing Seed Scripts Assessment

| Script | Location | What It Seeds | Quality |
|--------|----------|---------------|---------|
| `seed-to-named-db.ts` | scripts/seed-demo/ | User, org, clients, projects, tasks | Good base |
| `index.ts` | scripts/seed-demo/ | Org, users, clients, financials | Good base |
| `seed-projects.ts` | scripts/seed-demo/ | Projects | OK (23 projects exist) |
| `seed-tasks.ts` | scripts/seed-demo/ | Tasks | OK but all overdue |
| `seed-rfis.ts` | scripts/seed-demo/ | RFIs | Not deployed (0 RFIs visible) |
| `seed-subcontractors.ts` | scripts/seed-demo/ | Subs & bids | Minimal (only 1 sub) |

### What's Missing from Seed Scripts
- Invoice seeder
- Payment seeder
- Estimate seeder
- Schedule/event seeder
- Time entry seeder
- Timesheet seeder
- Message/channel seeder
- SMS conversation seeder
- E-signature seeder
- Safety/inspection seeder
- RFI seeder (exists but data not visible)
- Submittal seeder
- Equipment seeder
- Purchase order seeder
- Supplier seeder
- Lead seeder
- Review seeder
- Service ticket seeder
- Activity log seeder
- Notification seeder
- Scope/quote line item seeder
- Change order seeder
- Phase seeder
- Document seeder
- Photo reference seeder

---

## Data Relationship Map

```
Clients ─────┬── Projects ─────┬── Tasks (assignees, due dates)
             │                 ├── Scopes (line items)
             │                 ├── Quotes (from scope)
             │                 ├── Invoices ──── Payments ──── Revenue
             │                 ├── Expenses ──── Cost tracking
             │                 ├── Change Orders
             │                 ├── Phases (timeline)
             │                 ├── Schedule Events
             │                 ├── Time Entries ──── Timesheets
             │                 ├── Daily Logs ✅ (seeded)
             │                 ├── RFIs
             │                 ├── Submittals
             │                 ├── Photos
             │                 ├── Activity Feed
             │                 ├── Notes
             │                 ├── Selections
             │                 └── Messages/Channels
             │
Subcontractors ──┬── Bids
                 ├── AP Invoices
                 └── Performance metrics

Estimates ────── Pipeline Value
Leads ────────── CRM Pipeline
Reviews ──────── Reputation
Team ─────────── Time entries, payroll ✅ (partially seeded)
Equipment ────── Materials/POs
Safety ──────── Inspections, incidents, toolbox talks
```

---

## Key Metric Targets (Realistic Demo Company)

| Metric | Current | Target | Notes |
|--------|---------|--------|-------|
| Revenue YTD | $0 | $450K-600K | 8-month-old company |
| Outstanding AR | $0 | $40K-80K | Normal for construction |
| Pipeline Value | $0 | $200K-400K | From estimates |
| Profit Margin | -100% | 15-25% | Industry standard |
| Active Projects | 11 | 11 (OK) | Already good |
| Completed Projects | 5 | 5 (OK) | Already good |
| Team Members | 6 | 6-8 (OK) | Acceptable |
| Subcontractors | 1 | 8-12 | Need more trades |
| Weekly Hours Logged | 0 | 200-240 | 5-6 FTE × 40hrs |
| Monthly Expenses | ~$2.5K | $30K-60K | More realistic |

---

## Estimated Effort

| Phase | New Scripts | Estimated Records | Effort |
|-------|------------|-------------------|--------|
| Phase 1: Bug fixes | 0 | 0 | 2-3 hours |
| Phase 2: Financial | 3-4 scripts | ~80 records | 4-6 hours |
| Phase 3: Project detail | 5-6 scripts | ~200 records | 6-8 hours |
| Phase 4: Schedule & Time | 2-3 scripts | ~250 records | 4-5 hours |
| Phase 5: Team & Subs | 2-3 scripts | ~50 records | 3-4 hours |
| Phase 6: Communication | 3-4 scripts | ~80 records | 4-5 hours |
| Phase 7: Compliance | 5-6 scripts | ~80 records | 4-5 hours |
| Phase 8: Portals & Photos | 2-3 scripts | ~50 records | 3-4 hours |
| **TOTAL** | **~25 scripts** | **~800 records** | **~2-3 sprints** |
