# Sprint 39 - CLI 2: UI/UX & Layout Polish

**Role:** Frontend / UI Development
**Focus:** Animation removal, layout fixes, component standardization
**Estimated Hours:** 45-65h
**Priority:** MEDIUM - Can run in parallel

---

## Prerequisites

- Dev server running: `cd apps/web && npm run dev`
- Docker for final testing
- Tailwind CSS knowledge

---

## Phase 1: Animation Removal (HIGH PRIORITY)

### Task 1: Remove Bouncing Pending Estimates Icon (Issue #8)
**Location:** `components/dashboard/` or dashboard page
**Effort:** 1h

**Steps:**
1. Find component with bouncing estimate icon
2. Remove `animate-bounce` class
3. Keep static icon

**Acceptance Criteria:**
- [ ] No bouncing animation on Pending Estimates
- [ ] Icon displays statically

---

### Task 2: Remove Bouncing Folder Icon (Issue #9)
**Location:** `components/ui/EmptyState.tsx` or Projects page
**Effort:** 1h

**Steps:**
1. Find empty state component
2. Remove bounce animation from folder icon
3. Apply consistent static styling

**Acceptance Criteria:**
- [ ] No bouncing animation on empty states

---

### Task 3: Remove Daily Logs Animated Icon (Issue #45)
**Location:** Daily Logs page empty state
**Effort:** 1h

**Acceptance Criteria:**
- [ ] Static clipboard icon
- [ ] Consistent with other empty states

---

### Task 4: Platform-Wide Animation Audit (Issue #10)
**Effort:** 4-6h

**Search Commands:**
```bash
grep -r "animate-bounce" apps/web/
grep -r "animate-pulse" apps/web/
grep -r "animate-spin" apps/web/
```

**Rules:**
- REMOVE: `animate-bounce` (all instances)
- KEEP: `animate-pulse` only for loading skeletons
- KEEP: `animate-spin` only for loading spinners
- REMOVE: Custom bounce keyframes

**Acceptance Criteria:**
- [ ] All bounce animations removed
- [ ] Pulse only on loading states
- [ ] Spin only on spinners
- [ ] Document animation guidelines

---

## Phase 2: Layout Fixes

### Task 5: Fix Search Bar Overlap (Issue #1)
**Location:** Dashboard header component
**Effort:** 2-3h

Search bar overlaps "New Estimate" and "New Project" buttons.

**Fix Approach:**
```tsx
// Ensure proper flex layout with gap
<div className="flex items-center gap-4">
  <SearchBar className="flex-1 max-w-md" />
  <div className="flex gap-2 shrink-0">
    <Button>New Estimate</Button>
    <Button>New Project</Button>
  </div>
</div>
```

**Acceptance Criteria:**
- [ ] Search bar has proper spacing
- [ ] Buttons fully visible and clickable
- [ ] Works at 1200px+ widths

---

### Task 6: Move Help Menu to Sidebar (Issue #2)
**Location:** Top navigation / Side navigation
**Effort:** 1-2h

**Acceptance Criteria:**
- [ ] Help menu in side navigation
- [ ] Floating help icon removed from top

---

### Task 7: Restore Online Status Indicator (Issue #3)
**Location:** User profile section (sidebar bottom)
**Effort:** 2-3h

**Implementation:**
```tsx
<div className="flex items-center gap-2">
  <span className="w-2 h-2 bg-green-500 rounded-full" />
  <span>{user.name}</span>
</div>
```

**Acceptance Criteria:**
- [ ] Green dot visible next to username
- [ ] Positioned in sidebar user section

---

### Task 8: Optimize Active Projects Layout (Issue #4)
**Location:** Dashboard main content
**Effort:** 3-4h

Active Projects section takes too much space, pushing Material Prices and Recent Activity below fold.

**Fix Approach:**
- Limit Active Projects to 3-4 cards
- Add "View All" link
- Use compact card variant
- Ensure Material Prices visible above fold

**Acceptance Criteria:**
- [ ] Active Projects shows 3-4 items max
- [ ] Material Prices visible without scrolling
- [ ] Recent Activity visible without scrolling

---

### Task 9: Reduce Project Card Padding (Issue #5)
**Location:** Project cards component
**Effort:** 3-4h

**Current Issue:** Excessive padding, only ~6 projects visible per page.

**Target:** 9-12 projects per page on desktop.

**Fix Approach:**
```tsx
// Reduce padding from p-6 to p-4
<div className="p-4 border rounded-lg">
  {/* Reduce internal spacing */}
  <div className="space-y-2"> {/* was space-y-4 */}
```

**Acceptance Criteria:**
- [ ] 9-12 projects visible per page
- [ ] Pagination controls visible without scrolling
- [ ] "Show per page" dropdown visible

---

### Task 10: Fix Dropdown Arrow Positioning (Issue #6)
**Location:** Filter dropdowns
**Effort:** 1-2h

**Fix:**
```tsx
// Add proper right padding for arrow
<select className="pr-10 ...">
```

**Acceptance Criteria:**
- [ ] Arrow has proper spacing from edge
- [ ] Consistent across all dropdowns

---

### Task 11: Fix Sub-Navigation Spacing (Issue #7)
**Location:** Tasks page sub-navigation (Board/List/Gantt)
**Effort:** 2h

**Fix:**
```tsx
<div className="pt-4 pb-2"> {/* Add vertical padding */}
  <SubNav />
</div>
```

**Acceptance Criteria:**
- [ ] Breathing room between main nav and sub-nav
- [ ] Breathing room between sub-nav and content

---

## Phase 3: Component Patterns

### Task 12: Standardize Empty State Pattern (Issue #44)
**Location:** `components/ui/EmptyState.tsx`
**Effort:** 2-3h

Create/update standard empty state component:

```tsx
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-gray-400 mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      {description && <p className="mt-1 text-gray-500">{description}</p>}
      {action && (
        <Button className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Single EmptyState component
- [ ] Used consistently across all pages
- [ ] No animations in empty states

---

### Task 13: Fix Client Preferences Layout (Issue #29)
**Location:** Client Preferences page
**Effort:** 3-4h

Current: Long, thin, single-column layout.

**Fix:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card>Finish Preferences</Card>
  <Card>Budget Preferences</Card>
  <Card>Timeline Preferences</Card>
</div>
```

**Acceptance Criteria:**
- [ ] 2-3 column grid on desktop
- [ ] Responsive single column on mobile
- [ ] Better information density

---

### Task 14: Fix "Add Client" Button Brand Colors (Issue #31)
**Location:** Clients page
**Effort:** 2-3h

Button uses default blue instead of brand colors.

**Fix:**
```tsx
// Use brand color from org settings
<Button className="bg-brand-primary hover:bg-brand-primary-dark">
  Add Client
</Button>
```

**Acceptance Criteria:**
- [ ] Button uses custom brand color
- [ ] Consistent with other CTA buttons

---

## Phase 4: Date Pickers

### Task 15: Enhance Date Picker UX (Issue #77)
**Location:** Reports and date-related components
**Effort:** 3-4h

**Features to Add:**
- Quick selects: This Week, This Month, This Quarter, YTD
- Custom date range picker
- Keyboard shortcuts (arrow keys, enter)

**Acceptance Criteria:**
- [ ] Quick select buttons available
- [ ] Custom range picker works
- [ ] Keyboard navigation works

---

### Task 16: Add Relative Date Selection (Issue #78)
**Location:** Report filters
**Effort:** 2-3h

**Options:**
- Last 7 days
- Last 30 days
- Last 90 days
- Last 12 months
- Custom range

**Acceptance Criteria:**
- [ ] Relative date presets available
- [ ] Updates dynamically (e.g., "Last 30 days" always current)

---

### Task 17: Fix Team Dropdown Layout (Issue #86)
**Location:** Settings > Team
**Effort:** 1-2h

Team dropdown, Roles, Permissions should be on one line.

**Fix:**
```tsx
<div className="flex flex-wrap lg:flex-nowrap items-center gap-4">
  <TeamDropdown />
  <RolesSelect />
  <PermissionsSelect />
</div>
```

**Acceptance Criteria:**
- [ ] Single row on 1200px+ screens
- [ ] Responsive wrapping on smaller screens

---

## Status Updates

```
Phase 1: Animation Removal
[ ] Task 1: Remove Bouncing Pending Estimates Icon
[ ] Task 2: Remove Bouncing Folder Icon
[ ] Task 3: Remove Daily Logs Animated Icon
[ ] Task 4: Platform-Wide Animation Audit

Phase 2: Layout Fixes
[ ] Task 5: Fix Search Bar Overlap
[ ] Task 6: Move Help Menu to Sidebar
[ ] Task 7: Restore Online Status Indicator
[ ] Task 8: Optimize Active Projects Layout
[ ] Task 9: Reduce Project Card Padding
[ ] Task 10: Fix Dropdown Arrow Positioning
[ ] Task 11: Fix Sub-Navigation Spacing

Phase 3: Component Patterns
[ ] Task 12: Standardize Empty State Pattern
[ ] Task 13: Fix Client Preferences Layout
[ ] Task 14: Fix "Add Client" Button Brand Colors

Phase 4: Date Pickers
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

# Docker rebuild
./docker-build-local.sh
docker stop contractoros-web; docker rm contractoros-web
docker run -d -p 3000:8080 --name contractoros-web contractoros-web
```

---

## File Ownership

CLI 2 owns these directories:
- `components/ui/`
- `components/dashboard/`
- Component styling in all `components/` subdirectories
- CSS/Tailwind configuration

**Do NOT modify:**
- `lib/hooks/` (CLI 1 territory)
- `app/dashboard/*/page.tsx` business logic (CLI 3 territory)
- Firestore rules (CLI 4 territory)
