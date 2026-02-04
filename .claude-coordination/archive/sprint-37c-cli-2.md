# CLI 2 SPRINT 37C - UI Polish & Features

> **Sprint:** 37C
> **Role:** Dev (UI/Layout)
> **Started:** 2026-02-02

---

## Your Tasks

### Task 1: Dropdown Arrow Positioning (Issue #6)
**Severity:** Low | **Effort:** 1-2 hours

**Problem:** Dropdown arrows too close to right edge in filter dropdowns

**Files to check:**
- `components/ui/FilterBar.tsx`
- Any `<select>` elements in dashboard pages

**Fix:**
- Add `pr-8` or `pr-10` padding to select elements
- Ensure arrow has breathing room from edge

**Acceptance:**
- [ ] All dropdowns have consistent arrow spacing
- [ ] Test: Projects filters, Tasks filters, Invoices filters

---

### Task 2: Empty State Consistency (Issue #44)
**Severity:** Low | **Effort:** 2-3 hours

**Problem:** Some empty states don't match established pattern

**Check these pages:**
- Time Off Requests
- Any page not using `EmptyState` component

**Fix:**
- Use `components/ui/EmptyState.tsx` component
- Pattern: Icon + Message + CTA button

**Acceptance:**
- [ ] All empty states use consistent component
- [ ] Icon, message, and action button present

---

### Task 3: Help Menu Relocation (Issue #2)
**Severity:** Low | **Effort:** 1-2 hours

**Problem:** Help icon floating at top instead of in sidebar

**Files:**
- `components/ui/AppShell.tsx`
- `components/layout/Sidebar.tsx` (if exists)

**Fix:**
- Remove help icon from top bar
- Add to sidebar navigation (under Settings or as dedicated item)

**Acceptance:**
- [ ] Help accessible from sidebar
- [ ] Top bar cleaner

---

### Task 4: Crew Availability Enhancement (Issue #42)
**Severity:** Medium | **Effort:** 6-8 hours

**Problem:** Team > Crew Availability tab is underdeveloped

**File:** `app/dashboard/team/` (find availability component)

**Enhancements needed:**
- Utilization % display (time allocated vs available)
- Workload visualization (current assignments)
- Skills/trades filtering
- Date range picker for availability windows

**Acceptance:**
- [ ] Utilization percentages shown per crew member
- [ ] Can filter by trade/skill
- [ ] Visual indicator of workload

---

## Files You OWN
- `components/ui/EmptyState.tsx`
- `components/ui/FilterBar.tsx`
- `components/ui/AppShell.tsx`
- `app/dashboard/team/`

## Files to AVOID (CLI 3 owns)
- `scripts/seed-demo/*`
- `app/dashboard/reports/`
- `app/dashboard/settings/organization/`

---

## Status Updates
After each task:
```bash
echo "$(date +%H:%M) - Task X complete: [description]" >> /Users/nickbodkins/contractoros/.claude-coordination/cli-2-status.txt
```

## Verification
```bash
cd /Users/nickbodkins/contractoros/apps/web && npx tsc --noEmit
```
