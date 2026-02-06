# ContractorOS Reprioritized Sprint Plan
## Bugs, Stability, and Functionality First

**Date:** 2026-02-04
**Priority:** Bugs → Stability → Core Functionality → New Features
**Status:** 🔴 READY FOR EXECUTION

> **Note:** This is the **active execution roadmap** focusing on immediate sprint priorities.
> For comprehensive historical context, feature vision, and archived work, see:
> - `docs/archive/MASTER_ROADMAP_historical.md` - Complete historical roadmap
> - `SPRINT_STATUS.md` - Current sprint progress and session handoffs

---

## Executive Summary

**Current State:** 101 open issues (0 critical, 47 high, 40 medium, 8 low)
**Reprioritization Goal:** Address all bugs and stability issues before new features
**Estimated Timeline:** 15-20 days of Claude sessions

### Why Reprioritize?

1. **Version warnings** (Node.js 20 EOL) need immediate attention
2. **Existing bugs** hurt user trust more than missing features help
3. **Stability issues** block production readiness
4. **Technical debt** compounds over time

---

## NEW Sprint Order (Critical Path)

```
┌─────────────────────────────────────────────────────────┐
│ PHASE 1: INFRASTRUCTURE & CRITICAL FIXES (3-4 days)    │
├─────────────────────────────────────────────────────────┤
│ Sprint 47  → Node.js 22 + Firebase SDK Updates         │
│ Sprint 48  → Next.js 14→16 + React 18→19 Upgrades      │
│ Sprint 49A → Remaining Critical Bugs (if any)          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ PHASE 2: HIGH-PRIORITY BUGS & DATA QUALITY (4-6 days)  │
├─────────────────────────────────────────────────────────┤
│ Sprint 49  → Data Quality & Missing Demo Data          │
│ Sprint 50  → UI/UX Bug Fixes (Layout, Polish)          │
│ Sprint 51  → Navigation Bugs & Structure               │
│ Sprint 52  → Reports Bugs & Configuration              │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ PHASE 3: STABILITY & FUNCTIONALITY (4-6 days)          │
├─────────────────────────────────────────────────────────┤
│ Sprint 53  → Settings Consolidation                    │
│ Sprint 54  → Schedule Stability & Polish               │
│ Sprint 55  → Mobile UX Bug Fixes                       │
│ Sprint 56  → Performance Optimization                  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ PHASE 4: ENHANCEMENTS (Optional - 4-6 days)            │
├─────────────────────────────────────────────────────────┤
│ Sprint 57  → Reporting Enhancements                    │
│ Sprint 58  → Notification System Completion            │
│ Sprint 59  → Minor Package Updates                     │
│ Sprint 60  → Tailwind CSS 4 (Optional)                 │
└─────────────────────────────────────────────────────────┘
```

**Total Critical Path:** 11-16 days
**Total with Optional:** 15-22 days

---

## Comparison: Old vs. New Priority

| Sprint | Old Focus | New Focus | Why Changed |
|--------|-----------|-----------|-------------|
| **40** | Demo Mode + Data | **SKIP** → Sprint 49 | Feature over bugs |
| **41** | Demo Mode Feature | **SKIP** → Sprint 61+ | New feature, not critical |
| **42** | Finance Module | **SKIP** → Included in bug fixes | Already completed per SPRINT_STATUS.md |
| **43** | Reports | **KEEP** → Sprint 52 | Bug fixes included |
| **47** | N/A | **NEW** → Node.js 22 | Version warnings |
| **48** | N/A | **NEW** → Next.js/React | Foundation stability |

---

## PHASE 1: Infrastructure & Critical Fixes (Days 1-4)

### Sprint 47: Node.js 22 + Firebase SDK Updates ⚡ START HERE
**Priority:** P0 - CRITICAL
**Duration:** 1 day (6-8 hours)
**Status:** 🔴 READY TO START

**Why First?**
- Resolves deploy warnings (Node.js 20 EOL in 3 months)
- Foundation for Next.js 15/16 upgrade
- Low risk, high impact

**What's Fixed:**
- Node.js 20 → 22 (local, Docker, Cloud Functions)
- Firebase Admin 12 → 13 (Cloud Functions)
- Firebase Functions 5 → 7
- Version consistency across stack

**Deliverables:**
- ✅ No deploy warnings
- ✅ All tests passing
- ✅ Docker builds successfully
- ✅ Cloud Functions deploy without errors

**Files:**
- `apps/web/Dockerfile`
- `functions/package.json`
- `.nvmrc` (new)
- `CLAUDE.md` (updated)

**Next:** Sprint 48 (Next.js + React)

---

### Sprint 48: Next.js 14→16 + React 18→19 Upgrades
**Priority:** P0 - CRITICAL
**Duration:** 2-3 days (12-18 hours)
**Status:** ⏳ After Sprint 47

**Why Second?**
- Enables latest React features
- Security updates for Next.js
- Required foundation for future work
- Breaking changes need careful testing

**What's Fixed:**
- Next.js 14.2.35 → 16.1.6 (2 major versions)
- React 18.3.1 → 19.2.4 (major version)
- `cookies()` / `headers()` → async (breaking change)
- `fetch()` caching behavior (breaking change)

**Migration Path:**
1. **Day 1:** Next.js 14 → 15
   - Audit `cookies()` / `headers()` usage
   - Add `await` to all server-side calls
   - Test Server Components
2. **Day 2:** Next.js 15 → 16 + React 18 → 19
   - Update React simultaneously
   - Test interactive components
   - Full E2E regression
3. **Day 3:** Bug fixes & polish

**Deliverables:**
- ✅ TypeScript compiles
- ✅ All Server Components working
- ✅ Forms and interactive UI functional
- ✅ E2E tests ≥ 95% pass rate

**Files Affected:**
- `package.json` (web app)
- `app/**/page.tsx` (async cookies/headers)
- `middleware.ts` (if exists)
- All components using React hooks

**Next:** Sprint 49 (Data Quality)

---

### Sprint 49A: Remaining Critical Bug Sweep (If Needed)
**Priority:** P0 - CRITICAL
**Duration:** 0.5-1 day (2-4 hours)
**Status:** ⏳ Conditional on Sprint 47-48 findings

**Purpose:** Catch any critical bugs introduced during upgrades

**Checklist:**
- [ ] TypeScript errors from upgrades
- [ ] Runtime errors in production
- [ ] Breaking changes not caught in testing
- [ ] Performance regressions

**Next:** Sprint 49 (Data Quality)

---

## PHASE 2: High-Priority Bugs & Data Quality (Days 5-10)

### Sprint 49: Data Quality & Missing Demo Data
**Priority:** P1 - HIGH
**Duration:** 1-2 days (8-12 hours)
**Status:** ⏳ After Sprint 48

**Issues Fixed:**
| ID | Issue | Effort | Type |
|----|-------|--------|------|
| #12 | Demo projects not categorized | 2-3h | Data |
| #14 | Missing demo client assignment | 2-3h | Data |
| #17 | No demo tasks for Gantt | 8-12h | Data |
| #21 | No demo RFIs (partially done) | 3-4h | Data |
| #30 | Create realistic demo clients | 3-4h | Data |
| #35 | Schedule demo events | 4-6h | Data |

**Why This Sprint?**
- Demo data is critical for sales/testing
- Missing data makes features appear broken
- Low risk (data only, no code changes)

**Deliverables:**
- ✅ All demo projects have categories
- ✅ All projects assigned to clients
- ✅ 15-25 tasks per project for Gantt chart
- ✅ 5-10 demo RFIs with responses
- ✅ 5-8 realistic demo clients with full data
- ✅ 20+ schedule events across projects

**Seed Scripts:**
- `seed-project-categories.ts` (new)
- `seed-client-assignments.ts` (new)
- `seed-tasks-gantt.ts` (new)
- `seed-rfis.ts` (enhance existing)
- `seed-demo-clients.ts` (new)
- `seed-schedule-events.ts` (enhance existing)

**Next:** Sprint 50 (UI/UX Bugs)

---

### Sprint 50: UI/UX Bug Fixes (Layout, Polish)
**Priority:** P1 - HIGH
**Duration:** 1-2 days (10-14 hours)
**Status:** ⏳ After Sprint 49

**Issues Fixed:**
| ID | Issue | Effort | Severity |
|----|-------|--------|----------|
| #1 | Search bar overlaps CTA buttons | 2-3h | Medium |
| #2 | Help menu location | 1-2h | Low |
| #3 | Online status indicator missing | 2-3h | Low |
| #4 | Active Projects dominates dashboard | 3-4h | Medium |
| #5 | Project card padding too large | 3-4h | Low |
| #7 | Sub-navigation spacing | 2h | Low |
| #29 | Client Preferences layout | 3-4h | Medium |
| #44 | Empty state pattern consistency | 2-3h | Medium |

**Why This Sprint?**
- User-facing bugs hurt credibility
- Layout issues distract from functionality
- Quick wins with visible impact

**Deliverables:**
- ✅ No overlapping UI elements
- ✅ Consistent spacing across modules
- ✅ Help menu in logical location
- ✅ Online status indicator visible
- ✅ Dashboard balanced (Active Projects smaller)
- ✅ Project cards optimally sized
- ✅ Standardized empty states

**Files Affected:**
- `app/dashboard/page.tsx` (dashboard layout)
- `components/ui/PageHeader.tsx` (search bar)
- `components/projects/ProjectCard.tsx` (card sizing)
- `components/ui/EmptyState.tsx` (standardization)
- `components/settings/ClientPreferences.tsx` (layout)

**Next:** Sprint 51 (Navigation)

---

### Sprint 51: Navigation Bugs & Structure
**Priority:** P1 - HIGH
**Duration:** 1-2 days (12-16 hours)
**Status:** ⏳ After Sprint 50

**Issues Fixed:**
| ID | Issue | Effort | Type |
|----|-------|--------|------|
| #33 | Separate Team from Subcontractors | 8-12h | Navigation |
| #59 | Sidebar navigation reorganization | 8-12h | Navigation |
| #34 | Subcontractor directory | 12-16h | Feature + Bug |
| #62 | Reports top nav → sidebar | 2-3h | Navigation |

**Why This Sprint?**
- Navigation confusion blocks user flow
- Team vs. Subcontractors distinction important
- Sidebar consistency improves UX

**Deliverables:**
- ✅ "Team" and "Subcontractors" are separate sidebar items
- ✅ Sidebar reorganized for logical flow
- ✅ Subcontractor directory functional
- ✅ Reports use sidebar nav (not top nav)
- ✅ All navigation patterns consistent

**Files Affected:**
- `components/layout/Sidebar.tsx` (navigation structure)
- `app/dashboard/team/page.tsx` (separate from subs)
- `app/dashboard/subcontractors/page.tsx` (directory)
- `app/dashboard/reports/layout.tsx` (sidebar nav)

**Next:** Sprint 52 (Reports Bugs)

---

### Sprint 52: Reports Bugs & Configuration
**Priority:** P1 - HIGH
**Duration:** 1-2 days (8-12 hours)
**Status:** ⏳ After Sprint 51

**Issues Fixed:**
| ID | Issue | Effort | Status |
|----|-------|--------|--------|
| #69 | Operational Reports load error | 2-4h | ✅ Fixed |
| #76 | Payroll data load error | 2-4h | ✅ Fixed |
| #63 | Reports demo data (historical revenue) | 12-16h | Open |
| #64 | Report filters save/load | 4-6h | Open |
| #65 | Export formats (PDF, Excel) | 6-8h | Open |

**Note:** #69 and #76 marked as fixed in SPRINT_STATUS.md. Verify and continue with remaining issues.

**Why This Sprint?**
- Reports module shows 65% completion
- Demo data needed for testing
- Export functionality expected by users

**Deliverables:**
- ✅ All reports load without errors (verify fixes)
- ✅ 3-5 completed projects with full P&L data
- ✅ Backdated revenue (3-6 months historical)
- ✅ Report filters save user preferences
- ✅ PDF export functional
- ✅ Excel export functional

**Files Affected:**
- `app/dashboard/reports/*` (various report pages)
- `scripts/seed-demo/seed-historical-revenue.ts` (new)
- `scripts/seed-demo/seed-completed-projects.ts` (new)
- `lib/reports/exportPDF.ts` (new)
- `lib/reports/exportExcel.ts` (new)

**Next:** Sprint 53 (Settings)

---

## PHASE 3: Stability & Functionality (Days 11-16)

### Sprint 53: Settings Consolidation
**Priority:** P2 - MEDIUM
**Duration:** 1 day (6-8 hours)
**Status:** ⏳ After Sprint 52

**Issues Fixed:**
| ID | Issue | Effort | Type |
|----|-------|--------|------|
| #66 | Settings scattered across modules | 4-6h | Architecture |
| #79 | Preferences not persisting | 2-3h | Bug |
| #80 | Account settings incomplete | 3-4h | Feature Gap |

**Why This Sprint?**
- Settings UX is confusing when scattered
- Persistence bugs frustrate users
- Consolidation improves maintainability

**Deliverables:**
- ✅ Single Settings module (consolidated)
- ✅ Preferences persist correctly
- ✅ Account settings complete
- ✅ Consistent settings patterns

**Files Affected:**
- `app/dashboard/settings/page.tsx` (consolidate here)
- `lib/hooks/useUserPreferences.ts` (persistence)
- Various components moved to settings module

**Next:** Sprint 54 (Schedule)

---

### Sprint 54: Schedule Stability & Polish
**Priority:** P2 - MEDIUM
**Duration:** 1-2 days (10-14 hours)
**Status:** ⏳ After Sprint 53

**Issues Fixed:**
| ID | Issue | Effort | Type |
|----|-------|--------|------|
| #36 | Weather integration | 12-16h | Feature |
| #37 | Day view for schedule | 8-12h | Feature |
| #38 | Team assignment from calendar | 8-12h | Bug + Feature |
| #77 | Date picker quick selections | 3-4h | UX |

**Why This Sprint?**
- Schedule is 85% complete (needs final push)
- Weather integration adds value
- Day view is expected functionality

**Deliverables:**
- ✅ Weather widget on schedule page
- ✅ Day view toggle (month/week/day)
- ✅ Assign team members from calendar UI
- ✅ Date picker with quick selections (Today, Tomorrow, Next Week)

**Files Affected:**
- `app/dashboard/schedule/page.tsx` (views)
- `components/schedule/WeatherWidget.tsx` (new)
- `components/schedule/TeamAssignment.tsx` (new)
- `components/ui/DatePicker.tsx` (quick selections)

**Next:** Sprint 55 (Mobile UX)

---

### Sprint 55: Mobile UX Bug Fixes
**Priority:** P2 - MEDIUM
**Duration:** 1 day (6-8 hours)
**Status:** ⏳ After Sprint 54

**Issues Fixed:**
| ID | Issue | Effort | Type |
|----|-------|--------|------|
| #81 | Mobile nav menu glitchy | 3-4h | Bug |
| #82 | Forms not mobile-optimized | 4-6h | UX |
| #83 | Bottom nav overlaps content | 2-3h | Bug |

**Why This Sprint?**
- Mobile UI shows 90% completion
- Field workers use mobile primarily
- Small bugs have outsized impact

**Deliverables:**
- ✅ Mobile nav smooth and responsive
- ✅ All forms mobile-optimized
- ✅ Bottom nav proper z-index
- ✅ Touch targets ≥ 44px

**Files Affected:**
- `components/layout/MobileNav.tsx` (nav glitch)
- `components/forms/*` (mobile optimization)
- `components/layout/BottomNav.tsx` (z-index)

**Next:** Sprint 56 (Performance)

---

### Sprint 56: Performance Optimization
**Priority:** P2 - MEDIUM
**Duration:** 1-2 days (8-12 hours)
**Status:** ⏳ After Sprint 55

**Issues Fixed:**
| ID | Issue | Effort | Type |
|----|-------|--------|------|
| #84 | Large bundle size (analyze) | 4-6h | Performance |
| #85 | Slow dashboard load | 3-4h | Performance |
| #86 | Unoptimized images | 2-3h | Performance |
| #87 | Firestore query inefficiencies | 4-6h | Performance |

**Why This Sprint?**
- Performance affects user experience
- Load times impact adoption
- Optimization best done after feature completion

**Deliverables:**
- ✅ Bundle size < 500KB (main chunk)
- ✅ Dashboard load < 2 seconds
- ✅ All images optimized (WebP, lazy load)
- ✅ Firestore queries use indexes

**Tools:**
- `@next/bundle-analyzer` (analyze bundle)
- Next.js Image component (optimization)
- Firestore query profiling

**Files Affected:**
- `next.config.js` (bundle optimization)
- Various components (image optimization)
- `lib/firebase/queries.ts` (query optimization)

**Next:** Phase 4 (Optional Enhancements)

---

## PHASE 4: Enhancements (Optional - Days 17-22)

### Sprint 57: Reporting Enhancements
**Priority:** P3 - LOW
**Duration:** 1-2 days (10-14 hours)
**Status:** ⏳ Optional

**Issues Fixed:**
| ID | Issue | Effort | Type |
|----|-------|--------|------|
| #67 | Custom reports builder | 12-16h | Feature |
| #68 | Report scheduling | 4-6h | Feature |
| #70 | Report sharing | 3-4h | Feature |

**Why Optional?**
- Reports at 65% are functional
- Custom builder is nice-to-have
- Can defer to later sprint

**Deliverables:**
- ✅ Custom report builder UI
- ✅ Schedule reports (daily/weekly/monthly)
- ✅ Share reports via link

---

### Sprint 58: Notification System Completion
**Priority:** P3 - LOW
**Duration:** 1 day (6-8 hours)
**Status:** ⏳ Optional

**Issues Fixed:**
| ID | Issue | Effort | Type |
|----|-------|--------|------|
| #88 | Email notifications | 4-6h | Feature |
| #89 | Notification preferences | 2-3h | Feature |

**Why Optional?**
- Core notifications already functional
- Email can wait
- Preferences are nice-to-have

---

### Sprint 59: Minor Package Updates
**Priority:** P3 - LOW
**Duration:** 0.5-1 day (3-5 hours)
**Status:** ⏳ Optional (see Sprint 47)

**Note:** This was part of original version update plan. May be unnecessary after Sprint 47-48.

**What's Updated:**
- Anthropic SDK (functions)
- Framer Motion (minor)
- Autoprefixer (minor)
- Other non-breaking updates

---

### Sprint 60: Tailwind CSS 4 Migration
**Priority:** P3 - LOW
**Duration:** 1-2 days (8-12 hours)
**Status:** ⏳ Optional

**Why Optional?**
- Tailwind 3 is stable
- v4 is major rewrite with breaking changes
- Can defer until UI is finalized

**Recommendation:** Skip for now, revisit in 2-3 months

---

## Deferred Sprints (Not Bugs/Stability)

### Sprint 61+: Demo Mode Feature
**Original:** Sprint 40-41
**New Priority:** P4 - DEFERRED
**Rationale:** New feature, not a bug fix

**What It Does:**
- Toggleable demo mode for platform exploration
- Purple banner, org switcher
- 4-hour auto-expiry

**When to Build:**
- After all bugs resolved (Sprint 56+)
- When preparing for sales demos
- Estimated: 2-3 days

---

### Sprint 62+: AI Receipt OCR
**Original:** Sprint F0
**New Priority:** P4 - DEFERRED
**Rationale:** New feature, not existing functionality

**What It Does:**
- Auto-extract expense data from receipt photos
- Anthropic Vision API integration
- $1/month for 1,000 receipts

**When to Build:**
- After core expense module stable
- When users request OCR
- Estimated: 2-3 days

---

### Sprint 63+: Messaging Architecture
**Original:** Issue #61
**New Priority:** P4 - DEFERRED
**Rationale:** Strategic research project, not a bug

**What It Does:**
- Unified messaging platform
- Multi-channel integration
- Context-aware communication

**When to Build:**
- After platform stable and launched
- When users report communication pain
- Estimated: 2-3 weeks (research + implementation)

---

## Implementation Strategy

### Parallel Execution (Recommended)

Each sprint can use 3-4 parallel CLI workstreams:

**Example: Sprint 47 (Node.js Upgrade)**
- CLI 1: Upgrade local Node.js + create .nvmrc
- CLI 2: Update Docker + functions package.json
- CLI 3: Test Cloud Functions + run integration tests
- CLI 4: Update documentation (CLAUDE.md)

**Wall-Clock Time:** 4-6 hours (vs. 8-12h sequential)

---

### Sprint Velocity

**Estimated Velocity:**
- **Phase 1 (Sprints 47-49A):** 3-4 days
- **Phase 2 (Sprints 49-52):** 4-6 days
- **Phase 3 (Sprints 53-56):** 4-6 days
- **Phase 4 (Sprints 57-60):** 4-6 days (optional)

**Total Critical Path:** 11-16 days
**Total with Optional:** 15-22 days

---

## Success Metrics

### Phase 1 (Infrastructure)
| Metric | Target |
|--------|--------|
| Deploy warnings | 0 |
| TypeScript errors | 0 |
| Critical bugs | 0 |
| Node.js version | 22.x |
| Next.js version | 16.x |
| React version | 19.x |

### Phase 2 (Bugs)
| Metric | Target |
|--------|--------|
| High-priority bugs | 0 |
| Demo data completeness | 100% |
| UI layout issues | 0 |
| Navigation bugs | 0 |
| Reports bugs | 0 |

### Phase 3 (Stability)
| Metric | Target |
|--------|--------|
| Settings consolidated | Yes |
| Schedule completion | 95% |
| Mobile UX bugs | 0 |
| Page load time | < 2sec |
| Bundle size | < 500KB |

### Phase 4 (Enhancements)
| Metric | Target |
|--------|--------|
| Reports completion | 80% |
| Notification system | 95% |
| Package updates | All current |

---

## Risk Assessment

### High Risk Sprints
1. **Sprint 48** (Next.js/React) - Breaking changes, extensive testing required
2. **Sprint 51** (Navigation) - Affects entire app structure
3. **Sprint 56** (Performance) - Potential regressions

### Medium Risk Sprints
1. **Sprint 47** (Node.js) - Docker/deployment changes
2. **Sprint 50** (UI/UX) - Visual regressions possible
3. **Sprint 52** (Reports) - Complex data dependencies

### Low Risk Sprints
1. **Sprint 49** (Data) - Seed scripts only
2. **Sprint 53** (Settings) - Mostly UI reorganization
3. **Sprint 54** (Schedule) - Additive features

---

## Rollback Plan

**Every sprint:**
1. Git tag before starting: `git tag pre-sprint-XX`
2. Document current Docker image SHA
3. Document current Cloud Run revision
4. Full E2E baseline before changes

**Emergency rollback:**
```bash
# Rollback code
git checkout pre-sprint-XX

# Rollback Cloud Run (2 minutes)
gcloud run services update-traffic contractoros-web \
  --to-revisions=PREVIOUS_REVISION=100 \
  --region=us-west1

# Rollback Functions (5 minutes)
cd functions && git checkout HEAD~1 -- package.json
firebase deploy --only functions
```

---

## Communication Plan

**After each phase:**
- Update SPRINT_STATUS.md
- Update MASTER_ROADMAP.md with completions
- Document any new patterns in CLAUDE.md
- Run platform audit to verify fixes

**Key milestones:**
- **After Sprint 48:** Foundation stable, no version warnings
- **After Sprint 52:** All high-priority bugs resolved
- **After Sprint 56:** Platform production-ready

---

## Quick Start

### To Begin Sprint 47 (Node.js Upgrade):

```bash
# Read the full plan
cat docs/VERSION_AUDIT_FEB_2026.md
cat .claude-coordination/sprint-47-overview.md

# In Claude Code:
"Start Sprint 47: Node.js and Firebase SDK updates.
Follow sprint-47-overview.md with parallel CLI execution.
Focus on resolving deploy warnings."
```

### To Continue After Sprint 47:

```bash
# Update sprint status
# In Claude Code:
"Sprint 47 complete. Start Sprint 48: Next.js 14→16 and React 18→19 upgrades.
Follow docs/VERSION_AUDIT_FEB_2026.md section on Next.js migration."
```

---

## Appendix A: Issues by Sprint

### Sprint 47 (Node.js + Firebase)
- Version warnings (deploy)
- Node.js 20 → 22
- Firebase Admin 12 → 13
- Firebase Functions 5 → 7

### Sprint 48 (Next.js + React)
- Next.js 14 → 16
- React 18 → 19
- Breaking: async cookies/headers
- Breaking: fetch() caching

### Sprint 49 (Data Quality)
- #12: Project categories
- #14: Client assignments
- #17: Demo tasks
- #21: Demo RFIs
- #30: Demo clients
- #35: Schedule events

### Sprint 50 (UI/UX Bugs)
- #1: Search bar overlap
- #2: Help menu location
- #3: Online status indicator
- #4: Active Projects size
- #5: Project card padding
- #7: Sub-nav spacing
- #29: Client Preferences layout
- #44: Empty state consistency

### Sprint 51 (Navigation)
- #33: Team vs. Subcontractors
- #59: Sidebar reorganization
- #34: Subcontractor directory
- #62: Reports sidebar nav

### Sprint 52 (Reports)
- #69: Operational load error (verify fix)
- #76: Payroll load error (verify fix)
- #63: Historical revenue demo data
- #64: Report filters persistence
- #65: Export formats (PDF, Excel)

### Sprint 53 (Settings)
- #66: Settings consolidation
- #79: Preferences persistence
- #80: Account settings completion

### Sprint 54 (Schedule)
- #36: Weather integration
- #37: Day view
- #38: Team assignment
- #77: Date picker quick selections

### Sprint 55 (Mobile UX)
- #81: Mobile nav glitch
- #82: Forms mobile optimization
- #83: Bottom nav z-index

### Sprint 56 (Performance)
- #84: Bundle size optimization
- #85: Dashboard load time
- #86: Image optimization
- #87: Firestore query optimization

---

## Appendix B: Comparison to Original Plan

| Original Sprint | Focus | New Sprint | Focus | Change |
|----------------|-------|------------|-------|--------|
| 40 | Demo Mode + Data | 49 | Data Quality | Separated concerns |
| 41 | Demo Mode (cont.) | 61+ | DEFERRED | Not a bug |
| 42 | Finance Module | ✅ | COMPLETE | Already done |
| 43 | Reports | 52 | Reports Bugs | Bugs first |
| 44 | Settings | 53 | Settings Consolidation | Kept |
| 45 | Reporting Enhancements | 57 | Optional | Deferred |
| 46 | Notification System | 58 | Optional | Deferred |
| F0 | AI Receipt OCR | 62+ | DEFERRED | New feature |
| N/A | Version Updates | 47-48 | Critical | NEW |
| N/A | UI/UX Bugs | 50 | High Priority | NEW |
| N/A | Navigation Bugs | 51 | High Priority | NEW |
| N/A | Mobile UX Bugs | 55 | Medium Priority | NEW |
| N/A | Performance | 56 | Medium Priority | NEW |

---

## Phase 9: Testing & Polish (Sprints 77-80) ✅ COMPLETE

- **Sprint 77:** Unit Test Coverage ✅
- **Sprint 78:** Unit Test Coverage Continuation ✅
- **Sprint 79:** Full-Stack UI Debugging (Desktop + Mobile) ✅
- **Sprint 80:** Unit Test Coverage Phase 3 ✅

---

## Phase 10: Launch Readiness (Sprints 81-84)

### Sprint 81: Review & Google Business Completion
**Priority:** P0 - HIGH | **Hours:** 8-10 | **Status:** 📋 NEXT

Complete the remaining 25% of review management. Code is written (types, hooks, UI, Cloud Functions all in codebase). Sprint focuses on Firestore rules, indexes, deployment, GCP secrets, and demo seed data.

**Deliverables:**
- Firestore rules for 5 review collections (reviews, reviewRequests, reviewAutomationRules, reviewResponseTemplates, googleBusinessConnections)
- Composite indexes for review collections
- Deploy Cloud Functions (6 functions already exported in `functions/src/index.ts`)
- Configure GCP Secrets: GOOGLE_BUSINESS_CLIENT_ID, GOOGLE_BUSINESS_CLIENT_SECRET
- Seed demo reviews (15-20 Google reviews, 5-10 requests, 2-3 automation rules)
- E2E verification: create review request -> Cloud Function triggers -> status updates

### Sprint 82: Email Template Builder & History
**Priority:** P1 - HIGH | **Hours:** 10-12

Complete email template system. Hook (`useEmailTemplates`) and default templates exist. Add visual builder, scheduling, and email history tracking.

**Deliverables:**
- Enhanced template builder UI with rich text editing and variable autocomplete
- Email send scheduling (scheduledFor field on email queue)
- Email history page content (`/dashboard/settings/email-history/`)
- `useEmailHistory` hook for tracking sent emails with status
- Cloud Function: `onEmailSent` trigger to log email history
- Email analytics display (open rate, click rate, bounce rate)

### Sprint 83: Demo Data Completeness
**Priority:** P1 - HIGH | **Hours:** 8-10 | **Depends on:** Sprint 81

Fill all demo data gaps for sales-ready demos. Currently ~30% complete.

**Deliverables:**
- All projects: categories, client assignments, budgets, dates
- Tasks: 15-25/project with Gantt dependencies
- RFIs: 10+, Submittals: 8+, Punch list: 15+, Change orders: 5+
- Historical financial data: 6 months revenue/expenses/invoices
- Schedule events: 30+, Sub performance data for 5+ subs, Payroll runs: 3-4

### Sprint 84: E2E Regression & Smoke Testing
**Priority:** P1 - HIGH | **Hours:** 10-14 | **Depends on:** Sprints 81-83

Quality gate before new features. Run all E2E suites, fix critical/high issues.

**Deliverables:**
- Smoke test: 100% pass (all pages load)
- Auth/RBAC: 100% pass
- Mobile (375x812): 95%+ pass
- Desktop (1440px): 95%+ pass
- Full regression suite pass
- All critical bugs fixed, results documented

---

## Phase 11: Differentiators & Gap Filling (Sprints 85-88)

### Sprint 85: Settings Consolidation & Configuration
**Priority:** P2 - MEDIUM | **Hours:** 8-10

Complete settings to 95%. Fiscal year, payroll periods, tax settings, corporate structure, template management hub, document numbering config, data retention UI.

### Sprint 86: Subcontractor Analytics & Advanced Reporting
**Priority:** P2 - MEDIUM | **Hours:** 10-12 | **Depends on:** Sprint 83

Subcontractor performance analytics dashboard, cost comparison by trade, utilization charts. Report drill-down (summary -> project -> task), PDF export with branding, Excel export with formatting.

### Sprint 87: Notification Enhancements & Browser Push
**Priority:** P2 - MEDIUM | **Hours:** 8-10

Browser push notifications (Web Push API + VAPID), quiet hours enforcement, DND/snooze mode, notification digest emails, granular per-project controls, `processNotificationDigest` Cloud Function.

### Sprint 88: Offline Mode Foundation (PWA)
**Priority:** P2 - MEDIUM | **Hours:** 10-12

PWA manifest, service worker with workbox caching, background sync for offline queued operations, reconnection flow, field portal offline indicator. Types, sync queue, IndexedDB storage, offline forms, and OfflineProvider already exist.

---

## Phase 12: Intelligence & Polish (Sprints 89-90)

### Sprint 89: AI Intelligence Dashboard & Recommendations
**Priority:** P3 - MEDIUM-LOW | **Hours:** 8-10 | **Depends on:** Sprint 83

Surface existing AI infrastructure (anomaly detection, budget analyzer, material predictor, project intelligence) in a unified dashboard. AI alerts panel on main dashboard, anomaly timeline, portfolio health score, smart recommendations.

### Sprint 90: Final Polish, Unit Tests & Launch Prep
**Priority:** P1 - HIGH | **Hours:** 10-14 | **Depends on:** All

Final quality sprint. Target 1,700+ tests (from 1,502), full E2E regression, ESLint warnings <800 (from 1,050), MODULE_REGISTRY/SPRINT_STATUS/CLAUDE.md updates, Docker build verification, Cloud Run readiness, GCP secrets audit.

---

## Phase 13: Demo Data Hydration (Sprints 91-98)

> **Source:** Full platform browser audit (`docs/specs/DEMO_DATA_AUDIT.md`)
> **Problem:** Of ~40 audited pages, ~28 are completely empty or severely under-seeded. Sprint 83 achieved ~70% data completeness but the audit revealed massive gaps remain — **zero invoices, zero revenue, zero time entries, zero schedule events** cascade into broken financials, reports, and intelligence dashboards.
> **Goal:** Bring demo data completeness from ~70% to 100% with ~800 new records across ~25 seed scripts.

### Sprint 91: Bug Fixes & Financial Foundation
**Priority:** P0 - CRITICAL | **Hours:** 10-14 | **Depends on:** Sprint 90
**Focus:** Fix blocking bugs + seed invoices, payments, and estimates — the foundation everything else depends on.

**Phase A: Bug Fixes (2-3 hours)**

| Bug | Location | Fix |
|-----|----------|-----|
| Change Orders missing Firestore index | Project > Change Orders tab | Deploy composite index for `changeOrders` collection |
| Selections page infinite loading | Project > Selections tab | Debug and fix loading logic in selections hook/page |
| "Failed to load financial data" toast | Project > Finances tab | Fix data loading error in project finances page |
| Field Portal clock stuck at 174+ hours | Field Portal | Reset clock state / fix timer persistence bug |
| Material "Available" shows 0 for items with stock | Materials inventory | Fix available quantity calculation |
| Payroll runs all share same Run ID #202606 | Payroll page | Fix run ID generation in seed script or payroll logic |
| 99 overdue tasks (all past due dates) | Reports / Business Command Center | Update task due dates to realistic future dates |

**Phase B: Financial Seed Scripts (8-10 hours)**

| Script | Records | What It Seeds |
|--------|---------|---------------|
| `seed-invoices.ts` | 25-30 | Invoices across 8-10 projects with statuses: draft (3), sent (5), paid (12), overdue (5), partially paid (3). Tied to real projects and clients. Historical dates spanning 6 months. |
| `seed-payments.ts` | 15-20 | Payment records tied to paid/partially-paid invoices. Creates revenue data. Various methods (check, ACH, credit card). |
| `seed-estimates.ts` | 10-12 | Estimates with statuses: draft (2), sent (3), accepted (4), declined (2), expired (1). Pipeline value $200K-400K. |

**Data relationships created:**
- Invoices → Payments → Revenue ($450K-600K YTD)
- Invoices → AR Aging (current, 30, 60, 90+ days → $40K-80K outstanding)
- Estimates → Pipeline Value ($200K-400K)
- Revenue - Expenses → Profit Margin (15-25% target)

**Acceptance Criteria:**
- [ ] All 7 bugs fixed and verified in browser
- [ ] Dashboard shows realistic revenue ($450K-600K YTD)
- [ ] Finance page shows revenue, AR aging, profit margins
- [ ] Intelligence dashboards show real data (not $0)
- [ ] Cash flow runway shows realistic inflow/outflow
- [ ] Estimates page shows pipeline with win rate
- [ ] `npx tsc --noEmit` passes

**Seed Scripts to Create:** 3 new (`seed-invoices.ts`, `seed-payments.ts`, `seed-estimates.ts`)
**Files to Modify:** Bug fixes across 5-7 existing files
**Parallel Plan:** Bug fixes (Agent 1) + Invoice seeder (Agent 2) + Estimate seeder (Agent 3)

---

### Sprint 92: Project Detail Hydration
**Priority:** P1 - HIGH | **Hours:** 10-14 | **Depends on:** Sprint 91
**Focus:** Hydrate per-project data — scopes, quotes, tasks, activity, change orders, phases, selections, and client assignments.

| Script | Records | What It Seeds |
|--------|---------|---------------|
| `seed-scopes-quotes.ts` | 40-60 | Scope items + quote line items for 5-8 active projects. Labor + material categories with quantities, unit prices, and totals. Quote sections (Demolition, Framing, Electrical, Plumbing, Finishes). |
| `seed-activity-notes.ts` | 100-150 | Activity feed entries (20-30 per active project) + notes (5-10 per project). Types: task_completed, invoice_sent, photo_added, change_order_approved, comment_added. |
| `seed-change-orders.ts` | 8-10 | Change orders across 5 projects. Statuses: draft (2), pending (3), approved (3), rejected (1), completed (1). With line items, reasons, cost impact. |
| `seed-phases.ts` | 30-40 | Project phases for 6-8 projects. 4-6 phases each (Planning, Foundation, Framing, MEP, Finishes, Punch List). Start/end dates, % complete, dependencies. |
| `seed-selections.ts` | 20-30 | Client selections for 4-5 projects. Categories: Flooring, Countertops, Fixtures, Paint, Hardware. Statuses: pending, selected, approved, ordered. With budget vs actual. |
| `update-client-assignments.ts` | 0 (updates) | Link all 23 projects to appropriate clients from the 13 existing clients. Fix "Not assigned" projects. |
| `update-task-dates.ts` | 0 (updates) | Reset 99 overdue tasks to realistic future dates. Mix statuses: pending (40%), in_progress (25%), completed (30%), blocked (5%). Add assignees. |

**Acceptance Criteria:**
- [ ] 5-8 projects have populated scope items and quote line items
- [ ] Project activity feeds show realistic history
- [ ] Change orders load and display across projects (index deployed)
- [ ] Project phases visible with timeline and progress
- [ ] Selections page loads with real data
- [ ] All projects assigned to clients
- [ ] Tasks show mixed completion states (not all overdue)
- [ ] `npx tsc --noEmit` passes

**Seed Scripts to Create:** 5 new + 2 update scripts
**Parallel Plan:** Scopes/Quotes (Agent 1) + Activity/Notes (Agent 2) + Change Orders + Phases (Agent 3) + Selections + Updates (Agent 4)

---

### Sprint 93: Schedule, Time Tracking & Timesheets
**Priority:** P1 - HIGH | **Hours:** 8-10 | **Depends on:** Sprint 91
**Focus:** Populate the schedule calendar, time tracking, and timesheet review queues.

| Script | Records | What It Seeds |
|--------|---------|---------------|
| `seed-schedule-events.ts` | 40-50 | Calendar events spanning Jan-Mar 2026. Types: job_site (20), inspection (8), meeting (6), delivery (4), milestone (5), time_off (3). Assigned to team members and projects. Recurring events for weekly meetings. |
| `seed-time-entries.ts` | 200-250 | Time entries across 6 team members over 8 weeks. 6-10 hours/day, 5 days/week. Tied to real projects. Break entries, overtime flagging. Task-level assignment. |
| `seed-timesheets.ts` | 24-30 | Weekly timesheets for 6 team members × 4 weeks. Statuses: submitted (8), approved (12), pending (6), rejected (2). Linked to time entries. Manager approval workflow data. |

**Acceptance Criteria:**
- [ ] Schedule calendar shows events across Jan-Mar 2026
- [ ] Time tracking page shows 200+ hours logged this week
- [ ] Timesheets page has items to review/approve
- [ ] Field portal schedule shows assigned events
- [ ] Field portal time clock works (clock reset from Sprint 91)
- [ ] Weekly hours logged: 200-240hrs (6 FTE × 40hrs)
- [ ] `npx tsc --noEmit` passes

**Seed Scripts to Create:** 3 new (schedule may enhance existing)
**Parallel Plan:** Schedule events (Agent 1) + Time entries (Agent 2) + Timesheets (Agent 3)

---

### Sprint 94: Subcontractors, Leads & Sales Pipeline
**Priority:** P1 - HIGH | **Hours:** 8-10 | **Depends on:** Sprint 91
**Focus:** Build out subcontractor network, lead pipeline, and service tickets.

| Script | Records | What It Seeds |
|--------|---------|---------------|
| `seed-subcontractors-full.ts` | 10-12 | Subcontractors across trades: plumbing (2), electrical (2), HVAC (1), concrete (1), framing (1), roofing (1), painting (1), landscaping (1), drywall (update existing), flooring (1). With insurance expiry, license #, contact info, performance ratings (1-5 stars), on-time %, completed project count. |
| `seed-bids.ts` | 12-15 | Bid solicitations + responses. Statuses: pending (4), accepted (5), declined (3), expired (2). Tied to real projects and subcontractors. With line items, amounts, notes. |
| `seed-leads.ts` | 12-15 | CRM leads across pipeline stages: new (3), contacted (3), qualified (2), proposal_sent (3), won (2), lost (2). With source (referral, Google, website, social), estimated value, next action dates, notes. |
| `seed-service-tickets.ts` | 6-8 | Service/warranty tickets. Statuses: open (2), scheduled (2), in_progress (1), completed (2), closed (1). Tied to completed projects and clients. Priority levels. |
| `update-team-rates.ts` | 0 (updates) | Set hourly cost rates for all 6 team members ($25-$65/hr based on trade/role). Update trade assignments for any missing. |

**Acceptance Criteria:**
- [ ] Subcontractors page shows 10-12 subs across trades
- [ ] Sub performance metrics display ratings and on-time %
- [ ] Bids page shows solicitations with various statuses
- [ ] Leads pipeline shows $200K-400K in pipeline value
- [ ] Service tickets page has active tickets
- [ ] Team members all have cost rates set
- [ ] `npx tsc --noEmit` passes

**Seed Scripts to Create:** 4 new + 1 update script
**Parallel Plan:** Subs + Bids (Agent 1) + Leads + Service Tickets (Agent 2) + Team Rates (Agent 3)

---

### Sprint 95: Communication & Notifications
**Priority:** P1 - HIGH | **Hours:** 6-8 | **Depends on:** Sprint 91
**Focus:** Populate messaging channels, SMS conversations, and notification feed.

| Script | Records | What It Seeds |
|--------|---------|---------------|
| `seed-messages.ts` | 40-60 | 4-5 project message channels with 8-12 messages each. Channel names: "Kitchen Reno - General", "Foundation Issues", "Material Delays", "Punch List Items". Messages from mix of team members. Threaded replies. |
| `seed-sms-conversations.ts` | 30-40 | 10-15 SMS conversations with clients and subs. 2-4 messages per conversation. Topics: scheduling, material questions, change requests, payment reminders. Realistic timestamps. |
| `seed-notifications.ts` | 20-25 | Notification feed entries. Types: task_assigned (5), approval_requested (4), message_received (3), invoice_paid (3), change_order_pending (2), schedule_updated (2), document_shared (2), milestone_reached (2). Mix of read/unread. |

**Acceptance Criteria:**
- [ ] Messages page shows project channels with threads
- [ ] SMS messaging page shows conversations
- [ ] Notifications bell shows unread count
- [ ] Notifications page has realistic entries
- [ ] `npx tsc --noEmit` passes

**Seed Scripts to Create:** 3 new
**Parallel Plan:** Messages (Agent 1) + SMS (Agent 2) + Notifications (Agent 3)

---

### Sprint 96: Compliance, Safety, RFIs & Submittals
**Priority:** P2 - MEDIUM | **Hours:** 8-10 | **Depends on:** Sprint 92
**Focus:** Populate compliance/safety records and project documentation workflows.

| Script | Records | What It Seeds |
|--------|---------|---------------|
| `seed-rfis-full.ts` | 10-12 | RFIs across 4-5 projects. Statuses: open (3), responded (4), closed (3), overdue (2). With questions, responses, linked drawings, assigned to team/subs. Response times. |
| `seed-submittals.ts` | 10-12 | Submittals across 4-5 projects. Statuses: pending_review (3), approved (4), needs_revision (2), rejected (1), resubmitted (2). Types: shop drawings, material samples, product data. Linked to spec sections. |
| `seed-safety.ts` | 20-25 | Safety inspections (10-12): passed (7), failed (3), pending (2). Safety incidents (2-3): reported, investigated, resolved. Toolbox talks (5-8): topics like fall protection, electrical safety, PPE, heat stress. |
| `seed-documents.ts` | 15-20 | Document references (metadata only, no file upload). Types: contract (4), permit (3), insurance_cert (3), lien_waiver (3), plan/drawing (4), change_order_doc (3). Tied to projects. |
| `seed-signatures.ts` | 8-10 | E-signature requests. Statuses: pending (3), viewed (2), signed (3), declined (1), expired (1). Tied to estimates and change orders. |

**Acceptance Criteria:**
- [ ] RFIs page shows 10-12 items across projects
- [ ] Submittals page shows items in various review states
- [ ] Safety page shows inspections, incidents, toolbox talks
- [ ] Documents page shows categorized documents
- [ ] Signatures page shows requests in various statuses
- [ ] `npx tsc --noEmit` passes

**Seed Scripts to Create:** 5 new (seed-rfis-full.ts enhances existing)
**Parallel Plan:** RFIs + Submittals (Agent 1) + Safety (Agent 2) + Documents + Signatures (Agent 3)

---

### Sprint 97: Equipment, Expenses & Materials Enhancement
**Priority:** P2 - MEDIUM | **Hours:** 6-8 | **Depends on:** Sprint 91
**Focus:** Fill equipment inventory, expand expenses, and enhance material data.

| Script | Records | What It Seeds |
|--------|---------|---------------|
| `seed-equipment.ts` | 12-15 | Equipment items: excavator (1), skid steer (1), trucks (2), trailer (1), scaffolding (2), power tools (3-4), generators (1), compressors (1). With purchase date, value, maintenance schedule, current assignment (project/warehouse), condition. |
| `seed-expenses-full.ts` | 50-70 | Expanded expenses across categories: materials (20), labor (10), equipment_rental (8), fuel (8), insurance (4), permits (4), office (4), misc (6). Spanning 6 months. Realistic amounts ($50-$15,000). Tied to projects. Various approval statuses. |
| `update-materials.ts` | 0 (updates) | Fix material availability calculation. Update existing 20 materials with realistic stock levels, reorder points, and recent transaction history. Add low-stock alerts for 3-4 items. |

**Acceptance Criteria:**
- [ ] Equipment page shows 12-15 items with details
- [ ] Equipment checkout/assignment visible
- [ ] Expenses total $30K-60K/month (realistic)
- [ ] Expense categories populated across all types
- [ ] Material availability shows correct "Available" counts
- [ ] Low-stock alerts appear for appropriate items
- [ ] Monthly expenses on dashboard are realistic
- [ ] `npx tsc --noEmit` passes

**Seed Scripts to Create:** 2 new + 1 update script
**Parallel Plan:** Equipment (Agent 1) + Expenses (Agent 2) + Materials update (Agent 3)

---

### Sprint 98: Portal Users, Photos & Final Verification
**Priority:** P1 - HIGH | **Hours:** 8-10 | **Depends on:** Sprints 91-97
**Focus:** Create portal demo users, add photo references, and run full platform verification.

| Script | Records | What It Seeds |
|--------|---------|---------------|
| `seed-portal-users.ts` | 2-3 | Demo users: 1 client user (linked to existing client, CLIENT role), 1 sub user (linked to existing sub, SUBCONTRACTOR role), optionally 1 field worker (EMPLOYEE role with field assignments). Firebase Auth accounts + Firestore profiles. |
| `seed-photos.ts` | 30-50 | Photo reference records (using placeholder URLs or Unsplash construction images). Categories: progress (15), before/after (10), issue (5), inspection (5), material (5). Tied to projects. With descriptions, dates, tagged team members. |
| `seed-job-costing.ts` | 20-30 | Job costing data for 5-8 projects. Cost codes, budget allocations, actual costs (from seeded expenses + time entries). Creates realistic budget vs actual comparisons. |
| `verify-platform.ts` | 0 | Verification script — queries all seeded collections and outputs completeness report. Validates data relationships (invoices→payments, projects→clients, time→timesheets). |

**Acceptance Criteria:**
- [ ] Client portal accessible with demo client user
- [ ] Client portal shows project progress, invoices, timeline, messages
- [ ] Sub portal accessible with demo sub user
- [ ] Sub portal shows assigned projects, bids, schedule
- [ ] Field portal shows tasks, schedule, photos for field user
- [ ] Photos page shows images across projects
- [ ] Job costing shows budget vs actual on project finances
- [ ] Business health score reflects realistic data (75-85/100)
- [ ] All dashboard KPIs show realistic values (not $0 or -100%)
- [ ] `verify-platform.ts` reports 100% data completeness
- [ ] `npx tsc --noEmit` passes
- [ ] Full browser smoke test passes (all pages load with data)

**Seed Scripts to Create:** 3 new + 1 verification script
**Parallel Plan:** Portal users (Agent 1) + Photos + Job Costing (Agent 2) + Verification (Agent 3)

---

### Phase 13 Summary

| Sprint | Focus | Scripts | Records | Hours |
|--------|-------|---------|---------|-------|
| **91** | Bug Fixes + Financial Foundation | 3 new | ~65 | 10-14 |
| **92** | Project Detail Hydration | 5 new + 2 update | ~250 | 10-14 |
| **93** | Schedule, Time & Timesheets | 3 new | ~290 | 8-10 |
| **94** | Subs, Leads & Sales | 4 new + 1 update | ~55 | 8-10 |
| **95** | Communication & Notifications | 3 new | ~100 | 6-8 |
| **96** | Compliance, Safety, RFIs, Submittals | 5 new | ~75 | 8-10 |
| **97** | Equipment, Expenses & Materials | 2 new + 1 update | ~80 | 6-8 |
| **98** | Portal Users, Photos & Verification | 3 new + 1 verify | ~65 | 8-10 |
| **TOTAL** | | **28 new + 4 updates + 1 verify** | **~980** | **65-84** |

### Phase 13 Dependency Graph

```
Sprint 91 (Financial Foundation) ───┬──> Sprint 92 (Project Detail)
                                    ├──> Sprint 93 (Schedule & Time) ──┐
                                    ├──> Sprint 94 (Subs & Leads)      │
                                    ├──> Sprint 95 (Communication)     ├──> Sprint 98 (Portals & Verify)
                                    └──> Sprint 97 (Equipment & $$$)   │
                                                                       │
                        Sprint 92 ──────> Sprint 96 (Compliance) ──────┘
```

**Parallelization:** Sprints 93+94+95+97 can run in parallel after Sprint 91. Sprint 96 needs Sprint 92. Sprint 98 is the final verification after all others.

### Key Metric Targets (Post Phase 13)

| Metric | Before | After | Source |
|--------|--------|-------|--------|
| Revenue YTD | $0 | $450K-600K | Sprint 91 (invoices + payments) |
| Outstanding AR | $0 | $40K-80K | Sprint 91 (unpaid invoices) |
| Pipeline Value | $0 | $200K-400K | Sprint 91 (estimates) |
| Profit Margin | -100% | 15-25% | Sprint 91 (revenue - expenses) |
| Subcontractors | 1 | 10-12 | Sprint 94 |
| Weekly Hours Logged | 0 | 200-240 | Sprint 93 |
| Monthly Expenses | $2.5K | $30K-60K | Sprint 97 |
| Schedule Events | 0 | 40-50 | Sprint 93 |
| Data Completeness | ~70% | 100% | Sprint 98 (verification) |
| Business Health Score | 65/100 | 75-85/100 | All sprints combined |

---

## Phase 14: Deployment & Execution (Sprints 96-99)

> **Goal:** Get ContractorOS running in production with real data. Everything built in Phases 1-13 is local — this phase deploys it, seeds it, and verifies it end-to-end.

### Sprint 96: Firebase Deployment & Seed Execution
**Priority:** P0 - CRITICAL | **Hours:** 4-6 | **Depends on:** Sprint 95
**Focus:** Deploy all pending Firestore indexes/rules, Cloud Functions, and execute all 50 seed scripts against the live database.

**Subagent Plan (parallel):**
| Agent | Type | Task | Files |
|-------|------|------|-------|
| Agent 1 | Bash | Deploy Firestore rules + indexes | `firestore.rules`, `firestore.indexes.json` |
| Agent 2 | Bash | Deploy Cloud Functions | `functions/src/` |
| Agent 3 | Bash (background) | Run `run-all-seeds.ts` orchestrator (50 scripts) | `scripts/seed-demo/` |
| Main session | Manual | Add GCP secrets (GOOGLE_BUSINESS_CLIENT_ID, GOOGLE_BUSINESS_CLIENT_SECRET, FRED_API_KEY) | GCP Console |

**Acceptance Criteria:**
- [ ] All Firestore indexes show "Enabled" in Firebase Console
- [ ] All Cloud Functions deployed (review, job-costing, AP, email)
- [ ] Seed data visible in Firebase Console `contractoros` database
- [ ] `npx tsc --noEmit` passes

---

### Sprint 97: Docker Build, Cloud Run Deploy & Smoke Test
**Priority:** P0 - CRITICAL | **Hours:** 6-8 | **Depends on:** Sprint 96
**Focus:** Build production Docker image, deploy to Cloud Run, verify basic functionality.

**Subagent Plan:**
| Agent | Type | Task | Files |
|-------|------|------|-------|
| Agent 1 | Bash | Docker build + local verification | `Dockerfile`, `docker-build-local.sh` |
| Agent 2 | Bash | Cloud Build trigger + Cloud Run deploy | `cloudbuild.yaml` |
| Agent 3 | Explore | Review deploy config for correctness | `cloudbuild.yaml`, `Dockerfile`, Cloud Run settings |
| Main session | Chrome MCP | Production URL smoke test — login, dashboard, data check | Browser |

**Acceptance Criteria:**
- [ ] Docker image builds successfully
- [ ] Container runs locally on port 3000/8080
- [ ] Cloud Run revision deployed and serving traffic
- [ ] Login works at production URL
- [ ] Dashboard loads with seeded data visible
- [ ] No JavaScript errors in browser console

---

### Sprint 98: E2E Regression in Browser
**Priority:** P1 - HIGH | **Hours:** 8-12 | **Depends on:** Sprint 97
**Focus:** Run full E2E test suites against running app, fix critical/high issues found.

**Subagent Plan:**
| Agent | Type | Task | Files |
|-------|------|------|-------|
| Main session | Chrome MCP | Execute `e2e/suites/00-smoke.md` (all pages load) | `apps/web/e2e/suites/` |
| Main session | Chrome MCP | Execute `e2e/suites/22-ui-ux-mobile.md` at 375x812 | `apps/web/e2e/suites/` |
| Agent 1 | general-purpose | Fix critical/high bugs found during E2E | Various |
| Agent 2 | general-purpose | Fix medium bugs found during E2E | Various |

**Acceptance Criteria:**
- [ ] Smoke test: 100% pass (all pages load without errors)
- [ ] Mobile test: 95%+ pass at 375x812
- [ ] All critical bugs found during E2E fixed
- [ ] Results documented in `e2e/results/sprint-98-regression.md`

---

### Sprint 99: Data Verification & Portal Testing
**Priority:** P1 - HIGH | **Hours:** 6-8 | **Depends on:** Sprint 98
**Focus:** Walk all 4 portals in browser, verify data integrity, fix empty states.

**Subagent Plan:**
| Agent | Type | Task | Files |
|-------|------|------|-------|
| Main session | Chrome MCP | Walk Dashboard, Client, Sub, Field portals — verify data | Browser |
| Agent 1 | general-purpose | Fix data relationship issues (orphaned records, missing refs) | Seeds + hooks |
| Agent 2 | Bash | Create `verify-platform.ts` — queries all collections, reports completeness | `scripts/seed-demo/` |
| Agent 3 | general-purpose | Fix empty-state pages that should show data | Page files |

**Acceptance Criteria:**
- [ ] All 4 portals show realistic data
- [ ] `verify-platform.ts` reports 95%+ data completeness
- [ ] No empty-state pages for features that have seed data
- [ ] Financial KPIs show realistic values ($450K+ revenue, 15-25% margins)
- [ ] Intelligence dashboards populated with real metrics

---

## Phase 15: Production Hardening (Sprints 100-102)

> **Goal:** Code quality, test coverage, and error resilience before opening to users. All 3 sprints can run in **parallel** after Sprint 99.

### Sprint 100: ESLint Warning Cleanup Phase 2
**Priority:** P2 - MEDIUM | **Hours:** 6-8 | **Depends on:** Sprint 99
**Target:** 1,050 warnings → <400 warnings
**Focus:** Clean up unused imports/vars, convert img→next/image, fix hook deps.

**Subagent Plan (4 agents, no file overlap):**
| Agent | Type | Warnings Targeted | File Scope |
|-------|------|-------------------|------------|
| Agent 1 | general-purpose | `no-unused-vars` (~350) | `components/**` |
| Agent 2 | general-purpose | `no-unused-vars` (~350) | `app/**`, `lib/**` |
| Agent 3 | general-purpose | `no-img-element` (40) | All `<img>` tags → `next/image` |
| Agent 4 | general-purpose | `exhaustive-deps` (54) | All hooks with missing deps |

**Acceptance Criteria:**
- [ ] ESLint warnings <400
- [ ] `npx tsc --noEmit` passes
- [ ] All 1,502+ tests still pass
- [ ] No visual regressions from import cleanup

---

### Sprint 101: Unit Test Coverage Phase 4
**Priority:** P2 - MEDIUM | **Hours:** 8-10 | **Depends on:** Sprint 99
**Target:** 1,502 → 1,800+ tests
**Focus:** Cover remaining high-value hooks and utility functions.

**Subagent Plan (4 agents, each creates separate test files):**
| Agent | Type | Hooks to Test | Est. Tests |
|-------|------|---------------|------------|
| Agent 1 | general-purpose | `useInvoices`, `useEstimates`, `useDocuments` | ~75 |
| Agent 2 | general-purpose | `useTimesheets`, `useTimeEntries`, `useAvailability` | ~60 |
| Agent 3 | general-purpose | `useProjects`, `useClients` | ~50 |
| Agent 4 | general-purpose | Utils: `formatCurrency`, `formatDate`, `formatPhoneNumber`, form validators | ~60 |

**New test files:**
- `__tests__/lib/hooks/useInvoices.test.ts`
- `__tests__/lib/hooks/useEstimates.test.ts`
- `__tests__/lib/hooks/useDocuments.test.ts`
- `__tests__/lib/hooks/useTimesheets.test.ts`
- `__tests__/lib/hooks/useTimeEntries.test.ts`
- `__tests__/lib/hooks/useAvailability.test.ts`
- `__tests__/lib/hooks/useProjects.test.ts`
- `__tests__/lib/hooks/useClients.test.ts`
- `__tests__/lib/utils/formatters.test.ts`
- `__tests__/lib/utils/form-validators.test.ts`

**Acceptance Criteria:**
- [ ] 1,800+ tests total
- [ ] All tests passing (no OOM regressions)
- [ ] Newly tested hooks have >80% branch coverage

---

### Sprint 102: Error Handling & Edge Cases
**Priority:** P2 - MEDIUM | **Hours:** 6-8 | **Depends on:** Sprint 99
**Focus:** Add error boundaries, fix silent catch blocks, add skeleton screens.

**Subagent Plan (4 agents, no file overlap):**
| Agent | Type | Task | Files |
|-------|------|------|-------|
| Agent 1 | general-purpose | Add error boundaries to all portal root layouts | `dashboard/layout.tsx`, `client/layout.tsx`, `sub/layout.tsx`, `field/layout.tsx` |
| Agent 2 | general-purpose | Audit all catch blocks — no silent swallows, add toast errors | `lib/hooks/*.ts` |
| Agent 3 | general-purpose | Add skeleton loading to 10 highest-traffic pages | Dashboard, Projects, Clients, Invoices, Expenses, Schedule, Team, Messages, Reports, Settings pages |
| Agent 4 | general-purpose | Fix stale data — ensure hooks unsubscribe on unmount, no memory leaks | `lib/hooks/*.ts` (different hooks than Agent 2) |

**Acceptance Criteria:**
- [ ] Error boundaries on all 4 portal layouts
- [ ] No silent catch blocks (all errors surfaced to user)
- [ ] 10 pages have skeleton loading instead of spinners
- [ ] No `useEffect` cleanup warnings in React strict mode
- [ ] `npx tsc --noEmit` passes

---

## Phase 16: Growth Features (Sprints 103-105)

> **Goal:** Customer-facing polish and sales readiness. All 3 sprints can run in **parallel** after Phase 15.

### Sprint 103: Client Portal Enhancement
**Priority:** P2 - MEDIUM | **Hours:** 8-10 | **Depends on:** Sprint 102
**Focus:** Make the client portal demo-worthy with project progress, invoice viewing, and documents.

**Subagent Plan:**
| Agent | Type | Task | Files |
|-------|------|------|-------|
| Agent 1 | general-purpose | Build project progress tracker (phase timeline, % complete, photo carousel) | `components/client-portal/ProjectProgress.tsx` |
| Agent 2 | general-purpose | Build invoice viewer (view invoices, payment status, pay button stub) | `components/client-portal/InvoiceViewer.tsx` |
| Agent 3 | general-purpose | Build document viewer (contracts, drawings, permits — read-only) | `components/client-portal/DocumentViewer.tsx` |
| Main session | Wiring | Integrate components into `client/[token]/` pages | `app/client/[token]/*.tsx` |

**Acceptance Criteria:**
- [ ] Client portal shows project timeline with phase progress
- [ ] Client portal shows invoice list with payment statuses
- [ ] Client portal shows project documents (read-only)
- [ ] Demo client user sees realistic data

---

### Sprint 104: Reporting & Export Polish
**Priority:** P2 - MEDIUM | **Hours:** 8-10 | **Depends on:** Sprint 102
**Focus:** PDF and CSV/Excel export for reports, pre-built report templates.

**Subagent Plan:**
| Agent | Type | Task | Files |
|-------|------|------|-------|
| Agent 1 | general-purpose | PDF export for financial reports (P&L, AR aging, project summary) | `lib/reports/exportPDF.ts`, `components/reports/ReportPDF.tsx` |
| Agent 2 | general-purpose | CSV/Excel export for data tables (expenses, time, invoices) | `lib/reports/exportCSV.ts` |
| Agent 3 | general-purpose | Report template selector (5 templates: Monthly P&L, Project Summary, AR Aging, Payroll Summary, Expense Report) | `components/reports/ReportTemplateSelector.tsx` |
| Main session | Wiring | Integrate exports into report pages, add download buttons | `app/dashboard/reports/*.tsx` |

**Acceptance Criteria:**
- [ ] PDF export works for 3 report types
- [ ] CSV export works for 3 data table types
- [ ] 5 pre-built report templates selectable
- [ ] Download buttons visible on all report pages

---

### Sprint 105: Demo Mode & Sales Readiness
**Priority:** P1 - HIGH | **Hours:** 8-10 | **Depends on:** Sprint 102
**Focus:** Enable sales demos with toggleable demo mode, multiple demo orgs, and guided walkthrough.

**Subagent Plan:**
| Agent | Type | Task | Files |
|-------|------|------|-------|
| Agent 1 | general-purpose | Build demo mode toggle (purple banner, "Demo Mode" indicator, optional read-only) | `components/demo/DemoModeBanner.tsx`, `lib/contexts/DemoContext.tsx` |
| Agent 2 | general-purpose | Build demo org switcher (switch between 2 demo orgs for multi-tenant demo) | `components/demo/DemoOrgSwitcher.tsx` |
| Agent 3 | general-purpose | Create second demo org seed script | `scripts/seed-demo/seed-second-org.ts` |
| Main session | Docs | Write demo walkthrough script (`docs/DEMO_SCRIPT.md` — 15-min guided tour) | `docs/DEMO_SCRIPT.md` |

**Acceptance Criteria:**
- [ ] Demo mode toggle activates purple banner
- [ ] 2 demo orgs switchable during demo
- [ ] Demo walkthrough script covers all major features (15 min)
- [ ] Demo mode doesn't affect production users

---

## Phases 14-16 Summary

| Sprint | Phase | Focus | Agents | Hours |
|--------|-------|-------|--------|-------|
| **96** | 14 - Deploy | Firebase deploy + seed execution | 3 Bash + Main | 4-6 |
| **97** | 14 - Deploy | Docker + Cloud Run production deploy | 3 + Main | 6-8 |
| **98** | 14 - Verify | E2E regression in browser | 2 + Chrome MCP | 8-12 |
| **99** | 14 - Verify | Data verification + portal testing | 3 + Chrome MCP | 6-8 |
| **100** | 15 - Harden | ESLint cleanup (1050→<400) | 4 parallel | 6-8 |
| **101** | 15 - Harden | Unit tests (1502→1800+) | 4 parallel | 8-10 |
| **102** | 15 - Harden | Error handling + edge cases | 4 parallel | 6-8 |
| **103** | 16 - Growth | Client portal enhancement | 3 + Main | 8-10 |
| **104** | 16 - Growth | Report export (PDF/CSV) | 3 + Main | 8-10 |
| **105** | 16 - Growth | Demo mode + sales readiness | 3 + Main | 8-10 |
| **TOTAL** | | | | **69-90** |

### Phases 14-16 Dependency Graph

```
Sprint 96 (Deploy Firebase) ──> Sprint 97 (Cloud Run) ──> Sprint 98 (E2E) ──> Sprint 99 (Verify)
                                                                                       │
                                     ┌─────────────────────┬──────────────────────────┘
                                     ↓                     ↓                     ↓
                              Sprint 100 (ESLint)    Sprint 101 (Tests)    Sprint 102 (Errors)
                                     │                     │                     │
                                     └─────────────────────┴─────────────────────┘
                                                           │
                                     ┌─────────────────────┼─────────────────────┐
                                     ↓                     ↓                     ↓
                              Sprint 103 (Client)    Sprint 104 (Reports)   Sprint 105 (Demo)
```

**Parallelization opportunities:**
- **Phase 14:** Sequential (each depends on the prior)
- **Phase 15:** Sprints 100+101+102 run in **parallel** after Sprint 99
- **Phase 16:** Sprints 103+104+105 run in **parallel** after Phase 15
- **Within each sprint:** 3-4 subagents run in parallel on non-overlapping files

### Key Metric Targets (Post Phase 16)

| Metric | Current (Sprint 95) | Target (Sprint 105) |
|--------|---------------------|---------------------|
| Production Deploy | Not deployed | Running on Cloud Run |
| Data Completeness | Scripts written, not executed | 95%+ verified in browser |
| ESLint Warnings | 1,050 | <400 |
| Unit Tests | 1,502 | 1,800+ |
| E2E Pass Rate | Not run | Smoke 100%, Mobile 95%+ |
| Error Boundaries | Partial | All 4 portal layouts |
| Report Exports | None | PDF + CSV for 5 types |
| Demo Mode | None | Toggle + 2 orgs + script |
| Client Portal | Basic | Progress + Invoices + Docs |

---

## PHASE 17: DEVELOPMENT BUILD PHASE (Sprints 106-120)

> **Sprints 97-105 DEFERRED** — Building features first, testing comes after.
> Phase 17 focuses on feature completeness, production-readiness, and client experience.

### Sprint 106: Estimates Hook & Estimate-to-Invoice Pipeline ✅ COMPLETE

**Priority:** P0 | **Hours:** 8-10 | **Completed:** 2026-02-06

- Created `lib/hooks/useEstimates.ts` — full CRUD hook (useEstimates, useEstimate, useEstimateStats)
- Standalone functions: createEstimate, calculateEstimateTotals, convertEstimateToInvoice, reviseEstimate
- Wired hook into estimates/page.tsx, estimates/[id]/page.tsx, estimates/new/page.tsx
- Added: Duplicate, Delete, Convert to Invoice, Create Revision, Mark as Sent/Accepted/Declined

### Sprint 107: Invoice PDF & Email Delivery

**Priority:** P0 | **Hours:** 6-8

- Wire InvoicePdf template into useInvoices hook
- "Download PDF" + "Send Invoice" (email with PDF attachment via Cloud Function)
- Invoice email template with "Pay Now" button
- Recurring invoice support (schedule, auto-generate drafts)
- **Files:** useInvoices.ts, invoices/page.tsx, pdf-service.ts, functions/src/email/

### Sprint 108: Client Portal — Full Experience Build

**Priority:** P0 | **Hours:** 10-14

- Two-way messaging (clients can reply)
- Selection approval with budget display
- Document library expansion (contracts, permits, warranties)
- Photo gallery with before/after comparison
- Payment integration ("Pay Now" via Stripe)
- Notification preferences for clients

### Sprint 109: QuickBooks Online — OAuth & Account Mapping

**Priority:** P1 | **Hours:** 10-14

- Real QBO OAuth2 connection
- Account mapping UI (ContractorOS categories → QBO accounts)
- Customer sync (bidirectional client ↔ QBO customer)
- Chart of accounts pull, class/project mapping
- Connection status dashboard

### Sprint 110: QuickBooks Online — Invoice & Expense Sync

**Priority:** P1 | **Hours:** 8-10

- Push invoices to QBO on create/send
- Pull payment updates from QBO
- Expense sync with mapped accounts
- QBO webhook support (real-time sync)
- Sync conflict resolution + history UI

### Sprint 111: Field Portal Hardening

**Priority:** P1 | **Hours:** 8-10

- Issue reporting flow (severity, photo, location)
- Safety incident reporting (OSHA-style form)
- Material request from field → office notification
- Equipment checkout/return
- Schedule + voice logs polish for mobile

### Sprint 112: Advanced Reporting — Financial Statements & Exports

**Priority:** P1 | **Hours:** 10-12

- P&L Statement, Balance Sheet, Cash Flow Statement
- Custom date ranges for all reports
- PDF export with company branding (logo, colors)
- Excel export (multi-sheet workbooks)
- Report templates library (5-8 pre-built)

### Sprint 113: Console Cleanup & Structured Logging

**Priority:** P2 | **Hours:** 6-8

- Create `lib/utils/logger.ts` (dev vs prod, levels, context)
- Replace 1,041 console statements → structured logging or remove
- Sentry-ready error reporting interface
- Target: <100 console statements remaining
- **Parallel:** 4 sub-agents by directory

### Sprint 114: Payroll & Team Management Polish

**Priority:** P1 | **Hours:** 8-10

- Overtime auto-detect (>40 hrs/week, >8 hrs/day)
- PTO/time-off accrual tracking
- Team certifications with expiry alerts
- Timesheet approval workflow (manager → approve → payroll)
- Employee onboarding/offboarding checklists

### Sprint 115: Messaging & Communication Overhaul

**Priority:** P2 | **Hours:** 8-10

- Unified inbox (internal, client, sub in one view)
- Read receipts + file/image attachments
- Message templates (meeting reminder, payment due, etc.)
- Scheduled messages + SMS broadcast
- Email integration in message thread context

### Sprint 116: Subcontractor Portal & Workflow Enhancement

**Priority:** P2 | **Hours:** 8-10

- Bid response with line items in portal
- Invoice submission from sub portal
- Compliance tracking (insurance, license, W-9 upload)
- Performance dashboard for subs
- Schedule visibility + document sharing

### Sprint 117: Error Handling, Boundaries & Loading States

**Priority:** P2 | **Hours:** 6-8

- SectionErrorBoundary on all dashboard widget sections
- Audit catch blocks (no silent swallows, add toast errors)
- Skeleton loading on 10 highest-traffic pages
- Retry logic for failed Firestore operations
- Graceful offline degradation

### Sprint 118: Project Detail Page Polish

**Priority:** P1 | **Hours:** 8-10

- Activity feed on project (tasks, photos, messages, changes)
- Project health score (budget + schedule + quality)
- Quick actions bar (Add Task, Log Time, Upload Photo, Create Invoice)
- Gantt chart: dependencies, critical path, drag-to-reschedule
- Project summary PDF export

### Sprint 119: Dashboard & Navigation Refresh

**Priority:** P2 | **Hours:** 6-8

- Configurable widget grid (users choose KPIs)
- Smart quick actions based on role
- Recent activity stream (org-wide)
- Sidebar: collapsible sections, favorites, notification badges
- Global search + keyboard shortcuts

### Sprint 120: Refactoring & Tech Debt Cleanup

**Priority:** P2 | **Hours:** 8-10 | **RUN LAST**

- TODO/FIXME cleanup (17 files → 0)
- Dead code removal (unused imports, functions, components)
- Hook consistency (all return `{items, loading, error}`)
- Type safety (fix `any` types, strict TypeScript)
- Form validation (react-hook-form + Zod everywhere)
- ESLint warnings: 1,050 → <400

### Phase 17 Dependency Graph

```
Sprint 106 (Estimates) ──> Sprint 107 (Invoice PDF) ──> Sprint 108 (Client Portal)

Sprint 109 (QBO OAuth) ──> Sprint 110 (QBO Sync)

Sprints 111-119: Independent (any order)
Sprint 120: LAST (cleanup after all building)
```

### Key Metric Targets (Post Phase 17)

| Metric | Current (Sprint 106) | Target (Sprint 120) |
|--------|---------------------|---------------------|
| Estimate hook | ✅ Full CRUD + conversion | ✅ Done |
| Invoice PDF | Not wired | Generate + email + download |
| Client portal | 6 basic pages | 8+ with payments + replies |
| QBO integration | Placeholder OAuth | Real bidirectional sync |
| Field portal | 5 core pages | 8+ with safety, issues, materials |
| Financial statements | None | P&L, Balance Sheet, Cash Flow |
| Console statements | 1,041 | <100 |
| ESLint warnings | 1,050 | <400 |
| TODO/FIXME files | 17 | 0 |
| Error boundaries | 5 portal-level | 30+ section-level |

---

## PHASE 18: PRODUCTION HARDENING & TEST COVERAGE (Sprints 121-124)

> **Target Market:** Residential GCs (home builders, remodelers, custom homes)
> **Balance:** 50% New Features / 50% Hardening & Optimization
> **Strategic Priorities:** Native Mobile, Integrations, AI/Automation
> **Goal:** Make the platform bulletproof before adding major new capabilities. Covers deferred work from Sprints 98-105 plus new hardening.

### Sprint 121: E2E Regression & Smoke Testing
**Priority:** P0 | **Hours:** 8-12

Run full E2E test suites against the live app via Chrome MCP. Fix all critical/high bugs found.

- Execute `e2e/suites/00-smoke.md` (all pages load)
- Execute `e2e/suites/22-ui-ux-mobile.md` at 375x812
- Execute `e2e/suites/02-rbac.md` (auth/permissions)
- Fix all critical + high bugs discovered
- Document results in `e2e/results/sprint-121-regression.md`

**Acceptance:** Smoke 100%, Mobile 95%+, RBAC 100%, all critical bugs fixed

---

### Sprint 122: ESLint Cleanup & Console Cleanup Mega-Sprint
**Priority:** P1 | **Hours:** 10-14

Combine ESLint warning cleanup (1,050 → <300) and console statement cleanup (1,041 → <50).

**Subagent Plan (4 agents, no file overlap):**
| Agent | Type | Task | Files |
|-------|------|------|-------|
| Agent 1 | general-purpose | `no-unused-vars` cleanup | `components/**` (~350 warnings) |
| Agent 2 | general-purpose | `no-unused-vars` cleanup | `app/**`, `lib/**` (~350 warnings) |
| Agent 3 | general-purpose | `no-img-element` (40) + `exhaustive-deps` (54) | All files |
| Agent 4 | general-purpose | Create `lib/utils/logger.ts`, replace 1,041 console.* calls | All files |

**Acceptance:** ESLint warnings <300, console statements <50, `npx tsc --noEmit` passes, all tests pass

---

### Sprint 123: Unit Test Coverage Push (1,502 → 2,000+)
**Priority:** P1 | **Hours:** 10-14

Cover remaining high-value hooks, utilities, and new code from Sprints 106-120.

**Subagent Plan (5 agents, separate test files):**
| Agent | Type | Hooks to Test | Est. Tests |
|-------|------|---------------|------------|
| Agent 1 | general-purpose | `useInvoices`, `useEstimates`, `useRecurringInvoices` | ~80 |
| Agent 2 | general-purpose | `useTimesheets`, `useTimeEntries`, `useAvailability` | ~60 |
| Agent 3 | general-purpose | `useProjects`, `useClients`, `useDocuments` | ~60 |
| Agent 4 | general-purpose | Formatters, validators, QBO sync utils, logger | ~100 |
| Agent 5 | general-purpose | `useAccountingConnection`, `useEstimateStats`, `useCompanyStats` | ~50 |

**Acceptance:** 2,000+ total tests, all passing, no OOM regressions

---

### Sprint 124: Error Handling, Boundaries & Loading States
**Priority:** P1 | **Hours:** 8-10

Comprehensive error resilience across all portals.

- SectionErrorBoundary on all dashboard widget sections (30+ sections)
- Audit all catch blocks in `lib/hooks/*.ts` — no silent swallows, add toast errors
- Skeleton loading screens on 15 highest-traffic pages
- Retry logic for failed Firestore operations (exponential backoff wrapper)
- Graceful offline degradation (show cached data + "offline" banner)
- `useEffect` cleanup audit — no memory leaks in React strict mode

**Acceptance:** Error boundaries on all portal layouts + 30 sections, skeleton loading on 15 pages, no silent catch blocks

---

## PHASE 19: INTEGRATIONS & ECOSYSTEM (Sprints 125-128)

> **Goal:** Expand the integration ecosystem. Residential GCs need accounting, payments, calendars, and leads flowing between tools.

### Sprint 125: Stripe Connect — Online Payments for Clients
**Priority:** P0 | **Hours:** 10-14

Enable real client payments. GCs connect their Stripe account, clients pay invoices online.

- Stripe Connect onboarding flow (Express accounts for GCs)
- "Pay Now" button on client portal invoices (Stripe Checkout)
- Payment confirmation webhook → mark invoice as paid
- Partial payment support (pay custom amount)
- Payment receipt email to client
- Payout dashboard for GC (Stripe balance, upcoming payouts)
- **Files:** `lib/integrations/stripe/`, `app/api/payments/`, `app/pay/[token]/page.tsx` (enhance existing)

**Acceptance:** End-to-end: GC sends invoice → client clicks Pay Now → Stripe Checkout → invoice marked paid → GC sees payout

---

### Sprint 126: Google Calendar & Apple Calendar Sync
**Priority:** P1 | **Hours:** 8-10

Sync ContractorOS schedule events to Google Calendar and generate .ics files for Apple Calendar.

- Google Calendar OAuth + Calendar API write access
- Push schedule events → Google Calendar (create/update/delete)
- Pull Google Calendar events → ContractorOS (optional, read-only)
- .ics file generation for Apple Calendar (download per event + full calendar export)
- Two-way sync toggle in settings
- Sync status indicator on schedule page
- **Files:** `lib/integrations/google-calendar/`, `app/api/integrations/calendar/`, `lib/utils/ics-generator.ts`

**Acceptance:** Events created in ContractorOS appear in Google Calendar within 30s, .ics download works

---

### Sprint 127: Xero Accounting Integration
**Priority:** P2 | **Hours:** 10-14

Second accounting platform. Many residential GCs outside the US use Xero.

- Xero OAuth 2.0 connection flow
- Contact sync (Clients ↔ Xero Contacts)
- Invoice sync (push to Xero on send, pull payment status)
- Expense sync (push approved expenses to Xero)
- Account mapping UI (reuse QBO pattern — adapt `QBOAccountMapping.tsx`)
- Sync status dashboard (reuse `QBOSyncStatus.tsx` pattern)
- **Files:** `lib/integrations/xero/`, `app/api/integrations/xero/`, `components/settings/XeroAccountMapping.tsx`

**Acceptance:** Xero connection, invoice sync, expense sync all working. Account mapping UI functional.

---

### Sprint 128: Zapier / Make.com Webhook Integration
**Priority:** P2 | **Hours:** 6-8

Enable ContractorOS to connect to 5,000+ apps via Zapier/Make.com webhooks.

- Outbound webhooks: Fire events on key actions (invoice sent, payment received, project created, task completed, estimate accepted)
- Webhook configuration UI (URL, events, secret key, test button)
- Webhook delivery log (success/failure, retry on failure)
- Inbound webhook endpoint for triggers (create task, add note, update status)
- API key management for inbound auth
- **Files:** `lib/webhooks/`, `app/api/webhooks/`, `app/dashboard/settings/integrations/webhooks/page.tsx`

**Acceptance:** Outbound webhooks fire on 5 key events, inbound endpoint creates tasks, delivery log shows history

---

## PHASE 20: AI & INTELLIGENCE (Sprints 129-132)

> **Goal:** Differentiate from competitors with AI capabilities no one else has. Residential GCs get smart automation.

### Sprint 129: AI Estimate Builder
**Priority:** P0 | **Hours:** 10-14

Use AI to generate estimates from project descriptions. The killer feature for residential GCs.

- "Generate Estimate with AI" button on new estimate page
- Input: project description (free text), square footage, project type, location
- AI generates line items with quantities, unit prices, labor hours
- Uses material price data (FRED/BLS integration already exists) for current pricing
- Regional cost adjustment based on ZIP code
- User reviews, edits, accepts/rejects each line item
- Save as draft estimate with all AI-generated items
- **Files:** `app/api/ai/generate-estimate/route.ts`, `components/estimates/AIEstimateBuilder.tsx`, `lib/ai/estimate-generator.ts`

**Acceptance:** User enters "2,500 sq ft kitchen remodel in Portland, OR" → AI generates 20-40 line items with realistic prices → user edits and saves

---

### Sprint 130: AI Schedule Optimizer
**Priority:** P1 | **Hours:** 8-10

Smart scheduling that considers weather, crew availability, task dependencies, and trade sequencing.

- "Optimize Schedule" button on schedule page
- Analyze: current tasks, dependencies, crew availability, weather forecast
- Suggest: optimal task ordering, crew assignments, weather-adjusted dates
- Conflict detection: overlapping crew, missing dependencies, weather risks
- One-click apply suggestions or manual review
- Weather integration with real API (replace mock data in WeatherWidget)
- **Files:** `app/api/ai/optimize-schedule/route.ts`, `components/schedule/ScheduleOptimizer.tsx`, `lib/ai/schedule-optimizer.ts`

**Acceptance:** Optimizer suggests reordering based on weather + dependencies, user can apply with one click

---

### Sprint 131: Smart Notifications & Auto-Categorization
**Priority:** P1 | **Hours:** 6-8

AI-powered notification intelligence and expense auto-categorization.

- Smart notification digest: AI summarizes daily activity into 3-5 key takeaways
- Priority scoring: AI ranks notifications by urgency and business impact
- Expense auto-categorization: Receipt OCR (exists) → AI assigns category, project, vendor
- Invoice payment prediction: Based on client payment history
- Anomaly alerts: Flag unusual expenses, late payments, budget overruns
- **Files:** `lib/ai/notification-digest.ts`, `lib/ai/expense-categorizer.ts`, `lib/ai/payment-predictor.ts`

**Acceptance:** Daily digest summarizes activity, expenses auto-categorize from receipts, anomaly alerts fire

---

### Sprint 132: AI Assistant Chat Enhancement
**Priority:** P2 | **Hours:** 8-10

Enhance existing AI assistant with contextual project knowledge and action capabilities.

- Context-aware: AI knows current project, recent activity, financial status
- Actionable: "Create a task for electrician rough-in next Tuesday" → creates task
- Queryable: "What's the margin on the Johnson kitchen project?" → pulls real data
- Document generation: "Draft a change order for the added bathroom" → generates CO
- Natural language search: "Show me all overdue invoices over $5,000" → filters and displays
- Voice input support (integrate with existing voice log infrastructure)
- **Files:** `lib/ai/assistant-context.ts`, `app/api/ai/assistant/route.ts`, `components/ai/AIAssistantPanel.tsx` (enhance)

**Acceptance:** AI assistant answers project questions, creates tasks, generates documents from natural language

---

## PHASE 21: NATIVE MOBILE FOUNDATION (Sprints 133-136)

> **Goal:** Begin the React Native mobile app. Highest-value screens for field workers and GCs on the go.

### Sprint 133: React Native Project Setup & Shared Types
**Priority:** P0 | **Hours:** 10-14

Bootstrap the React Native project with shared code architecture.

- Initialize React Native project with Expo (managed workflow)
- Shared TypeScript types package (`packages/shared/types/`)
- Firebase React Native SDK setup (Auth, Firestore)
- Navigation structure (React Navigation): Dashboard, Projects, Schedule, Time, Messages, More
- Authentication flow: Login, session persistence, biometric unlock
- Theme system matching web (brand colors, Outfit font, design tokens)
- **Files:** `apps/mobile/` (new), `packages/shared/` (new)

**Acceptance:** App runs on iOS simulator, Firebase auth works, navigates between 6 main screens (empty shells)

---

### Sprint 134: Mobile — Dashboard & Projects
**Priority:** P0 | **Hours:** 10-14

Build the two most-used screens with native components.

- Dashboard: KPI cards (revenue, active projects, outstanding AR, tasks due), quick actions, recent activity
- Projects list: Search, filter by status, project cards with photo/progress/budget
- Project detail: Tabbed view (Overview, Tasks, Photos, Finances, Documents)
- Pull-to-refresh on all lists
- Offline data caching with AsyncStorage / WatermelonDB
- Push notification setup (Firebase Cloud Messaging)
- **Files:** `apps/mobile/screens/Dashboard.tsx`, `apps/mobile/screens/Projects.tsx`, `apps/mobile/screens/ProjectDetail.tsx`

**Acceptance:** Dashboard shows live KPI data, project list loads with search/filter, project detail shows 5 tabs

---

### Sprint 135: Mobile — Time Tracking & Schedule
**Priority:** P0 | **Hours:** 8-10

Field workers' most critical screens.

- Time clock: Large clock-in/out button, GPS location capture, project selector
- Active timer display with elapsed time
- Today's schedule: List view of events with project, location, crew
- Quick task completion (swipe to complete from schedule)
- Photo capture for daily log (native camera integration)
- Offline time entries (queue and sync when connected)
- **Files:** `apps/mobile/screens/TimeClock.tsx`, `apps/mobile/screens/Schedule.tsx`, `apps/mobile/screens/DailyLog.tsx`

**Acceptance:** Clock in/out works with GPS, timer persists across app backgrounding, schedule shows today's events

---

### Sprint 136: Mobile — Messages, Notifications & App Store Prep
**Priority:** P1 | **Hours:** 10-14

Complete core mobile experience and prepare for TestFlight/App Store.

- Messages: Channel list, message thread, reply/compose
- Push notifications: Receive and tap to navigate to relevant screen
- Notification center: In-app notification list with read/unread
- Settings: Profile, notification preferences, biometric toggle
- App icons, splash screen, app store screenshots
- TestFlight build for iOS beta testing
- Android APK build for internal testing
- **Files:** `apps/mobile/screens/Messages.tsx`, `apps/mobile/screens/Notifications.tsx`, `apps/mobile/screens/Settings.tsx`

**Acceptance:** Full app flow on iOS + Android, push notifications received, TestFlight build uploaded

---

## PHASE 22: CLIENT EXPERIENCE & RESIDENTIAL GC POLISH (Sprints 137-140)

> **Goal:** Best client experience in the residential market. Beat Buildertrend and CoConstruct.

### Sprint 137: Client Selection Board & Allowance Tracking
**Priority:** P0 | **Hours:** 8-10

The #1 feature residential GC clients ask for: picking finishes, fixtures, and materials.

- Visual selection board: Grid of categories (Flooring, Countertops, Fixtures, Paint, Hardware, Appliances)
- Per-selection: Photo, description, vendor, price, allowance vs actual, status
- Allowance tracking: Budget per category, spent vs remaining, over/under alerts
- Client portal integration: Clients browse options, make selections, see budget impact
- GC approval workflow: Client selects → GC reviews → approves/suggests alternative
- PDF export of all selections with photos and pricing
- **Files:** `components/selections/SelectionBoard.tsx`, `components/selections/AllowanceTracker.tsx`, `app/client/selections/page.tsx` (enhance)

**Acceptance:** Client browses selections by category, picks items, sees budget impact. GC approves/rejects. PDF export works.

---

### Sprint 138: Project Timeline & Progress Sharing
**Priority:** P0 | **Hours:** 8-10

Clients want to see progress. Beautiful timeline they can share with family.

- Visual project timeline: Phase-based progress bar with milestones
- Photo progress: Before/during/after photo comparisons per phase
- Daily/weekly update emails: Auto-generated progress summary with photos
- Public shareable link: Client can share progress URL with family/friends (read-only, no auth)
- Progress % auto-calculation from task completion
- Next milestone ETA with confidence indicator
- Weather delay tracking: Show impact of weather on schedule
- **Files:** `components/client-portal/ProjectTimeline.tsx`, `app/progress/[token]/page.tsx` (public), `lib/email/progress-digest.ts`

**Acceptance:** Client portal shows visual timeline, photos per phase. Public share link works without auth. Weekly email sends.

---

### Sprint 139: Warranty & Maintenance Tracking
**Priority:** P1 | **Hours:** 8-10

Post-project value: Track warranties, schedule maintenance, handle service requests.

- Warranty registry: Per-project items with manufacturer, duration, start/expiration dates
- Warranty expiration alerts: Email/notification 30/60/90 days before expiration
- Maintenance schedule: Recurring tasks (HVAC filter, gutter cleaning) with reminders
- Service request portal: Client submits → GC triages → assigns → resolves
- Warranty claim tracking: Submit to manufacturer, track status, resolution
- Post-project revenue: Maintenance contracts, warranty extensions
- **Files:** `lib/hooks/useWarranties.ts`, `components/warranty/WarrantyRegistry.tsx`, `app/client/warranty/page.tsx`, `app/dashboard/warranty/page.tsx`

**Acceptance:** Warranties tracked per project, expiration alerts fire, clients submit service requests

---

### Sprint 140: Performance Audit & Optimization Mega-Sprint
**Priority:** P1 | **Hours:** 10-14 | **RUN LAST**

End-of-roadmap optimization pass. Make everything fast.

- Bundle analysis: Code-split large chunks, lazy-load below-fold components
- Firestore optimization: Audit all queries for missing indexes, add limit() where missing
- Image pipeline: WebP-optimized, properly sized, lazy-loaded
- Server component migration: Convert data-fetching pages to RSC where possible
- Caching strategy: SWR/React Query for API responses, Firebase cache config
- Core Web Vitals targets: LCP < 2.5s, FID < 100ms, CLS < 0.1
- Lighthouse audit: Run on 10 key pages, fix all "Opportunities"
- Database indexing review: Ensure every compound query has matching index
- Memory leak audit: Profile with React DevTools, fix growing subscriptions

**Acceptance:** Lighthouse > 85 on all key pages, bundle < 400KB, dashboard < 2s, no "requires index" errors

---

### Phases 18-22 Dependency Graph

```
Phase 18 (Hardening) ── Sequential: 121 -> 122 -> 123 -> 124
                                                            |
                         ┌──────────────────────────────────┘
                         v
Phase 19 (Integrations) ── 125, 126, 127, 128 all independent (any order)
Phase 20 (AI)           ── 129, 130, 131 independent; 132 after 129-131
Phase 21 (Mobile)       ── Sequential: 133 -> 134 -> 135 -> 136
Phase 22 (Client UX)    ── 137, 138, 139 independent; 140 LAST

Phases 19, 20, 21 can run in PARALLEL after Phase 18.
Phase 22 Sprints 137-139 can start alongside Phases 19-21.
Sprint 140 runs absolutely last.
```

### Key Metrics Targets (Post Sprint 140)

| Metric | Current (Sprint 120) | Target (Sprint 140) |
|--------|---------------------|---------------------|
| Unit Tests | ~1,800 | 2,000+ |
| ESLint Warnings | <400 | <300 |
| Console Statements | <100 | <50 |
| Lighthouse Score | Unknown | >85 all pages |
| Bundle Size | Unknown | <400KB main |
| Integrations | QBO only | QBO + Xero + Stripe + Calendar + Webhooks |
| Mobile App | Web PWA only | Native iOS + Android (TestFlight) |
| AI Features | BI dashboards + OCR | Estimate builder + Schedule optimizer + Smart notifications + Assistant |
| Client Portal | Basic experience | Selections + Timeline + Progress sharing + Warranty |
| Payment Processing | Stripe stub | Full Stripe Connect + online payments |

---

**Document Version:** 6.0
**Last Updated:** 2026-02-06
**Status:** Phases 1-14 COMPLETE, Sprints 97-105 DEFERRED, Phase 17 IN PROGRESS (Sprint 110 complete), Phases 18-22 PLANNED (Sprints 121-140)
**Next Action:** Complete Phase 17 (Sprints 111-120), then begin Phase 18
