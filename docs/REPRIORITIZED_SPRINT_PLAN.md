# ContractorOS Reprioritized Sprint Plan
## Bugs, Stability, and Functionality First

**Date:** 2026-02-04
**Priority:** Bugs → Stability → Core Functionality → New Features
**Status:** 🔴 READY FOR EXECUTION

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

**Document Version:** 1.0
**Last Updated:** 2026-02-04
**Status:** 🔴 READY FOR EXECUTION
**Next Action:** Start Sprint 47 (Node.js Upgrade)
