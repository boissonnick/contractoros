# Sprint 38 - CLI 2: UI/UX & Layout Fixes

**Role:** Frontend / UI Development
**Focus:** Component fixes, animations, spacing, layout improvements
**Estimated Hours:** 45-65h
**Priority:** Can run in parallel with other CLIs

---

## Prerequisites

- Access to `apps/web/` codebase
- Tailwind CSS knowledge
- Component library in `components/ui/`

---

## Tasks

### Task 1: Fix Search Bar Overlap (Issue #1)
**Location:** `app/dashboard/` - header component
**Effort:** 2-3h

Fix search bar overlapping "New Estimate" and "New Project" buttons.

**Acceptance Criteria:**
- [ ] Search bar has proper spacing, no overlap
- [ ] All buttons remain fully clickable/visible
- [ ] Responsive at 1200px+ desktop widths

---

### Task 2: Move Help Menu to Sidebar (Issue #2)
**Location:** Top navigation / Side navigation
**Effort:** 1-2h

Relocate help icon from top nav to side navigation.

**Acceptance Criteria:**
- [ ] Help menu in side navigation (under Settings or dedicated item)
- [ ] Top floating help icon removed

---

### Task 3: Restore Online Status Indicator (Issue #3)
**Location:** User profile section (bottom left sidebar)
**Effort:** 2-3h

Restore green online status indicator next to username.

**Acceptance Criteria:**
- [ ] Green status indicator visible
- [ ] Updates in real-time (or appears static green when logged in)

---

### Task 4: Optimize Active Projects Layout (Issue #4)
**Location:** Dashboard main content
**Effort:** 3-4h

Active Projects section dominates dashboard, pushing Material Prices and Recent Activity below fold.

**Acceptance Criteria:**
- [ ] Active Projects optimized for space
- [ ] Material Prices and Recent Activity visible above fold
- [ ] Improved grid/layout distribution

---

### Task 5: Reduce Project Card Padding (Issue #5)
**Location:** Project cards component
**Effort:** 3-4h

Excessive padding on project cards, pagination not visible without scrolling.

**Acceptance Criteria:**
- [ ] Reduced padding on cards
- [ ] Display 9-12 projects per page on desktop
- [ ] "Show per page" dropdown visible
- [ ] Pagination controls visible without scrolling

---

### Task 6: Fix Dropdown Arrow Positioning (Issue #6)
**Location:** Filter dropdowns (All Status, All Categories)
**Effort:** 1-2h

Dropdown arrows too close to right edge.

**Acceptance Criteria:**
- [ ] Proper padding around arrows
- [ ] Consistent spacing across all dropdowns

---

### Task 7: Fix Sub-Navigation Spacing (Issue #7)
**Location:** Tasks page sub-navigation
**Effort:** 2h

Board/List/Gantt sub-nav has no breathing room from Tasks tab.

**Acceptance Criteria:**
- [ ] Vertical padding between main nav and sub-nav
- [ ] Vertical padding between sub-nav and action buttons

---

### Task 8: Remove Bouncing Pending Estimates Icon (Issue #8)
**Location:** Dashboard - Pending Estimates section
**Effort:** 1h

Pending Estimates icon constantly bounces - distracting.

**Acceptance Criteria:**
- [ ] Remove bouncing animation
- [ ] Display as static icon

---

### Task 9: Remove Bouncing Folder Icon (Issue #9)
**Location:** Projects empty state
**Effort:** 1h

Folder icon bounces on "No projects found" empty state.

**Acceptance Criteria:**
- [ ] Remove bouncing animation from empty state

---

### Task 10: Platform-Wide Animation Audit (Issue #10)
**Location:** Multiple pages
**Effort:** 4-6h

Audit and remove all distracting bounce/pulse animations.

**Files to check:**
- `components/ui/EmptyState.tsx`
- `components/ui/StatsCard.tsx`
- `components/dashboard/` components
- Any component with `animate-bounce` or `animate-pulse`

**Acceptance Criteria:**
- [ ] All pages audited for bounce/pulse animations
- [ ] Constant bouncing animations removed
- [ ] Replace with static icons or subtle non-repetitive animations
- [ ] Document animation guidelines for future

---

### Task 11: Fix Client Preferences Layout (Issue #29)
**Location:** Client Preferences page
**Effort:** 3-4h

Long, thin, single-column layout - poor information density.

**Acceptance Criteria:**
- [ ] Reorganized into 2-3 column grid on desktop
- [ ] Finish Preferences in grid layout
- [ ] Budget & Timeline fields side-by-side
- [ ] Responsive for mobile (revert to single column)

---

### Task 12: Fix "Add Client" Button Brand Colors (Issue #31)
**Location:** Clients page
**Effort:** 2-3h

"Add Client" button uses default blue instead of custom brand colors.

**Acceptance Criteria:**
- [ ] Button uses custom brand color from settings
- [ ] Consistent with other CTA buttons

---

### Task 13: Standardize Empty State Pattern (Issue #44)
**Location:** Various pages (Time Off Requests, etc.)
**Effort:** 2-3h

Empty state patterns inconsistent across platform.

**Acceptance Criteria:**
- [ ] Standardized empty state component
- [ ] Icon, message, CTA button pattern
- [ ] Applied to all empty states

---

### Task 14: Remove Daily Logs Animated Icon (Issue #45)
**Location:** Daily Logs page
**Effort:** 1h

Daily Logs empty state has animated clipboard icon.

**Acceptance Criteria:**
- [ ] Remove animated icon
- [ ] Use static icon in established pattern

---

### Task 15: Enhance Date Picker UX (Issue #77)
**Location:** Reports and other date-related components
**Effort:** 3-4h

Date picker needs quick select buttons.

**Acceptance Criteria:**
- [ ] Quick selects: This Week, Month, Quarter, YTD
- [ ] Custom date range picker
- [ ] Keyboard shortcuts
- [ ] Save to user preferences

---

### Task 16: Add Relative Date Selection (Issue #78)
**Location:** Reporting date filters
**Effort:** 2-3h

Reports should use relative dates ("Last 30 days").

**Acceptance Criteria:**
- [ ] Dynamic date ranges
- [ ] Comparison periods
- [ ] Relative date presets

---

### Task 17: Fix Team Dropdown Layout (Issue #86)
**Location:** Settings > Team
**Effort:** 1-2h

Team dropdown, Roles, Permissions should be on one line.

**Acceptance Criteria:**
- [ ] Single row on 1200px+ screens
- [ ] Responsive wrapping on smaller screens

---

## Animation Removal Checklist

Search for these classes and remove/replace:
- `animate-bounce`
- `animate-pulse` (keep only for loading states)
- `animate-spin` (keep only for loading indicators)
- Custom bounce keyframes

---

## Status Updates

```
[ ] Task 1: Fix Search Bar Overlap
[ ] Task 2: Move Help Menu to Sidebar
[ ] Task 3: Restore Online Status Indicator
[ ] Task 4: Optimize Active Projects Layout
[ ] Task 5: Reduce Project Card Padding
[ ] Task 6: Fix Dropdown Arrow Positioning
[ ] Task 7: Fix Sub-Navigation Spacing
[ ] Task 8: Remove Bouncing Pending Estimates Icon
[ ] Task 9: Remove Bouncing Folder Icon
[ ] Task 10: Platform-Wide Animation Audit
[ ] Task 11: Fix Client Preferences Layout
[ ] Task 12: Fix "Add Client" Button Brand Colors
[ ] Task 13: Standardize Empty State Pattern
[ ] Task 14: Remove Daily Logs Animated Icon
[ ] Task 15: Enhance Date Picker UX
[ ] Task 16: Add Relative Date Selection
[ ] Task 17: Fix Team Dropdown Layout
```

---

## Commands

```bash
# Dev server
cd apps/web && npm run dev

# TypeScript check
npx tsc --noEmit

# Find animations
grep -r "animate-bounce" apps/web/
grep -r "animate-pulse" apps/web/
```
