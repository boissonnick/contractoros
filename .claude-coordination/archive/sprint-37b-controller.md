# CLI 1 CONTROLLER INSTRUCTIONS - Sprint 37B Parallel Development

> **Sprint:** 37B - UI/Layout, Animations & Reports Configuration
> **Date:** 2026-02-02
> **Estimated Duration:** 1-2 weeks
> **Controller Role:** Coordinate CLI 2-4, prevent conflicts, verify completions

---

## EXECUTIVE SUMMARY

All 6 critical bugs are fixed. This sprint focuses on parallel development across:
- **UI/Layout fixes** (Phase 1 audit)
- **Reports configuration** (Phase 2 audit)
- **Demo data enhancement** (both phases)

You are CLI 1 (Controller). Your job is to:
1. Distribute these instructions to CLI 2-4
2. Monitor progress via status files
3. Prevent file conflicts
4. Verify completions before merging

---

## SESSION ASSIGNMENTS

| CLI | Role | Focus | Files Owned |
|-----|------|-------|-------------|
| **CLI 1** | Controller | Coordination, review, docs | `CLAUDE.md`, `SPRINT_STATUS.md`, `.claude-coordination/` |
| **CLI 2** | Dev Sprint | UI/Layout + Animations | `components/ui/`, `app/dashboard/` layouts |
| **CLI 3** | Database/Data | Reports Config + Demo Data | `scripts/seed-demo/`, `lib/hooks/useReports.ts` |
| **CLI 4** | Testing | E2E + Verification | `e2e/`, Chrome MCP testing |

---

## CLI 2 INSTRUCTIONS (UI/Layout + Animations)

**Copy and send to CLI 2:**

```markdown
# CLI 2 SPRINT 37B INSTRUCTIONS - UI/Layout + Animations

## Your Role
You are CLI 2 (Dev Sprint). Focus on UI/Layout fixes and animation cleanup.

## Priority Order (Complete in sequence)

### Task 1: Search Bar Overlap Fix (FEB-001)
**File:** `apps/web/components/ui/PageHeader.tsx` or dashboard layout
**Issue:** Search bar overlaps CTA buttons on mobile/tablet
**Fix:** Add responsive breakpoints, use flex-wrap or stack on mobile
**Acceptance:**
- [ ] Search bar and CTAs don't overlap at any viewport
- [ ] Test at 320px, 768px, 1024px, 1440px

### Task 2: Dashboard Layout Balance (FEB-004, FEB-005)
**Files:** `apps/web/app/dashboard/page.tsx`, `components/dashboard/`
**Issues:**
- Active Projects card dominates dashboard
- Project card padding too large
**Fix:**
- Reduce Active Projects max-height, add "View All" link
- Reduce card padding from p-6 to p-4
**Acceptance:**
- [ ] Dashboard has visual balance
- [ ] All sections visible without excessive scrolling

### Task 3: Sub-Navigation Spacing (FEB-007)
**File:** `apps/web/components/layout/Sidebar.tsx` or nav components
**Issue:** Inconsistent spacing in sidebar sub-items
**Fix:** Standardize padding/margins across all nav levels
**Acceptance:**
- [ ] Consistent 8px or 12px spacing throughout
- [ ] Sub-items clearly indented

### Task 4: Animation Cleanup (FEB-008, FEB-009, FEB-010, FEB-045)
**Files:** Multiple components with animated icons
**Issues:**
- Bouncing "Pending Estimates" icon distracting
- Bouncing folder icon in empty states distracting
- Daily Logs animated icon
- Platform needs animation audit
**Fix:**
- Remove bounce animations, use subtle fade or static
- Replace `animate-bounce` with `animate-pulse` or remove
- Audit all components for excessive animation
**Acceptance:**
- [ ] No bouncing icons anywhere
- [ ] Animations subtle and purposeful
- [ ] Grep for `animate-bounce` returns 0 results

### Task 5: Client Preferences Layout (FEB-029)
**File:** `apps/web/app/dashboard/projects/[id]/client-preferences/page.tsx`
**Issue:** Poor layout, hard to use
**Fix:** Reorganize into logical sections with cards
**Acceptance:**
- [ ] Clean, organized layout
- [ ] Mobile responsive

## Files You OWN (No conflicts)
- `apps/web/components/ui/PageHeader.tsx`
- `apps/web/components/layout/Sidebar.tsx`
- `apps/web/app/dashboard/page.tsx`
- `apps/web/components/dashboard/*.tsx`
- Any component with `animate-bounce`

## Files to AVOID (CLI 3 owns)
- `scripts/seed-demo/*`
- `lib/hooks/useReports.ts`

## Status Updates
After each task, update your status:
```bash
echo "CLI2: Task X complete - [description]" >> .claude-coordination/cli-2-status.txt
```

## Verification Commands
```bash
# After changes
cd apps/web && npx tsc --noEmit

# Check for remaining bounce animations
grep -r "animate-bounce" apps/web/

# Test build
npm run build
```
```

---

## CLI 3 INSTRUCTIONS (Reports Config + Demo Data)

**Copy and send to CLI 3:**

```markdown
# CLI 3 SPRINT 37B INSTRUCTIONS - Reports Configuration + Demo Data

## Your Role
You are CLI 3 (Database/Data). Focus on settings configuration and demo data.

## Priority Order (Complete in sequence)

### Task 1: Reports Navigation to Sidebar (#62)
**File:** `apps/web/app/dashboard/reports/layout.tsx`
**Issue:** Reports has top nav, should be sidebar sub-nav
**Fix:**
- Add sidebar with sub-items: Overview, Financial, Operational, Detailed
- Remove or repurpose top navigation
**Acceptance:**
- [ ] Reports sidebar matches other modules
- [ ] All report types accessible from sidebar

### Task 2: Fiscal Year Configuration (#79)
**Files:**
- `apps/web/app/dashboard/settings/organization/page.tsx`
- `types/index.ts` (add FiscalYearConfig type)
**Issue:** No fiscal year configuration
**Fix:**
- Add fiscal year start month selector (Jan, Apr, Jul, Oct, custom)
- Store in organization settings
**Acceptance:**
- [ ] Fiscal year start month selectable
- [ ] Saved to Firestore organization doc

### Task 3: Payroll Period Configuration (#80)
**Files:**
- `apps/web/app/dashboard/settings/organization/page.tsx`
- `types/index.ts` (add PayrollPeriodConfig type)
**Issue:** No payroll period configuration
**Fix:**
- Add payroll frequency selector (Weekly, Bi-weekly, Semi-monthly, Monthly)
- Add period start day selector
- Add pay date offset
**Acceptance:**
- [ ] Payroll frequency configurable
- [ ] Period start day configurable
- [ ] Settings saved to Firestore

### Task 4: Tax Configuration (#83)
**File:** `apps/web/app/dashboard/settings/organization/page.tsx`
**Issue:** No tax configuration
**Fix:**
- Add tax entity type selector
- Add federal/state tax rate inputs
**Acceptance:**
- [ ] Tax entity type selectable
- [ ] Tax rates configurable

### Task 5: Reports Demo Data Enhancement (#63, #64, #65)
**Files:** `scripts/seed-demo/seed-financials.ts`, new `seed-reports-data.ts`
**Issues:**
- Missing historical revenue
- $0 labor costs in profitability
- Limited invoice aging data
**Fix:**
- Add backdated revenue entries (3-6 months)
- Link time entries to labor costs
- Create realistic aging distribution (70% current, 20% 30-day, etc.)
**Acceptance:**
- [ ] Financial reports show meaningful data
- [ ] Project profitability shows labor costs
- [ ] Invoice aging has realistic distribution

## Files You OWN (No conflicts)
- `apps/web/app/dashboard/reports/layout.tsx`
- `apps/web/app/dashboard/settings/organization/page.tsx`
- `scripts/seed-demo/seed-financials.ts`
- `scripts/seed-demo/seed-reports-data.ts` (create new)

## Files to AVOID (CLI 2 owns)
- `components/ui/*`
- `components/dashboard/*`
- `app/dashboard/page.tsx`

## Status Updates
After each task:
```bash
echo "CLI3: Task X complete - [description]" >> .claude-coordination/cli-3-status.txt
```

## Verification Commands
```bash
# After changes
cd apps/web && npx tsc --noEmit

# Run seed scripts
cd scripts/seed-demo && npx ts-node seed-financials.ts

# Verify data
# Use Chrome MCP to check Reports pages
```
```

---

## CLI 4 INSTRUCTIONS (E2E Testing)

**Copy and send to CLI 4:**

```markdown
# CLI 4 SPRINT 37B INSTRUCTIONS - E2E Testing & Verification

## Your Role
You are CLI 4 (E2E Testing). Verify fixes from CLI 2-3 and run regression tests.

## Priority Order

### Task 1: Critical Bug Verification
**Using Chrome MCP at localhost:3000**

Verify all 6 critical bugs are fixed:
1. **FEB-011:** Go to Projects, try category filter - should work
2. **FEB-013:** Go to Change Orders, Tasks, Estimates - no permission errors
3. **FEB-053:** Go to Finances - profit margin shows correct % (can be negative)
4. **FEB-057:** Go to Payroll - no "NaNh total" displayed
5. **#69:** Go to Reports > Operational - data loads without error
6. **#76:** Go to Reports > Detailed > Payroll section - data loads

**Log results:**
```bash
echo "CLI4: Bug verification - [PASS/FAIL] [details]" >> .claude-coordination/cli-4-status.txt
```

### Task 2: UI/Layout Verification (After CLI 2 completes)
Test CLI 2's fixes:
- [ ] Search bar doesn't overlap CTAs (test mobile viewport)
- [ ] Dashboard layout balanced
- [ ] No bouncing animations anywhere
- [ ] Sidebar sub-navigation consistent

**Test at viewports:** 320px, 768px, 1024px, 1440px

### Task 3: Reports & Settings Verification (After CLI 3 completes)
Test CLI 3's fixes:
- [ ] Reports sidebar navigation works
- [ ] Fiscal year settings save and persist
- [ ] Payroll period settings save and persist
- [ ] Reports show historical data

### Task 4: Regression Test Suite
Run key test scenarios:
```
1. Login as demo owner (mike@horizonconstruction.demo)
2. Dashboard loads without errors
3. Projects list shows 12 projects with categories
4. Create new estimate - auto-numbering works
5. View project finances - data loads
6. Check schedule - events display
7. View reports - all sections load
8. Check payroll - data displays correctly
```

### Task 5: Mobile Regression
Test at 375x812 (iPhone viewport):
- [ ] Bottom navigation works
- [ ] All pages accessible
- [ ] Forms usable on mobile
- [ ] No horizontal scroll

## Files You OWN
- `apps/web/e2e/*`
- `.claude-coordination/cli-4-status.txt`
- Test result documentation

## Verification Commands
```bash
# Check docker is running
docker ps | grep contractoros

# Tail logs for errors
docker logs contractoros-web --tail 50

# Check for console errors via Chrome MCP
```

## Status Updates
After each verification:
```bash
echo "CLI4: [Test Name] - [PASS/FAIL] [notes]" >> .claude-coordination/cli-4-status.txt
```
```

---

## CONTROLLER CHECKLIST (CLI 1)

### Setup Phase
- [ ] Create status files:
  ```bash
  mkdir -p .claude-coordination
  touch .claude-coordination/cli-2-status.txt
  touch .claude-coordination/cli-3-status.txt
  touch .claude-coordination/cli-4-status.txt
  echo "Sprint 37B started $(date)" > .claude-coordination/sprint-status.txt
  ```
- [ ] Verify docker running: `docker ps | grep contractoros`
- [ ] Verify TypeScript passing: `cd apps/web && npx tsc --noEmit`
- [ ] Send instructions to CLI 2, 3, 4

### Monitoring Phase
Check status every 30 minutes:
```bash
cat .claude-coordination/cli-*-status.txt
```

### Conflict Prevention
If CLI 2 and CLI 3 need same file:
1. Have one CLI complete first
2. Other CLI pulls latest: `git pull`
3. Then proceeds

### Completion Phase
When all tasks done:
- [ ] CLI 4 confirms all tests pass
- [ ] Run full type check: `npx tsc --noEmit`
- [ ] Rebuild docker: `./docker-build-local.sh`
- [ ] Update SPRINT_STATUS.md
- [ ] Commit all changes with summary

---

## SPRINT 37B TASK SUMMARY

| Task | CLI | Issue(s) | Effort | Status |
|------|-----|----------|--------|--------|
| Search bar overlap | CLI 2 | FEB-001 | 2-3h | `[ ]` |
| Dashboard balance | CLI 2 | FEB-004, 005 | 3-4h | `[ ]` |
| Sub-nav spacing | CLI 2 | FEB-007 | 2h | `[ ]` |
| Animation cleanup | CLI 2 | FEB-008,009,010,045 | 4-6h | `[ ]` |
| Client preferences | CLI 2 | FEB-029 | 3-4h | `[ ]` |
| Reports nav | CLI 3 | #62 | 2-3h | `[ ]` |
| Fiscal year config | CLI 3 | #79 | 2-3h | `[ ]` |
| Payroll period config | CLI 3 | #80 | 2-3h | `[ ]` |
| Tax config | CLI 3 | #83 | 3-4h | `[ ]` |
| Reports demo data | CLI 3 | #63,64,65 | 8-12h | `[ ]` |
| Bug verification | CLI 4 | All | 2h | `[ ]` |
| UI verification | CLI 4 | - | 2h | `[ ]` |
| Regression tests | CLI 4 | - | 3h | `[ ]` |

**Total Estimated:** 36-50 hours across 3 parallel CLIs

---

## EMERGENCY PROCEDURES

### If TypeScript Fails
```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -50
# Fix errors before proceeding
```

### If Docker Build Fails
```bash
# Check logs
docker logs contractoros-web --tail 100

# Rebuild
./docker-build-local.sh
```

### If Firebase Permission Error
```bash
# Check rules
cat firestore.rules | grep -A5 "[collection_name]"

# Deploy rules
firebase deploy --only firestore --project contractoros-483812
```

### If Git Conflict
```bash
git status
git stash  # Save local changes
git pull origin main
git stash pop  # Reapply changes
# Resolve conflicts manually
```

---

## SUCCESS CRITERIA

Sprint 37B is complete when:
1. All 13 tasks marked complete
2. CLI 4 verification passes 100%
3. TypeScript compiles without errors
4. Docker builds and runs successfully
5. No console errors in browser
6. SPRINT_STATUS.md updated
