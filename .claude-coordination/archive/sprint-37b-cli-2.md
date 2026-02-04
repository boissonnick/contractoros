# CLI 2 SPRINT 37B INSTRUCTIONS - UI/Layout + Animations

> **Role:** Dev Sprint
> **Sprint:** 37B
> **Focus:** UI/Layout fixes and animation cleanup
> **Coordinator:** CLI 1

---

## YOUR TASKS (Complete in order)

### Task 1: Search Bar Overlap Fix (FEB-001)
**Effort:** 2-3 hours
**File:** `apps/web/components/ui/PageHeader.tsx` or dashboard layout

**Problem:** Search bar overlaps CTA buttons on mobile/tablet viewports

**Solution:**
- Add responsive breakpoints using Tailwind
- Use `flex-wrap` or stack elements vertically on mobile
- Consider hiding search on very small screens with a toggle

**Acceptance Criteria:**
- [ ] Search bar and CTAs don't overlap at 320px viewport
- [ ] Search bar and CTAs don't overlap at 768px viewport
- [ ] Layout works cleanly at 1024px and 1440px
- [ ] No horizontal scrolling introduced

**Test:**
```bash
# Use Chrome MCP to test responsive layouts
# Or open DevTools and test breakpoints
```

---

### Task 2: Dashboard Layout Balance (FEB-004, FEB-005)
**Effort:** 3-4 hours
**Files:**
- `apps/web/app/dashboard/page.tsx`
- `apps/web/components/dashboard/*.tsx`

**Problems:**
- Active Projects card dominates the dashboard (too tall)
- Project card padding is excessive (p-6 should be p-4)

**Solution:**
- Set `max-h-[400px]` or similar on Active Projects section
- Add "View All Projects" link to see full list
- Reduce card padding from `p-6` to `p-4` throughout
- Ensure visual balance between all dashboard sections

**Acceptance Criteria:**
- [ ] Active Projects doesn't dominate viewport
- [ ] "View All" link present for truncated lists
- [ ] Card padding reduced and consistent
- [ ] All dashboard sections visible without excessive scrolling
- [ ] Stats cards, projects, and other widgets have equal visual weight

---

### Task 3: Sub-Navigation Spacing (FEB-007)
**Effort:** 2 hours
**File:** `apps/web/components/layout/Sidebar.tsx`

**Problem:** Inconsistent spacing in sidebar sub-navigation items

**Solution:**
- Audit all sidebar nav items for padding/margin consistency
- Standardize to 8px or 12px spacing pattern
- Ensure sub-items are clearly indented (pl-4 or pl-6)
- Check active state styling consistency

**Acceptance Criteria:**
- [ ] All nav items have consistent vertical spacing
- [ ] Sub-items clearly indented from parent
- [ ] Active state styling uniform
- [ ] Hover states consistent

---

### Task 4: Animation Cleanup (FEB-008, FEB-009, FEB-010, FEB-045)
**Effort:** 4-6 hours
**Files:** Multiple components across codebase

**Problems:**
- Bouncing "Pending Estimates" icon is distracting
- Bouncing folder icon in empty states is distracting
- Daily Logs has animated icon
- Platform needs comprehensive animation audit

**Solution:**
```bash
# Find all bounce animations
grep -r "animate-bounce" apps/web/

# Replace with subtle alternatives or remove
# animate-bounce → animate-pulse (subtle) or remove entirely
# animate-spin → only for loading states
```

**Acceptable animations:**
- Loading spinners (`animate-spin`)
- Subtle pulse on new items (`animate-pulse`)
- Fade transitions (`transition-opacity`)

**Unacceptable animations:**
- Bouncing icons
- Continuous attention-grabbing motion
- Animations that don't serve a purpose

**Acceptance Criteria:**
- [ ] `grep -r "animate-bounce" apps/web/` returns 0 results
- [ ] No distracting continuous animations
- [ ] Loading states still have appropriate spinners
- [ ] Empty states use static or subtle icons
- [ ] All animations serve a clear UX purpose

---

### Task 5: Client Preferences Layout (FEB-029)
**Effort:** 3-4 hours
**File:** `apps/web/app/dashboard/projects/[id]/client-preferences/page.tsx`

**Problem:** Client Preferences page has poor layout, hard to use

**Solution:**
- Reorganize into logical card sections:
  - Communication Preferences
  - Schedule Preferences
  - Budget/Payment Preferences
  - Design Preferences
- Use consistent card styling
- Add clear section headers
- Ensure mobile responsive

**Acceptance Criteria:**
- [ ] Page organized into clear sections with cards
- [ ] Each preference category has its own card
- [ ] Labels and inputs aligned properly
- [ ] Mobile responsive (stacks on small screens)
- [ ] Save button clearly visible

---

## FILES YOU OWN (Safe to edit)

```
apps/web/components/ui/PageHeader.tsx
apps/web/components/layout/Sidebar.tsx
apps/web/app/dashboard/page.tsx
apps/web/components/dashboard/*.tsx
apps/web/app/dashboard/projects/[id]/client-preferences/page.tsx
Any file containing animate-bounce
```

## FILES TO AVOID (CLI 3 owns these)

```
scripts/seed-demo/*
lib/hooks/useReports.ts
app/dashboard/reports/*
app/dashboard/settings/organization/*
```

---

## VERIFICATION COMMANDS

After each task:
```bash
# Type check
cd apps/web && npx tsc --noEmit

# Check for remaining bounce animations
grep -r "animate-bounce" apps/web/

# Build test
npm run build
```

---

## STATUS UPDATES

After completing each task, update your status:
```bash
echo "$(date '+%H:%M') - Task X complete: [brief description]" >> .claude-coordination/cli-2-status.txt
```

Example:
```bash
echo "$(date '+%H:%M') - Task 1 complete: Search bar now stacks on mobile" >> .claude-coordination/cli-2-status.txt
```

---

## COMPLETION CHECKLIST

Before marking sprint complete:
- [ ] All 5 tasks done
- [ ] TypeScript passes: `npx tsc --noEmit`
- [ ] No bounce animations: `grep -r "animate-bounce" apps/web/`
- [ ] Status file updated
- [ ] Ready for CLI 4 verification
