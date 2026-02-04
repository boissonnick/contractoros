# ContractorOS Master Development Roadmap

> **Version:** 3.1
> **Last Updated:** 2026-02-03
> **Branch:** `main`
> **Sources:** `1.28.bugfixes.pdf`, `ContractorOS - Product Development Roadmap & Sprint Plan.pdf`, January 2026 Platform Audit, **February 2026 Comprehensive Platform Audit (101 issues)**

---

## Document Purpose

This is the **single source of truth** for all ContractorOS development work. It combines:
1. **Bug Fixes** - Issues from the 1.28 walkthrough (32+ items)
2. **January 2026 Audit** - Critical issues from platform audit (17 items, 57 SP)
3. **February 2026 Audit** - Comprehensive platform audit (101 issues, 512-730 hours)
4. **Product Roadmap** - New features from the competitive analysis (45+ items)
5. **Refactoring** - Technical debt and architectural improvements
6. **Sprint Planning** - Organized implementation phases

New sessions should read this document to understand all pending work.

---

## 🎯 CURRENT SPRINT: Sprint 51

**Focus:** Navigation Bugs & Structure

**See:** `docs/REPRIORITIZED_SPRINT_PLAN.md` for full sprint plan

---

## ✅ Sprint 50 Complete (2026-02-04)

**Focus:** UI/UX Bug Fixes

| Task | Status |
|------|--------|
| #1: PageHeader responsive action layout | ✅ |
| #3: Online status indicator visibility | ✅ |
| #4: Dashboard layout balance (50/50 grid) | ✅ |
| #5: Card padding consistency | ✅ |
| #7: Sub-nav spacing improvements | ✅ |
| #29: Client Preferences layout | ✅ |
| #44: Empty state standardization | ✅ |

---

## ✅ Sprint 49 Complete (2026-02-04)

**Focus:** Data Quality & Demo Data

| Task | Status |
|------|--------|
| Seeded 233 tasks (Gantt-ready with dependencies) | ✅ |
| Seeded 32 RFIs across 7 projects | ✅ |
| Seeded 90 schedule events | ✅ |
| Seeded 10 subcontractors, 23 assignments, 24 bids | ✅ |
| Seeded 20 invoices, 20 payments, 89 expenses | ✅ |
| Seeded 307 daily log entries | ✅ |
| Seeded 8 change orders, 51 submittals | ✅ |

---

## ✅ Sprint 48 Complete (2026-02-04)

**Focus:** Next.js 14→16 + React 18→19 upgrade

| Task | Status |
|------|--------|
| Next.js 14.2.35 → 16.1.6 | ✅ |
| React 18.3.1 → 19.2.4 | ✅ |
| @types/react 18 → 19 | ✅ |
| Fixed useRef() requiring initial value (GlobalSearchBar.tsx) | ✅ |
| TypeScript compiles without errors | ✅ |
| Docker builds and runs successfully | ✅ |

---

## ✅ Sprint 47 Complete (2026-02-04)

**Focus:** Node.js 22 + Firebase SDK Updates

| Task | Status |
|------|--------|
| Node.js 20 → 22 (Docker, Cloud Functions) | ✅ |
| Firebase Admin SDK 12 → 13.6.0 | ✅ |
| Firebase Functions SDK 5 → 7.0.5 | ✅ |
| .nvmrc for version consistency | ✅ |
| Fixed deprecated functions.config() | ✅ |
| Cloud Functions deployed | ✅ |

---

## ✅ Sprint 40-46 Archived

See `.claude-coordination/archive/` for historical sprint files.

---

## ✅ Sprint 38-39 Completed

### Critical Blockers - ALL RESOLVED ✅
- **FEB-011**: Category filter causes projects to disappear → `[x]` Fixed
- **FEB-013**: Firebase permissions blocking 8+ features → `[x]` Fixed
- **FEB-053**: Profit margin shows 0% for negative values → `[x]` Fixed
- **FEB-057**: Payroll displaying "NaNh total" → `[x]` Fixed

### Sprint 39 Completions

**Data Seeding (CLI 1):** 450 demo records
- Scopes (7), Submittals (54), Change Orders (8), Schedule Events (93)
- Daily Logs (256), Time Off (18), Payroll (6 runs), Client Preferences (8)

**UI/UX (CLI 2):** All layout fixes complete
- Search bar, Active Projects, Project cards, Sub-nav spacing
- Dropdown arrows, Client Preferences grid, Animation audit

**Notifications (CLI 4):** Complete system
- Browser permissions, Service worker, Granular control, Quiet hours

**Research (CLI 4):** 8 comprehensive documents
- Bank integration, Neobank, Payroll integration, Messaging architecture
- Custom reports, AI insights, AI provider management, Animation guidelines

---

## Table of Contents

1. [Vision & Strategy](#vision--strategy)
2. [Priority System](#priority-system)
3. [Work Categories](#work-categories)
4. [February 2026 Audit Summary](#february-2026-audit-summary) ⭐ NEW
5. [Bug Fixes & Critical Improvements (January 2026 Audit)](#bug-fixes--critical-improvements-january-2026-audit)
6. [Phase 0: Foundation & Technical Debt](#phase-0-foundation--technical-debt)
7. [Phase 1: Bug Fixes & Core Stability](#phase-1-bug-fixes--core-stability)
8. [Phase 2: Differentiating Features](#phase-2-differentiating-features)
9. [Phase 3: Transaction & Operations](#phase-3-transaction--operations)
10. [Phase 4: Efficiency & Scale](#phase-4-efficiency--scale)
11. [Phase 5: Advanced Features](#phase-5-advanced-features)
12. [Complete Work Item Index](#complete-work-item-index)
13. [File Change Tracking](#file-change-tracking)
14. [Testing Strategy](#testing-strategy)

---

## Vision & Strategy

### Product Vision
> "Making contractor operations so simple that running a business feels effortless, allowing contractors to focus on their craft, not their software."

### 10 Competitive Differentiators (from Product Roadmap)
1. **No Login Required for Clients** - Magic link authentication
2. **Text-First Communication** - Native SMS via Twilio
3. **One-Click Everything** - Minimal friction workflows
4. **Mobile Photos That Work** - Auto-organization, offline queue
5. **Smart Templates** - AI-learned suggestions
6. **Stupid-Simple UI** - 3 clicks max to any feature
7. **Fast Load Times** - < 2 seconds on 3G
8. **Offline Mode** - Core features work without internet
9. **Voice Commands** - Hands-free operation
10. **Automatic Everything** - Smart reminders and workflows

### Target Market
Small to medium contractors (1-50 employees) in residential/light commercial construction.

---

## Priority System

| Priority | Code | Description | Timeline |
|----------|------|-------------|----------|
| Critical | P0 | Blocking core functionality | Immediate |
| High | P1 | Major UX issues, key features | Sprint 1-2 |
| Medium | P2 | Enhancements, polish | Sprint 3-4 |
| Low | P3 | Nice-to-have, future | Backlog |

### Size Categories

| Size | Code | Effort | Description |
|------|------|--------|-------------|
| Large | L | 2-4 weeks | Major new feature systems |
| Medium | M | 1-2 weeks | Significant features |
| Small | S | 1-5 days | Quick features/fixes |
| Quick Win | QW | Hours | Minor improvements |

---

## Work Categories

### Category A: Bug Fixes (Source: 1.28.bugfixes.pdf)
Existing platform issues that need resolution.

### Category B: New Features (Source: Product Roadmap)
Competitive differentiators and new capabilities.

### Category C: Refactoring (Source: Code Audit)
Technical debt and architectural improvements.

### Category D: Technical Debt (Source: CLAUDE.md)
Known issues from development documentation.

### Category E: January 2026 Audit Findings
Critical issues discovered during platform audit (January 29, 2026).

### Category F: February 2026 Comprehensive Audit ⭐ UPDATED
Comprehensive platform audit with **101 issues** across 2 phases (February 2, 2026).

| Phase | Issues | Focus Areas | Effort | Tracker |
|-------|--------|-------------|--------|---------|
| Phase 1 | #1-60 | UI/UX, Demo Data, Navigation, Integrations | 316-448h | `docs/PLATFORM_AUDIT_ISSUES.md` |
| Phase 2 | #61-101 | Messaging, Reporting, Settings | 196-282h | `docs/PLATFORM_AUDIT_ISSUES_PHASE2.md` |
| **Total** | **101** | | **512-730h** | |

---

## February 2026 Audit Summary

> **Source:** Comprehensive platform audit conducted February 2, 2026
> **Total Items:** 101 issues (Phase 1: 60, Phase 2: 41)
> **Estimated Effort:** 512-730 hours (~13-18 weeks for 2-3 developers)
> **Full Trackers:**
> - Phase 1: `docs/PLATFORM_AUDIT_ISSUES.md`
> - Phase 2: `docs/PLATFORM_AUDIT_ISSUES_PHASE2.md`

### Critical Issues - Sprint 37A ✅ COMPLETE

| ID | Issue | Effort | Status |
|----|-------|--------|--------|
| FEB-011 | Category filter causes projects to disappear | 4-6h | `[x]` ✅ |
| FEB-013 | Firebase permissions blocking 8+ features | 6-10h | `[x]` ✅ |
| FEB-053 | Profit margin shows 0% for negative values | 2-3h | `[x]` ✅ |
| FEB-057 | Payroll displaying "NaNh total" | 1-2h | `[x]` ✅ |

### Critical Issues - Phase 2 (Next)

| ID | Issue | Effort | Status |
|----|-------|--------|--------|
| #69 | Operational Reports Load Error | 2-4h | `[ ]` |
| #76 | Payroll Reports Load Error | 2-4h | `[ ]` |

### High Priority Issues by Category

#### Dashboard & UI Layout (5 issues)
| ID | Issue | Effort |
|----|-------|--------|
| FEB-001 | Search bar overlaps CTA buttons | 2-3h |
| FEB-004 | Active Projects dominates dashboard | 3-4h |
| FEB-005 | Project card padding too large | 3-4h |
| FEB-029 | Client Preferences layout poor | 3-4h |
| FEB-042 | Crew Availability underdeveloped | 8-12h |

#### Animations (4 issues)
| ID | Issue | Effort |
|----|-------|--------|
| FEB-008 | Bouncing Pending Estimates icon | 1h |
| FEB-009 | Bouncing folder icon empty state | 1h |
| FEB-010 | Platform-wide animation audit | 4-6h |
| FEB-045 | Daily Logs animated icon | 1h |

#### Demo Data Quality (25 issues)
| ID | Issue | Effort |
|----|-------|--------|
| FEB-012 | Projects not categorized | 2-3h |
| FEB-014 | Missing client assignment | 2-3h |
| FEB-015 | Missing quotes with line items | 6-8h |
| FEB-016 | Missing Scope of Work | 4-6h |
| FEB-017 | No demo tasks | 8-12h |
| FEB-018 | No sub assignments | 4-6h |
| FEB-019 | No demo bids | 4-6h |
| FEB-020 | No bid solicitations | 4-6h |
| FEB-021 | No demo RFIs | 3-4h |
| FEB-022 | No demo submittals | 3-4h |
| FEB-023 | No punch list items | 3-4h |
| FEB-024 | No change orders | 3-4h |
| FEB-025 | No client preferences | 2-3h |
| FEB-030 | Missing demo clients | 3-4h |
| FEB-035 | Schedule page empty | 8-12h |
| FEB-041 | Crew availability data | 2-3h |
| FEB-043 | Time off requests data | 2-3h |
| FEB-046 | Daily logs data | 4-6h |
| FEB-047 | Finances demo data | 8-12h |
| FEB-048 | Expenses context | 4-6h |
| FEB-054 | Payroll rate mapping | 4-6h |
| FEB-055 | Payroll demo data | 6-8h |

#### Feature Gaps & Enhancements (15 issues)
| ID | Issue | Effort |
|----|-------|--------|
| FEB-026 | Finances error + job costing | 6-8h |
| FEB-032 | Custom color contrast | 6-8h |
| FEB-033 | Team/Subcontractor separation | 8-12h |
| FEB-034 | **Dedicated Subcontractors module** | 20-30h |
| FEB-036 | Schedule weather integration | 12-16h |
| FEB-037 | Enhanced schedule views | 8-12h |
| FEB-038 | Schedule team assignment | 8-12h |
| FEB-039 | Schedule context dashboard | 10-14h |
| FEB-040 | AI schedule briefing | 12-16h |
| FEB-049 | Reimbursement workflow | 8-12h |
| FEB-050 | Owner finance dashboard | 10-14h |
| FEB-059 | Sidebar reorganization | 8-12h |
| FEB-060 | Role-based navigation | 10-14h |

#### Future Integrations (4 issues)
| ID | Issue | Effort |
|----|-------|--------|
| FEB-051 | Bank integration (Plaid/Yodlee) | 20-30h |
| FEB-052 | Neobank integrations | Research |
| FEB-058 | Payroll integration | 25-40h |
| FEB-028 | Microanimations sprint | Planning |

### Phase 2: Messaging, Reporting & Settings (Issues 61-101) ⭐ NEW

> **Added:** February 2, 2026
> **Full Tracker:** `docs/PLATFORM_AUDIT_ISSUES_PHASE2.md`

#### Messaging (1 strategic research issue)
| ID | Issue | Effort |
|----|-------|--------|
| #61 | Comprehensive Messaging Architecture Redesign | 40-60h |

#### Reporting & Analytics (15 issues)
| ID | Issue | Effort |
|----|-------|--------|
| #62 | Reports navigation to sidebar | 2-3h |
| #63 | Historical revenue demo data | 12-16h |
| #64 | Labor costs demo data | 6-8h |
| #65 | Invoice aging demo data | 3-4h |
| #66 | Financial reporting customization | 6-8h |
| #67 | Custom Reports Builder (research) | 30-40h |
| #68 | Reports as owner's source of truth | 8-12h |
| #69 | **Operational Reports Load Error** | 2-4h |
| #70 | Detailed reports P&L demo data | 10-14h |
| #71 | Profitability percentages | 4-6h |
| #72 | Benchmarking & comparative analysis | 8-12h |
| #73 | AI-powered insights | 12-16h |
| #74 | Team productivity demo data | 8-12h |
| #75 | Task performance metrics | 6-8h |
| #76 | **Payroll Reports Load Error** | 2-4h |
| #77 | Date picker UX enhancement | 3-4h |
| #78 | Relative date selection | 2-3h |

#### Settings & Configuration (19 issues)
| ID | Issue | Effort |
|----|-------|--------|
| #79 | Fiscal year configuration | 2-3h |
| #80 | Payroll period configuration | 2-3h |
| #81 | Payroll provider integration | 15-25h |
| #82 | Template management consolidation | 3-4h |
| #83 | Tax configuration | 3-4h |
| #84 | Corporate structure settings | 2-3h |
| #85 | Workers comp & insurance | 2-3h |
| #86 | Team dropdown layout | 1-2h |
| #87 | Move AI settings to Org Preferences | 2-3h |
| #88 | Default AI contribution setting | 1h |
| #89 | Settings consolidation | 4-6h |
| #90 | User AI Model OAuth (future) | 8-12h |
| #91 | User API Key Management (future) | 4-6h |
| #92 | Multiple AI Provider Support (future) | 6-8h |
| #93 | Secure AI Credential Storage | 3-4h |
| #94 | Google Workspace Integration (future) | 15-20h |
| #95 | Microsoft 365/AD Integration (future) | 15-20h |
| #96 | Automated User Onboarding (future) | 6-8h |
| #97 | Automated User Offboarding (future) | 4-6h |
| #98 | Browser Notification Permissions | 3-4h |
| #99 | OS-Level Notification Pass-Through | 4-6h |
| #100 | Granular Notification Control | 4-6h |
| #101 | Do Not Disturb & Quiet Hours | 4-6h |

### Recommended Sprint Structure

#### Phase 1 Sprints (Issues 1-60)
| Sprint | Focus | Duration | Issues | Status |
|--------|-------|----------|--------|--------|
| **37A** | Critical bugs | 1 week | FEB-011, 013, 053, 057 | ✅ DONE |
| **37B** | UI/Layout + animations | 1 week | FEB-001, 004, 005, 007-010, 029 | Next |
| **38** | Demo data (core) | 1-2 weeks | FEB-012, 014, 015, 016, 017, 030 | |
| **39** | Demo data (complete) | 1-2 weeks | FEB-018-024, 035, 041, 043, 046 | |
| **40** | Navigation architecture | 1-2 weeks | FEB-033, 059, 060 | |
| **41** | Finance module | 1-2 weeks | FEB-026, 047, 049, 050, 054, 055 | |

#### Phase 2 Sprints (Issues 61-101)
| Sprint | Focus | Duration | Issues |
|--------|-------|----------|--------|
| **42** | Reports bugs + config | 1-2 weeks | #62, 69, 76, 79, 80, 83 |
| **43** | Reports demo data | 2-3 weeks | #63, 64, 65, 70, 74, 75 |
| **44** | Settings consolidation | 1-2 weeks | #82, 84, 85, 87, 89 |
| **45** | Reporting enhancements | 2 weeks | #66, 68, 71, 72 |
| **46** | Notification system | 1-2 weeks | #98, 99, 100, 101 |

#### Future Sprints (Strategic)
| Sprint | Focus | Duration | Issues |
|--------|-------|----------|--------|
| **F1** | Messaging research | 2-3 weeks | #61 |
| **F2** | AI model integration | 2 weeks | #90, 91, 92, 93 |
| **F3** | Directory integration | 3-4 weeks | #94, 95, 96, 97 |
| **F4** | Custom reports builder | 2-3 weeks | #67 |
| **F5** | AI-powered insights | 2 weeks | #73 |
| **F6** | Schedule enhancement | 2 weeks | FEB-036, 037, 038, 039, 042 |
| **F7** | Strategic features | 2-3 weeks | FEB-034, 040 |

---

## Bug Fixes & Critical Improvements (January 2026 Audit)

> **Source:** Platform audit conducted January 29, 2026
> **Total Items:** 17 issues
> **Total Story Points:** 57
> **Status:** Triaged and integrated into roadmap

### Priority 1: Blockers (13 SP)

#### AUDIT-001: Firebase Permissions - Photos Module
**Priority:** P0-BLOCKER | **Size:** S (3 SP)
**Issue:** Project photos page throws Firebase permission errors
**Root Cause:** Missing Firestore rules for `projectPhotos` collection

**Acceptance Criteria:**
- [ ] Add Firestore rules for `organizations/{orgId}/projects/{projectId}/photos`
- [ ] Rules allow read/write for authenticated org members
- [ ] Test photo upload and retrieval functions

**Files:**
```
firestore.rules
```

---

#### AUDIT-002: Firebase Permissions - Schedule Module
**Priority:** P0-BLOCKER | **Size:** S (3 SP)
**Issue:** Schedule page throws Firebase permission errors
**Root Cause:** Missing Firestore rules for `scheduleEvents` and `crewAvailability` collections

**Acceptance Criteria:**
- [ ] Add Firestore rules for schedule-related collections
- [ ] Rules allow CRUD operations for authenticated org members
- [ ] Test event creation and availability updates

**Files:**
```
firestore.rules
```

---

#### AUDIT-003: Firebase Permissions - SMS Module
**Priority:** P0-BLOCKER | **Size:** S (3 SP)
**Issue:** Messaging page throws Firebase permission errors
**Root Cause:** Missing Firestore rules for `smsConversations` and `smsMessages` collections

**Acceptance Criteria:**
- [ ] Add Firestore rules for SMS collections
- [ ] Rules allow read/write for authenticated org members
- [ ] Test message sending and conversation retrieval

**Files:**
```
firestore.rules
```

---

#### AUDIT-004: Integrations Page Infinite Loading
**Priority:** P0-BLOCKER | **Size:** S (2 SP)
**Status:** ✅ RESOLVED (January 29, 2026)
**Resolution:** Added Firestore rules for `accountingConnections` and `accountMappingRules`. Redesigned page with proper SVG logos and "Coming Soon" status for all integrations.

---

#### AUDIT-005: Cannot Uncancel Projects
**Priority:** P0-BLOCKER | **Size:** S (2 SP)
**Issue:** Once a project is cancelled, there's no way to restore it to active status
**Root Cause:** Missing status transition logic in project management

**Acceptance Criteria:**
- [ ] Add "Restore Project" option for cancelled projects
- [ ] Implement status transition from 'cancelled' to 'planning' or 'active'
- [ ] Add confirmation dialog for restore action
- [ ] Log status change in project activity

**Files:**
```
apps/web/components/projects/ProjectStatusDropdown.tsx
apps/web/lib/hooks/useProjects.ts
```

---

### Priority 2: Critical (16 SP)

#### AUDIT-006: Client Module Missing from Sidebar
**Priority:** P1-CRITICAL | **Size:** S (3 SP)
**Status:** ✅ RESOLVED (Sprint 4)
**Resolution:** Full Client Management module implemented with list view, detail pages, communication logs, notes, and financials tracking.

---

#### AUDIT-007: Budget Calculation Inconsistencies
**Priority:** P1-CRITICAL | **Size:** M (5 SP)
**Issue:** Project budget vs actual costs show inconsistent values across different views
**Root Cause:** Multiple calculation methods used across components

**Acceptance Criteria:**
- [ ] Centralize budget calculation logic in a single utility
- [ ] Ensure consistent values in dashboard, project detail, and reports
- [ ] Add unit tests for budget calculations
- [ ] Display calculation methodology in UI tooltips

**Files:**
```
apps/web/lib/budget-calculations.ts (create)
apps/web/components/projects/ProjectBudgetCard.tsx
apps/web/components/dashboard/ProjectsOverview.tsx
```

---

#### AUDIT-008: Dashboard Layout - Empty States
**Priority:** P1-CRITICAL | **Size:** S (3 SP)
**Issue:** Dashboard shows poor layout when data is missing or empty
**Root Cause:** Missing empty state components and conditional rendering

**Acceptance Criteria:**
- [ ] Add meaningful empty states for all dashboard widgets
- [ ] Use existing EmptyState component consistently
- [ ] Add "Get Started" actions for new users
- [ ] Handle loading states gracefully

**Files:**
```
apps/web/app/dashboard/page.tsx
apps/web/components/dashboard/*.tsx
```

---

#### AUDIT-009: Dashboard Layout - Data Overflow
**Priority:** P1-CRITICAL | **Size:** S (3 SP)
**Issue:** Dashboard cards overflow when displaying large amounts of data
**Root Cause:** Missing max-height and scroll containers

**Acceptance Criteria:**
- [ ] Add max-height with scroll for list cards
- [ ] Implement "View All" links for truncated lists
- [ ] Ensure consistent card heights in grid layout
- [ ] Test with large datasets (50+ items)

**Files:**
```
apps/web/components/dashboard/RecentProjectsCard.tsx
apps/web/components/dashboard/UpcomingTasksCard.tsx
apps/web/components/dashboard/RecentActivityCard.tsx
```

---

#### AUDIT-010: Invoice List Performance
**Priority:** P1-CRITICAL | **Size:** S (2 SP)
**Issue:** Invoice list page slow with many records
**Root Cause:** No pagination, all records loaded at once

**Acceptance Criteria:**
- [ ] Implement cursor-based pagination
- [ ] Add page size selector (10, 25, 50)
- [ ] Show loading skeleton during fetch
- [ ] Maintain filter state across pages

**Files:**
```
apps/web/app/dashboard/invoices/page.tsx
apps/web/lib/hooks/useInvoices.ts
```

---

### Priority 3: UX Issues (15 SP)

#### AUDIT-011: Project Tabs Order Non-Intuitive
**Priority:** P2-UX | **Size:** S (2 SP)
**Issue:** Project detail tabs not in logical workflow order
**Current:** Overview, Scope, Tasks, Schedule, Budget, Photos, Documents
**Suggested:** Overview, Scope, Budget, Tasks, Schedule, Photos, Documents

**Acceptance Criteria:**
- [ ] Reorder tabs to match typical project workflow
- [ ] Ensure URL routes still work correctly
- [ ] Update any navigation that references tab order

**Files:**
```
apps/web/app/dashboard/projects/[id]/page.tsx
```

---

#### AUDIT-012: Calendar View Vertical Space
**Priority:** P2-UX | **Size:** S (3 SP)
**Issue:** Schedule calendar doesn't utilize available vertical space effectively
**Root Cause:** Fixed height instead of flex-grow

**Acceptance Criteria:**
- [ ] Calendar should expand to fill available viewport height
- [ ] Minimum height of 500px
- [ ] Proper resize behavior on window resize
- [ ] Mobile-friendly height adjustments

**Files:**
```
apps/web/components/schedule/ScheduleCalendar.tsx
apps/web/app/dashboard/schedule/page.tsx
```

---

#### AUDIT-013: SMS Module - Use Case Ambiguity
**Priority:** P2-UX | **Size:** S (3 SP)
**Issue:** Unclear when/how to use SMS features, no onboarding
**Root Cause:** Missing guidance and setup wizard

**Acceptance Criteria:**
- [ ] Add SMS setup wizard on first access
- [ ] Include Twilio account connection flow
- [ ] Show example use cases and templates
- [ ] Add help tooltips throughout messaging UI

**Files:**
```
apps/web/app/dashboard/messaging/page.tsx
apps/web/components/sms/SmsSetupWizard.tsx (create)
```

---

#### AUDIT-014: Material Tracking - Category Confusion
**Priority:** P2-UX | **Size:** S (2 SP)
**Issue:** Material categories don't match contractor mental models
**Root Cause:** Generic categories instead of trade-specific

**Acceptance Criteria:**
- [ ] Review and update material categories based on trades
- [ ] Allow custom category creation
- [ ] Add category suggestions based on project type
- [ ] Migrate existing materials to new categories

**Files:**
```
apps/web/types/index.ts (MaterialCategory type)
apps/web/components/materials/MaterialFormModal.tsx
```

---

#### AUDIT-015: Estimate Builder - Line Item Search
**Priority:** P2-UX | **Size:** M (5 SP)
**Issue:** Hard to find line items in large libraries
**Root Cause:** Basic search, no filtering or categorization in picker

**Acceptance Criteria:**
- [ ] Add category filter to line item picker
- [ ] Implement fuzzy search
- [ ] Add "Recently Used" and "Favorites" sections
- [ ] Show pricing history on hover

**Files:**
```
apps/web/components/estimates/LineItemPicker.tsx
apps/web/lib/hooks/useLineItems.ts
```

---

### Priority 4: Settings & Configuration (13 SP)

#### AUDIT-016: Missing Owner/Admin Controls
**Priority:** P2-SETTINGS | **Size:** M (5 SP)
**Issue:** Organization owners cannot manage team roles or billing
**Root Cause:** Role management UI not implemented

**Acceptance Criteria:**
- [ ] Add team role management to settings
- [ ] Implement role assignment (owner, admin, member)
- [ ] Add billing management section
- [ ] Show subscription status and limits

**Files:**
```
apps/web/app/dashboard/settings/team/page.tsx
apps/web/app/dashboard/settings/billing/page.tsx (create)
apps/web/lib/hooks/useTeamRoles.ts (create)
```

---

#### AUDIT-017: Template Management Scattered
**Priority:** P2-SETTINGS | **Size:** S (3 SP)
**Issue:** Different template types managed in different places
**Root Cause:** Templates added organically without unified location

**Acceptance Criteria:**
- [ ] Create unified Templates settings section
- [ ] Include: SOW templates, SMS templates, Email templates, Estimate templates
- [ ] Consistent template CRUD interface
- [ ] Template preview capability

**Files:**
```
apps/web/app/dashboard/settings/templates/page.tsx (create)
apps/web/components/settings/TemplateManager.tsx (create)
```

---

#### AUDIT-018: Integration Stubs Need Completion
**Priority:** P2-SETTINGS | **Size:** M (5 SP)
**Status:** ✅ PARTIALLY RESOLVED (January 29, 2026)
**Resolution:** Integrations page redesigned with proper logos and "Coming Soon" status. Actual OAuth integration still needed for each provider.

**Remaining Work:**
- [ ] QuickBooks OAuth flow
- [ ] Xero OAuth flow
- [ ] Stripe Connect onboarding
- [ ] Gusto OAuth flow
- [ ] ADP OAuth flow

**Files:**
```
apps/web/lib/integrations/quickbooks.ts (create)
apps/web/lib/integrations/xero.ts (create)
apps/web/lib/integrations/stripe-connect.ts (create)
```

---

### January 2026 Audit Summary Table

| ID | Issue | Priority | Size | Status |
|----|-------|----------|------|--------|
| AUDIT-001 | Photos Firebase Permissions | P0 | 3 SP | ✅ Done |
| AUDIT-002 | Schedule Firebase Permissions | P0 | 3 SP | ✅ Done |
| AUDIT-003 | SMS Firebase Permissions | P0 | 3 SP | ✅ Done |
| AUDIT-004 | Integrations Page Loading | P0 | 2 SP | ✅ Done |
| AUDIT-005 | Cannot Uncancel Projects | P0 | 2 SP | ✅ Done |
| AUDIT-006 | Client Module Missing | P1 | 3 SP | ✅ Done |
| AUDIT-007 | Budget Calculation Issues | P1 | 5 SP | ✅ Done |
| AUDIT-008 | Dashboard Empty States | P1 | 3 SP | ✅ Done |
| AUDIT-009 | Dashboard Data Overflow | P1 | 3 SP | ✅ Done |
| AUDIT-010 | Invoice List Performance | P1 | 2 SP | ✅ Done |
| AUDIT-011 | Project Tabs Order | P2 | 2 SP | ✅ Done |
| AUDIT-012 | Calendar Vertical Space | P2 | 3 SP | ✅ Done |
| AUDIT-013 | SMS Use Case Clarity | P2 | 3 SP | ✅ Done |
| AUDIT-014 | Material Categories | P2 | 2 SP | ✅ Done |
| AUDIT-015 | Line Item Search | P2 | 5 SP | ✅ Done |
| AUDIT-016 | Owner/Admin Controls | P2 | 5 SP | ✅ Done |
| AUDIT-017 | Template Management | P2 | 3 SP | ✅ Done |
| AUDIT-018 | Integration OAuth | P2 | 5 SP | Partial (UI done) |

**Total Story Points:** 57
**Completed:** 52 SP (17 items)
**Remaining:** 5 SP (OAuth integration partial)

---

### Sprint 9E: Security Hardening (COMPLETED January 30, 2026)

**Summary:** Comprehensive platform security audit and hardening across 4 phases.

**Phase 1-2: Firestore Rules Hardening**
- Fixed 30+ root-level collections to enforce org-scoping
- Added missing rules for: messageChannels, toolCheckouts, safetyInspections, safetyIncidents, toolboxTalks, messages, tools, leads, serviceTickets, subAssignments

**Phase 3: Hook Fixes**
- Fixed useReports.ts, useClients.ts, usePayments.ts, useGeofences.ts for proper org-scoping

**Phase 4: API Route Security**
- Created lib/api/auth.ts authentication helper
- Added authentication to /api/payments (POST/GET), /api/payments/[id]/refund (POST), /api/sms (POST/GET)

**Security Status:**
- ✅ ALL root-level Firestore collections enforce org-scoping
- ✅ All hooks use proper collection paths
- ✅ All sensitive API routes require authentication
- ⚠️ TODO: Twilio SMS webhook signature verification

---

## Phase 0: Foundation & Technical Debt

> **Goal:** Establish patterns and fix foundational issues before feature work.

### RF-001: Toast/Notification System
**Category:** Refactoring | **Priority:** P1 | **Size:** S (3 days)
**Issue:** Silent errors, no user feedback on CRUD operations

**Implementation:**
- Implement react-hot-toast
- Toast on all CRUD operations
- Error toast with retry action
- Success/warning/error/info variants

**Files:**
```
apps/web/components/ui/Toast.tsx
apps/web/components/Providers.tsx
apps/web/lib/hooks/*.ts (all hooks with mutations)
```

---

### RF-002: Form Component Library
**Category:** Refactoring | **Priority:** P1 | **Size:** S (3 days)
**Issue:** Form validation inconsistent across platform

**Implementation:**
- Create FormField wrapper component
- Integrate React Hook Form + Zod universally
- Required field indicators (red asterisk)
- Inline error display

**Files to Create:**
```
apps/web/components/ui/FormField.tsx
apps/web/components/ui/FormError.tsx
apps/web/components/ui/FormSection.tsx
```

---

### RF-003: BaseModal Component
**Category:** Refactoring | **Priority:** P1 | **Size:** S (2 days)
**Issue:** Multiple modal implementations with inconsistent behavior

**Implementation:**
- Single BaseModal wrapping Headless UI Dialog
- Consistent scroll behavior
- Dirty state tracking hook
- Standard close button positioning

**Files to Create:**
```
apps/web/components/ui/BaseModal.tsx
apps/web/lib/hooks/useModalState.ts
apps/web/lib/hooks/useModalDirtyState.ts
```

---

### RF-004: AuthProvider Architecture
**Category:** Refactoring | **Priority:** P1 | **Size:** M (1 week)
**Issue:** Per CLAUDE.md, AuthProvider needs refactoring

**Implementation:**
- Separate auth state, user profile, permissions
- Add loading states for auth checks
- Implement proper token refresh
- Session persistence options

**Files:**
```
apps/web/lib/auth.tsx
apps/web/lib/auth/AuthProvider.tsx (new)
apps/web/lib/auth/UserProfileProvider.tsx (new)
apps/web/lib/auth/PermissionsProvider.tsx (new)
apps/web/components/auth/AuthGuard.tsx
```

---

### RF-005: Error Boundary Enhancement
**Category:** Refactoring | **Priority:** P2 | **Size:** S (2 days)
**Issue:** Errors crash entire app

**Implementation:**
- Route-level error boundaries
- Graceful error UI with retry
- Error logging preparation (Sentry ready)

**Files:**
```
apps/web/components/ErrorBoundary.tsx
apps/web/app/**/error.tsx
```

---

### RF-006: Firestore Hook Factory
**Category:** Refactoring | **Priority:** P2 | **Size:** M (1 week)
**Issue:** Repeated boilerplate in data hooks

**Implementation:**
- Create base hook factory
- Standardize subscription patterns
- Unified error handling
- Consistent date conversion

**Files to Create:**
```
apps/web/lib/hooks/createFirestoreHook.ts
apps/web/lib/hooks/firestoreHelpers.ts
```

---

### RF-007: Type Organization
**Category:** Refactoring | **Priority:** P3 | **Size:** S (2 days)
**Issue:** types/index.ts is 2,391 lines

**Implementation:**
- Split by domain (auth, projects, scope, etc.)
- Re-export from index.ts for compatibility

**Files to Create:**
```
apps/web/types/auth.ts
apps/web/types/projects.ts
apps/web/types/scope.ts
apps/web/types/financial.ts
apps/web/types/common.ts
```

---

## Phase 1: Bug Fixes & Core Stability

> **Goal:** Fix all critical and high-priority bugs from the walkthrough.

### SECTION 1.1: Settings Page Fixes

#### BUG-026: Integrations Page Broken
**Category:** Bug Fix | **Priority:** P0 | **Size:** M (1.5 weeks)
**Component:** `apps/web/app/dashboard/settings/integrations/page.tsx`
**Issue:** Page shows stubs only, no functional integrations

**Acceptance Criteria:**
- [ ] Integration cards with status (Connected/Not Connected)
- [ ] OAuth flow for QuickBooks, Xero
- [ ] Connection status indicator
- [ ] Disconnect option with confirmation
- [ ] Sync settings per integration
- [ ] Last sync timestamp display

**Files:**
```
apps/web/app/dashboard/settings/integrations/page.tsx
apps/web/components/settings/IntegrationCard.tsx (new)
apps/web/lib/hooks/useAccountingConnection.ts
```

---

#### BUG-027: Tax Rates Page Issues
**Category:** Bug Fix | **Priority:** P1 | **Size:** S (3 days)
**Component:** `apps/web/app/dashboard/settings/tax-rates/page.tsx`

**Acceptance Criteria:**
- [ ] List all org tax rates
- [ ] Add new rate with name, percentage, applies-to
- [ ] Edit existing rates inline or modal
- [ ] Delete with confirmation
- [ ] Default rate designation

**Files:**
```
apps/web/app/dashboard/settings/tax-rates/page.tsx
apps/web/lib/hooks/useTaxRates.ts
```

---

#### BUG-028: Data Export Page Broken
**Category:** Bug Fix | **Priority:** P1 | **Size:** S (4 days)
**Component:** `apps/web/app/dashboard/settings/data-export/page.tsx`

**Acceptance Criteria:**
- [ ] Export options: Projects, Tasks, Timesheets, Invoices
- [ ] Format selection: CSV, JSON, PDF
- [ ] Date range filter
- [ ] Download with progress indicator
- [ ] Export history/logs

**Files:**
```
apps/web/app/dashboard/settings/data-export/page.tsx
apps/web/lib/exports.ts
```

---

#### BUG-029: Notifications Page Broken
**Category:** Bug Fix | **Priority:** P1 | **Size:** S (4 days)
**Component:** `apps/web/app/dashboard/settings/notifications/page.tsx`

**Acceptance Criteria:**
- [ ] Toggle switches for each notification type
- [ ] Categories: Tasks, Projects, Timesheets, Invoices, Team
- [ ] Channel selection: Email, Push, In-App
- [ ] Digest frequency option
- [ ] Test notification button

**Files:**
```
apps/web/app/dashboard/settings/notifications/page.tsx
apps/web/lib/hooks/useNotifications.ts
apps/web/types/index.ts (NotificationPreferences type)
```

---

#### BUG-024: Organization Settings Save Behavior
**Category:** Bug Fix | **Priority:** P1 | **Size:** S (2 days)
**Component:** `apps/web/app/dashboard/settings/organization/page.tsx`

**Acceptance Criteria:**
- [ ] Toast notification on successful save
- [ ] Loading state during save
- [ ] Error handling with specific messages
- [ ] Dirty state tracking

**Files:**
```
apps/web/app/dashboard/settings/organization/page.tsx
```

---

#### BUG-025: Organization Settings Layout Issues
**Category:** Bug Fix | **Priority:** P2 | **Size:** S (1 day)

**Acceptance Criteria:**
- [ ] Clear section headers
- [ ] Consistent spacing
- [ ] Color pickers with preview swatches
- [ ] Mobile-responsive layout

---

### SECTION 1.2: Task Management Bugs

#### BUG-001: Phase Dropdown Missing in Task Modal
**Category:** Bug Fix | **Priority:** P1 | **Size:** S (3 days)
**Component:** `apps/web/components/tasks/TaskDetailModal.tsx`

**Acceptance Criteria:**
- [ ] Phase dropdown appears in TaskDetailModal
- [ ] Dropdown populated from project phases
- [ ] Selecting phase updates task's phaseId
- [ ] Phase badge displays on TaskCard and TaskListRow
- [ ] Phase filter works in TaskFilters

**Files:**
```
apps/web/components/tasks/TaskDetailModal.tsx
apps/web/components/tasks/TaskCard.tsx
apps/web/components/projects/tasks/list/TaskListRow.tsx
apps/web/components/projects/tasks/TaskFilters.tsx
```

---

#### BUG-002: Modal Close Button Offset
**Category:** Bug Fix | **Priority:** P2 | **Size:** QW (2 hours)
**Issue:** X close button poorly positioned

**Acceptance Criteria:**
- [ ] Close button in top-right corner with consistent padding
- [ ] Button has proper hit target (min 44x44px)

---

#### BUG-003: Modal Scroll Issues
**Category:** Bug Fix | **Priority:** P2 | **Size:** S (1 day)
**Issue:** Long content causes page scroll instead of modal scroll

**Acceptance Criteria:**
- [ ] Modal content scrolls independently
- [ ] Header/footer remain fixed
- [ ] Works on mobile viewports

---

#### BUG-004: Gantt View Task Name Overlap
**Category:** Bug Fix | **Priority:** P2 | **Size:** S (1 day)
**Component:** `apps/web/components/projects/tasks/gantt/GanttChart.tsx`

**Acceptance Criteria:**
- [ ] Task names truncate with ellipsis
- [ ] Tooltip shows full name on hover
- [ ] Works at all zoom levels

---

#### UX-005: Task Assignment UX
**Category:** Bug Fix | **Priority:** P2 | **Size:** S (2 days)

**Acceptance Criteria:**
- [ ] Clear multi-select UI
- [ ] Selected assignees shown prominently
- [ ] Quick search/filter for team members
- [ ] Avatar display for assigned users

---

#### UX-006: Checklist Save Feedback
**Category:** Bug Fix | **Priority:** P2 | **Size:** QW (4 hours)

**Acceptance Criteria:**
- [ ] Toast notification on save
- [ ] Optimistic UI update
- [ ] Checkbox animates on toggle

---

#### UX-007: Save Confirmation on Modal Close
**Category:** Bug Fix | **Priority:** P1 | **Size:** S (1 day)

**Acceptance Criteria:**
- [ ] Track dirty state for form fields
- [ ] ConfirmDialog on close with unsaved changes
- [ ] Options: Save & Close, Discard, Cancel

---

### SECTION 1.3: SOW/Scope Builder Bugs

#### BUG-008: SOW Template Items Not Assigned to Phases
**Category:** Bug Fix | **Priority:** P1 | **Size:** S (2 days)
**Component:** `apps/web/components/projects/scope/ScopeTemplateSelector.tsx`

**Acceptance Criteria:**
- [ ] Template items include phaseId mapping
- [ ] On apply, items assigned to corresponding phases
- [ ] Unmatched items go to "Unassigned"

---

#### FEAT-009: SOW Template Management System
**Category:** New Feature | **Priority:** P1 | **Size:** M (1 week)
**Issue:** No UI to create/edit/delete SOW templates

**Acceptance Criteria:**
- [ ] New route: `/dashboard/settings/sow-templates`
- [ ] List templates with edit/delete
- [ ] Create template form
- [ ] Import from existing scope
- [ ] Template preview

**Files to Create:**
```
apps/web/app/dashboard/settings/sow-templates/page.tsx
apps/web/components/settings/SowTemplateList.tsx
apps/web/components/settings/SowTemplateForm.tsx
apps/web/lib/hooks/useSowTemplates.ts
```

---

#### WORKFLOW-013: SOW Approval Process Unclear
**Category:** Bug Fix | **Priority:** P1 | **Size:** S (3 days)

**Acceptance Criteria:**
- [ ] Clear status badges (Draft, Pending, Approved, Rejected)
- [ ] Role-contextual approval buttons
- [ ] Email notifications on status change
- [ ] Approval history visible

---

#### WORKFLOW-014: SOW vs Quote Relationship Unclear
**Category:** Bug Fix | **Priority:** P1 | **Size:** S (2 days)

**Acceptance Criteria:**
- [ ] Help tooltips explaining relationship
- [ ] Visual link showing SOW ↔ Quote connection
- [ ] Auto-generate Quote from approved SOW

---

#### BUG-015: Quote Import Not Organized by Phase
**Category:** Bug Fix | **Priority:** P2 | **Size:** S (1 day)

**Acceptance Criteria:**
- [ ] Imported items grouped by phase
- [ ] Phase headers in quote view
- [ ] Subtotals per phase

---

#### FEAT-016: SOW Version Viewing
**Category:** New Feature | **Priority:** P1 | **Size:** S (3 days)
**Component:** `apps/web/components/projects/scope/ScopeVersionHistory.tsx`

**Acceptance Criteria:**
- [ ] Version list shows all versions
- [ ] Click to view read-only snapshot
- [ ] Side-by-side diff comparison
- [ ] Restore previous version option

**Files:**
```
apps/web/components/projects/scope/ScopeVersionHistory.tsx
apps/web/components/projects/scope/ScopeVersionDiff.tsx (new)
```

---

### SECTION 1.4: Subcontractor Management

#### FEAT-020: Global Subcontractor Management System
**Category:** New Feature | **Priority:** P0 | **Size:** L (2 weeks)
**Issue:** Subcontractors only exist at project level

**Acceptance Criteria:**
- [ ] Org-level subcontractor collection
- [ ] `/dashboard/subcontractors` list page
- [ ] Subcontractor detail page
- [ ] Assign existing subs to projects
- [ ] Cross-project metrics aggregation
- [ ] Document expiration alerts
- [ ] Bulk import/export

**Files to Create:**
```
apps/web/app/dashboard/subcontractors/page.tsx
apps/web/app/dashboard/subcontractors/[id]/page.tsx
apps/web/lib/hooks/useOrgSubcontractors.ts
apps/web/components/subcontractors/SubcontractorGlobalList.tsx
```

**Firestore Schema:**
```
organizations/{orgId}/subcontractors/{subId}
  - company, contact, trade, rating, documents[]
  - linkedProjects[] (references)
  - aggregateMetrics: { onTimeRate, qualityScore, totalProjects }
```

---

#### UX-017: Subcontractor Modal Scrolling
**Category:** Bug Fix | **Priority:** P2 | **Size:** QW (4 hours)

**Acceptance Criteria:**
- [ ] Tab content scrolls independently
- [ ] Modal doesn't exceed viewport
- [ ] Works on mobile

---

#### UX-018: Form Validation Feedback
**Category:** Bug Fix | **Priority:** P1 | **Size:** S (2 days)

**Acceptance Criteria:**
- [ ] Inline error messages below fields
- [ ] Field border turns red on error
- [ ] Real-time validation
- [ ] Error summary at form top

---

#### UX-019: Required Field Indicators (System-wide)
**Category:** Bug Fix | **Priority:** P1 | **Size:** S (2 days)

**Acceptance Criteria:**
- [ ] Required fields show red asterisk
- [ ] Consistent across all forms
- [ ] Legend where appropriate

**Files:**
```
apps/web/components/ui/Input.tsx
apps/web/components/ui/FormField.tsx (new)
```

---

### SECTION 1.5: UI/Responsive Bugs

#### BUG-021: Responsive Design Mobile Issues
**Category:** Bug Fix | **Priority:** P2 | **Size:** M (1 week)

**Acceptance Criteria:**
- [ ] All pages render correctly on 375px
- [ ] Navigation collapses to hamburger
- [ ] Tables convert to cards on mobile
- [ ] Touch targets min 44x44px
- [ ] No horizontal scroll

---

#### BUG-022: Table Layout Overflow
**Category:** Bug Fix | **Priority:** P2 | **Size:** S (2 days)

**Acceptance Criteria:**
- [ ] Horizontal scroll on table containers
- [ ] Sticky first column option
- [ ] Column priority on mobile

---

#### CRITICAL-023: Brand Colors Not Applied
**Category:** Bug Fix | **Priority:** P1 | **Size:** S (2 days)
**Component:** `apps/web/lib/theme/ThemeProvider.tsx`

**Acceptance Criteria:**
- [ ] Primary button uses CSS variable
- [ ] Accent colors for highlights, badges
- [ ] Preview in settings before save
- [ ] Fallback to defaults

---

### SECTION 1.6: Other Bug Fixes

#### BUG-011: Archived Project Duplicate Fails
**Category:** Bug Fix | **Priority:** P2 | **Size:** S (1 day)

**Acceptance Criteria:**
- [ ] Archived projects can be duplicated
- [ ] Includes all phases, tasks, scope
- [ ] Status resets to 'planning'

---

#### UX-012: Tags Feature Incomplete
**Category:** Bug Fix | **Priority:** P3 | **Size:** S (3 days)

**Acceptance Criteria:**
- [ ] Tag autocomplete
- [ ] Tag creation inline
- [ ] Color/category support
- [ ] Filter by tags

---

## Phase 2: Differentiating Features

> **Goal:** Build the features that make ContractorOS different from competitors.

### FEAT-L1: E-Signature System
**Category:** New Feature | **Priority:** P0 | **Size:** L (4 weeks)
**Business Value:** Critical for closing deals, legally binding agreements

**User Stories:**
1. Contractor sends estimates for e-signature
2. Client signs without creating account
3. Contractor tracks signature status
4. Signed documents auto-stored

**Technical Options:**
- **Option A:** DocuSeal (open-source, MIT license)
- **Option B:** SignRequest API ($10/month)
- **Option C:** HelloSign/Dropbox Sign

**Implementation Phases:**
1. Week 1: Integration, PDF generation, basic signing
2. Week 2: "Send for Signature" workflow, magic tokens
3. Week 3: Status tracking, storage, webhooks
4. Week 4: Multi-party signatures, reminders, polish

**Acceptance Criteria:**
- [ ] Send estimate for signature in < 3 clicks
- [ ] Client signs on mobile without login in < 60 seconds
- [ ] Signed PDF auto-attached to project
- [ ] Email + SMS notifications work
- [ ] Real-time status updates
- [ ] Works on iOS Safari, Android Chrome, desktop
- [ ] Legally binding with audit trail

**Files to Create:**
```
apps/web/lib/esignature/
apps/web/app/api/esignature/
apps/web/components/esignature/
apps/web/app/sign/[token]/page.tsx (public signing page)
```

**Success Metrics:**
- 80% of estimates sent via e-signature
- 65% signature completion within 48 hours
- 50% reduction in time-to-approval
- 95% mobile signature rate

---

### FEAT-L2: SMS/Text Message Workflows
**Category:** New Feature | **Priority:** P0 | **Size:** L (4 weeks)
**Business Value:** Primary communication channel for contractors

**User Stories:**
1. Text clients from platform (tracked in one place)
2. Send estimate links via text
3. Clients receive updates without app download
4. Message templates for quick responses
5. Text crew for coordination

**Technical Requirements:**
- **Provider:** Twilio (recommended) or Bandwidth
- Dedicated business number per company
- Two-way messaging (send/receive)
- MMS support (photos via text)
- Delivery receipts

**Features to Build:**
- Unified inbox (all texts in one place)
- Message templates library
- Bulk messaging
- Auto-replies
- URL shortener
- Scheduling (send later)
- Message search/filtering

**Implementation Phases:**
1. Week 1: Twilio integration, webhooks, schema
2. Week 2: Messaging interface, conversation view
3. Week 3: Templates, automation, bulk messaging
4. Week 4: URL shortener, MMS, analytics

**Message Template Examples:**
```
APPOINTMENT_REMINDER:
"Hi {client_name}, reminder: We'll be at {address} tomorrow at {time}. Reply YES to confirm."

ESTIMATE_READY:
"Your estimate for {project_name} is ready! View and sign: {short_link}"

RUNNING_LATE:
"We're running about {minutes} behind. New ETA: {new_time}."

PAYMENT_REMINDER:
"Invoice #{invoice_number} for ${amount} is due {due_date}. Pay online: {payment_link}"
```

**Files to Create:**
```
apps/web/lib/sms/
apps/web/app/api/sms/
apps/web/app/dashboard/messages/page.tsx
apps/web/components/messages/
functions/src/sms/ (Cloud Functions for webhooks)
```

**Success Metrics:**
- 90% of communication via SMS
- Average response time < 3 minutes
- Client satisfaction +25%
- Template usage > 70%

---

### FEAT-L3: Mobile-First Client Portal (No Login)
**Category:** New Feature | **Priority:** P1 | **Size:** L (3 weeks)
**Business Value:** Eliminates #1 client friction point

**User Stories:**
1. View project status without logging in
2. See photos and updates
3. Approve estimates and pay invoices from phone
4. Contractor wants fewer "what's the status" calls

**Technical Approach:**
- Magic link authentication (email/SMS)
- Responsive, mobile-first design
- PWA architecture
- JWT token-based security
- 7-day token expiration

**Portal Features:**
- **Project Dashboard:** Status, phase, timeline, completion date
- **Photo Gallery:** Progress photos, before/after, organized by phase
- **Documents:** Signed contracts, invoices, warranties, permits
- **Messages:** Conversation thread, send photos
- **Payments:** View invoices, pay via card/ACH
- **Approvals:** Review estimates, sign change orders

**Files to Create:**
```
apps/web/app/portal/[token]/page.tsx
apps/web/app/portal/[token]/photos/page.tsx
apps/web/app/portal/[token]/documents/page.tsx
apps/web/lib/magic-link/
apps/web/components/portal/
```

**Acceptance Criteria:**
- [ ] Access portal from text link in < 10 seconds
- [ ] No password required, ever
- [ ] Works on any mobile browser
- [ ] Loads in < 3 seconds on 4G
- [ ] Sessions persist for 7 days

**Success Metrics:**
- 85% client access within 24 hours
- Average 5 visits per project
- 40% reduction in status calls
- 95% mobile usage

---

### FEAT-L4: Client Management Module
**Category:** New Feature | **Priority:** P1 | **Size:** L (4 weeks)
**Business Value:** CRM for relationship management, repeat business

**Current Problem:** Clients mixed into Team module

**Module Features:**

**Client List View:**
- Searchable directory
- Status: active, past, potential
- Quick stats: projects, revenue, balance
- Sort: name, revenue, last contact

**Client Detail Page:**
- Contact info (primary + secondary)
- Preferred communication method
- Project history with timeline
- Financial summary (lifetime value)
- Communication log
- Documents & files
- Preferences & notes
- Source tracking

**Client Source Tracking:**
- Referral
- Google search
- Social media
- Yard sign
- Vehicle wrap
- Website
- Custom sources

**Files to Create:**
```
apps/web/app/dashboard/clients/page.tsx
apps/web/app/dashboard/clients/[id]/page.tsx
apps/web/lib/hooks/useClients.ts
apps/web/components/clients/
```

**Acceptance Criteria:**
- [ ] All existing clients migrated
- [ ] No clients in Team module
- [ ] All projects per client visible
- [ ] Lifetime value calculated
- [ ] Search < 1 second

---

## Phase 3: Transaction & Operations

> **Goal:** Enable full project lifecycle from estimate to payment.

### FEAT-M5: Photo & Progress Documentation
**Category:** New Feature | **Priority:** P1 | **Size:** M (2 weeks)
**Business Value:** Professional documentation, dispute protection

**Core Features:**
- Mobile camera integration (one-tap)
- Auto-organization by project/date
- GPS location and timestamp metadata
- Before/after photo pairing
- Albums per project phase
- Client-shareable galleries
- Photo annotations/markup
- Image compression for fast upload
- Offline photo queue

**Advanced Features:**
- AI-suggested categorization
- Timelapse video from daily photos
- Photo-based billing
- Comparison slider (before/after)
- Client approval workflow

**Files to Create:**
```
apps/web/app/dashboard/projects/[id]/photos/page.tsx (enhance)
apps/web/components/photos/
apps/web/lib/hooks/useProjectPhotos.ts (enhance)
apps/web/lib/photo-processing.ts
```

---

### FEAT-M6: Payment Processing
**Category:** New Feature | **Priority:** P1 | **Size:** M (1.5 weeks)
**Business Value:** Get paid faster, reduce collections

**Provider:** Stripe (recommended)
- Transaction fee: 2.9% + $0.30
- ACH: 0.8% capped at $5

**Features:**
- Accept credit cards on invoices
- ACH bank transfers
- One-click payment links (via text/email)
- Deposit and milestone tracking
- Automatic receipts
- Payment reminders (automated)
- Client payment portal
- Saved payment methods
- Split payments (deposit + final)
- Refund processing

**Files to Create:**
```
apps/web/lib/payments/
apps/web/app/api/payments/
apps/web/app/pay/[token]/page.tsx
apps/web/components/payments/
```

---

### FEAT-M7: Quick Estimate Builder
**Category:** New Feature | **Priority:** P1 | **Size:** M (1.5 weeks)
**Business Value:** Create estimates faster, consistency

**Features:**

**Line Item Library:**
- Pre-defined by trade
- Saved custom items
- Recent items quick access
- Pricing history

**Smart Templates:**
- Project type templates
- Duplicate from past estimates
- Learn from approved estimates

**Quick Input:**
- Drag-and-drop line items
- Bulk add from template
- Voice-to-text for scope
- Copy from spreadsheet

**Pricing:**
- Material + labor breakdown
- Markup percentages
- Tax handling
- Discounts

**Professional Output:**
- Branded PDF
- Multiple layouts
- Photos included
- Terms and conditions

---

### FEAT-M8: Smart Scheduling with Text Confirmations
**Category:** New Feature | **Priority:** P1 | **Size:** M (2 weeks)
**Business Value:** Reduce no-shows, optimize crew utilization

**Features:**

**Visual Calendar:**
- Week/month views
- Drag-and-drop
- Color-coded by project/crew
- Multi-project view

**Conflict Detection:**
- Double-booking prevention
- Travel time calculations
- Workload balancing

**Appointment Confirmations:**
- Automatic 24hr/2hr reminder texts
- "Reply YES to confirm"
- Automatic status updates

**Client Self-Scheduling:**
- Shareable booking link
- Time slot selection
- Buffer times
- Calendar sync

**Weather Integration:**
- Forecast display
- Delay notifications
- Rescheduling suggestions

---

### FEAT-M9: Material & Equipment Tracking
**Category:** New Feature | **Priority:** P2 | **Size:** M (1 week)
**Business Value:** Control costs, reduce waste

**Features:**
- Simple inventory list
- Track what's on each job site
- Material orders linked to projects
- Tool/equipment checkout
- Low stock alerts
- Receipt photo capture
- Supplier management
- Cost tracking per project

---

### FEAT-M10: Change Order System Enhancement
**Category:** New Feature | **Priority:** P1 | **Size:** M (1.5 weeks)
**Business Value:** Document scope changes, capture extra revenue

**Features:**
- Quick change order creation
- Client approval via mobile link
- E-signature integration (uses L1)
- Automatic budget adjustment
- Photo attachments for justification
- Impact on schedule/completion
- Change order history
- SMS notifications

---

## Phase 4: Efficiency & Scale

> **Goal:** Features for power users and operational efficiency.

### FEAT-S11: Communication Hub
**Category:** New Feature | **Priority:** P2 | **Size:** S (3 days)
**Description:** Unified inbox for all communications

---

### FEAT-S12: Document Storage
**Category:** New Feature | **Priority:** P2 | **Size:** S (3 days)
**Description:** Project file organization and sharing

---

### FEAT-S13: Simple Time Tracking
**Category:** New Feature | **Priority:** P2 | **Size:** S (5 days)
**Description:** Clock in/out with GPS

---

### FEAT-S14: Quote Templates
**Category:** New Feature | **Priority:** P2 | **Size:** S (2 days)
**Description:** Branded estimate PDFs

---

### FEAT-S15: Client Appointment Booking
**Category:** New Feature | **Priority:** P2 | **Size:** S (4 days)
**Description:** Self-service scheduling

---

### FEAT-S16: Expense Tracking
**Category:** New Feature | **Priority:** P2 | **Size:** S (3 days)
**Description:** Receipt capture and categorization

---

### FEAT-S17: Daily Log/Journal
**Category:** New Feature | **Priority:** P2 | **Size:** S (2 days)
**Description:** Job site notes and photos

---

### FEAT-S18: Client Feedback & Reviews
**Category:** New Feature | **Priority:** P2 | **Size:** S (3 days)
**Description:** Post-project surveys

---

### FEAT-S19: Lead Capture Forms
**Category:** New Feature | **Priority:** P2 | **Size:** S (3 days)
**Description:** Website integration

---

### FEAT-S20: Warranty Tracking
**Category:** New Feature | **Priority:** P2 | **Size:** S (2 days)
**Description:** Expiration reminders

---

### FEAT-S21: Weather Integration
**Category:** New Feature | **Priority:** P2 | **Size:** S (2 days)
**Description:** Forecast on schedule

---

### FEAT-S22: Subcontractor Payments
**Category:** New Feature | **Priority:** P2 | **Size:** S (4 days)
**Description:** Payment schedule tracking

---

### FEAT-S23: Permit Tracking
**Category:** New Feature | **Priority:** P2 | **Size:** S (2 days)
**Description:** Required permits checklist

---

### FEAT-S24: Referral Tracking
**Category:** New Feature | **Priority:** P2 | **Size:** S (3 days)
**Description:** Source attribution

---

### FEAT-S25: Reporting Dashboards
**Category:** New Feature | **Priority:** P2 | **Size:** S (5 days)
**Description:** Analytics and exports

---

## Phase 5: Advanced Features

> **Goal:** Enterprise-ready features and advanced capabilities.

### EPIC: Lead Generation Integration Platform
**Category:** New Feature | **Priority:** P1 | **Size:** XL (16-20 weeks)
**Status:** BACKLOG
**Full Spec:** `docs/EPIC_LEAD_GENERATION_PLATFORM.md`

**Business Value:** "Killer feature" - unified lead management hub eliminating manual data transfer between platforms.

**Components:**

| Component | Description | Size | Priority |
|-----------|-------------|------|----------|
| **Lead Inbox** | Unified view of all leads | L (2 weeks) | P0 |
| **Thumbtack Integration** | Full Partner API | L (2 weeks) | P0 |
| **Angi Integration** | Webhook-based leads | M (1.5 weeks) | P0 |
| **Google LSA Integration** | Leads + budget management | L (2 weeks) | P0 |
| **Meta Lead Ads** | Facebook/Instagram leads | M (1 week) | P1 |
| **Website Builder** | White-label Duda or Payload CMS | XL (4 weeks) | P1 |
| **Lead Capture Forms** | Embeddable forms | M (1 week) | P1 |
| **Marketing ROI Dashboard** | Cost-per-lead analytics | M (2 weeks) | P1 |
| **Zapier Integration** | For unsupported platforms | M (2 weeks) | P2 |

**Lead Sources Researched:**
- **Tier 1 (API):** Thumbtack, Angi, Google LSA, Meta Lead Ads
- **Tier 2 (Zapier):** Houzz Pro (import only), Bark, Nextdoor
- **Tier 3 (Partnership):** Porch, Yelp (partner-only)
- **Regional:** Checkatrade (UK), HomeStars (Canada)

**Key Findings:**
- Thumbtack has the most complete API (leads, two-way messaging, reviews)
- Angi/HomeAdvisor is webhook-only, no ad spend control
- Google LSA allows budget/bidding control via Google Ads API
- Houzz Pro has NO public API, one-way Zapier import only

---

### Team Management Overhaul
- Certifications and training system
- Onboarding workflows
- Archive/termination workflows
- Team location tracking

### Reporting & Analytics
- Advanced dashboards
- Custom reports
- Financial analytics

### Integrations & Automation
- QuickBooks full integration
- Calendar sync
- Workflow automation builder
- API for third-party integrations
- Vehicle tracking (Samsara, Verizon Connect, Geotab)

### Future Considerations
- Native mobile apps (iOS, Android)
- Offline mode enhancements
- International expansion
- White-label opportunities

---

## Phase 6: AI Intelligence Platform

> **Goal:** Transform ContractorOS into an AI-powered construction intelligence platform.
> **See:** `docs/AI_INTELLIGENCE_VISION.md` for full strategic vision.

### AI-L1: Construction Intelligence Database
**Category:** New Feature | **Priority:** P0 | **Size:** XL (8 weeks)
**Business Value:** Foundation for all AI features, competitive moat

**Data Sources (External):**
- FRED API (material price indices - lumber, steel, cement)
- BLS OEWS (labor wage data by occupation and geography)
- SAM.gov Davis-Bacon (prevailing wage rates by county)
- Census Bureau (construction activity and permits)
- HUD Cost Indices (location adjustment factors)

**Data Sources (Internal - The Moat):**
- Aggregated, anonymized user estimates
- Subcontractor bid history
- Invoice actuals vs estimates
- Time tracking productivity data
- Change order patterns

**Files to Create:**
```
apps/web/lib/intelligence/
├── types.ts                    # Intelligence data types
├── material-prices.ts          # FRED API integration
├── labor-rates.ts              # BLS data integration
├── benchmarks.ts               # Benchmark calculations
└── anonymizer.ts               # Data anonymization

functions/src/intelligence/
├── fetchMaterialPrices.ts      # Scheduled FRED fetch
├── fetchLaborRates.ts          # Scheduled BLS fetch
├── aggregateUserData.ts        # Anonymized aggregation
└── index.ts
```

---

### AI-L2: Estimation Intelligence
**Category:** New Feature | **Priority:** P0 | **Size:** L (4 weeks)
**Business Value:** Increase estimate accuracy, reduce revision time by 30%

**Features:**
1. **Smart Line Item Suggestions**
   - Suggest unit costs based on region, project type, historical data
   - Show market range for each line item
   - "Your typical price" vs "market average" comparison

2. **Estimate Confidence Score**
   - Calculate risk score based on data availability
   - Flag thin margins vs historical averages
   - Show estimate position vs market range

3. **Material Price Alerts**
   - Proactive notifications when prices change >5%
   - Suggest estimate updates for pending quotes
   - Seasonal trend indicators

**UI Integration Points:**
- Line item picker shows AI suggestions
- Estimate summary includes confidence meter
- Dashboard shows pending quote risk alerts

**Files to Create:**
```
apps/web/components/intelligence/
├── InsightCard.tsx             # Reusable insight display
├── MarketComparison.tsx        # Price comparison visual
├── ConfidenceScore.tsx         # Estimate confidence meter
├── PriceAlertBanner.tsx        # Material price alerts
└── index.ts

apps/web/lib/hooks/useIntelligence.ts  # Intelligence data hooks
```

---

### AI-M3: Bid Intelligence
**Category:** New Feature | **Priority:** P1 | **Size:** M (2 weeks)
**Business Value:** Optimize subcontractor selection, improve bid acceptance rates

**Features:**
1. **Bid Comparison Analysis**
   - Compare bid to market rates for trade
   - Compare to sub's historical bids
   - Compare to other received bids

2. **Subcontractor Scoring**
   - Performance score based on past projects
   - Price competitiveness rating
   - Reliability index

3. **Bid Recommendations**
   - Suggest optimal number of bids to request
   - Identify best value subs for project type
   - Market timing recommendations

---

### AI-M4: Project Intelligence
**Category:** New Feature | **Priority:** P1 | **Size:** M (2 weeks)
**Business Value:** Predict profitability, reduce project risk

**Features:**
1. **Profitability Predictions**
   - Pre-project profit forecast
   - Risk factors identification
   - Similar project comparison

2. **Risk Indicators**
   - Thin margin warnings
   - Scope creep patterns
   - Weather risk for outdoor work
   - Schedule conflict detection

3. **Post-Project Analysis**
   - Automated estimate vs actuals comparison
   - Trade-by-trade variance breakdown
   - Change order pattern analysis
   - Lessons learned suggestions

---

### AI-L5: AI Assistant
**Category:** New Feature | **Priority:** P1 | **Size:** L (3 weeks)
**Business Value:** Instant answers, reduced learning curve, hands-free field operation

**Features:**
1. **Contextual Chat Interface**
   - Claude API integration
   - Context-aware responses (knows current project, user history)
   - Natural language queries ("What should I charge for bathroom remodels?")

2. **Voice Commands**
   - Speech-to-text input
   - Text-to-speech responses
   - Hands-free field operation
   - Mobile-optimized

3. **Proactive Insights**
   - "You might want to know..." notifications
   - Weekly intelligence digest
   - Trend alerts

**Files to Create:**
```
apps/web/components/assistant/
├── AssistantPanel.tsx          # Slide-out chat panel
├── ChatMessage.tsx             # Message display
├── VoiceInput.tsx              # Voice command UI
└── index.ts

apps/web/lib/assistant/
├── claude-client.ts            # Claude API wrapper
├── context-builder.ts          # Build context from user data
├── voice-service.ts            # Speech-to-text/text-to-speech
└── types.ts
```

---

### AI Feature Index

| ID | Title | Priority | Size | Status |
|----|-------|----------|------|--------|
| AI-L1 | Construction Intelligence Database | P0 | XL | Sprint 14 |
| AI-L2 | Estimation Intelligence | P0 | L | Sprint 15-16 |
| AI-M3 | Bid Intelligence | P1 | M | Sprint 17 |
| AI-M4 | Project Intelligence | P1 | M | Sprint 18 |
| AI-L5 | AI Assistant | P1 | L | Sprint 19-20 |

### AI Data Sources Summary

| Source | Data Type | Cost | Priority |
|--------|-----------|------|----------|
| FRED API | Material price indices | Free | P0 |
| BLS OEWS | Labor wage data | Free | P0 |
| SAM.gov Davis-Bacon | Prevailing wages | Free | P0 |
| Census Bureau | Construction activity | Free | P1 |
| HUD Cost Indices | Location factors | Free | P1 |
| User Data (aggregated) | Estimates, bids, actuals | Internal | P0 |
| Home Depot/Lowe's | Retail material prices | Scraping | P2 |
| Craftsman Estimator | Unit costs | $14/mo | P2 |
| 1build API | Live cost data | $$$ | Future |

---

## Complete Work Item Index

### January 2026 Audit Items

| ID | Title | Priority | Size | Status |
|----|-------|----------|------|--------|
| AUDIT-001 | Photos Firebase Permissions | P0 | S | ✅ Done |
| AUDIT-002 | Schedule Firebase Permissions | P0 | S | ✅ Done |
| AUDIT-003 | SMS Firebase Permissions | P0 | S | ✅ Done |
| AUDIT-004 | Integrations Page Loading | P0 | S | ✅ Done |
| AUDIT-005 | Cannot Uncancel Projects | P0 | S | ✅ Done |
| AUDIT-006 | Client Module Missing | P1 | S | ✅ Done |
| AUDIT-007 | Budget Calculation Issues | P1 | M | ✅ Done |
| AUDIT-008 | Dashboard Empty States | P1 | S | ✅ Done |
| AUDIT-009 | Dashboard Data Overflow | P1 | S | ✅ Done |
| AUDIT-010 | Invoice List Performance | P1 | S | ✅ Done |
| AUDIT-011 | Project Tabs Order | P2 | S | ✅ Done |
| AUDIT-012 | Calendar Vertical Space | P2 | S | ✅ Done |
| AUDIT-013 | SMS Use Case Clarity | P2 | S | ✅ Done |
| AUDIT-014 | Material Categories | P2 | S | ✅ Done |
| AUDIT-015 | Line Item Search | P2 | M | ✅ Done |
| AUDIT-016 | Owner/Admin Controls | P2 | M | ✅ Done |
| AUDIT-017 | Template Management | P2 | S | ✅ Done |
| AUDIT-018 | Integration OAuth | P2 | M | Partial |

### Bug Fixes (from 1.28.bugfixes.pdf)

| ID | Title | Priority | Size | Status |
|----|-------|----------|------|--------|
| BUG-001 | Phase Dropdown Missing | P1 | S | ✅ Done |
| BUG-002 | Modal Close Button Offset | P2 | QW | ✅ Done |
| BUG-003 | Modal Scroll Issues | P2 | S | ✅ Done |
| BUG-004 | Gantt Task Name Overlap | P2 | S | ✅ Done |
| UX-005 | Task Assignment UX | P2 | S | ✅ Done |
| UX-006 | Checklist Save Feedback | P2 | QW | ✅ Done |
| UX-007 | Save Confirmation Modal Close | P1 | S | ✅ Done |
| BUG-008 | SOW Template Phase Assignment | P1 | S | ✅ Done |
| FEAT-009 | SOW Template Management | P1 | M | ✅ Done |
| BUG-011 | Archived Project Duplicate | P2 | S | ✅ Done |
| UX-012 | Tags Feature Incomplete | P3 | S | ✅ Done |
| WORKFLOW-013 | SOW Approval Process | P1 | S | ✅ Done |
| WORKFLOW-014 | SOW vs Quote Relationship | P1 | S | ✅ Done |
| BUG-015 | Quote Import Phase Grouping | P2 | S | ✅ Done |
| FEAT-016 | SOW Version Viewing | P1 | S | ✅ Done |
| UX-017 | Subcontractor Modal Scroll | P2 | QW | ✅ Done |
| UX-018 | Form Validation Feedback | P1 | S | ✅ Done |
| UX-019 | Required Field Indicators | P1 | S | ✅ Done |
| FEAT-020 | Global Subcontractor System | P0 | L | ✅ Done |
| BUG-021 | Responsive Design Mobile | P2 | M | ✅ Done |
| BUG-022 | Table Layout Overflow | P2 | S | ✅ Done |
| CRITICAL-023 | Brand Colors Not Applied | P1 | S | ✅ Done |
| BUG-024 | Org Settings Save Behavior | P1 | S | ✅ Done |
| BUG-025 | Org Settings Layout | P2 | S | ✅ Done |
| BUG-026 | Integrations Page Broken | P0 | M | ✅ Done |
| BUG-027 | Tax Rates Page Issues | P1 | S | ✅ Done |
| BUG-028 | Data Export Page Broken | P1 | S | ✅ Done |
| BUG-029 | Notifications Page Broken | P1 | S | ✅ Done |

### New Features (from Product Roadmap)

| ID | Title | Priority | Size | Status |
|----|-------|----------|------|--------|
| FEAT-L1 | E-Signature System | P0 | L | ✅ Done |
| FEAT-L2 | SMS/Text Workflows | P0 | L | ✅ Done |
| FEAT-L3 | Client Portal (No Login) | P1 | L | ✅ Done |
| FEAT-L4 | Client Management Module | P1 | L | ✅ Done |
| FEAT-M5 | Photo Documentation | P1 | M | ✅ Done |
| FEAT-M6 | Payment Processing | P1 | M | ✅ Done |
| FEAT-M7 | Quick Estimate Builder | P1 | M | ✅ Done |
| FEAT-M8 | Smart Scheduling | P1 | M | ✅ Done |
| FEAT-M9 | Material Tracking | P2 | M | ✅ Done |
| FEAT-M10 | Change Order Enhancement | P1 | M | ✅ Done |
| FEAT-S11 | Communication Hub | P2 | S | ✅ Done |
| FEAT-S12 | Document Storage | P2 | S | ✅ Done |
| FEAT-S13 | Time Tracking | P2 | S | ✅ Done |
| FEAT-S14 | Quote Templates | P2 | S | ✅ Done |
| FEAT-S15 | Appointment Booking | P2 | S | Pending |
| FEAT-S16 | Expense Tracking | P2 | S | ✅ Done |
| FEAT-S17 | Daily Log/Journal | P2 | S | ✅ Done |
| FEAT-S18 | Client Feedback | P2 | S | Pending |
| FEAT-S19 | Lead Capture Forms | P2 | S | Pending |
| FEAT-S20 | Warranty Tracking | P2 | S | Pending |
| FEAT-S21 | Weather Integration | P2 | S | ✅ Done |
| FEAT-S22 | Subcontractor Payments | P2 | S | Pending |
| FEAT-S23 | Permit Tracking | P2 | S | Pending |
| FEAT-S24 | Referral Tracking | P2 | S | Pending |
| FEAT-S25 | Reporting Dashboards | P2 | S | Pending |

### Lead Generation Platform (Epic)

| ID | Title | Priority | Size | Status |
|----|-------|----------|------|--------|
| LEAD-001 | Unified Lead Inbox | P0 | L | Backlog |
| LEAD-002 | Webhook Infrastructure | P0 | M | Backlog |
| LEAD-003 | Real-Time Notifications | P0 | S | Backlog |
| LEAD-010 | Thumbtack Integration | P0 | L | Backlog |
| LEAD-011 | Angi Integration | P0 | M | Backlog |
| LEAD-012 | Google LSA Integration | P0 | L | Backlog |
| LEAD-013 | Meta Lead Ads Integration | P1 | M | Backlog |
| LEAD-014 | Google Business Profile | P2 | S | Backlog |
| LEAD-020 | Website Builder Platform | P1 | XL | Backlog |
| LEAD-021 | Lead Capture Forms | P1 | M | Backlog |
| LEAD-022 | Website Chat Widget | P2 | S | Backlog |
| LEAD-030 | Marketing ROI Dashboard | P1 | M | Backlog |
| LEAD-031 | Lead Scoring & Auto-Assignment | P2 | M | Backlog |
| LEAD-032 | Two-Way Messaging Hub | P1 | M | Backlog |
| LEAD-040 | Zapier App | P2 | M | Backlog |

### Expense Module UX Improvements (Backlog)

> **Added:** 2026-02-04 | **Context:** Receipt OCR feature shipped, identified UX improvements needed

| ID | Title | Priority | Size | Status | Notes |
|----|-------|----------|------|--------|-------|
| EXP-001 | Multi-Line Receipt Breakdown | P1 | M | Backlog | When receipt has many items, allow splitting into multiple expense lines. Requires new layout/workflow beyond modal. |
| EXP-002 | Quick Project Assignment for Expenses | P1 | M | Backlog | Succinct UX for assigning expenses to active projects. Modal likely not ideal - explore inline assignment, swipe actions, or dedicated expense review screen. |
| EXP-003 | Expense Review Workflow | P2 | L | Backlog | Dedicated screen/flow for reviewing unassigned expenses, bulk project assignment, and multi-line item editing. |

**Design Considerations:**
- Current modal-based expense entry is good for single items
- Multi-item receipts (e.g., Home Depot with 20 line items) need a different approach
- Project assignment should be fast for field users processing multiple receipts
- Consider: batch processing view, swipe-to-assign, project picker flyout

### Sprint 9 Completed Features

| ID | Title | Status |
|----|-------|--------|
| Sprint 9A | Data Architecture Bug Fixes | ✅ Done |
| Sprint 9B | Full Payroll Module | ✅ Done |
| Sprint 9C | CSV Import System | ✅ Done |
| Sprint 9D | Crew Scheduling Enhancement | ✅ Done (verified Jan 30) |
| Sprint 9E | Security Hardening | ✅ Done |

### Refactoring Tasks

| ID | Title | Priority | Size | Status |
|----|-------|----------|------|--------|
| RF-001 | Toast/Notification System | P1 | S | ✅ Done |
| RF-002 | Form Component Library | P1 | S | ✅ Done |
| RF-003 | BaseModal Component | P1 | S | ✅ Done |
| RF-004 | AuthProvider Architecture | P1 | M | ✅ Done (verified Jan 30) |
| RF-005 | Error Boundary Enhancement | P2 | S | ✅ Done (added Jan 30) |
| RF-006 | Firestore Hook Factory | P2 | M | ✅ Done |
| RF-007 | Type Organization | P3 | S | Pending |

---

## File Change Tracking

### Phase 0 Files (Foundation)

| File | Tasks | Status |
|------|-------|--------|
| `components/ui/Toast.tsx` | RF-001 | ✅ Done |
| `components/Providers.tsx` | RF-001 | ✅ Done |
| `components/ui/FormField.tsx` | RF-002, UX-019 | ✅ Done |
| `components/ui/FormError.tsx` | RF-002 | ✅ Done (in FormField.tsx) |
| `components/ui/BaseModal.tsx` | RF-003 | ✅ Done |
| `lib/hooks/useModalState.ts` | RF-003 | ✅ Done (useFormModal) |
| `lib/auth.tsx` | RF-004 | ✅ Done (verified) |
| `components/ErrorBoundary.tsx` | RF-005 | ✅ Done |
| `app/error.tsx` | RF-005 | ✅ Done (added Jan 30) |
| `app/not-found.tsx` | RF-005 | ✅ Done (added Jan 30) |
| `app/loading.tsx` | RF-005 | ✅ Done (added Jan 30) |
| `app/dashboard/error.tsx` | RF-005 | ✅ Done (added Jan 30) |
| `app/dashboard/loading.tsx` | RF-005 | ✅ Done (added Jan 30) |
| `app/client/error.tsx` | RF-005 | ✅ Done (added Jan 30) |
| `app/field/error.tsx` | RF-005 | ✅ Done (added Jan 30) |
| `app/sub/error.tsx` | RF-005 | ✅ Done (added Jan 30) |

### Phase 1 Files (Bug Fixes)

| File | Tasks | Status |
|------|-------|--------|
| `components/tasks/TaskDetailModal.tsx` | BUG-001-003, UX-005,007 | Pending |
| `components/tasks/TaskCard.tsx` | BUG-001 | Pending |
| `components/tasks/TaskChecklist.tsx` | UX-006 | Pending |
| `components/projects/tasks/gantt/GanttChart.tsx` | BUG-004 | Pending |
| `components/projects/scope/ScopeBuilder.tsx` | BUG-008 | Pending |
| `components/projects/scope/ScopeApprovalPanel.tsx` | WORKFLOW-013 | Pending |
| `components/projects/scope/ScopeVersionHistory.tsx` | FEAT-016 | Pending |
| `components/subcontractors/SubDetailModal.tsx` | UX-017 | Pending |
| `components/subcontractors/SubForm.tsx` | UX-018 | Pending |
| `lib/theme/ThemeProvider.tsx` | CRITICAL-023 | Pending |
| `app/dashboard/settings/organization/page.tsx` | BUG-024,025 | Pending |
| `app/dashboard/settings/integrations/page.tsx` | BUG-026 | Pending |
| `app/dashboard/settings/tax-rates/page.tsx` | BUG-027 | Pending |
| `app/dashboard/settings/data-export/page.tsx` | BUG-028 | Pending |
| `app/dashboard/settings/notifications/page.tsx` | BUG-029 | Pending |
| `app/dashboard/subcontractors/page.tsx` | FEAT-020 | Create |
| `app/dashboard/settings/sow-templates/page.tsx` | FEAT-009 | Create |

### Phase 2 Files (New Features)

| File | Tasks | Status |
|------|-------|--------|
| `lib/esignature/` | FEAT-L1 | Create |
| `app/sign/[token]/page.tsx` | FEAT-L1 | Create |
| `lib/sms/` | FEAT-L2 | Create |
| `app/dashboard/messages/page.tsx` | FEAT-L2 | Create |
| `app/portal/[token]/page.tsx` | FEAT-L3 | Create |
| `lib/magic-link/` | FEAT-L3 | Create |
| `app/dashboard/clients/page.tsx` | FEAT-L4 | Create |

### Phase 3 Files (Operations)

| File | Tasks | Status |
|------|-------|--------|
| `lib/payments/` | FEAT-M6 | Create |
| `app/pay/[token]/page.tsx` | FEAT-M6 | Create |
| `components/photos/` | FEAT-M5 | Create |
| `app/dashboard/schedule/` | FEAT-M8 | Enhance |

---

## Testing Strategy

### Unit Test Priority

1. `lib/auth.tsx` - Auth flows
2. `lib/hooks/useTasks.ts` - Task CRUD
3. `lib/hooks/usePhases.ts` - Phase management
4. `lib/hooks/useScopes.ts` - Scope versioning
5. `lib/hooks/useChangeOrders.ts` - Change orders
6. `lib/validations/index.ts` - Schema validation
7. `lib/esignature/` - E-signature flows
8. `lib/sms/` - SMS integration
9. `lib/payments/` - Payment processing

### Integration Tests

1. Task creation → Phase assignment → Gantt view
2. SOW creation → Approval → Quote generation
3. Estimate → E-signature → Payment
4. SMS send → Client reply → Activity log

### E2E Tests (Playwright)

1. Full project creation workflow
2. Client portal access and navigation
3. E-signature flow end-to-end
4. Payment processing
5. Settings configuration

---

## Sprint Planning Summary

### Recommended Sprint Order

**Sprint 0 (Foundation):** RF-001, RF-002, RF-003
**Sprint 1:** BUG-026, FEAT-020, UX-019, BUG-024
**Sprint 2:** BUG-027-029, CRITICAL-023, BUG-001
**Sprint 3:** FEAT-L1 (E-Signature - Week 1-2)
**Sprint 4:** FEAT-L1 (E-Signature - Week 3-4)
**Sprint 5:** FEAT-L2 (SMS - Week 1-2)
**Sprint 6:** FEAT-L2 (SMS - Week 3-4)
**Sprint 7:** FEAT-L3 (Client Portal - Week 1-2)
**Sprint 8:** FEAT-L3 (Client Portal - Week 3), FEAT-L4 Start
**Sprint 9+:** Continue per phase plan

---

## Notes for New Sessions

1. **Start here:** Read this MASTER_ROADMAP.md first
2. **Code patterns:** See CLAUDE.md for architecture details
3. **Refactoring details:** See REFACTORING.md
4. **Test cases:** See ACCEPTANCE_CRITERIA.md
5. **Branch:** All work on `feature/bug-fixes-1.28`
6. **No test framework:** Tests need to be added

### Key Technical Decisions Already Made

- Next.js 14 App Router (not Pages)
- Firestore for database
- Firebase Auth for authentication
- Tailwind CSS for styling
- React Hook Form + Zod for validation
- Headless UI for components
- Twilio for SMS (recommended)
- Stripe for payments (recommended)
- DocuSeal or SignRequest for e-signatures
