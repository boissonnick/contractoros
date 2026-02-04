# Sprint 50 - UI/UX Bug Fixes

**Start Date:** 2026-02-04
**Focus:** Layout polish and UI consistency
**Estimated Effort:** 10-14 hours (1-2 days)
**Priority:** P1 - HIGH
**Status:** 🔴 IN PROGRESS

---

## Why This Sprint?

**Problem:** Various UI layout issues hurt credibility and user experience
**Root Cause:** Rapid feature development left polish items unaddressed
**Solution:** Address all high-visibility UI/UX bugs systematically
**Impact:** Professional appearance, improved usability

---

## Sprint Objectives

### Issues to Fix
| ID | Issue | Effort | Severity | Status |
|----|-------|--------|----------|--------|
| #1 | Search bar overlaps CTA buttons | 2-3h | Medium | [ ] |
| #2 | Help menu location | 1-2h | Low | [ ] |
| #3 | Online status indicator missing | 2-3h | Low | [ ] |
| #4 | Active Projects dominates dashboard | 3-4h | Medium | [ ] |
| #5 | Project card padding too large | 3-4h | Low | [ ] |
| #7 | Sub-navigation spacing | 2h | Low | [ ] |
| #29 | Client Preferences layout | 3-4h | Medium | [ ] |
| #44 | Empty state pattern consistency | 2-3h | Medium | [ ] |

### Success Criteria
- [ ] No overlapping UI elements
- [ ] Consistent spacing across modules
- [ ] Help menu in logical location
- [ ] Online status indicator visible
- [ ] Dashboard balanced (Active Projects smaller)
- [ ] Project cards optimally sized
- [ ] Standardized empty states

---

## Files Affected

```
apps/web/
├── app/dashboard/page.tsx           # Dashboard layout, Active Projects
├── components/ui/PageHeader.tsx     # Search bar overlap
├── components/projects/ProjectCard.tsx  # Card sizing/padding
├── components/ui/EmptyState.tsx     # Empty state standardization
├── components/settings/ClientPreferences.tsx  # Layout fix
├── components/layout/Sidebar.tsx    # Help menu location
├── components/search/GlobalSearchBar.tsx  # Search bar
└── components/layout/TopNav.tsx     # Online status indicator
```

---

## Parallel Execution Plan

### Batch 1: Assessment (Parallel)
- Agent 1: Review dashboard layout (page.tsx, Active Projects widget)
- Agent 2: Review PageHeader and search bar components
- Agent 3: Review ProjectCard and EmptyState components
- Agent 4: Review Settings and navigation components

### Batch 2: Fixes (Parallel)
- Agent 1: Fix dashboard balance (#4), sub-nav spacing (#7)
- Agent 2: Fix search bar overlap (#1), help menu (#2)
- Agent 3: Fix project card padding (#5), empty states (#44)
- Agent 4: Fix online status (#3), Client Preferences (#29)

### Batch 3: Verification
- TypeScript check
- Visual verification
- Commit changes

---

## Technical Notes

### Search Bar Overlap (#1)
- PageHeader has search bar and CTA buttons
- Need to ensure proper flex layout or responsive behavior

### Active Projects (#4)
- Dashboard Active Projects widget takes too much space
- Consider: max-height, collapsible, or smaller card format

### Online Status (#3)
- Add connection status indicator to header/nav
- Could use existing navigator.onLine or custom hook

### Empty States (#44)
- Audit all modules for empty state consistency
- Use standardized EmptyState component everywhere

---

**Sprint Owner:** Development Team
**Sprint Status:** 🔴 IN PROGRESS
**Previous Sprint:** Sprint 49 - Data Quality ✅ COMPLETE
