# CLI 2 Worker Prompt: UI/UX & Animation Fixes

**Copy this entire prompt into a new Claude Code session.**

---

## Context

You are CLI 2 working on ContractorOS Sprint 39. Your role is to fix UI layout issues and remove distracting animations.

**Project:** `/Users/nickbodkins/contractoros`
**App:** `apps/web/`
**Dev Server:** `npm run dev` (port 3000)

---

## Your Tasks

### Phase 1: Animation Removal (HIGH PRIORITY)

#### Task 1: Platform-Wide Animation Audit
**Effort:** 4-6h

Find and remove all bouncing/pulsing animations:

```bash
cd /Users/nickbodkins/contractoros/apps/web
grep -r "animate-bounce" --include="*.tsx" --include="*.ts"
grep -r "animate-pulse" --include="*.tsx" --include="*.ts"
```

**Rules:**
- REMOVE: All `animate-bounce` classes
- KEEP: `animate-pulse` ONLY on loading skeletons
- KEEP: `animate-spin` ONLY on loading spinners
- REMOVE: Custom bounce keyframes

**Known locations:**
- Dashboard Pending Estimates icon
- Projects empty state folder icon
- Daily Logs empty state clipboard
- Any EmptyState component

**Fix pattern:**
```tsx
// Before
<FolderIcon className="h-12 w-12 text-gray-400 animate-bounce" />

// After
<FolderIcon className="h-12 w-12 text-gray-400" />
```

---

### Phase 2: Layout Fixes

#### Task 2: Fix Search Bar Overlap (Issue #1)
**Location:** Dashboard header
**Effort:** 2-3h

Search bar overlaps "New Estimate" and "New Project" buttons.

**Find the component:**
```bash
grep -r "New Estimate" apps/web/app/dashboard --include="*.tsx"
grep -r "New Project" apps/web/app/dashboard --include="*.tsx"
```

**Fix approach:**
```tsx
<div className="flex items-center gap-4">
  <SearchBar className="flex-1 max-w-md" />
  <div className="flex gap-2 shrink-0">
    <Button>New Estimate</Button>
    <Button>New Project</Button>
  </div>
</div>
```

---

#### Task 3: Optimize Active Projects Layout (Issue #4)
**Location:** Dashboard main content
**Effort:** 3-4h

Active Projects section takes too much space, pushing Material Prices below fold.

**Fix:**
- Limit Active Projects to 3-4 cards max
- Add "View All Projects" link
- Use compact card variant
- Ensure Material Prices visible above fold on 1080p

---

#### Task 4: Reduce Project Card Padding (Issue #5)
**Location:** Project cards component
**Effort:** 3-4h

Target: 9-12 projects visible per page (currently ~6).

**Find cards:**
```bash
grep -r "ProjectCard" apps/web/components --include="*.tsx"
```

**Fix:**
```tsx
// Reduce padding from p-6 to p-4
<div className="p-4 border rounded-lg">
  <div className="space-y-2"> {/* was space-y-4 */}
```

---

#### Task 5: Fix Sub-Navigation Spacing (Issue #7)
**Location:** Tasks page (Board/List/Gantt tabs)
**Effort:** 2h

Sub-nav has no breathing room from main nav.

**Fix:**
```tsx
<div className="pt-4 pb-2">
  <SubNav />
</div>
```

---

#### Task 6: Fix Dropdown Arrow Positioning (Issue #6)
**Location:** Filter dropdowns (Status, Categories)
**Effort:** 1-2h

Arrows too close to right edge.

**Fix:**
```tsx
<select className="pr-10 ..."> {/* Add right padding */}
```

---

### Phase 3: Component Patterns

#### Task 7: Standardize Empty State Pattern (Issue #44)
**Location:** `components/ui/EmptyState.tsx`
**Effort:** 2-3h

Create/update standardized empty state:

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
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      {action && (
        <Button className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

Then find all empty states and update to use this component.

---

#### Task 8: Fix Client Preferences Layout (Issue #29)
**Location:** Client Preferences page
**Effort:** 3-4h

Change from single-column to multi-column grid:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card>Finish Preferences</Card>
  <Card>Budget Preferences</Card>
  <Card>Communication Preferences</Card>
</div>
```

---

### Phase 4: Date Pickers

#### Task 9: Enhance Date Picker UX (Issue #77)
**Location:** Reports date filters
**Effort:** 3-4h

Add quick select buttons:

```tsx
const DATE_PRESETS = [
  { label: 'This Week', getValue: () => getThisWeek() },
  { label: 'This Month', getValue: () => getThisMonth() },
  { label: 'This Quarter', getValue: () => getThisQuarter() },
  { label: 'YTD', getValue: () => getYTD() },
  { label: 'Last 30 Days', getValue: () => getLast30Days() },
];
```

---

## Execution Order

1. **Animation audit first** - High impact, quick wins
2. **Layout fixes** - Search bar, Active Projects, cards
3. **Component patterns** - EmptyState standardization
4. **Date pickers** - Lower priority

---

## Commands

```bash
# Start dev server
cd /Users/nickbodkins/contractoros/apps/web
npm run dev

# Find animations
grep -r "animate-bounce" --include="*.tsx"
grep -r "animate-pulse" --include="*.tsx"

# TypeScript check before commit
npx tsc --noEmit

# Commit pattern
git add apps/web/components/
git commit -m "fix(ui): Remove bouncing animations from empty states

Removes distracting animate-bounce from:
- Dashboard Pending Estimates icon
- Projects empty state
- Daily Logs empty state

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## File Ownership

CLI 2 owns:
- `components/ui/`
- `components/dashboard/`
- Component styling in all subdirectories
- Tailwind/CSS configuration

**Do NOT modify:**
- `lib/hooks/` (CLI 1)
- Business logic in page.tsx files (CLI 3)
- Firestore rules (CLI 4)

---

## Success Criteria

- [ ] No `animate-bounce` classes remain (except intentional)
- [ ] `animate-pulse` only on loading skeletons
- [ ] Search bar doesn't overlap buttons
- [ ] 9-12 project cards visible per page
- [ ] All empty states use consistent pattern
- [ ] TypeScript passes
- [ ] All changes committed
