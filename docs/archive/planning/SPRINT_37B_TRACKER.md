# Sprint 37B Tracker - UI/Layout + Animations

> **Started:** 2026-02-02
> **Estimated Effort:** 25-36 hours
> **Focus:** UI layout fixes, spacing issues, animation cleanup
> **Owner:** Dev Sprint (CLI 2)

---

## Status Legend

| Status | Description |
|--------|-------------|
| `[ ]` | Not started |
| `[~]` | In progress |
| `[x]` | Complete |
| `[!]` | Blocked |

---

## Priority 1: Animation Cleanup (HIGH - UX Distraction)

These bouncing/pulse animations are distracting and should be removed first.

| ID | Issue | Effort | Status | Assignee |
|----|-------|--------|--------|----------|
| FEB-008 | Bouncing Pending Estimates Icon | 1h | `[ ]` | |
| FEB-009 | Bouncing Folder Icon Empty State | 1h | `[ ]` | |
| FEB-010 | Remove All Bouncing Animations Platform-Wide | 4-6h | `[ ]` | |
| FEB-045 | Remove Animated Icon from Daily Logs Empty State | 1h | `[ ]` | |

**Total:** 7-9 hours

---

## Priority 2: Dashboard & UI Layout (MEDIUM)

| ID | Issue | Effort | Status | Assignee |
|----|-------|--------|--------|----------|
| FEB-001 | Search Bar Overlap with CTAs | 2-3h | `[ ]` | |
| FEB-004 | Active Projects Taking Excessive Space | 3-4h | `[ ]` | |
| FEB-005 | Project Card Padding Too Large | 3-4h | `[ ]` | |

**Total:** 8-11 hours

---

## Priority 3: Navigation & Spacing (LOW-MEDIUM)

| ID | Issue | Effort | Status | Assignee |
|----|-------|--------|--------|----------|
| FEB-002 | Help Menu Location | 1-2h | `[ ]` | |
| FEB-003 | Online Status Indicator Missing | 2-3h | `[ ]` | |
| FEB-006 | Dropdown Arrow Positioning | 1-2h | `[ ]` | |
| FEB-007 | Sub-Navigation Spacing | 2h | `[ ]` | |

**Total:** 6-9 hours

---

## Related Issues (May address in this sprint)

| ID | Issue | Effort | Status | Notes |
|----|-------|--------|--------|-------|
| FEB-029 | Client Preferences Layout Poor | 3-4h | `[ ]` | Layout issue |
| FEB-044 | Empty State Pattern Inconsistency | 2-3h | `[ ]` | Related to animation fixes |

---

## Sprint Progress

| Category | Issues | Hours Est. | Complete |
|----------|--------|------------|----------|
| Animations | 4 | 7-9h | 0/4 |
| Dashboard Layout | 3 | 8-11h | 0/3 |
| Navigation/Spacing | 4 | 6-9h | 0/4 |
| **Total** | **11** | **21-29h** | **0/11** |

---

## Session Notes

### 2026-02-02 - Controller (CLI 1)
- Sprint 37B officially started
- Created tracker from PLATFORM_AUDIT_ISSUES.md (FEB-001 to FEB-010 + related)
- Dev Sprint (CLI 2) should prioritize animation cleanup first (most visible UX impact)

---

## Files Likely to Change

**Animation Fixes:**
- `components/ui/EmptyState.tsx` - Remove bounce animations
- `app/dashboard/` pages with animated icons
- Tailwind config or global CSS for animation classes

**Layout Fixes:**
- `components/ui/PageHeader.tsx` - Search bar spacing
- `app/dashboard/page.tsx` - Active projects layout
- `components/projects/ProjectCard.tsx` - Padding adjustments
- `components/ui/AppShell.tsx` - Navigation spacing

---

## Acceptance Criteria for Sprint Complete

- [ ] All 4 animation issues resolved (no bouncing icons)
- [ ] Search bar no longer overlaps CTAs
- [ ] Project cards show 9-12 per page on desktop
- [ ] Navigation spacing consistent across platform
- [ ] No TypeScript errors (`npx tsc --noEmit` passes)
- [ ] Visual QA on localhost:3000 complete
